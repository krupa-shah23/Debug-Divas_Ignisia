def recommend_species(zone):
    if zone["temperature"] > 35:
        return "Neem"
    elif zone["soil_moisture"] > 0.3:
        return "Peepal"
    else:
        return "Neem"