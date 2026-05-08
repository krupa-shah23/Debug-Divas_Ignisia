import logging
from functools import lru_cache

import ee

from src.gis.satellite_features import (
    _initialize_earth_engine,
    load_city_zones,
)

LOGGER = logging.getLogger(__name__)

DEFAULT_START_DATE = "2025-01-01"
DEFAULT_END_DATE = "2025-03-01"


@lru_cache(maxsize=32)
def _get_spectral_indices_cached(city, start_date, end_date):

    if not _initialize_earth_engine():
        return {}

    try:
        gdf = load_city_zones(city)
    except Exception as exc:
        LOGGER.warning("Unable to load zones for %s: %s", city, exc)
        return {}

    results = {}

    for _, row in gdf.iterrows():

        zone_id = str(row.get("zone_id"))

        try:
            geom = ee.Geometry(row.geometry.__geo_interface__)

            # =====================================
            # SENTINEL-2
            # =====================================

            s2_collection = (
                ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
                .filterBounds(geom)
                .filterDate(start_date, end_date)
                .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
            )

            s2_image = s2_collection.median()

            ndvi = s2_image.normalizedDifference(
                ["B8", "B4"]
            ).rename("NDVI")

            ndbi = s2_image.normalizedDifference(
                ["B11", "B8"]
            ).rename("NDBI")

            ndwi = s2_image.normalizedDifference(
                ["B3", "B8"]
            ).rename("NDWI")

            # =====================================
            # MODIS LST
            # =====================================

            lst_collection = (
                ee.ImageCollection("MODIS/061/MOD11A2")
                .filterBounds(geom)
                .filterDate(start_date, end_date)
            )

            lst_image = lst_collection.mean()

            lst = lst_image.select(
                "LST_Day_1km"
            ).rename("LST")

            # =====================================
            # COMBINE ALL BANDS
            # =====================================

            combined = (
                ndvi
                .addBands(ndbi)
                .addBands(ndwi)
                .addBands(lst)
            )

            # =====================================
            # REDUCE REGION
            # =====================================

            stats = combined.reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=geom,
                scale=10,
                maxPixels=1e9,
            )

            ndvi_value = stats.get("NDVI").getInfo()
            ndbi_value = stats.get("NDBI").getInfo()
            ndwi_value = stats.get("NDWI").getInfo()
            lst_value = stats.get("LST").getInfo()

            # =====================================
            # CONVERT LST TO CELSIUS
            # =====================================

            if lst_value is not None:
                lst_celsius = (lst_value * 0.02) - 273.15
            else:
                lst_celsius = None

            # =====================================
            # STORE RESULTS
            # =====================================

            results[zone_id] = {

                "ndvi": round(float(ndvi_value), 4)
                if ndvi_value is not None
                else None,

                "ndbi": round(float(ndbi_value), 4)
                if ndbi_value is not None
                else None,

                "ndwi": round(float(ndwi_value), 4)
                if ndwi_value is not None
                else None,

                "lst": round(float(lst_celsius), 2)
                if lst_celsius is not None
                else None,
            }

        except Exception as exc:

            LOGGER.warning(
                "Spectral index retrieval failed for %s %s: %s",
                city,
                zone_id,
                exc,
            )

            results[zone_id] = {
                "ndvi": None,
                "ndbi": None,
                "ndwi": None,
                "lst": None,
            }

    LOGGER.info(
        "Live spectral indices retrieval completed for %s",
        city
    )

    return results


def get_spectral_indices(
    city,
    start_date=DEFAULT_START_DATE,
    end_date=DEFAULT_END_DATE,
):
    return _get_spectral_indices_cached(
        city,
        start_date,
        end_date,
    )