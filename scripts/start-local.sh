#!/usr/bin/env sh
set -e

docker compose up -d redis postgres dynamodb
docker compose run --rm game-service npm run db:migrate
docker compose up --build wallet-service game-service
