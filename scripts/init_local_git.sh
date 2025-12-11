#!/bin/bash

# init_local_git.sh - Initialize local-only git repository
# This script is IDEMPOTENT and LOCAL-ONLY - it will NOT push to any remote

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "================================================"
echo "  Initializing LOCAL-ONLY Git Repository"
echo "================================================"
echo ""

# Create .gitignore if it doesn't exist or update it
echo "Creating/updating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
frontend/node_modules/

# Environment variables
.env
.env.local
.env.*.local

# Datasets and sensitive data
datasets/
data/
*.db
*.sqlite
*.sqlite3

# Model files
models/
*.h5
*.pb
*.tflite

# Output and logs
scripts/output/
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Test coverage
coverage/

# Production builds
frontend/build/
dist/

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# Temporary files
tmp/
temp/
*.tmp

# Images (if sensitive)
uploads/
*.png
*.jpg
*.jpeg
*.gif
*.bmp
!frontend/public/*.png
!frontend/public/*.jpg

EOF

echo "✓ .gitignore created/updated"
echo ""

# Initialize git if not already initialized
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
    echo "✓ Git repository initialized"
else
    echo "✓ Git repository already exists"
fi
echo ""

# Add all files (respecting .gitignore)
echo "Adding files to git..."
git add .
echo "✓ Files added"
echo ""

# Commit only if there are changes to commit
if git diff-index --quiet HEAD -- 2>/dev/null; then
    echo "✓ No changes to commit"
else
    echo "Creating initial commit..."
    git commit -m "Initial local commit" 2>/dev/null || git commit -m "Initial local commit"
    echo "✓ Commit created"
fi

echo ""
echo "================================================"
echo "  ⚠️  CRITICAL WARNING ⚠️"
echo "================================================"
echo ""
echo "  🚫 DO NOT PUSH TO ANY REMOTE REPOSITORY 🚫"
echo ""
echo "  This is a LOCAL-ONLY research project."
echo ""
echo "  Before pushing to ANY remote (GitHub, GitLab, etc.):"
echo "    1. Obtain WRITTEN approval from your supervisor"
echo "    2. Ensure IRB/ethics compliance"
echo "    3. Verify all sensitive data is excluded"
echo "    4. Remove or anonymize any identifying information"
echo ""
echo "  Unauthorized sharing may violate:"
echo "    - Ethics guidelines"
echo "    - IRB requirements"
echo "    - Institutional policies"
echo "    - Research agreements"
echo ""
echo "================================================"
echo "  Repository initialized for LOCAL USE ONLY"
echo "================================================"
echo ""
echo "Git status:"
git status
echo ""
echo "To avoid accidentally pushing, DO NOT add any remote:"
echo "  ❌ git remote add origin <url>"
echo ""
