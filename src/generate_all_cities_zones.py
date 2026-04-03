import json
import os
from shapely.geometry import shape, box, mapping

# =========================
# CITY LIST
# =========================
cities = [
    "delhi", "mumbai", "kolkata", "bangalore", "chennai",
    "hyderabad", "ahmedabad", "pune", "surat", "jaipur",
    "lucknow", "kanpur", "nagpur", "indore", "vadodara"
]

# =========================
# GENERATE ZONES FUNCTION
# =========================
def generate_zones(city_name):
    path = f"data/raw/{city_name}.geojson"

    print(f"\nProcessing {city_name}...")

    # Check file exists
    if not os.path.exists(path):
        print(f"Missing file: {path}")
        return

    # Load GeoJSON
    with open(path) as f:
        geo = json.load(f)

    # =========================
    # EXTRACT CITY BOUNDARY
    # =========================
    if "features" not in geo or len(geo["features"]) == 0:
        print(f"No features found in {city_name}")
        return

    if len(geo["features"]) > 1:
        print(f"{city_name} has multiple features — using first one")

    geom = shape(geo["features"][0]["geometry"])
    boundary = geom

    # =========================
    # CREATE GRID
    # =========================
    minx, miny, maxx, maxy = boundary.bounds

    rows, cols = 2, 5   # change if needed
    dx = (maxx - minx) / cols
    dy = (maxy - miny) / rows

    features = []
    zone_id = 1

    for i in range(rows):
        for j in range(cols):

            cell = box(
                minx + j * dx,
                miny + i * dy,
                minx + (j + 1) * dx,
                miny + (i + 1) * dy
            )

            # Clip to city boundary
            clipped = cell.intersection(boundary)

            if clipped.is_empty:
                continue

            features.append({
                "type": "Feature",
                "properties": {
                    "zone_id": f"Z{zone_id}"
                },
                "geometry": mapping(clipped)
            })

            zone_id += 1

    # =========================
    # SAVE OUTPUT
    # =========================
    output = {
        "type": "FeatureCollection",
        "features": features
    }

    os.makedirs("data/processed", exist_ok=True)

    output_path = f"data/processed/zones_{city_name}.geojson"

    with open(output_path, "w") as f:
        json.dump(output, f)

    print(f"{city_name} → {len(features)} zones created")


# =========================
# RUN ALL CITIES
# =========================
print("Starting zone generation...")

for city in cities:
    generate_zones(city)

print("\nAll cities processed!")