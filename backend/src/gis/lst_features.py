import logging
from src.gis.spectral_indices import get_spectral_indices

LOGGER = logging.getLogger(__name__)

DEFAULT_START_DATE = "2025-01-01"
DEFAULT_END_DATE = "2025-03-01"


def get_lst(city,
            start_date=DEFAULT_START_DATE,
            end_date=DEFAULT_END_DATE):
    # Deprecated compatibility wrapper. Live LST now comes from the centralized
    # spectral indices provider alongside NDVI/NDBI/NDWI.
    indices = get_spectral_indices(city, start_date=start_date, end_date=end_date)
    LOGGER.info("Resolved LST via centralized spectral indices for %s", city)
    return {
        str(zone_id): {"lst": values.get("lst")}
        for zone_id, values in indices.items()
    }
