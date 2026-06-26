from fastapi import APIRouter, HTTPException, status, Depends
from models.field import FieldCreate, FieldResponse
from services.field_service import FieldService
from services.auth_service import get_current_user

router = APIRouter(
    prefix="/api/fields",
    tags=["fields"]
)

@router.post(
    "", 
    response_model=FieldResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new farm field",
    description="Registers a new agricultural field with detailed spatial and operational metadata.",
    response_description="The newly created field document details including its unique ID."
)
async def create_field(payload: FieldCreate, current_user: dict = Depends(get_current_user)):
    new_field = FieldService.create_field(payload, current_user["id"])
    return new_field

@router.get(
    "", 
    response_model=list[FieldResponse],
    summary="Get all fields",
    description="Retrieves a list of all registered fields currently in the database.",
    response_description="A list containing all fields operational data."
)
async def get_all_fields(current_user: dict = Depends(get_current_user)):
    return FieldService.get_all_fields(current_user["id"])

@router.get(
    "/{id}", 
    response_model=FieldResponse,
    summary="Get single field",
    description="Retrieves the detailed metadata of a specific field by its unique hex ID.",
    response_description="The field details for the specified ID.",
    responses={
        404: {"description": "Field not found"}
    }
)
async def get_field(id: str, current_user: dict = Depends(get_current_user)):
    field = FieldService.get_field_by_id(id, current_user["id"])
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Field with ID {id} not found"
        )
    return field

@router.put(
    "/{id}", 
    response_model=FieldResponse,
    summary="Update field",
    description="Updates the metadata (name, crop, area, location, status) of a specific field by its unique ID.",
    response_description="The updated field operational details.",
    responses={
        404: {"description": "Field not found"}
    }
)
async def update_field(id: str, payload: FieldCreate, current_user: dict = Depends(get_current_user)):
    updated_field = FieldService.update_field(id, payload, current_user["id"])
    if not updated_field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Field with ID {id} not found"
        )
    return updated_field

@router.delete(
    "/{id}", 
    summary="Delete field",
    description="Deletes a specific field from the database by its unique hex ID.",
    response_description="Confirmation message of successful deletion.",
    responses={
        404: {"description": "Field not found"}
    }
)
async def delete_field(id: str, current_user: dict = Depends(get_current_user)):
    deleted = FieldService.delete_field(id, current_user["id"])
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Field with ID {id} not found"
        )
    return {"message": f"Field {id} deleted successfully"}
