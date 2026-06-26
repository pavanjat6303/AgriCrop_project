import os
import uvicorn
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from routes.disease import router as disease_router
from routes.moisture import router as moisture_router
from routes.fields import router as fields_router
from routes.dashboard import router as dashboard_router
from routes.alerts import router as alerts_router
from routes.auth import router as auth_router
from routes.weather import router as weather_router
from services.auth_service import get_current_user
from database import client

app = FastAPI(
    title="AgriCrop Disease Detection API",
    description="Backend API for classifying crop leaf diseases and managing farm health telemetry.",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(disease_router, dependencies=[Depends(get_current_user)])
app.include_router(moisture_router, dependencies=[Depends(get_current_user)])
app.include_router(fields_router, dependencies=[Depends(get_current_user)])
app.include_router(dashboard_router, dependencies=[Depends(get_current_user)])
app.include_router(alerts_router, dependencies=[Depends(get_current_user)])
app.include_router(weather_router)

@app.on_event("startup")
def startup_event():
    # Ensure the uploads directory exists
    os.makedirs("uploads", exist_ok=True)
    
    # Verify MongoDB connection
    try:
        client.admin.command('ping')
        print("MongoDB Connected Successfully")
    except Exception:
        print("MongoDB Connection Failed")

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "AgriCrop Disease Detection Service",
        "version": "1.0.0"
    }

@app.get("/api/test/mongodb")
def test_mongodb():
    try:
        client.admin.command('ping')
        return {
            "status": "connected",
            "message": "MongoDB Connected Successfully"
        }
    except Exception as e:
        return {
            "status": "disconnected",
            "message": f"MongoDB Connection Failed: {str(e)}"
        }

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
