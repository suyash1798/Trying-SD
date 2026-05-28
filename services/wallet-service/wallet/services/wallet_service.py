from fastapi import HTTPException

from wallet.database import connection
from wallet.models import CreditRequest, DeductRequest
from wallet.repositories import JackpotRepository, TransactionRepository, WalletRepository


class WalletService:
    def __init__(self):
        self.wallets = WalletRepository()
        self.transactions = TransactionRepository()
        self.jackpots = JackpotRepository()

    def balance(self, user_id: str):
        with connection() as conn:
            wallet = self.wallets.get_or_create_wallet(conn, user_id)
            return {"userId": user_id, "balance": wallet["balance"]}

    def deduct(self, request: DeductRequest):
        with connection() as conn:
            with conn.transaction():
                existing = self.transactions.get(conn, request.transactionId)
                if existing:
                    return self._duplicate_response(existing)

                wallet = self.wallets.get_or_create_wallet(conn, request.userId)
                if wallet["balance"] < request.amount:
                    raise HTTPException(status_code=400, detail={"error": "insufficient funds"})

                next_balance = wallet["balance"] - request.amount
                self.wallets.update_balance(conn, request.userId, next_balance)
                self.transactions.insert(
                    conn,
                    request.transactionId,
                    request.userId,
                    "DEDUCT",
                    request.amount,
                    next_balance,
                    request.referenceId,
                    request.gameId,
                )
                contributions = self.jackpots.contribute(
                    conn,
                    request.gameId,
                    request.transactionId,
                    request.amount,
                )

                return {
                    "userId": request.userId,
                    "balance": next_balance,
                    "jackpotContributions": contributions,
                }

    def credit(self, request: CreditRequest):
        with connection() as conn:
            with conn.transaction():
                existing = self.transactions.get(conn, request.transactionId)
                if existing:
                    return self._duplicate_response(existing)

                wallet = self.wallets.get_or_create_wallet(conn, request.userId)
                next_balance = wallet["balance"] + request.amount
                self.wallets.update_balance(conn, request.userId, next_balance)
                self.transactions.insert(
                    conn,
                    request.transactionId,
                    request.userId,
                    "CREDIT",
                    request.amount,
                    next_balance,
                    request.referenceId,
                    None,
                )

                return {"userId": request.userId, "balance": next_balance}

    def _duplicate_response(self, transaction):
        return {
            "userId": transaction["user_id"],
            "balance": transaction["balance_after"],
            "duplicate": True,
        }
