def compute_drought_index(
    rainfall,
    soil_moisture,
    temperature,
    ndvi,
    humidity,
    evapotranspiration,
    heatwave_days,
):

    # =====================================
    # RAINFALL DEFICIT
    # =====================================

    rain_factor = max(0, 1 - (rainfall / 100))

    # =====================================
    # SOIL DRYNESS
    # =====================================

    soil_factor = max(0, 1 - soil_moisture)

    # =====================================
    # VEGETATION STRESS
    # =====================================

    vegetation_factor = 1 - ndvi

    # =====================================
    # TEMPERATURE STRESS
    # =====================================

    temp_factor = max(0, (temperature - 30) / 15)

    # =====================================
    # LOW HUMIDITY STRESS
    # =====================================

    humidity_factor = max(0, 1 - (humidity / 100))

    # =====================================
    # EVAPOTRANSPIRATION STRESS
    # =====================================

    evap_factor = min(evapotranspiration / 10, 1)

    # =====================================
    # HEATWAVE IMPACT
    # =====================================

    heatwave_factor = min(heatwave_days / 30, 1)

    # =====================================
    # FINAL DROUGHT INDEX
    # =====================================

    drought_index = (
        0.20 * rain_factor
        + 0.25 * soil_factor
        + 0.15 * vegetation_factor
        + 0.10 * temp_factor
        + 0.10 * humidity_factor
        + 0.10 * evap_factor
        + 0.10 * heatwave_factor
    )

    return round(
        max(0, min(1, drought_index)),
        2
    )