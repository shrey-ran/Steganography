#!/bin/bash

# Stop All Services Script

cd "$(dirname "$0")"

echo "🛑 Stopping all services..."
echo ""

# Stop backend
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "   Stopping backend (PID: $BACKEND_PID)"
        kill $BACKEND_PID
    fi
    rm backend.pid
fi

# Stop frontend
if [ -f frontend/frontend.pid ]; then
    FRONTEND_PID=$(cat frontend/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "   Stopping frontend (PID: $FRONTEND_PID)"
        kill $FRONTEND_PID
    fi
    rm frontend/frontend.pid
fi

# Cleanup any remaining processes
pkill -f "node backend/index.js" 2>/dev/null
pkill -f "react-scripts start" 2>/dev/null

echo ""
echo "✅ All services stopped"
