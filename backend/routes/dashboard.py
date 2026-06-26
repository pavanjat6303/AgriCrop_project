from fastapi import APIRouter, Depends
from models.dashboard import (
    DashboardStatsResponse,
    RecentScanResponse,
    MoistureSummaryResponse,
    DashboardOverviewResponse
)
from services.dashboard_service import DashboardService
from services.auth_service import get_current_user

router = APIRouter(
    prefix="/api/dashboard",
    tags=["dashboard"]
)

@router.get(
    "/stats", 
    response_model=DashboardStatsResponse,
    summary="Get dashboard statistics",
    description="Calculates and returns total registered fields, healthy vs diseased fields count, and overall average soil moisture.",
    response_description="A dashboard statistics overview metrics payload."
)
async def get_stats(current_user: dict = Depends(get_current_user)):
    return DashboardService.get_stats(current_user["id"])

@router.get(
    "/recent-scans", 
    response_model=list[RecentScanResponse],
    summary="Get recent crop disease scans",
    description="Retrieves the latest crop disease classification scans conducted on the farm, ordered by timestamp descending.",
    response_description="A list containing details of recent scans."
)
async def get_recent_scans(current_user: dict = Depends(get_current_user)):
    return DashboardService.get_recent_scans(current_user["id"])

@router.get(
    "/moisture-summary", 
    response_model=MoistureSummaryResponse,
    summary="Get soil moisture summary",
    description="Aggregates soil moisture data and tallies irrigation recommendation categories across the farm.",
    response_description="Soil moisture average metrics and irrigation tallies."
)
async def get_moisture_summary(current_user: dict = Depends(get_current_user)):
    return DashboardService.get_moisture_summary(current_user["id"])

@router.get(
    "/overview", 
    response_model=DashboardOverviewResponse,
    summary="Get full dashboard overview",
    description="Combines stats, recent disease scans, and soil moisture summaries into a single response payload for efficient client-side rendering.",
    response_description="A consolidated payload containing stats, recent scans, and moisture summaries."
)
async def get_overview(current_user: dict = Depends(get_current_user)):
    return DashboardService.get_overview(current_user["id"])
