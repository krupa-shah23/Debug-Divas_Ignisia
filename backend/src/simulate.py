import ast
import json
import logging
import os
import random

import pandas as pd
from shapely.geometry import Point, Polygon, shape

from src.lst_utils import ensure_lst_celsius

LOGGER = logging.getLogger(__name__)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAX_TREES_PER_ZONE = 100
MAX_NDVI = 0.9


def generate_points_in_zone(polygon, num_points):
    minx, miny, maxx, maxy = polygon.bounds
    points = []
    attempts = 0

    while len(points) < num_points and attempts < num_points * 25:
        x = random.uniform(minx, maxx)
        y = random.uniform(miny, maxy)
        if polygon.contains(Point(x, y)):
            points.append((y, x))
        attempts += 1

    return points


def normalize(series):
    numeric = pd.to_numeric(series, errors="coerce")
    fill_value = numeric.mean() if not numeric.dropna().empty else 0.0
    numeric = numeric.fillna(fill_value)
    min_val = numeric.min()
    max_val = numeric.max()
    if pd.isna(min_val) or pd.isna(max_val) or max_val - min_val == 0:
        return pd.Series([0.5] * len(numeric), index=numeric.index)
    return (numeric - min_val) / (max_val - min_val)


def _load_zone_geometries(city):
    raw_geo_path = os.path.join(BASE_DIR, "data", "raw", f"{city.lower()}.geojson")
    if os.path.exists(raw_geo_path):
        with open(raw_geo_path, encoding="utf-8") as file_handle:
            geojson = json.load(file_handle)
        geometries = {}
        for index, feature in enumerate(geojson["features"], start=1):
            properties = feature.get("properties", {})
            zone_id = properties.get("zone_id")
            if zone_id is None:
                continue
            geometries[str(zone_id)] = shape(feature["geometry"])
        if geometries:
            return geometries

    processed_path = os.path.join(BASE_DIR, "data", "processed", f"zones_{city.lower()}.csv")
    if os.path.exists(processed_path):
        frame = pd.read_csv(processed_path)
        geometries = {}
        for _, row in frame.iterrows():
            coordinates = ast.literal_eval(row["coordinates"])
            geometries[str(row["zone_id"])] = Polygon(coordinates[0])
        return geometries

    raise FileNotFoundError(f"Missing zone geometry for city '{city}'")


def simulate_city(city, scored_df=None):
    LOGGER.info("Simulating city=%s", city)
    if scored_df is None:
        score_path = os.path.join(BASE_DIR, "data", "processed", f"scored_zones_{city.lower()}.csv")
        if not os.path.exists(score_path):
            raise FileNotFoundError(f"Missing scored file for {city}")
        scored_df = pd.read_csv(score_path)

    df = ensure_lst_celsius(scored_df.copy())
    if df.empty:
        return {"zones": [], "points": []}

    df["zone_id"] = df["zone_id"].astype(str)
    geometries = _load_zone_geometries(city)

    required_cols = ["NDVI", "LST", "NDBI"]
    df = df.dropna(subset=required_cols)
    df["ndvi_n"] = normalize(df["NDVI"])
    df["lst_n"] = normalize(df["LST"])
    df["ndbi_n"] = normalize(df["NDBI"])

    results = []
    planting_points = []

    for _, row in df.iterrows():
        if not bool(row.get("selected", False)):
            continue

        polygon = geometries.get(str(row["zone_id"]))
        if polygon is None:
            continue

        need_score = ((1 - row["ndvi_n"]) * 0.5) + (row["lst_n"] * 0.3) + (row["ndbi_n"] * 0.2)
        derived_trees = int(MAX_TREES_PER_ZONE * need_score)
        derived_trees = max(5, min(derived_trees, MAX_TREES_PER_ZONE))
        trees = int(pd.to_numeric(row.get("trees", derived_trees), errors="coerce"))
        if trees <= 0:
            trees = derived_trees

        current_ndvi = float(row["NDVI"])
        current_lst = float(row["LST"])
        delta_ndvi = trees * 0.002 * (1 - current_ndvi)
        new_ndvi = min(MAX_NDVI, current_ndvi + delta_ndvi)

        cooling_factor = 30 + (10 * row["lst_n"])
        urban_factor = 1 + float(row["NDBI"])
        delta_temp = -cooling_factor * delta_ndvi * urban_factor
        new_lst = current_lst + delta_temp

        results.append(
            {
                "zone_id": str(row["zone_id"]),
                "trees": trees,
                "temp_before": round(current_lst, 2),
                "temp_after": round(new_lst, 2),
                "temp_reduction": round(abs(delta_temp), 2),
                "ndvi_before": round(current_ndvi, 3),
                "ndvi_after": round(new_ndvi, 3),
            }
        )

        points = generate_points_in_zone(polygon, trees)
        for lat, lon in points:
            planting_points.append({"zone_id": str(row["zone_id"]), "lat": lat, "lon": lon})

    output_dir = os.path.join(BASE_DIR, "data", "simulations")
    os.makedirs(output_dir, exist_ok=True)
    pd.DataFrame(results).to_csv(
        os.path.join(output_dir, f"simulation_{city.lower()}.csv"),
        index=False,
    )
    return {"zones": results, "points": planting_points}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    user_budget = int(input("Enter budget: "))
    from src.generate_scored_data import generate_features

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
    for city_name in cities:
        frame = generate_features(city_name, user_budget)
        simulate_city(city_name, frame)
