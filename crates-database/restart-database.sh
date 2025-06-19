#!/usr/bin/env bash

set -e -o pipefail

echo "Restarting crates database..."

# Stop the database
./stop-database.sh

# Start the database
./start-database.sh

echo "Database restart complete!"