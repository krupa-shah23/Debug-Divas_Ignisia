import logging
import os

import geopandas as gpd

try:
    import ee
except ModuleNotFoundError:  # pragma: no cover - depends on deployment extras
    ee = None

LOGGER = logging.getLogger(__name__)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "data")
SHAPEFILE_DIR = os.path.join(DATA_DIR, "shapefiles")
DEFAULT_START_DATE = "2025-01-01"
DEFAULT_END_DATE = "2025-03-01"
EE_PROJECT = os.getenv("CANOPYX_GEE_PROJECT", "canopx-gee")
EE_CREDENTIALS_PATH = os.getenv(
    "CANOPYX_EE_CREDENTIALS_PATH",
    os.path.join(BASE_DIR, "credentials", "ee-key.json"),
)

_EE_INITIALIZED = False
_EE_INIT_ATTEMPTED = False


def _initialize_earth_engine():
    global _EE_INITIALIZED, _EE_INIT_ATTEMPTED

    if _EE_INITIALIZED:
        return True
    if _EE_INIT_ATTEMPTED:
        return False

    if ee is None:
        LOGGER.warning("Earth Engine SDK is not installed; live spectral indices are unavailable")
        _EE_INIT_ATTEMPTED = True
        return False

    _EE_INIT_ATTEMPTED = True

    try:
        if os.path.exists(EE_CREDENTIALS_PATH):
            credentials = ee.ServiceAccountCredentials(None, EE_CREDENTIALS_PATH)
            ee.Initialize(credentials=credentials, project=EE_PROJECT)
        else:
            ee.Initialize(project=EE_PROJECT)
        _EE_INITIALIZED = True
        return True
    except Exception as exc:
        LOGGER.warning("Earth Engine initialization failed: %s", exc)
        return False


def load_city_zones(city):
    city_key = str(city).strip().lower()
    path = os.path.join(SHAPEFILE_DIR, f"zones_{city_key}.shp")

    if not os.path.exists(path):
        raise FileNotFoundError(f"Missing shapefile for city '{city_key}': {path}")

    return gpd.read_file(path)
