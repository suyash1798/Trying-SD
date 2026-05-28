from fastapi import APIRouter

from wallet.models import CreditRequest, DeductRequest
from wallet.services import WalletService


router = APIRouter()
wallet_service = WalletService()


@router.get("/")
def health():
    return {"status": "ok", "service": "wallet-service"}


@router.get("/balance/{user_id}")
def get_balance(user_id: str):
    return wallet_service.balance(user_id)


@router.post("/deduct")
def deduct(request: DeductRequest):
    return wallet_service.deduct(request)


@router.post("/credit")
def credit(request: CreditRequest):
    return wallet_service.credit(request)
