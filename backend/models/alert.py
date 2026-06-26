from pydantic import BaseModel, Field
from datetime import datetime

class AlertCreate(BaseModel):
    type: str = Field(
        ..., 
        description="The type of alert (Disease, Moisture, Weather, Information)", 
        examples=["Disease"]
    )
    title: str = Field(
        ...,
        description="Title of the alert",
        examples=["Early Blight Detected"]
    )
    message: str = Field(
        ..., 
        description="Detailed description of the alert", 
        examples=["Early Blight detected in Tomato scan of Field 12"]
    )
    priority: str = Field(
        ..., 
        description="Priority level of the alert (High, Medium, Low)", 
        examples=["High"]
    )
    field_id: str | None = Field(
        None,
        description="Associated field ID hex string"
    )
    status: str = Field(
        "Unread", 
        description="Current reading status of the alert (Unread/Read)", 
        examples=["Unread"]
    )

class AlertResponse(AlertCreate):
    id: str = Field(
        ..., 
        description="Auto-generated unique MongoDB identifier as a hex string", 
        examples=["60b8d2f5f1d8c92a4c8b4567"]
    )
    created_at: datetime = Field(
        ..., 
        description="UTC timestamp of when the alert was created"
    )
