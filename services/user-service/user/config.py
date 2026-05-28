import os


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgres://postgres:postgres@postgres:5432/game_service",
)
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_TTL_SECONDS = int(os.getenv("JWT_TTL_SECONDS", "86400"))
