# Dockerfile for local development
# Docker is OPTIONAL - this is for convenience only
# 
# ⚠️  WARNING: Heavy training should NOT be attempted in this container
# ⚠️  Use bare metal for any actual model training (when approved)
# 
# This container is for:
# - Local API development
# - Dry-run experiments only
# - Testing pipeline components
# 
# Build:
#   docker build -t stego-robustness-local -f docker/Dockerfile .
# 
# Run:
#   docker run -p 8000:8000 -v $(pwd)/scripts/output:/app/scripts/output \
#     -e ALLOW_TRAINING=false stego-robustness-local

FROM node:18-slim

# Install system dependencies for Sharp and Canvas
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use ci for reproducible builds)
RUN npm ci --only=production

# Copy application code
COPY . .

# Create output directories
RUN mkdir -p scripts/output logs

# Expose backend port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/status', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set environment variables (defaults)
ENV NODE_ENV=development
ENV PORT=8000
ENV ALLOW_TRAINING=false

# Run backend server
CMD ["node", "backend/index.js"]
