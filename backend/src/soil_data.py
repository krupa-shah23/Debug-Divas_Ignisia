import ee

from src.climate import CITY_COORDS
from src.gis.satellite_features import (
    _initialize_earth_engine,
)


def normalize_soil_values(soil):
    return {
        "clay": soil["clay"] / 10 if soil["clay"] else None,
        "sand": soil["sand"] / 10 if soil["sand"] else None,
        "organic_carbon": soil["organic_carbon"] / 10 if soil["organic_carbon"] else None,
        "ph": soil["ph"] / 10 if soil["ph"] else None,
        "bulk_density": soil["bulk_density"] / 100 if soil["bulk_density"] else None,
    }


def get_soil_data(city):

    if not _initialize_earth_engine():
        return {}

    city_key = city.strip().lower()

    if city_key not in CITY_COORDS:
        raise ValueError(f"Unsupported city: {city}")

    latitude, longitude = CITY_COORDS[city_key]

    point = ee.Geometry.Point([longitude, latitude]).buffer(1000)

    # =====================================
    # SOILGRIDS DATASETS
    # =====================================

    clay = ee.Image(
        "projects/soilgrids-isric/clay_mean"
    )

    

    sand = ee.Image(
        "projects/soilgrids-isric/sand_mean"
    )

    soc = ee.Image(
        "projects/soilgrids-isric/soc_mean"
    )

    ph = ee.Image(
        "projects/soilgrids-isric/phh2o_mean"
    )

    bulk_density = ee.Image(
        "projects/soilgrids-isric/bdod_mean"
    )

    # =====================================
    # EXTRACT VALUES
    # =====================================

    clay_value = clay.reduceRegion(
    reducer=ee.Reducer.mean(),
    geometry=point,
    scale=1000,
    ).get("clay_0-5cm_mean")

    sand_value = sand.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=point,
        scale=1000,
    ).get("sand_0-5cm_mean")

    soc_value = soc.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=point,
        scale=1000,
    ).get("soc_0-5cm_mean")

    ph_value = ph.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=point,
        scale=1000,
    ).get("phh2o_0-5cm_mean")

    bdod_value = bulk_density.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=point,
        scale=1000,
    ).get("bdod_0-5cm_mean")

    return {
        "clay": clay_value.getInfo(),
        "sand": sand_value.getInfo(),
        "organic_carbon": soc_value.getInfo(),
        "ph": ph_value.getInfo(),
        "bulk_density": bdod_value.getInfo(),
    }
