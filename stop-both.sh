#!/bin/bash

# STOP BOTH SERVERS
echo "Stopping all servers..."
pkill -f "node backend/index.js" 2>/dev/null || echo "Backend already stopped"
pkill -f "react-scripts" 2>/dev/null || echo "Frontend already stopped"
sleep 2
echo "✓ All servers stopped"
