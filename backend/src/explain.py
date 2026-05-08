def get_zone_reason(row):
    if row.get("drought_index", 0) > 0.7:
        return "High drought risk due to adverse climate and negative sentiment"

    if row.get("soil_moisture", 0) < 0.2:
        return "Low soil moisture impacting vegetation survival"

    if not row.get("water_feasible", True):
        return "Water infrastructure constraints"

    if row.get("NDVI", 0) < 0.3:
        return "Low vegetation density detected"

    return "Favorable conditions for tree plantation"
