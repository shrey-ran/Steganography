#!/bin/bash

# scripts/run_local.sh
# Local startup script for steganography research project
# LOCAL-ONLY - No external connections

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  🔬 Steganography Research - Local Startup"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# ============================================================================
# Check for .env file
# ============================================================================
if [ ! -f .env ]; then
    echo -e "${RED}⚠️  WARNING: .env file not found${NC}"
    echo ""
    echo "Please create .env file from template:"
    echo ""
    echo -e "  ${BLUE}cp .env.example .env${NC}"
    echo ""
    echo "Then edit .env with your settings:"
    echo "  - Set ALLOW_TRAINING=false for dry-run mode (recommended)"
    echo "  - Configure PORT, DB_PATH, etc."
    echo ""
    echo -e "${YELLOW}Continuing with default settings...${NC}"
    echo ""
else
    echo -e "${GREEN}✓ .env file found${NC}"
    
    # Source .env
    export $(cat .env | grep -v '^#' | xargs)
    
    # Display current settings
    echo ""
    echo "Current settings:"
    echo "  NODE_ENV=${NODE_ENV:-development}"
    echo "  PORT=${PORT:-8000}"
    echo "  ALLOW_TRAINING=${ALLOW_TRAINING:-false}"
    
    if [ "${ALLOW_TRAINING}" = "true" ]; then
        echo ""
        echo -e "${RED}⚠️  WARNING: ALLOW_TRAINING=true${NC}"
        echo -e "${RED}⚠️  Ensure IRB/supervisor approval is in place${NC}"
    fi
    echo ""
fi

# ============================================================================
# Create output directories
# ============================================================================
echo "Creating output directories..."
mkdir -p scripts/output
mkdir -p logs
echo -e "${GREEN}✓ Output directories created${NC}"
echo ""

# ============================================================================
# Check if backend is already running
# ============================================================================
if lsof -Pi :${PORT:-8000} -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Backend already running on port ${PORT:-8000}${NC}"
    echo ""
    echo "To stop it, run:"
    echo -e "  ${BLUE}lsof -ti:${PORT:-8000} | xargs kill${NC}"
    echo ""
    echo "Or use:"
    echo -e "  ${BLUE}./scripts/stop_local.sh${NC}"
    echo ""
else
    # ============================================================================
    # Start backend server
    # ============================================================================
    echo "Starting backend server..."
    echo ""
    
    # Start backend in background
    nohup node backend/index.js > scripts/output/backend.log 2>&1 &
    BACKEND_PID=$!
    
    echo $BACKEND_PID > scripts/output/backend.pid
    
    echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
    echo "  Log: scripts/output/backend.log"
    echo "  PID: scripts/output/backend.pid"
    echo ""
    
    # Wait a moment for server to start
    echo "Waiting for backend to initialize..."
    sleep 2
    
    # Check if backend is running
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is running${NC}"
        echo -e "  ${BLUE}http://localhost:${PORT:-8000}${NC}"
    else
        echo -e "${RED}✗ Backend failed to start${NC}"
        echo "Check logs: cat scripts/output/backend.log"
        exit 1
    fi
    echo ""
fi

# ============================================================================
# Frontend instructions
# ============================================================================
echo "═══════════════════════════════════════════════════════════════════"
echo "  📱 Frontend"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "To start the React frontend:"
echo ""
echo -e "  ${BLUE}cd frontend${NC}"
echo -e "  ${BLUE}npm start${NC}"
echo ""
echo "Frontend will run on: http://localhost:3000"
echo ""

# ============================================================================
# Experiment instructions
# ============================================================================
echo "═══════════════════════════════════════════════════════════════════"
echo "  🧪 Running Experiments"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Run a dry-run experiment (safe mode, no training):"
echo ""
echo -e "  ${BLUE}node experiments/runner.js \\${NC}"
echo -e "    ${BLUE}--id my_experiment \\${NC}"
echo -e "    ${BLUE}--dataset default \\${NC}"
echo -e "    ${BLUE}--dry-run${NC}"
echo ""
echo "Or with a config file:"
echo ""
echo -e "  ${BLUE}node experiments/runner.js \\${NC}"
echo -e "    ${BLUE}--config experiments/config.example.json \\${NC}"
echo -e "    ${BLUE}--id my_experiment \\${NC}"
echo -e "    ${BLUE}--dry-run${NC}"
echo ""
echo "Or with YAML config:"
echo ""
echo -e "  ${BLUE}node experiments/runner.js \\${NC}"
echo -e "    ${BLUE}--config experiments/config.example.yaml \\${NC}"
echo -e "    ${BLUE}--id test_001 \\${NC}"
echo -e "    ${BLUE}--dry-run${NC}"
echo ""
echo "Results will be saved to: scripts/output/<experiment_id>/"
echo ""

# ============================================================================
# API Testing
# ============================================================================
echo "═══════════════════════════════════════════════════════════════════"
echo "  🔧 API Testing"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Test the backend API:"
echo ""
echo -e "  ${BLUE}# Health check${NC}"
echo -e "  ${BLUE}curl http://localhost:${PORT:-8000}/status${NC}"
echo ""
echo -e "  ${BLUE}# List experiments${NC}"
echo -e "  ${BLUE}curl http://localhost:${PORT:-8000}/experiments${NC}"
echo ""
echo -e "  ${BLUE}# Create experiment${NC}"
echo -e "  ${BLUE}curl -X POST http://localhost:${PORT:-8000}/experiments \\${NC}"
echo -e "    ${BLUE}-H 'Content-Type: application/json' \\${NC}"
echo -e "    ${BLUE}-d '{\"name\":\"test\",\"dataset\":\"default\",\"transforms\":[]}'${NC}"
echo ""

# ============================================================================
# Training Harness (if needed)
# ============================================================================
echo "═══════════════════════════════════════════════════════════════════"
echo "  🏋️  Training Harness (Dry-Run)"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Run training harness in dry-run mode:"
echo ""
echo -e "  ${BLUE}node experiments/training_harness.js \\${NC}"
echo -e "    ${BLUE}--id train_001 \\${NC}"
echo -e "    ${BLUE}--epochs 5 \\${NC}"
echo -e "    ${BLUE}--batch-size 8 \\${NC}"
echo -e "    ${BLUE}--dry-run${NC}"
echo ""

# ============================================================================
# Stopping services
# ============================================================================
echo "═══════════════════════════════════════════════════════════════════"
echo "  🛑 Stopping Services"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "To stop the backend server:"
echo ""
echo -e "  ${BLUE}./scripts/stop_local.sh${NC}"
echo ""
echo "Or manually:"
echo ""
echo -e "  ${BLUE}kill \$(cat scripts/output/backend.pid)${NC}"
echo ""

# ============================================================================
# Logs
# ============================================================================
echo "═══════════════════════════════════════════════════════════════════"
echo "  📋 Viewing Logs"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "View backend logs:"
echo ""
echo -e "  ${BLUE}tail -f scripts/output/backend.log${NC}"
echo ""
echo "View experiment logs:"
echo ""
echo -e "  ${BLUE}tail -f scripts/output/<experiment_id>/experiment.log${NC}"
echo ""

# ============================================================================
# Important reminders
# ============================================================================
echo "═══════════════════════════════════════════════════════════════════"
echo "  ⚠️  IMPORTANT REMINDERS"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo -e "${YELLOW}• This is a LOCAL-ONLY research project${NC}"
echo -e "${YELLOW}• DO NOT push to remote repositories${NC}"
echo -e "${YELLOW}• All data stays on this machine${NC}"
echo -e "${YELLOW}• Supervisor/IRB approval required before training${NC}"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✓ Local environment ready!${NC}"
echo ""
