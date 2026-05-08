import requests

# =========================================
# CITY COORDINATES
# =========================================

CITY_COORDS = {
    "delhi": (28.6139, 77.2090),
    "mumbai": (19.0760, 72.8777),
    "kolkata": (22.5726, 88.3639),
    "bangalore": (12.9716, 77.5946),
    "chennai": (13.0827, 80.2707),
    "hyderabad": (17.3850, 78.4867),
    "ahmedabad": (23.0225, 72.5714),
    "pune": (18.5204, 73.8567),
    "surat": (21.1702, 72.8311),
    "jaipur": (26.9124, 75.7873),
    "lucknow": (26.8467, 80.9462),
    "kanpur": (26.4499, 80.3319),
    "nagpur": (21.1458, 79.0882),
    "indore": (22.7196, 75.8577),
    "vadodara": (22.3072, 73.1812),
}


# =========================================
# MAIN CLIMATE FUNCTION
# =========================================

def get_climate_data(
    city,
    start_date="2025-01-01",
    end_date="2025-03-01",
):

    city_key = city.strip().lower()

    if city_key not in CITY_COORDS:
        raise ValueError(f"Unsupported city: {city}")

    latitude, longitude = CITY_COORDS[city_key]

    url = "https://archive-api.open-meteo.com/v1/archive"

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": start_date,
        "end_date": end_date,

        "daily": [
            "temperature_2m_mean",
            "precipitation_sum",
            "et0_fao_evapotranspiration",
            "relative_humidity_2m_mean",
        ],

        "timezone": "auto",
    }

    response = requests.get(url, params=params, timeout=30)

    response.raise_for_status()

    data = response.json()

    daily = data.get("daily", {})

    temperatures = daily.get("temperature_2m_mean", [])
    rainfall = daily.get("precipitation_sum", [])
    evapotranspiration = daily.get(
        "et0_fao_evapotranspiration",
        []
    )
    humidity = daily.get(
        "relative_humidity_2m_mean",
        []
    )

    if not temperatures:
        raise RuntimeError("No climate data returned")

    avg_temp = sum(temperatures) / len(temperatures)
    total_rainfall = sum(rainfall)
    avg_humidity = sum(humidity) / len(humidity)
    avg_evapo = sum(evapotranspiration) / len(evapotranspiration)

    # =========================================
    # HEATWAVE DAYS
    # =========================================

    heatwave_days = len(
        [temp for temp in temperatures if temp >= 40]
    )

    return {
        "temperature": round(avg_temp, 2),
        "rainfall": round(total_rainfall, 2),
        "humidity": round(avg_humidity, 2),
        "evapotranspiration": round(avg_evapo, 2),
        "heatwave_days": heatwave_days,
    }