from pydantic import BaseModel, Field, EmailStr

class UserRegister(BaseModel):
    username: str = Field(
        ..., 
        description="Choose a unique username", 
        min_length=3,
        max_length=50,
        examples=["ramesh"]
    )
    email: str = Field(
        ..., 
        description="User email address", 
        examples=["ramesh.kumar@gmail.com"]
    )
    password: str = Field(
        ..., 
        description="Secure password (minimum 6 characters)", 
        min_length=6,
        examples=["superSecret123"]
    )

class UserLogin(BaseModel):
    username: str = Field(
        ..., 
        description="Registered username", 
        examples=["ramesh"]
    )
    password: str = Field(
        ..., 
        description="User password", 
        examples=["superSecret123"]
    )

class TokenResponse(BaseModel):
    access_token: str = Field(
        ..., 
        description="Signed JWT access token", 
        examples=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."]
    )
    token_type: str = Field(
        "bearer", 
        description="Token type", 
        examples=["bearer"]
    )
