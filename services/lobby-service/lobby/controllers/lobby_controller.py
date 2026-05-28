from fastapi import APIRouter

from lobby.models import LoadGameRequest
from lobby.services import LobbyService


router = APIRouter()
lobby_service = LobbyService()


@router.get("/")
def health():
    return {"status": "ok", "service": "lobby-service"}


@router.post("/games/{game_id}/load")
def load_game(game_id: str, request: LoadGameRequest):
    return lobby_service.load_game(game_id, request)


@router.get("/rooms/{room_id}")
def get_room(room_id: str):
    return lobby_service.get_room(room_id)

