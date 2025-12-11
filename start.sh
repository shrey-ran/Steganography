#!/bin/bash

# Comprehensive startup script for Steganography Research Platform
# This script ensures both backend and frontend are always running

set -e

PROJECT_ROOT="/Users/apple/Desktop/Stegnography"
BACKEND_PORT=8000
FRONTEND_PORT=3000
BACKEND_PID_FILE="$PROJECT_ROOT/.backend.pid"
FRONTEND_PID_FILE="$PROJECT_ROOT/.frontend.pid"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     Steganography Research Platform - Startup Manager        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}⚠️  Port $port is in use. Killing process $pid...${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 1
    fi
}

# Function to check if process is running
is_running() {
    local pid_file=$1
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Stop function
stop_services() {
    echo -e "${YELLOW}🛑 Stopping all services...${NC}"
    
    # Stop backend
    if is_running "$BACKEND_PID_FILE"; then
        local backend_pid=$(cat "$BACKEND_PID_FILE")
        echo "   → Stopping backend (PID: $backend_pid)"
        kill $backend_pid 2>/dev/null || true
        rm -f "$BACKEND_PID_FILE"
    fi
    
    # Stop frontend
    if is_running "$FRONTEND_PID_FILE"; then
        local frontend_pid=$(cat "$FRONTEND_PID_FILE")
        echo "   → Stopping frontend (PID: $frontend_pid)"
        kill $frontend_pid 2>/dev/null || true
        rm -f "$FRONTEND_PID_FILE"
    fi
    
    # Kill any remaining processes on ports
    kill_port $BACKEND_PORT
    kill_port $FRONTEND_PORT
    
    echo -e "${GREEN}✅ All services stopped${NC}"
}

# Cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}⚠️  Interrupt received. Cleaning up...${NC}"
    stop_services
    exit 0
}

trap cleanup SIGINT SIGTERM

# Change to project root
cd "$PROJECT_ROOT"

# Check if already running
if is_running "$BACKEND_PID_FILE" && is_running "$FRONTEND_PID_FILE"; then
    echo -e "${GREEN}✅ Services are already running!${NC}"
    echo ""
    echo -e "   Backend:  ${BLUE}http://localhost:$BACKEND_PORT${NC}"
    echo -e "   Frontend: ${BLUE}http://localhost:$FRONTEND_PORT${NC}"
    echo ""
    exit 0
fi

# Stop any existing services
stop_services

# Clear any existing port usage
kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT

echo -e "${BLUE}📦 Installing dependencies...${NC}"

# Install backend dependencies
if [ ! -d "node_modules" ]; then
    echo "   → Installing backend dependencies..."
    npm install --silent
fi

# Install frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "   → Installing frontend dependencies..."
    cd frontend
    npm install --silent --legacy-peer-deps
    cd ..
fi

# Create output directories
mkdir -p scripts/output logs

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Creating .env file...${NC}"
    cat > .env << 'EOF'
NODE_ENV=development
PORT=8000
ALLOW_TRAINING=false
DB_PATH=./scripts/output/db.sqlite
LOG_LEVEL=info
EOF
fi

echo ""
echo -e "${GREEN}🚀 Starting services...${NC}"

# Start Backend
echo "   → Starting backend on port $BACKEND_PORT..."
nohup node backend/index.js > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$BACKEND_PID_FILE"
echo -e "      ${GREEN}✓${NC} Backend started (PID: $BACKEND_PID)"

# Wait for backend to be ready
echo "   → Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:$BACKEND_PORT/status > /dev/null 2>&1; then
        echo -e "      ${GREEN}✓${NC} Backend is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "      ${RED}✗${NC} Backend failed to start. Check logs/backend.log"
        tail -20 logs/backend.log
        stop_services
        exit 1
    fi
    sleep 0.5
done

# Start Frontend
echo "   → Starting frontend on port $FRONTEND_PORT..."
cd frontend
BROWSER=none nohup npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$FRONTEND_PID_FILE"
cd ..
echo -e "      ${GREEN}✓${NC} Frontend started (PID: $FRONTEND_PID)"

# Wait for frontend to be ready
echo "   → Waiting for frontend to be ready..."
for i in {1..60}; do
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        echo -e "      ${GREEN}✓${NC} Frontend is ready!"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "      ${RED}✗${NC} Frontend failed to start. Check logs/frontend.log"
        tail -20 logs/frontend.log
        stop_services
        exit 1
    fi
    sleep 1
done

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    🎉 ALL SYSTEMS ONLINE! 🎉                  ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "   📊 Backend API:  ${BLUE}http://localhost:$BACKEND_PORT${NC}"
echo -e "   🎨 Frontend UI:  ${BLUE}http://localhost:$FRONTEND_PORT${NC}"
echo ""
echo -e "${YELLOW}📝 Logs:${NC}"
echo "   • Backend:  tail -f logs/backend.log"
echo "   • Frontend: tail -f logs/frontend.log"
echo ""
echo -e "${YELLOW}🛑 To stop:${NC}"
echo "   • Run: ./stop.sh"
echo "   • Or press: Ctrl+C"
echo ""
echo -e "${GREEN}Opening browser...${NC}"

# Open browser (macOS)
sleep 2
open http://localhost:$FRONTEND_PORT 2>/dev/null || true

echo ""
echo -e "${BLUE}Press Ctrl+C to stop all services${NC}"
echo ""

# Keep script running to maintain foreground process
while true; do
    # Check if services are still running
    if ! is_running "$BACKEND_PID_FILE"; then
        echo -e "${RED}⚠️  Backend stopped unexpectedly!${NC}"
        stop_services
        exit 1
    fi
    
    if ! is_running "$FRONTEND_PID_FILE"; then
        echo -e "${RED}⚠️  Frontend stopped unexpectedly!${NC}"
        stop_services
        exit 1
    fi
    
    sleep 5
done
