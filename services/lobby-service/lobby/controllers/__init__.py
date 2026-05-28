from fastapi import APIRouter

from lobby.controllers.lobby_controller import router as lobby_router


router = APIRouter()
router.include_router(lobby_router)
