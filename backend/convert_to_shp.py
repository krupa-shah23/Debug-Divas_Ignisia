import geopandas as gpd
import os

input_folder = "data/processed"
output_folder = "data/shapefiles"

os.makedirs(output_folder, exist_ok=True)

for file in os.listdir(input_folder):
    if file.endswith(".geojson"):
        city = file.replace("zones_", "").replace(".geojson", "")
        
        geojson_path = os.path.join(input_folder, file)
        gdf = gpd.read_file(geojson_path)

        gdf = gdf.set_crs("EPSG:4326", allow_override=True)

        output_path = os.path.join(output_folder, f"zones_{city}.shp")
        
        gdf.to_file(output_path)

        print(f"Converted: {city}")

print("All cities converted!")

import zipfile

for file in os.listdir(output_folder):
    if file.endswith(".shp"):
        city = file[:-4]
        zip_path = os.path.join(output_folder, f"{city}.zip")

        with zipfile.ZipFile(zip_path, 'w') as z:
            for ext in ['.shp', '.shx', '.dbf', '.prj']:
                f = os.path.join(output_folder, city + ext)
                if os.path.exists(f):
                    z.write(f, arcname=os.path.basename(f))

        print(f"Zipped: {city}")

print("All shapefiles zipped!")