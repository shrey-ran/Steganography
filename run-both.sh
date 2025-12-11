#!/bin/bash

# SIMPLE STARTUP SCRIPT - Starts both Backend and Frontend
# Kill any existing processes first
echo "Stopping any existing servers..."
pkill -f "node backend/index.js" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true
sleep 2

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Steganography Research Platform${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Start Backend
echo -e "${GREEN}[1/2] Starting Backend API on Port 8000...${NC}"
cd /Users/apple/Desktop/Stegnography
node backend/index.js > backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend PID: $BACKEND_PID${NC}"
sleep 3

# Check Backend
if curl -s http://localhost:8000/status > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API is responding${NC}"
else
    echo -e "${RED}✗ Backend API failed to start${NC}"
    exit 1
fi

echo ""

# Start Frontend
echo -e "${GREEN}[2/2] Starting Frontend on Port 3000...${NC}"
cd /Users/apple/Desktop/Stegnography/frontend
PORT=3000 npm start > frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend PID: $FRONTEND_PID${NC}"
sleep 5

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ BOTH SERVERS STARTED SUCCESSFULLY${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${BLUE}ACCESS YOUR APPLICATION:${NC}"
echo -e "  🌐 Frontend Website:  ${GREEN}http://localhost:3000${NC}"
echo -e "  🔧 Backend API:       ${GREEN}http://localhost:8000${NC}"
echo ""
echo -e "${BLUE}To stop both servers, run:${NC}"
echo -e "  ${GREEN}./stop-both.sh${NC}"
echo ""
echo "Logs are saved in:"
echo "  - backend.log (Backend API)"
echo "  - frontend/frontend.log (Frontend)"
echo ""
