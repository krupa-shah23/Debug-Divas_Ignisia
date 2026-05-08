"""Deprecated NDVI compatibility helpers.

Legacy CSV-backed NDVI fallbacks have been removed. Active callers should use
``src.gis.spectral_indices.get_spectral_indices`` directly.
"""

from src.gis.spectral_indices import get_spectral_indices


def get_dataset_ndvi_map(city, start_date=None, end_date=None):
    """Return a zone_id -> NDVI map backed by live spectral indices."""
    kwargs = {}
    if start_date is not None:
        kwargs["start_date"] = start_date
    if end_date is not None:
        kwargs["end_date"] = end_date

    indices = get_spectral_indices(city, **kwargs)
    return {
        str(zone_id): values.get("ndvi")
        for zone_id, values in indices.items()
    }
