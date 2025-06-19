#!/bin/bash

# Crates Public Sharing UI - Status Script (Docker)

echo "📊 Crates Public Sharing UI Status (Docker)"
echo "============================================"

# Configuration
CONTAINER_NAME="crates-public"
IMAGE_NAME="crates-public"
HOST_PORT=${HOST_PORT:-8337}
NETWORK_NAME="crates-network"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running"
    exit 1
fi

echo "🔧 Configuration:"
echo "   Container: $CONTAINER_NAME"
echo "   Image: $IMAGE_NAME"
echo "   Host Port: $HOST_PORT"
echo "   Network: $NETWORK_NAME"
echo ""

# Check if container exists
if docker ps -a --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    # Get container status
    CONTAINER_STATUS=$(docker ps -a --filter name=$CONTAINER_NAME --format "{{.Status}}")
    
    if docker ps --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "✅ Status: RUNNING"
        
        # Get detailed container info
        echo "📋 Container Info:"
        docker ps --filter name=$CONTAINER_NAME --format "table {{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
        
        # Get container stats
        echo ""
        echo "📈 Resource Usage:"
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" $CONTAINER_NAME
        
        # Check network connectivity
        echo ""
        echo "🌐 Network Info:"
        CONTAINER_IP=$(docker inspect $CONTAINER_NAME --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
        echo "   Container IP: $CONTAINER_IP"
        echo "   Network: $NETWORK_NAME"
        
        # Test health endpoint
        if command -v curl &> /dev/null; then
            echo ""
            echo "🏥 Health Check:"
            if curl -s http://localhost:$HOST_PORT/health > /dev/null 2>&1; then
                HEALTH_RESPONSE=$(curl -s http://localhost:$HOST_PORT/health)
                echo "✅ Health endpoint: OK ($HEALTH_RESPONSE)"
                echo "🔗 Public URL: http://localhost:$HOST_PORT"
            else
                echo "❌ Health endpoint: FAILED"
            fi
        fi
        
    else
        echo "❌ Status: STOPPED"
        echo "📋 Last Status: $CONTAINER_STATUS"
    fi
    
    # Show container logs
    echo ""
    echo "📝 Recent Logs (last 10 lines):"
    echo "--------------------------------"
    docker logs --tail 10 $CONTAINER_NAME 2>/dev/null || echo "   No logs available"
    
else
    echo "❌ Container '$CONTAINER_NAME' not found"
fi

echo ""
echo "🐳 Docker Resources:"

# Check if image exists
if docker images --format 'table {{.Repository}}' | grep -q "^${IMAGE_NAME}$"; then
    IMAGE_INFO=$(docker images --filter reference=$IMAGE_NAME --format "{{.ID}} {{.Size}} {{.CreatedSince}}")
    echo "   Image: ✅ EXISTS ($IMAGE_INFO)"
else
    echo "   Image: ❌ NOT BUILT"
fi

# Check if network exists
if docker network ls --format 'table {{.Name}}' | grep -q "^${NETWORK_NAME}$"; then
    echo "   Network: ✅ EXISTS ($NETWORK_NAME)"
else
    echo "   Network: ❌ MISSING ($NETWORK_NAME)"
fi

# Check port availability
if lsof -Pi :$HOST_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   Port $HOST_PORT: 🔒 IN USE"
else
    echo "   Port $HOST_PORT: ✅ AVAILABLE"
fi

echo ""
echo "🔧 Environment Variables:"
echo "   HOST_PORT: $HOST_PORT"
echo "   BACKEND_URL: ${BACKEND_URL:-http://crates-backend:8080}"
echo "   GIN_MODE: ${GIN_MODE:-release}"