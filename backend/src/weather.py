import requests
import os

API_KEY = os.getenv("OPENWEATHER_API_KEY")


def get_weather(city):
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric"
    try:
        res = requests.get(url).json()
        rainfall = res.get("rain", {}).get("1h", 0)
        temperature = res.get("main", {}).get("temp", 30)
        return {
            "rainfall": rainfall,
            "temperature": temperature,
        }
    except Exception:
        return {
            "rainfall": 10,
            "temperature": 30,
        }


def get_rainfall(city):
    return get_weather(city)["rainfall"]
