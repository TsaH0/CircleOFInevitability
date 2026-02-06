import os

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.auth import create_access_token, hash_password, verify_password
from app.database import get_db
from app.models import User
from app.schemas import TokenResponse, UserCreate, UserLogin, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Detect environment: if FRONTEND_URL or ENVIRONMENT is set, assume production
_is_production = (
    bool(os.getenv("FRONTEND_URL")) or os.getenv("ENVIRONMENT") == "production"
)


def _set_auth_cookie(response: Response, token: str) -> None:
    """Set the access_token cookie with the correct flags for the environment."""
    if _is_production:
        # Cross-site (Vercel frontend → Render backend): must use None + Secure
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            max_age=90 * 24 * 60 * 60,  # 3 months in seconds
            samesite="none",
            secure=True,
        )
    else:
        # Local development: Lax is fine, no need for Secure
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            max_age=90 * 24 * 60 * 60,
            samesite="lax",
        )


@router.post("/createUser", response_model=UserResponse)
def create_user(
    user_data: UserCreate, response: Response, db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_password = hash_password(user_data.password)

    new_user = User(
        username=user_data.username,
        password=hashed_password,
        email=None,
        rating=30,
        total_contests=0,
        total_problems_solved=0,
        total_problems_attempted=0,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(data={"sub": str(new_user.id)})
    _set_auth_cookie(response, token)

    return new_user


@router.post("/login", response_model=TokenResponse)
def login(user_data: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not verify_password(user_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(data={"sub": str(user.id)})
    _set_auth_cookie(response, token)

    return {"access_token": token, "token_type": "bearer"}


@router.post("/logout")
def logout(response: Response):
    if _is_production:
        response.delete_cookie("access_token", samesite="none", secure=True)
    else:
        response.delete_cookie("access_token")
    return {"message": "Logged out successfully"}
