#!/bin/bash

# Crates Public Sharing UI - Stop Script (Docker)

echo "🛑 Stopping Crates Public Sharing UI (Docker)..."

# Configuration
CONTAINER_NAME="crates-public"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running."
    exit 1
fi

# Check if container exists
if ! docker ps -a --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "⚠️  Container '$CONTAINER_NAME' not found"
    echo "✅ Nothing to stop"
    exit 0
fi

# Check if container is running
if docker ps --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "🔄 Stopping container '$CONTAINER_NAME'..."
    
    # Get container info before stopping
    CONTAINER_INFO=$(docker ps --filter name=$CONTAINER_NAME --format "{{.ID}} {{.Status}}")
    echo "📋 Container: $CONTAINER_INFO"
    
    # Stop the container gracefully
    docker stop $CONTAINER_NAME
    
    echo "✅ Container stopped successfully"
else
    echo "⚠️  Container '$CONTAINER_NAME' is not running"
fi

# Remove the container
echo "🧹 Removing container '$CONTAINER_NAME'..."
docker rm $CONTAINER_NAME >/dev/null 2>&1

echo "✅ Crates Public UI stopped and removed successfully"

# Show recent logs
echo ""
echo "📝 Last few log entries:"
docker logs --tail 5 $CONTAINER_NAME 2>/dev/null || echo "   No logs available (container removed)"