import os
import urllib.request
import urllib.parse
import json
from dotenv import load_dotenv

load_dotenv()

class WeatherService:
    @staticmethod
    def get_current_weather(city: str = "Hyderabad", country_code: str = "IN") -> dict:
        api_key = os.getenv("OPENWEATHER_API_KEY")
        if not api_key:
            raise ValueError("OPENWEATHER_API_KEY is not configured in the environment.")

        # Construct OpenWeatherMap Current Weather API URL
        query = f"{city},{country_code}"
        params = {
            "q": query,
            "appid": api_key,
            "units": "metric"
        }
        url = "https://api.openweathermap.org/data/2.5/weather?" + urllib.parse.urlencode(params)

        try:
            req = urllib.request.Request(url)
            # Fetch with a 10 seconds timeout
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status != 200:
                    raise Exception(f"OpenWeatherMap API responded with status {response.status}")
                
                raw_data = response.read().decode('utf-8')
                data = json.loads(raw_data)
                
                # Extract and map values to requested response format
                weather_info = data.get("weather", [{}])[0]
                weather_desc = weather_info.get("description", "Partly Cloudy").title()
                weather_icon = weather_info.get("icon", "10d")
                
                main_data = data.get("main", {})
                wind_data = data.get("wind", {})
                rain_data = data.get("rain", {})
                
                # Check for rain volume in 1h or 3h
                rainfall = rain_data.get("1h", rain_data.get("3h", 0.0))
                
                return {
                    "city": data.get("name", city),
                    "temperature": int(round(main_data.get("temp", 28))),
                    "weather": weather_desc,
                    "humidity": main_data.get("humidity", 45),
                    "wind_speed": int(round(wind_data.get("speed", 12))),
                    "rainfall": float(rainfall),
                    "weather_icon": weather_icon
                }
        except Exception as e:
            print(f"Error fetching live weather: {str(e)}")
            raise e
