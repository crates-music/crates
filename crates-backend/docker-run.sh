#!/usr/bin/env bash

# Convenience script to just run the container (assumes image is already built)

set -e -o pipefail

# Create the custom network if it doesn't exist
docker network create crates-network 2>/dev/null || echo "Network crates-network already exists"

# Stop and remove existing container
docker rm -f crates-backend 2>/dev/null || echo "Container crates-backend not running"

# Run the container
docker run -d \
  --name crates-backend \
  --network crates-network \
  --network-alias crates-backend \
  -p 8980:8080 \
  -e SPRING_PROFILES_ACTIVE=dev \
  crates/crates-backend:0.0.1-SNAPSHOT

echo "Container started. View logs with: docker logs -f crates-backend"