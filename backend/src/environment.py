from src.gis.spectral_indices import get_spectral_indices
from src.soil import estimate_soil_moisture
from src.climate import get_climate_data
from src.soil_data import get_soil_data, normalize_soil_values


def get_environment_data(city):
    climate = get_climate_data(city)
    soil_data = normalize_soil_values(
        get_soil_data(city)
    )
    zone_ids = [f"Z{i}" for i in range(1, 10)]
    indices = get_spectral_indices(city)

    zones = []

    for zone_id in zone_ids:
        ndvi = indices.get(zone_id, {}).get("ndvi")
        if ndvi is None:
            ndvi = float("nan")

        soil = estimate_soil_moisture(climate["rainfall"], ndvi)
        zones.append(
            {
                "zone": zone_id,
                "temperature": climate["temperature"],
                "rainfall": climate["rainfall"],
                "humidity": climate["humidity"],
                "evapotranspiration": climate["evapotranspiration"],
                "heatwave_days": climate["heatwave_days"],
                "ndvi": ndvi,
                "soil_moisture": soil,
                "soil_ph": soil_data["ph"],
                "soil_clay": soil_data["clay"],
                "soil_sand": soil_data["sand"],
                "organic_carbon": soil_data["organic_carbon"],
                "bulk_density": soil_data["bulk_density"],
            }
        )

    return zones
