#!/bin/bash

# Crates Public Sharing UI - Restart Script

set -e

echo "🔄 Restarting Crates Public Sharing UI..."

# Stop the current instance
./stop-public.sh

# Wait a moment
sleep 1

# Start a new instance
./start-public.sh