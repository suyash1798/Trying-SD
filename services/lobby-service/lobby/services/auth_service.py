import jwt
from fastapi import HTTPException

from lobby.config import JWT_SECRET


class AuthService:
    def player_id(self, authorization: str | None):
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail={"error": "missing token"})

        token = authorization.removeprefix("Bearer ").strip()

        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        except jwt.PyJWTError:
            raise HTTPException(status_code=401, detail={"error": "invalid token"})

        player_id = payload.get("sub")

        if not player_id:
            raise HTTPException(status_code=401, detail={"error": "invalid token"})

        return player_id
