import random


def calculate_water_infrastructure(zone_data):
    rainfall = zone_data.get("rainfall", random.uniform(400, 1500))
    ndvi = zone_data.get("ndvi", random.uniform(0.2, 0.9))
    soil_moisture = zone_data.get("soil_moisture", random.uniform(0.2, 0.9))
    drought_index = zone_data.get("drought_index", random.uniform(0.1, 1.0))
    urban_pressure = zone_data.get("urban_pressure", random.uniform(0.1, 1.0))

    # Rainfall score
    if rainfall > 1200:
        rainfall_score = 1.0
    elif rainfall > 800:
        rainfall_score = 0.7
    else:
        rainfall_score = 0.3

    # Irrigation support
    irrigation_score = (
        ndvi * 0.4 +
        soil_moisture * 0.4 +
        rainfall_score * 0.2
            )

    # Harvesting potential
    runoff_coefficient = 0.7
    harvesting_potential = min((rainfall / 1500) * runoff_coefficient, 1.0)

    # Water stress
    water_stress = (
        drought_index * 0.5 +
        urban_pressure * 0.3 +
        (1 - rainfall_score) * 0.2
    )

    water_availability = (
        rainfall_score * 0.5 +
        irrigation_score * 0.5
    )

    final_water_score = (
        water_availability * 0.4 +
        harvesting_potential * 0.3 +
        (1 - water_stress) * 0.3
    )
    
    return {
        "water_availability": round(water_availability, 3),
        "rainfall_score": round(rainfall_score, 3),
        "irrigation_score": round(irrigation_score, 3),
        "harvesting_potential": round(harvesting_potential, 3),
        "water_stress": round(water_stress, 3),
        "final_water_score": round(final_water_score, 3)
    }