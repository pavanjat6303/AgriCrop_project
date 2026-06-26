from pydantic import BaseModel, Field

class MoisturePredictionRequest(BaseModel):
    temperature: float = Field(
        ..., 
        description="Ambient temperature in degrees Celsius", 
        ge=-50, 
        le=60,
        examples=[32]
    )
    humidity: float = Field(
        ..., 
        description="Relative humidity percentage", 
        ge=0, 
        le=100,
        examples=[45]
    )
    rainfall: float = Field(
        ..., 
        description="Precipitation/rainfall in mm", 
        ge=0, 
        le=500,
        examples=[0]
    )
    current_moisture: float = Field(
        ..., 
        description="Current soil moisture percentage", 
        ge=0, 
        le=100,
        examples=[21]
    )

class MoisturePredictionResponse(BaseModel):
    predicted_moisture: int = Field(
        ..., 
        description="Predicted soil moisture percentage (0-100)",
        examples=[18]
    )
    irrigation: str = Field(
        ..., 
        description="Irrigation recommendation status ('Required', 'Stable', 'Not Recommended')",
        examples=["Required"]
    )
