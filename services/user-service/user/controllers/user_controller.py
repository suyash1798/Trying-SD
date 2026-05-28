from fastapi import APIRouter

from user.models import DeviceLoginRequest
from user.services import UserService


router = APIRouter()
user_service = UserService()


@router.get("/")
def health():
    return {"status": "ok", "service": "user-service"}


@router.post("/devices")
def login_device(request: DeviceLoginRequest):
    return user_service.login_device(request)
