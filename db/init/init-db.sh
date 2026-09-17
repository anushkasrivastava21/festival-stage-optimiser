#!/bin/bash
set -e

echo "Running migrations..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /db/migrations/01_schema.sql

echo "Creating procedures..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /db/procedures/01_pivot_vibe.sql

echo "Creating triggers..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /db/triggers/01_recalc_vibe_score.sql

echo "Seeding data..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /db/seeds/01_vibe_clusters_seed.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /db/seeds/02_ml_generated_seed.sql

echo "Database initialization complete."
