from pydantic import BaseModel, Field

class WeatherResponse(BaseModel):
    city: str = Field(..., description="The name of the location/city", examples=["Hyderabad"])
    temperature: int = Field(..., description="Current temperature in Celsius", examples=[28])
    weather: str = Field(..., description="Short weather condition description", examples=["Partly Cloudy"])
    humidity: int = Field(..., description="Current humidity percentage", examples=[45])
    wind_speed: int = Field(..., description="Current wind speed rounded to nearest integer", examples=[12])
    rainfall: float = Field(..., description="Rainfall volume in the last hour/three hours in mm", examples=[20.0])
    weather_icon: str = Field(..., description="OpenWeatherMap weather icon code", examples=["10d"])
