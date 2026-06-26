from pydantic import BaseModel, Field

class DiseasePredictionResponse(BaseModel):
    disease: str = Field(..., description="The predicted disease class name", examples=["Early Blight"])
    confidence: float = Field(..., description="Prediction confidence percentage", examples=[97.4])
    recommendation: str = Field(..., description="Actionable agricultural recommendation", examples=["Remove infected leaves and apply fungicide."])
    field_status: str = Field(..., description="Updated status of the corresponding field", examples=["High Risk"])
    alert_created: bool = Field(..., description="Whether a disease alert notification was generated in the system", examples=[True])
