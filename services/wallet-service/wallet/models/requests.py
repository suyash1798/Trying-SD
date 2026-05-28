from decimal import Decimal

from pydantic import BaseModel, Field


class DeductRequest(BaseModel):
    userId: str
    amount: int = Field(gt=0)
    transactionId: str
    gameId: str | None = None
    referenceId: str | None = None


class CreditRequest(BaseModel):
    userId: str
    amount: int = Field(gt=0)
    transactionId: str
    referenceId: str | None = None


class JackpotSetupRequest(BaseModel):
    gameId: str
    jackpotName: str
    initialAmount: int = Field(ge=0)
    contributionPercent: Decimal = Field(gt=0)
