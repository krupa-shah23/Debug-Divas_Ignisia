import json
import logging
import os
import re
import sys

import pandas as pd
import requests

from src.lst_utils import ensure_lst_celsius

from dotenv import load_dotenv
load_dotenv()

LOGGER = logging.getLogger(__name__)
TOKEN_PATTERN = re.compile(r"[a-z0-9_]+")
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
FALLBACK_SUMMARY_PATHS = [
    os.path.join(BASE_DIR, "data", "final_scored.csv"),
    os.path.join(BASE_DIR, "data", "final_dataset.csv"),
]


def _tokenize(text):
    return TOKEN_PATTERN.findall(str(text).lower())


def _as_bool(value):
    if isinstance(value, bool):
        return value
    if pd.isna(value):
        return False
    if isinstance(value, (int, float)):
        return bool(value)
    return str(value).strip().lower() in {"true", "1", "yes"}


def _resolve_summary_path(city=None):
    if city:
        city_path = os.path.join(PROCESSED_DIR, f"scored_zones_{city.lower()}.csv")
        if os.path.exists(city_path):
            return city_path

    scored_candidates = []
    if os.path.isdir(PROCESSED_DIR):
        scored_candidates = [
            os.path.join(PROCESSED_DIR, filename)
            for filename in os.listdir(PROCESSED_DIR)
            if filename.startswith("scored_zones_") and filename.endswith(".csv")
        ]

    if scored_candidates:
        return max(scored_candidates, key=os.path.getmtime)

    for path in FALLBACK_SUMMARY_PATHS:
        if os.path.exists(path):
            return path

    raise FileNotFoundError("No summary dataset available for RAG")


def _clean_speech_text(content):
    speech_text = content
    speech_text = re.sub(r"\*\*", "", speech_text)
    speech_text = re.sub(r"- ", "", speech_text)
    speech_text = re.sub(r"\d+\.", "", speech_text)
    speech_text = re.sub(r"\n+", ". ", speech_text)
    speech_text = re.sub(r"[•\-]", "", speech_text)
    return speech_text.strip()


class ZoneRAG:
    def __init__(self, csv_path):
        self.csv_path = csv_path
        self.df = pd.read_csv(csv_path)
        self.df = ensure_lst_celsius(self.df)
        if "priority_score" not in self.df.columns:
            self.df["priority_score"] = 0.0
        if "water_ok" not in self.df.columns:
            self.df["water_ok"] = self.df.get("water_feasible", False)
        self.df["water_ok"] = self.df["water_ok"].apply(_as_bool)
        if "selected" not in self.df.columns:
            self.df["selected"] = False
        self.df["selected"] = self.df["selected"].apply(_as_bool)
        self.df["search_text"] = self.df.apply(
            lambda row: " ".join(
                [
                    str(row.get("zone_id", "")),
                    str(row.get("NDVI", "")),
                    str(row.get("LST", "")),
                    str(row.get("priority_score", "")),
                    "water_ok" if row.get("water_ok") else "water_constrained",
                    "selected" if row.get("selected") else "not_selected",
                ]
            ).lower(),
            axis=1,
        )

    def _structured_rows(self, frame):
        return frame[
            ["zone_id", "NDVI", "LST", "priority_score", "water_ok", "selected"]
        ].to_dict(orient="records")

    def retrieve(self, query):
        query_tokens = _tokenize(query)
        lowered_query = query.lower()

        if "heat" in lowered_query:
            top = self.df.sort_values(by=["LST", "priority_score"], ascending=[False, False]).head(3)
            return self._structured_rows(top)

        if "water" in lowered_query:
            top = self.df.sort_values(by=["water_ok", "priority_score"], ascending=[True, False]).head(3)
            return self._structured_rows(top)

        if "canopy" in lowered_query:
            top = self.df.sort_values(by=["NDVI", "priority_score"], ascending=[True, False]).head(3)
            return self._structured_rows(top)

        if not query_tokens:
            top = self.df.sort_values(
                by=["selected", "priority_score", "LST", "NDVI"],
                ascending=[False, False, False, True],
            ).head(3)
            return self._structured_rows(top)

        keyword_scores = self.df["search_text"].apply(
            lambda text: sum(keyword in text for keyword in query_tokens)
        )
        ranked = self.df.assign(keyword_score=keyword_scores)
        ranked = ranked[ranked["keyword_score"] > 0]

        if ranked.empty:
            LOGGER.info("No keyword matches found for query: %s", query)
            top = self.df.sort_values(
                by=["selected", "priority_score", "LST", "NDVI"],
                ascending=[False, False, False, True],
            ).head(3)
            return self._structured_rows(top)

        ranked = ranked.sort_values(
            by=["keyword_score", "priority_score", "LST", "NDVI"],
            ascending=[False, False, False, True],
        )
        top = ranked.head(3)
        return self._structured_rows(top)

    def generate_answer(self, query, contexts, selected_zones=None, total_trees=0):
        selected_zones = selected_zones or []
        selected_zone_ids = [zone.get("zone_id") for zone in selected_zones if zone.get("zone_id")]
        prompt = f"""
You are an urban planning AI assistant.

User question:
{query}

Zone data:
{contexts}

Simulation:
- Total trees planted: {total_trees}
- Selected zones: {selected_zone_ids}

Rules:
- Use ONLY provided data
- Do NOT hallucinate
- water_ok = False -> water constrained
- high LST -> heat hotspot
- low NDVI -> poor vegetation
- selected = True -> chosen for planting

Output format:
1. Short explanation (3-4 lines)
2. Bullet list of important zones
3. Reasons based strictly on data

Do NOT include internal reasoning or <think>.
"""

        if not SARVAM_API_KEY:
            LOGGER.warning("SARVAM_API_KEY is not configured")
            return "Could not generate response."

        try:
            response = requests.post(
                "https://api.sarvam.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {SARVAM_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "sarvam-m",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                },
                timeout=30,
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            content = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL).strip()
            return content
        except Exception:
            LOGGER.exception("Sarvam generation failed")
            return "Could not generate response."


def main():
    city = os.getenv("RAG_CITY")
    if len(sys.argv) > 2:
        query = sys.argv[1].strip()
        city = sys.argv[2].strip()
    else:
        query = " ".join(sys.argv[1:]).strip()

    chat_context = {}
    chat_context_raw = os.getenv("CHAT_CONTEXT_JSON", "").strip()
    if chat_context_raw:
        try:
            chat_context = json.loads(chat_context_raw)
        except json.JSONDecodeError:
            LOGGER.warning("Failed to parse CHAT_CONTEXT_JSON")

    rag = ZoneRAG(_resolve_summary_path(city))
    contexts = rag.retrieve(query)
    response = rag.generate_answer(
        query,
        contexts,
        selected_zones=chat_context.get("zones", []),
        total_trees=chat_context.get("total_trees", 0),
    )
    speech_text = _clean_speech_text(str(response))
    print(
        json.dumps(
            {
                "response": str(response),
                "answer": str(response),
                "speech": speech_text,
                "zones": contexts,
                "highlight_ids": [zone["zone_id"] for zone in contexts],
            }
        )
    )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()
