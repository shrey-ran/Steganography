#!/bin/bash

# Stop script for Steganography Research Platform

PROJECT_ROOT="/Users/apple/Desktop/Stegnography"
BACKEND_PID_FILE="$PROJECT_ROOT/.backend.pid"
FRONTEND_PID_FILE="$PROJECT_ROOT/.frontend.pid"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🛑 Stopping all services...${NC}"

# Function to kill process by PID file
kill_by_pid_file() {
    local pid_file=$1
    local name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo "   → Stopping $name (PID: $pid)"
            kill $pid 2>/dev/null || kill -9 $pid 2>/dev/null || true
        fi
        rm -f "$pid_file"
    fi
}

# Function to kill by port
kill_by_port() {
    local port=$1
    local name=$2
    
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "   → Killing $name on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
    fi
}

# Stop services by PID file
kill_by_pid_file "$BACKEND_PID_FILE" "Backend"
kill_by_pid_file "$FRONTEND_PID_FILE" "Frontend"

# Force kill by port (backup)
kill_by_port 8000 "Backend"
kill_by_port 3000 "Frontend"

# Clean up log files (optional)
# rm -f logs/backend.log logs/frontend.log

echo -e "${GREEN}✅ All services stopped successfully${NC}"
