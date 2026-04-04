def check_water_feasibility(row):
    if row["has_water_access"] == 0:
        return False
    
    if row["distance_to_pipeline"] > 500:
        return False
    
    return True