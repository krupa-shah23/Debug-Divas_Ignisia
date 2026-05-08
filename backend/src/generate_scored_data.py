import logging
import os

import pandas as pd

from src.drought import compute_drought_index
from src.gis.spectral_indices import get_spectral_indices

from src.models.priority_model import predict
from src.soil import estimate_soil_moisture
from src.water_constraint import check_water_feasibility
from src.climate import get_climate_data

LOGGER = logging.getLogger(__name__)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_DIR = os.path.dirname(BASE_DIR)
DATASET_PATH = os.path.join(BASE_DIR, "data", "final_dataset.csv")
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
MIN_SCORE = 2.5
DROUGHT_MULTIPLIERS = {
    "normal": 0.0,
    "moderate": 1.0,
    "severe": 2.5,
}
WATER_PATHS = [
    os.path.join(BASE_DIR, "data", "mock", "water_availability.csv"),
    os.path.join(PROJECT_DIR, "frontend", "data", "mock", "water_availability.csv"),
]


def _resolve_water_path():
    for path in WATER_PATHS:
        if os.path.exists(path):
            return path
    raise FileNotFoundError("water_availability.csv not found")


def _normalize_city_value(value):
    text = str(value).strip().lower()
    return text.replace("_features", "")


def normalize(series):
    numeric = pd.to_numeric(series, errors="coerce")
    fill_value = numeric.median() if not numeric.dropna().empty else 0.0
    numeric = numeric.fillna(fill_value)

    min_val = numeric.min()
    max_val = numeric.max()

    if pd.isna(min_val) or pd.isna(max_val) or max_val - min_val == 0:
        return pd.Series([0.5] * len(numeric), index=numeric.index)

    return (numeric - min_val) / (max_val - min_val)


def _load_city_features(city):
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"Missing dataset: {DATASET_PATH}")

    df = pd.read_csv(DATASET_PATH)
    df["city_normalized"] = df["city"].apply(_normalize_city_value)
    city_key = city.strip().lower()
    df = df[df["city_normalized"] == city_key].copy()

    if df.empty:
        raise ValueError(f"No features found for city '{city}'")

    
    df["zone_id"] = df["zone_id"].astype(str)
    df = df.head(100)
    return df

def _load_water_data():
    water_df = pd.read_csv(_resolve_water_path())

    water_df["zone_id"] = water_df["zone_id"].astype(str)

    water_df["has_water_access"] = pd.to_numeric(
        water_df["has_water_access"],
        errors="coerce"
    ).fillna(0)

    water_df["distance_to_pipeline"] = pd.to_numeric(
        water_df["distance_to_pipeline"],
        errors="coerce"
    ).fillna(1000)

    return water_df

def generate_features(city, budget, drought_mode="normal"):
    LOGGER.info("Scoring city=%s budget=%s drought_mode=%s", city, budget, drought_mode)
    df = _load_city_features(city)
    drought_multiplier = DROUGHT_MULTIPLIERS.get(drought_mode, 0.0)
    indices_by_zone = get_spectral_indices(city)

    df["NDVI"] = df["zone_id"].map(
        lambda z: indices_by_zone.get(str(z), {}).get("ndvi")
    )

    df["NDBI"] = df["zone_id"].map(
        lambda z: indices_by_zone.get(str(z), {}).get("ndbi")
    )

    df["NDWI"] = df["zone_id"].map(
        lambda z: indices_by_zone.get(str(z), {}).get("ndwi")
    )

    df["LST"] = df["zone_id"].map(
        lambda z: indices_by_zone.get(str(z), {}).get("lst")
    )

    climate = get_climate_data(city)

    df["rainfall"] = climate["rainfall"]
    df["temperature"] = climate["temperature"]
    df["humidity"] = climate["humidity"]
    df["evapotranspiration"] = climate["evapotranspiration"]
    df["heatwave_days"] = climate["heatwave_days"]

    df["soil_moisture"] = estimate_soil_moisture(
        climate["rainfall"],
        df["NDVI"],
    )

    # News/NLP remains stubbed so the NDVI refactor does not change unrelated scoring behavior.
    df["news_drought_score"] = 0.5  # TEMP: avoid news fetch/NLP during perf triage

    df = df.replace([float("inf"), float("-inf")], pd.NA)

    required_cols = ["NDVI", "LST", "NDBI", "NDWI"]
    for column in required_cols:
        if column not in df.columns:
            raise ValueError(f"Missing required column: {column}")
        df[column] = pd.to_numeric(df[column], errors="coerce")
        median_value = df[column].median()
        df[column] = df[column].fillna(0.0 if pd.isna(median_value) else median_value)

    water_df = _load_water_data()
    df = df.merge(water_df, on="zone_id", how="left")
    df["has_water_access"] = pd.to_numeric(
        df["has_water_access"], errors="coerce"
    ).fillna(0)
    df["distance_to_pipeline"] = pd.to_numeric(
        df["distance_to_pipeline"], errors="coerce"
    ).fillna(1000)

    if "income" not in df.columns:
        df["income"] = (1 - df["NDBI"]) * 0.7 + df["NDVI"] * 0.3
    df["income"] = pd.to_numeric(df["income"], errors="coerce")
    income_median = df["income"].median()
    df["income"] = df["income"].fillna(0.0 if pd.isna(income_median) else income_median)

    df["ndvi_n"] = normalize(df["NDVI"])
    df["lst_n"] = normalize(df["LST"])
    df["ndbi_n"] = normalize(df["NDBI"])
    df["ndwi_n"] = normalize(df["NDWI"])
    df["income_n"] = normalize(df["income"])
    df["drought_index"] = df.apply(
        lambda row: compute_drought_index(
            row["rainfall"],
            row["soil_moisture"],
            row["temperature"],
            row["NDVI"],
            row["humidity"],
            row["evapotranspiration"],
            row["heatwave_days"],
        ),
        axis=1,
    )

    df["water_score"] = (
        df["has_water_access"] * 0.7
        + (1 / (1 + df["distance_to_pipeline"].clip(lower=0))) * 0.3
    )
    df["priority_score"] = predict(df)
    df["priority_score"] = (
        (df["priority_score"] - df["priority_score"].min()) /
        (df["priority_score"].max() - df["priority_score"].min() + 1e-6)
    ) * 10
    df["priority_score"] += drought_multiplier * (1 - df["news_drought_score"])
    df["water_feasible"] = df.apply(check_water_feasibility, axis=1)
    if drought_mode == "severe":
        df.loc[~df["water_feasible"], "priority_score"] -= 3
    df.loc[~df["water_feasible"], "priority_score"] -= 2
    df["priority_score"] = df["priority_score"].clip(lower=0)
    df["water_ok"] = df["water_feasible"]
    df["trees"] = (df["priority_score"] * 20).clip(lower=0).round().astype(int)
    df["trees"] = (
        df["trees"] * (1 - df["drought_index"] * 0.5)
    ).clip(lower=0).round().astype(int)
    df["trees"] = (df["trees"] * (1 - drought_multiplier * 0.15)).clip(lower=0).round().astype(int)
    df.loc[df["priority_score"] < MIN_SCORE, "trees"] = 0
    df["risk_level"] = pd.cut(
        df["drought_index"],
        bins=[0, 0.3, 0.6, 1],
        labels=["Low", "Medium", "High"],
        include_lowest=True,
    ).astype(str)
    df["cost"] = 80 + (df["ndbi_n"] * 70)
    df["efficiency"] = df["priority_score"] / df["cost"].replace(0, 1)
    df = df.sort_values(by=["water_feasible", "efficiency"], ascending=[False, False])

    valid_zones = df[
        (df["water_feasible"]) & (df["priority_score"] >= MIN_SCORE)
    ]
    valid_sorted = valid_zones.sort_values(by="priority_score", ascending=False)
    selected = valid_sorted.head(3)

    if len(selected) < 3:
        remaining = 3 - len(selected)
        fallback = df[
            (~df["water_feasible"])
            & (df["priority_score"] >= MIN_SCORE)
            & (df["soil_moisture"] > 0.2)
        ].sort_values(
            by="priority_score", ascending=False
        ).head(remaining)
        selected = pd.concat([selected, fallback])

    df["selected"] = False
    df.loc[selected.index, "selected"] = True

    os.makedirs(PROCESSED_DIR, exist_ok=True)
    output_path = os.path.join(PROCESSED_DIR, f"scored_zones_{city.lower()}.csv")
    df.to_csv(output_path, index=False)
    LOGGER.info("Saved scored zones to %s", output_path)
    return df


def generate_zone_summary(row):
    return (
        f"Zone {row['zone_id']} has NDVI {float(row['NDVI']):.3f}, "
        f"LST {float(row['LST']):.2f}C, NDBI {float(row['NDBI']):.3f}, "
        f"drought index {float(row.get('drought_index', 0.0)):.2f}, "
        f"water feasible {bool(row.get('water_ok', row.get('water_feasible', False)))}, "
        f"priority score {float(row.get('priority_score', 0.0)):.3f}, "
        f"selected {bool(row.get('selected', False))}."
    )


def main():
    cities = [
        "delhi",
        "mumbai",
        "kolkata",
        "bangalore",
        "chennai",
        "hyderabad",
        "ahmedabad",
        "pune",
        "surat",
        "jaipur",
        "lucknow",
        "kanpur",
        "nagpur",
        "indore",
        "vadodara",
    ]
    user_budget = 500

    for city in cities:
        print(f"Scoring {city}...")
        generate_features(city, user_budget)

    print("All cities scored!")


if __name__ == "__main__":
    main()
