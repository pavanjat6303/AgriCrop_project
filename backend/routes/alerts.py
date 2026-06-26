from fastapi import APIRouter, HTTPException, status, Depends
from models.alert import AlertCreate, AlertResponse
from services.alert_service import AlertService
from services.auth_service import get_current_user

router = APIRouter(
    prefix="/api/alerts",
    tags=["alerts"]
)

@router.post(
    "", 
    response_model=AlertResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new alert",
    description="Registers a new system alert manually inside the database.",
    response_description="The newly created alert details."
)
async def create_alert(payload: AlertCreate, current_user: dict = Depends(get_current_user)):
    new_alert = AlertService.create_alert(
        alert_type=payload.type,
        title=payload.title,
        message=payload.message,
        priority=payload.priority,
        field_id=payload.field_id,
        status=payload.status,
        user_id=current_user["id"]
    )
    return new_alert

@router.get(
    "", 
    response_model=list[AlertResponse],
    summary="Get all alerts",
    description="Retrieves a list of all alerts currently stored in the database, sorted with the latest alerts first.",
    response_description="A list containing all alert details sorted by timestamp descending."
)
async def get_all_alerts(current_user: dict = Depends(get_current_user)):
    # Prepare backend structure for Weather Alerts:
    # Check if a Weather alert already exists; if not, inject a mock weather alert.
    from database import alerts as alerts_col
    from database import fields as fields_col
    
    # Only inject mock weather warning if the user has registered fields
    if fields_col.count_documents({"user_id": current_user["id"]}) > 0:
        if not alerts_col.find_one({"type": "Weather", "user_id": current_user["id"]}):
            field_doc = fields_col.find_one({"user_id": current_user["id"]})
            field_id = str(field_doc["_id"]) if field_doc else None
            field_name_str = f" for {field_doc['field_name']}" if field_doc else ""
            
            AlertService.create_alert(
                alert_type="Weather",
                title="Irrigation Delay Recommended",
                message=f"Weather forecast predicts heavy precipitation (45mm) in next 24h. Recommended to delay scheduled irrigation{field_name_str}.",
                priority="Medium",
                field_id=field_id,
                status="Unread",
                user_id=current_user["id"]
            )
        
    return AlertService.get_all_alerts(user_id=current_user["id"])

@router.get(
    "/unread-count",
    summary="Get unread alerts count",
    description="Retrieves the total count of alerts with status 'Unread'.",
    response_description="A JSON object containing the count of unread alerts."
)
async def get_unread_alerts_count(current_user: dict = Depends(get_current_user)):
    return {"unread_count": AlertService.get_unread_count(user_id=current_user["id"])}

@router.get(
    "/recent", 
    response_model=list[AlertResponse],
    summary="Get recent alerts",
    description="Retrieves a limited list of the latest alerts from the database, sorted descending by timestamp.",
    response_description="A list of recent alert documents."
)
async def get_recent_alerts(limit: int = 5, current_user: dict = Depends(get_current_user)):
    return AlertService.get_recent_alerts(user_id=current_user["id"], limit=limit)

@router.post(
    "/{id}/read",
    response_model=AlertResponse,
    summary="Mark alert as read (POST)",
    description="Updates the status of a specific alert by its unique hex ID to 'Read' via a POST request.",
    response_description="The updated alert document details.",
    responses={
        404: {"description": "Alert not found"}
    }
)
async def mark_alert_as_read_post(id: str, current_user: dict = Depends(get_current_user)):
    updated = AlertService.mark_as_read(id, current_user["id"])
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID {id} not found"
        )
    return updated

@router.put(
    "/{id}/read", 
    response_model=AlertResponse,
    summary="Mark alert as read (PUT)",
    description="Updates the status of a specific alert by its unique hex ID to 'Read' via a PUT request.",
    response_description="The updated alert document details.",
    responses={
        404: {"description": "Alert not found"}
    }
)
async def mark_alert_as_read_put(id: str, current_user: dict = Depends(get_current_user)):
    updated = AlertService.mark_as_read(id, current_user["id"])
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID {id} not found"
        )
    return updated

@router.delete(
    "/{id}", 
    summary="Delete alert",
    description="Deletes a specific alert from the database by its unique hex ID.",
    response_description="Confirmation of successful deletion.",
    responses={
        404: {"description": "Alert not found"}
    }
)
async def delete_alert(id: str, current_user: dict = Depends(get_current_user)):
    deleted = AlertService.delete_alert(id, current_user["id"])
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID {id} not found"
        )
    return {"message": f"Alert {id} deleted successfully"}
