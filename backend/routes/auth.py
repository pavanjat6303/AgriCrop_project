from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from models.auth import UserRegister, UserLogin, TokenResponse
from services.auth_service import AuthService
from database import users

router = APIRouter(
    prefix="/api/auth",
    tags=["authentication"]
)

@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Registers a new user account with a unique username and email, securely hashing the password.",
    response_description="A registration confirmation message."
)
async def register(payload: UserRegister):
    # Check if username already exists in database
    if users.find_one({"username": {"$regex": f"^{payload.username}$", "$options": "i"}}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered. Please choose another one."
        )

    # Check if email already exists in database
    if users.find_one({"email": {"$regex": f"^{payload.email}$", "$options": "i"}}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address already registered. Please sign in instead."
        )

    # Hash the password with bcrypt
    hashed_pwd = AuthService.hash_password(payload.password)

    # Insert user details into MongoDB Atlas
    users.insert_one({
        "username": payload.username,
        "email": payload.email,
        "password_hash": hashed_pwd,
        "created_at": datetime.utcnow()
    })

    return {
        "message": "User account created successfully",
        "username": payload.username
    }

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User Login",
    description="Authenticates credentials and issues a signed JWT access token for authorization.",
    response_description="The issued JWT access token and its token type."
)
async def login(payload: UserLogin):
    # Find user document in MongoDB
    user = users.find_one({"username": payload.username})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password credentials"
        )

    # Verify password hash
    if not AuthService.verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password credentials"
        )

    # Issue JWT token
    access_token = AuthService.create_access_token(payload.username)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
