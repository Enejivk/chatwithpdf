from sqlalchemy.orm import Session
from database import User
from user_models import UserCreate
import datetime
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from starlette.responses import Response
import os
from typing import Optional

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

# OAuth2 scheme for token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/google")


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def get_user_by_google_id(db: Session, google_id: str):
    return db.query(User).filter(User.google_id == google_id).first()


def create_user(db: Session, user: UserCreate):
    db_user = User(
        email=user.email,
        name=user.name,
        picture=user.picture,
        google_id=user.google_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Generate JWT token for the new user
    access_token = create_access_token(data={"sub": str(db_user.id), "email": db_user.email})
    
    # Generate refresh token with longer expiry
    refresh_token = create_access_token(
        data={"sub": str(db_user.id), "email": db_user.email},
        expires_delta=datetime.timedelta(days=30)
    )

    return {
        "user": db_user,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def refresh_access_token(db: Session, current_token: str):
    try:
        payload = jwt.decode(current_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        email = payload.get("email")
        
        if not user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token for refresh"
            )
            
        new_token = create_access_token(
            data={"sub": user_id, "email": email}
        )
        return {"access_token": new_token, "token_type": "bearer"}
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


def get_token(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.last_login = datetime.datetime.utcnow()
        db.commit()
        db.refresh(user)
        
        # Generate new JWT token
        access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
        
        # Generate refresh token with longer expiry
        refresh_token = create_access_token(
            data={"sub": str(user.id), "email": user.email},
            expires_delta=datetime.timedelta(days=30)
        )
        
        return {
            "user": user, 
            "access_token": access_token, 
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    return None


async def get_token_from_cookie_or_header(request: Request):
    """Get token from either cookie or Authorization header"""
    # Try cookie first
    token = request.cookies.get("access_token")
    
    # If not in cookie, try header
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")
    
    # If still no token, raise error
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    return token


async def get_current_user(request: Request):
    print('Getting current user from token...')
    token = await get_token_from_cookie_or_header(request)
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        
        # Check token expiration time
        exp = payload.get("exp")
        if exp is None:
            raise credentials_exception
            
        # If token is expired, raise exception
        if datetime.datetime.fromtimestamp(exp) < datetime.datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
    except JWTError:
        raise credentials_exception
    
    return {"user_id": user_id}


def get_current_user_from_db(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


def decode_refresh_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

    
def get_user_documents(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(User).filter(User.id == user_id).first().documents[skip:limit]


def get_user_chat_history(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(User).filter(User.id == user_id).first().chat_histories[skip:limit]


def set_auth_cookies(response: Response, access_token: str, refresh_token: str, secure: bool = False):
    """Set both access and refresh tokens as HTTP-only cookies."""
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=60*60*24*7  # 7 days
    )
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=60*60  # 1 hour
    )
    return response
