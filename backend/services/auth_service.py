import os
import bcrypt
import jwt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import users

# We use HTTPBearer to seamlessly extract the Bearer token and wire it to Swagger UI automatically
reusable_oauth2 = HTTPBearer()

class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        # Hashing with bcrypt
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')

    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:
        # Verifying with bcrypt
        try:
            return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
        except Exception:
            return False

    @staticmethod
    def create_access_token(username: str) -> str:
        # Sign JWT access token with 24 hours expiration
        secret_key = os.getenv("JWT_SECRET", "supersecretagricropkeyforjwtauthsigning123!")
        payload = {
            "sub": username,
            "exp": datetime.utcnow() + timedelta(hours=24),
            "iat": datetime.utcnow()
        }
        return jwt.encode(payload, secret_key, algorithm="HS256")

async def get_current_user(http_auth: HTTPAuthorizationCredentials = Depends(reusable_oauth2)) -> dict:
    token = http_auth.credentials
    secret_key = os.getenv("JWT_SECRET", "supersecretagricropkeyforjwtauthsigning123!")
    
    try:
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload is missing credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check MongoDB database if user exists
    user = users.find_one({"username": username})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user account does not exist",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "email": user.get("email", "")
    }
