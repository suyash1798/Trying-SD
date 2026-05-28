from wallet.database import connection
from wallet.models import JackpotSetupRequest
from wallet.repositories import JackpotRepository


class JackpotService:
    def __init__(self):
        self.jackpots = JackpotRepository()

    def setup(self, request: JackpotSetupRequest):
        with connection() as conn:
            row = self.jackpots.save_config(
                conn,
                request.gameId,
                request.jackpotName,
                request.initialAmount,
                request.contributionPercent,
            )
            conn.commit()
            return row

    def list_by_game(self, game_id: str):
        with connection() as conn:
            return {"gameId": game_id, "jackpots": self.jackpots.list_by_game(conn, game_id)}
