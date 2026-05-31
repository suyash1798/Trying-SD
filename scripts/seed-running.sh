#!/usr/bin/env sh
set -e

echo "Running game-service migrations in the existing container..."
docker compose exec -T game-service npm run db:migrate

echo "Seeding small game-service demo data in the existing container..."
docker compose exec -T game-service npm run db:seed

echo "Seeding persistent game-player data in the existing container..."
docker compose exec -T game-service npm run seed:persistent

echo "Done."
