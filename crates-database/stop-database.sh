#!/usr/bin/env bash

set -e -o pipefail

echo "Stopping crates database container..."

# Stop and remove the database container
docker rm -f crates-database 2>/dev/null || echo "Container crates-database was not running"

echo "Database container stopped."
echo ""
echo "To also remove the database volume (THIS WILL DELETE ALL DATA):"
echo "  docker volume rm crates-database"
echo ""
echo "To restart the database:"
echo "  ./start-database.sh"