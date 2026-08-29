from fastapi import APIRouter, HTTPException, status

from app.auth.schemas import LoginRequest, TokenResponse
from app.auth.security import create_access_token, verify_password


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


DEMO_USER = {
    "username": "admin",
    "password": "$argon2id$v=19$m=65536,t=3,p=4$m5S7A0YdG1kPyuqqEnc/KQ$APH/R8FGUS7niR45HQq3m3Ej7pqHxnuqv7Ytj4vRIGg",
    "role": "admin"
}


@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest):

    if credentials.username != DEMO_USER["username"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    if not verify_password(
        credentials.password,
        DEMO_USER["password"]
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    token = create_access_token({
        "sub": DEMO_USER["username"],
        "role": DEMO_USER["role"]
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }
