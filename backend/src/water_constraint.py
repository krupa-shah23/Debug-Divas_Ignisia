def is_drought(rainfall, soil_moisture):
    return rainfall < 20 and soil_moisture < 0.2


def check_water_feasibility(row):
    if row["has_water_access"] == 0:
        return False

    if row["distance_to_pipeline"] > 500:
        return False

    return True


def water_feasibility(zone, drought_mode):
    drought = is_drought(zone["rainfall"], zone["soil_moisture"])

    if drought_mode:
        return not drought
    return True
