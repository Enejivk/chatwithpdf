from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: str
    name: str
    picture: Optional[str] = None

class UserCreate(UserBase):
    google_id: str

class UserResponse(UserBase):
    id: int
    google_id: str
    is_active: bool
    created_at: datetime
    last_login: datetime
    
    class Config:
        orm_mode = True

class GoogleAuthResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    user_id: int
    email: Optional[str] = None
