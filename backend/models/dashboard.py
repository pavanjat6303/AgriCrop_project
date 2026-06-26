from pydantic import BaseModel, Field
from datetime import datetime

class DashboardStatsResponse(BaseModel):
    total_fields: int = Field(
        ..., 
        description="Total number of registered fields", 
        examples=[24]
    )
    healthy_fields: int = Field(
        ..., 
        description="Number of healthy fields (status='Healthy')", 
        examples=[19]
    )
    diseased_fields: int = Field(
        ..., 
        description="Number of diseased fields (status='Infected' or 'Diseased')", 
        examples=[5]
    )
    average_moisture: int = Field(
        ..., 
        description="Average soil moisture percentage across all predictions", 
        examples=[28]
    )

class RecentScanResponse(BaseModel):
    id: str = Field(
        ..., 
        description="Hex string representation of MongoDB ObjectId", 
        examples=["60b8d2f5f1d8c92a4c8b4567"]
    )
    filename: str = Field(
        ..., 
        description="The scanned leaf image filename", 
        examples=["tomato_leaf.jpg"]
    )
    disease: str = Field(
        ..., 
        description="Diagnosed crop disease class name", 
        examples=["Early Blight"]
    )
    confidence: float = Field(
        ..., 
        description="Classification model confidence score", 
        examples=[96.3]
    )
    recommendation: str = Field(
        ..., 
        description="Operational remedy or recommendation", 
        examples=["Remove infected leaves and apply fungicide."]
    )
    timestamp: datetime = Field(
        ..., 
        description="UTC time the scan was conducted and stored"
    )

class MoistureSummaryResponse(BaseModel):
    average_moisture: int = Field(
        ..., 
        description="Average current soil moisture level percentage", 
        examples=[28]
    )
    recommendations: dict[str, int] = Field(
        ..., 
        description="Tally of current irrigation status categories", 
        examples=[{"Required": 2, "Stable": 5, "Not Recommended": 1}]
    )

class DashboardOverviewResponse(BaseModel):
    stats: DashboardStatsResponse = Field(
        ..., 
        description="Aggregated crop and soil telemetry metrics"
    )
    recent_scans: list[RecentScanResponse] = Field(
        ..., 
        description="List of recent leaf classification scans"
    )
    moisture_summary: MoistureSummaryResponse = Field(
        ..., 
        description="Current soil health and irrigation summaries"
    )
