from fastapi import APIRouter, HTTPException, status
from models.weather import WeatherResponse
from services.weather_service import WeatherService

router = APIRouter(
    prefix="/api/weather",
    tags=["weather"]
)

@router.get(
    "/current",
    response_model=WeatherResponse,
    summary="Get current weather data",
    description="Retrieves live weather data from OpenWeatherMap for Hyderabad, India, with proper timeout and error handling."
)
async def get_current_weather():
    try:
        weather_data = WeatherService.get_current_weather(city="Hyderabad", country_code="IN")
        return weather_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Weather service is currently unavailable: {str(e)}"
        )
