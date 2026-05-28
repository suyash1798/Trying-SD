from fastapi import APIRouter

from wallet.controllers.jackpot_controller import router as jackpot_router
from wallet.controllers.wallet_controller import router as wallet_router


router = APIRouter()
router.include_router(wallet_router)
router.include_router(jackpot_router)
