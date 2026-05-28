import os


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgres://postgres:postgres@postgres:5432/game_service",
)
