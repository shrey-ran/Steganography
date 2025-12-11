#!/bin/bash

# STOP ALL SERVERS
echo "Stopping all servers..."
pkill -f "node backend/index.js" 2>/dev/null || echo "Backend already stopped"
pkill -f "react-scripts" 2>/dev/null || echo "Servers already stopped"
sleep 2

echo ""
echo "✓ All servers stopped"
echo ""
echo "To restart, run: ./start-all-servers.sh"
echo ""
