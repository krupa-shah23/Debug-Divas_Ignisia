import pandas as pd
import json
import os
import random
from shapely.geometry import shape, Point

from generate_scored_data import generate_features

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MAX_TREES_PER_ZONE = 100
MAX_NDVI = 0.9


# ==========================
# GENERATE POINTS
# ==========================
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


# ==========================
# SAFE NORMALIZATION
# ==========================
def normalize(series):

    # Fill missing values first
    series = series.fillna(series.mean())

    min_val = series.min()
    max_val = series.max()

    if max_val - min_val == 0:
        return pd.Series([0.5] * len(series))

    return (series - min_val) / (max_val - min_val)


# ==========================
# SIMULATION
# ==========================
def simulate_city(city):

    print(f"\n===== SIMULATING: {city.upper()} =====")

    score_path = os.path.join(BASE_DIR, "data", "processed", f"scored_zones_{city}.csv")
    geo_path   = os.path.join(BASE_DIR, "data", "processed", f"zones_{city}.geojson")

    # --------------------------
    # FILE CHECKS
    # --------------------------
    if not os.path.exists(score_path):
        print(f"[ERROR] Missing scored file for {city}")
        return

    if not os.path.exists(geo_path):
        print(f"[ERROR] Missing GeoJSON for {city}")
        return

    df = pd.read_csv(score_path)

    if df.empty:
        print(f"[ERROR] Empty scored data for {city}")
        return

    print(f"[DEBUG] Loaded {len(df)} rows")

    # Ensure consistent types
    df["zone_id"] = df["zone_id"].astype(str)

    # --------------------------
    # CLEAN DATA (CRITICAL)
    # --------------------------
    required_cols = ["NDVI", "LST", "NDBI"]

    for col in required_cols:
        if col not in df.columns:
            print(f"[ERROR] Missing column: {col}")
            return

    df = df.dropna(subset=required_cols)

    if df.empty:
        print(f"[ERROR] All rows invalid after cleaning for {city}")
        return

    # --------------------------
    # LOAD GEOJSON
    # --------------------------
    with open(geo_path) as f:
        geo = json.load(f)

    zone_geoms = {
        str(f["properties"]["zone_id"]): shape(f["geometry"])
        for f in geo["features"]
    }

    # --------------------------
    # NORMALIZE FEATURES
    # --------------------------
    df["ndvi_n"] = normalize(df["NDVI"])
    df["lst_n"]  = normalize(df["LST"])
    df["ndbi_n"] = normalize(df["NDBI"])

    results = []
    planting_points = []

    # --------------------------
    # LOOP THROUGH ZONES
    # --------------------------
    for _, row in df.iterrows():

        if not row.get("selected", False):
            continue

        zone_id = str(row["zone_id"])
        polygon = zone_geoms.get(zone_id)

        if polygon is None:
            continue

        # Extra safety against NaNs
        if pd.isna(row["ndvi_n"]) or pd.isna(row["lst_n"]) or pd.isna(row["ndbi_n"]):
            print(f"[WARNING] Skipping zone {zone_id} due to NaNs")
            continue

        current_ndvi = row["NDVI"]
        current_lst  = row["LST"]
        ndbi         = row["NDBI"]

        # --------------------------
        # TREE ALLOCATION
        # --------------------------
        need_score = (
            (1 - row["ndvi_n"]) * 0.5 +
            row["lst_n"] * 0.3 +
            row["ndbi_n"] * 0.2
        )

        if pd.isna(need_score):
            print(f"[WARNING] Skipping zone {zone_id} (need_score NaN)")
            continue

        trees = int(MAX_TREES_PER_ZONE * need_score)
        trees = max(5, min(trees, MAX_TREES_PER_ZONE))

        # --------------------------
        # NDVI CHANGE
        # --------------------------
        delta_ndvi = trees * 0.002 * (1 - current_ndvi)
        new_ndvi = min(MAX_NDVI, current_ndvi + delta_ndvi)

        # --------------------------
        # TEMPERATURE REDUCTION
        # --------------------------
        cooling_factor = 30 + 10 * row["lst_n"]
        urban_factor = 1 + ndbi

        delta_temp = -cooling_factor * delta_ndvi * urban_factor
        delta_temp *= random.uniform(0.9, 1.1)

        new_lst = current_lst + delta_temp

        results.append({
            "zone_id": zone_id,
            "trees": trees,
            "temp_before": round(current_lst, 2),
            "temp_after": round(new_lst, 2),
            "temp_reduction": round(abs(delta_temp), 2)
        })

        # --------------------------
        # PLANTING POINTS
        # --------------------------
        points = generate_points_in_zone(polygon, trees)

        for lat, lon in points:
            planting_points.append({
                "zone_id": zone_id,
                "lat": lat,
                "lon": lon
            })

    # --------------------------
    # SAVE OUTPUT
    # --------------------------
    output_dir = os.path.join(BASE_DIR, "data", "simulations")
    os.makedirs(output_dir, exist_ok=True)

    pd.DataFrame(results).to_csv(
        os.path.join(output_dir, f"simulation_{city}.csv"),
        index=False
    )

    print(f"[SIMULATION] {city} → {len(results)} zones simulated")
    print(f"[INFO] Total planting points: {len(planting_points)}")

    return {
        "zones": results,
        "points": planting_points
    }


# ==========================
# FULL PIPELINE
# ==========================
if __name__ == "__main__":

    USER_BUDGET = int(input("Enter budget: "))

    cities = [
        "delhi", "mumbai", "kolkata", "bangalore", "chennai",
        "hyderabad", "ahmedabad", "pune", "surat", "jaipur",
        "lucknow", "kanpur", "nagpur", "indore", "vadodara"
    ]

    for city in cities:
        generate_features(city, USER_BUDGET)
        simulate_city(city)

    print("\nFULL PIPELINE COMPLETE")