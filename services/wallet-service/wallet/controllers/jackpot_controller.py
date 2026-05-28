from fastapi import APIRouter

from wallet.models import JackpotSetupRequest
from wallet.services import JackpotService


router = APIRouter()
jackpot_service = JackpotService()


@router.post("/jackpots")
def setup_jackpot(request: JackpotSetupRequest):
    return jackpot_service.setup(request)


@router.get("/jackpots/{game_id}")
def list_jackpots(game_id: str):
    return jackpot_service.list_by_game(game_id)
