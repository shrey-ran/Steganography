#!/bin/bash

# MASTER STARTUP SCRIPT - Starts Backend API, Dashboard, and Experiment Builder
# Kill any existing processes first
echo "Stopping any existing servers..."
pkill -f "node backend/index.js" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true
sleep 2

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Steganography Research Platform - All Services       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Start Backend
echo -e "${YELLOW}[1/3] Starting Backend API on Port 8000...${NC}"
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

# Start Experiment Builder
echo -e "${YELLOW}[2/3] Starting Experiment Builder on Port 3001...${NC}"
cd /Users/apple/Desktop/Stegnography/builder
PORT=3001 npm start > builder.log 2>&1 &
BUILDER_PID=$!
echo -e "${GREEN}✓ Builder PID: $BUILDER_PID${NC}"
sleep 5

echo ""

# Start Dashboard
echo -e "${YELLOW}[3/3] Starting Dashboard on Port 3000...${NC}"
cd /Users/apple/Desktop/Stegnography/frontend
PORT=3000 npm start > frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Dashboard PID: $FRONTEND_PID${NC}"
sleep 5

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}✓ ALL 3 SERVERS STARTED SUCCESSFULLY${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}HOW TO USE:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}1. GENERATE EXPERIMENTS:${NC}"
echo -e "   🔧 Experiment Builder:   ${BLUE}http://localhost:3001${NC}"
echo -e "   • Create new experiments"
echo -e "   • Configure transforms"
echo -e "   • Run experiments"
echo ""

echo -e "${GREEN}2. VIEW RESULTS:${NC}"
echo -e "   📊 Dashboard:            ${BLUE}http://localhost:3000${NC}"
echo -e "   • View all experiments"
echo -e "   • See robustness metrics"
echo -e "   • Analyze results"
echo ""

echo -e "${GREEN}3. BACKEND API:${NC}"
echo -e "   🔧 API Server:           ${BLUE}http://localhost:8000${NC}"
echo -e "   • Handles all computations"
echo -e "   • Manages experiment data"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}LOGS:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Backend:  ${BLUE}backend.log${NC}"
echo -e "  Builder:  ${BLUE}builder/builder.log${NC}"
echo -e "  Dashboard: ${BLUE}frontend/frontend.log${NC}"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TO STOP ALL SERVERS:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${GREEN}./stop-all-servers.sh${NC}"
echo ""
