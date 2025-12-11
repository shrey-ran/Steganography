#!/bin/bash

# scripts/stop_local.sh
# Stop local services for steganography research project

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  🛑 Stopping Local Services"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Stop backend server
if [ -f scripts/output/backend.pid ]; then
    BACKEND_PID=$(cat scripts/output/backend.pid)
    
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "Stopping backend server (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        
        # Wait for process to stop
        sleep 1
        
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  Process still running, forcing...${NC}"
            kill -9 $BACKEND_PID
        fi
        
        echo -e "${GREEN}✓ Backend server stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend server not running (stale PID file)${NC}"
    fi
    
    rm -f scripts/output/backend.pid
else
    echo -e "${YELLOW}⚠️  No backend PID file found${NC}"
    
    # Try to find and kill by port
    PORT=${PORT:-8000}
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "Found process on port $PORT, stopping..."
        lsof -ti:$PORT | xargs kill
        echo -e "${GREEN}✓ Process on port $PORT stopped${NC}"
    else
        echo "No process found on port $PORT"
    fi
fi

echo ""
echo -e "${GREEN}✓ All services stopped${NC}"
echo ""
