import pandas as pd
import random
import os

print("""
PIPELINE:
Input → Zones
       → Feature Generation (NDVI, LST, etc.)
       → Impact Scoring
       → Water Constraint Filtering
       → Budget Optimization
       → Output Selected Zones
""")

cities = [
    "delhi", "mumbai", "kolkata", "bangalore", "chennai",
    "hyderabad", "ahmedabad", "pune", "surat", "jaipur",
    "lucknow", "kanpur", "nagpur", "indore", "vadodara"
]

def generate_features(city):
    path = f"data/processed/zones_{city}.csv"

    if not os.path.exists(path):
        print(f"Missing zones for {city}")
        return

    df = pd.read_csv(path)

    rows = []

    for _, row in df.iterrows():

        if city in ["delhi", "kanpur"]:
            ndvi = random.uniform(0.1, 0.4)
            lst = random.uniform(300, 320)
        elif city in ["bangalore", "pune"]:
            ndvi = random.uniform(0.3, 0.7)
            lst = random.uniform(290, 305)
        else:
            ndvi = random.uniform(0.2, 0.6)
            lst = random.uniform(295, 315)

        ndbi = random.uniform(0.3, 0.8)
        ndwi = random.uniform(0.1, 0.5)
        income = random.uniform(0.2, 0.9)

        tree_cover = 1 if ndvi > 0.3 else 0
        water_available = random.choice([0, 1])

        impact = (
            (1 - ndvi) * 0.4 +
            (lst / 320) * 0.3 +
            ndbi * 0.2 +
            (1 - income) * 0.1
        )

        if ndvi < 0.3 and lst > 305:
            reason = "High heat + low greenery"
        elif ndbi > 0.6:
            reason = "Dense built-up area"
        else:
            reason = "Moderate priority zone"

        rows.append({
            "zone_id": row["zone_id"],
            "NDVI": round(ndvi, 2),
            "LST": round(lst, 2),
            "NDBI": round(ndbi, 2),
            "NDWI": round(ndwi, 2),
            "tree_cover": tree_cover,
            "water_available": water_available,
            "impact_score": round(impact, 2),
            "cost": random.randint(80, 150),
            "reason": reason,
            "coordinates": row["coordinates"]
        })

    df = pd.DataFrame(rows)

    # Water constraint
    df = df[df["water_available"] == 1]

    # Sort by impact
    df = df.sort_values(by="impact_score", ascending=False)

    # Budget selection
    budget = 500
    total_cost = 0
    selected_zones = []

    for _, row in df.iterrows():
        if total_cost + row["cost"] <= budget:
            selected_zones.append(row["zone_id"])
            total_cost += row["cost"]

    df["selected"] = df["zone_id"].isin(selected_zones)

    df.to_csv(f"data/processed/scored_zones_{city}.csv", index=False)

    print(f"\nDEMO SCENARIO — {city.upper()}")
    print(f"Budget: {budget}")
    print(f"Selected Zones: {selected_zones}")
    print(f"Total Cost Used: {total_cost}")


for city in cities:
    generate_features(city)

print("""
SYSTEM FEASIBILITY:
- Uses precomputed satellite-like features
- Scalable to real satellite data via Google Earth Engine
- Designed for city-level planning decisions
""")