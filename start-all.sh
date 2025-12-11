#!/bin/bash

# Start All Services Script
# Run this anytime to start both backend and frontend

cd "$(dirname "$0")"

echo "🚀 Starting Steganography Research Platform..."
echo ""

# Kill any existing processes
pkill -f "node backend/index.js" 2>/dev/null
pkill -f "react-scripts start" 2>/dev/null
sleep 1

# Start backend
echo "📡 Starting backend server..."
nohup node backend/index.js > backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > backend.pid
echo "   Backend PID: $BACKEND_PID"
sleep 2

# Start frontend
echo "🎨 Starting frontend server..."
cd frontend
BROWSER=none PORT=3000 nohup npm start > frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > frontend.pid
cd ..
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "⏳ Waiting for servers to start..."
sleep 6

# Check if servers are running
echo ""
echo "🔍 Checking server status..."
if curl -s http://localhost:8000/status > /dev/null 2>&1; then
    echo "   ✅ Backend API running at http://localhost:8000"
else
    echo "   ❌ Backend failed to start"
fi

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✅ Frontend running at http://localhost:3000"
else
    echo "   ⏳ Frontend still loading (may take a few more seconds)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 All services started!"
echo ""
echo "📱 Open in browser: http://localhost:3000"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend/frontend.log"
echo ""
echo "🛑 To stop: ./stop-all.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
