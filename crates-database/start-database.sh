#!/usr/bin/env bash

set -e -o pipefail

# Create the custom network if it doesn't exist
docker network create crates-network 2>/dev/null || echo "Network crates-network already exists"

# Stop and remove existing container
docker rm -f crates-database 2>/dev/null || echo "Container crates-database not running"

# Start PostgreSQL database container
echo "Starting crates database container..."
docker run -d \
  --name crates-database \
  --network crates-network \
  --network-alias crates-database \
  -p 5432:5432 \
  -v crates-database:/var/lib/postgresql/data \
  -v "$(pwd)/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql:ro" \
  -e POSTGRES_PASSWORD=liltecca \
  -e POSTGRES_INITDB_ARGS="--encoding=UTF8 --locale=C.UTF-8" \
  postgres:12-bullseye

echo "✅ Database container started!"
echo "- Container name: crates-database"
echo "- Network: crates-network"
echo "- Port: 5432:5432"
echo "- Database: crates"
echo "- User: crates"
echo "- Password: cratesforfun"
echo ""
echo "View logs with: docker logs -f crates-database"