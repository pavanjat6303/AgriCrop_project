from datetime import datetime
from fastapi import APIRouter, Depends
from models.moisture import MoisturePredictionRequest, MoisturePredictionResponse
from services.moisture import MoisturePredictionService
from database import soil_predictions
from services.alert_service import AlertService
from services.auth_service import get_current_user

router = APIRouter(
    prefix="/api/moisture",
    tags=["moisture"]
)

@router.post(
    "/predict", 
    response_model=MoisturePredictionResponse,
    summary="Predict Soil Moisture",
    description="Predicts soil moisture percentage and provides irrigation recommendations based on temperature, humidity, rainfall, and current moisture levels."
)
async def predict_soil_moisture(payload: MoisturePredictionRequest, current_user: dict = Depends(get_current_user)):
    predicted_moisture, irrigation = MoisturePredictionService.predict_moisture(
        temperature=payload.temperature,
        humidity=payload.humidity,
        rainfall=payload.rainfall,
        current_moisture=payload.current_moisture
    )
    
    # Save prediction parameters and result to MongoDB
    soil_predictions.insert_one({
        "temperature": payload.temperature,
        "humidity": payload.humidity,
        "rainfall": payload.rainfall,
        "current_moisture": payload.current_moisture,
        "predicted_moisture": predicted_moisture,
        "irrigation": irrigation,
        "timestamp": datetime.utcnow(),
        "user_id": current_user["id"]
    })

    # Automatically create moisture alert if irrigation is Required
    if irrigation == "Required":
        # Resolve field ID
        from database import fields
        field_doc = fields.find_one({"status": {"$regex": "^low moisture$", "$options": "i"}, "user_id": current_user["id"]})
        if not field_doc:
            field_doc = fields.find_one({"user_id": current_user["id"]})
        field_id = str(field_doc["_id"]) if field_doc else None
        
        field_name_str = f" in {field_doc['field_name']}" if field_doc else ""
        msg = f"Soil moisture has fallen to {predicted_moisture}%{field_name_str}. Irrigation is recommended within 24 hours."
        
        AlertService.create_alert(
            alert_type="Moisture",
            title="Low Soil Moisture Warning",
            message=msg,
            priority="Medium",
            field_id=field_id,
            status="Unread",
            user_id=current_user["id"]
        )

    return {
        "predicted_moisture": predicted_moisture,
        "irrigation": irrigation
    }
