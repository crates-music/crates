#!/bin/bash

# Crates Public Sharing UI - Start Script (Docker)

set -e

echo "🚀 Starting Crates Public Sharing UI (Docker)..."

# Configuration
CONTAINER_NAME="crates-public"
IMAGE_NAME="crates-public"
HOST_PORT=${HOST_PORT:-8337}  # Unique port to avoid conflicts
CONTAINER_PORT=8080
NETWORK_NAME="crates-network"
BACKEND_URL=${BACKEND_URL:-http://crates-backend:8080}
GIN_MODE=${GIN_MODE:-release}

echo "🔧 Configuration:"
echo "   Container: $CONTAINER_NAME"
echo "   Host Port: $HOST_PORT"
echo "   Backend URL: $BACKEND_URL"
echo "   Network: $NETWORK_NAME"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if port is already in use
if lsof -Pi :$HOST_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "❌ Port $HOST_PORT is already in use!"
    echo "   Run './stop-public.sh' first or set HOST_PORT to a different value"
    exit 1
fi

# Stop and remove existing container if it exists
if docker ps -a --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "🧹 Removing existing container..."
    docker rm -f $CONTAINER_NAME >/dev/null 2>&1 || true
fi

# Build Docker image
echo "📦 Building Docker image..."
docker build -t $IMAGE_NAME .

# Check if crates-network exists, create if not
if ! docker network ls --format 'table {{.Name}}' | grep -q "^${NETWORK_NAME}$"; then
    echo "🌐 Creating Docker network: $NETWORK_NAME"
    docker network create $NETWORK_NAME
else
    echo "🌐 Using existing Docker network: $NETWORK_NAME"
fi

# Start container
echo "🐳 Starting Docker container..."
CONTAINER_ID=$(docker run -d \
    --name $CONTAINER_NAME \
    --network $NETWORK_NAME \
    -p $HOST_PORT:$CONTAINER_PORT \
    -e PORT=$CONTAINER_PORT \
    -e BACKEND_URL=$BACKEND_URL \
    -e GIN_MODE=$GIN_MODE \
    --restart unless-stopped \
    $IMAGE_NAME)

# Wait a moment and check if it started successfully
sleep 3
if docker ps --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "✅ Crates Public UI started successfully!"
    echo "   Container ID: ${CONTAINER_ID:0:12}"
    echo "   Container Name: $CONTAINER_NAME"
    echo "   URL: http://localhost:$HOST_PORT"
    echo "   Network: $NETWORK_NAME"
    echo ""
    echo "📋 Container Info:"
    docker ps --filter name=$CONTAINER_NAME --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "📝 View logs: docker logs -f $CONTAINER_NAME"
    echo "🛑 To stop: ./stop-public.sh"
else
    echo "❌ Failed to start Crates Public UI container"
    echo "   Check logs: docker logs $CONTAINER_NAME"
    exit 1
fi