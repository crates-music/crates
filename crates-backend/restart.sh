#!/usr/bin/env bash

set -e -o pipefail

# Create the custom network if it doesn't exist
docker network create crates-network 2>/dev/null || echo "Network crates-network already exists"

# Check if database is running, start if needed
if ! docker ps | grep -q crates-database; then
  echo "Database not running, starting it..."
  cd ../crates-database
  ./start-database.sh > /dev/null 2>&1 &
  cd - > /dev/null
  sleep 5
  echo "Database started"
fi

# Build the application JAR
echo "Building application..."
./mvnw clean install -DskipTests

# Build Docker image using existing Dockerfile (no Maven plugin needed)
echo "Building Docker image..."
docker build -t crates/crates-backend:0.0.1-SNAPSHOT .

# Stop and remove existing container
docker rm -f crates-backend 2>/dev/null || echo "Container crates-backend not running"

# Run the new container with same configuration as before
echo "Starting backend container..."
docker run -d \
  --name crates-backend \
  --network crates-network \
  --network-alias crates-backend \
  -p 8980:8080 \
  -p 5003:5003 \
  -e SPRING_PROFILES_ACTIVE=dev \
  -e JAVA_OPTS="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5003" \
  crates/crates-backend:0.0.1-SNAPSHOT

echo ""
echo "✅ Backend started successfully!"
echo "- Container: crates-backend"
echo "- Network: crates-network"  
echo "- Port: http://localhost:8980"
echo "- Debug Port: localhost:5003"
echo "- Database: crates-database (running)"
echo ""
echo "View logs with: docker logs -f crates-backend"