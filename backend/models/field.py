from pydantic import BaseModel, Field

class FieldCreate(BaseModel):
    field_name: str = Field(
        ..., 
        description="Name of the farm field", 
        examples=["Field 12"]
    )
    crop: str = Field(
        ..., 
        description="Crop type planted in the field", 
        examples=["Tomato"]
    )
    area: float = Field(
        ..., 
        description="Area of the field in acres/hectares", 
        ge=0.0,
        examples=[6.0]
    )
    latitude: float = Field(
        ..., 
        description="Latitude coordinate of the field location", 
        ge=-90.0, 
        le=90.0, 
        examples=[17.3850]
    )
    longitude: float = Field(
        ..., 
        description="Longitude coordinate of the field location", 
        ge=-180.0, 
        le=180.0, 
        examples=[78.4867]
    )
    status: str = Field(
        ..., 
        description="Current health/operational status of the field (e.g. Healthy, Infected, Fallow)", 
        examples=["Healthy"]
    )
    location: str = Field(
        "Hyderabad",
        description="Textual location of the field",
        examples=["Sangareddy"]
    )

class FieldResponse(FieldCreate):
    id: str = Field(
        ..., 
        description="Auto-generated unique MongoDB identifier as a hex string", 
        examples=["60b8d2f5f1d8c92a4c8b4567"]
    )
    current_moisture: float | None = Field(
        None,
        description="Current soil moisture percentage of the field"
    )
    disease_status: str | None = Field(
        None,
        description="Disease detected status or Healthy description"
    )
    last_scan_time: str | None = Field(
        None,
        description="Timestamp of the last disease scan or alert"
    )
    ai_recommendation: str | None = Field(
        None,
        description="AI recommendation for the field's health"
    )

