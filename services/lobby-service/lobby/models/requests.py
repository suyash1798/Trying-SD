from pydantic import BaseModel


class LoadGameRequest(BaseModel):
    userId: str
