import os


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgres://postgres:postgres@postgres:5432/game_service",
)
DEFAULT_BALANCE = int(os.getenv("DEFAULT_BALANCE", "10000000"))
