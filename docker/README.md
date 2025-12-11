# Docker Setup (Optional)

**⚠️ IMPORTANT: Docker is OPTIONAL and for convenience only**

This Docker setup is designed for:
- Local API development and testing
- Running dry-run experiments
- Pipeline component testing

**❌ NOT for:**
- Heavy model training (use bare metal)
- Production deployment
- Large-scale experiments

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Start backend
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop
docker-compose down
```

### Option 2: Docker CLI

```bash
# Build image
docker build -t stego-robustness-local -f docker/Dockerfile .

# Run container
docker run -d \
  -p 8000:8000 \
  -v $(pwd)/scripts/output:/app/scripts/output \
  -v $(pwd)/logs:/app/logs \
  -e ALLOW_TRAINING=false \
  --name stego-backend \
  stego-robustness-local

# View logs
docker logs -f stego-backend

# Stop
docker stop stego-backend
docker rm stego-backend
```

## Configuration

### Environment Variables

- `NODE_ENV` - Node environment (default: `development`)
- `PORT` - Server port (default: `8000`)
- `ALLOW_TRAINING` - Enable training (default: `false`)
- `DB_PATH` - Database path (default: `/app/scripts/output/db.sqlite`)

### Volume Mounts

Mount these directories for persistence:

```bash
-v $(pwd)/scripts/output:/app/scripts/output  # Experiment results
-v $(pwd)/logs:/app/logs                      # Application logs
-v $(pwd)/.env:/app/.env:ro                   # Environment config
```

## Accessing the API

Once running, the API is available at:
- http://localhost:8000/status
- http://localhost:8000/experiments

## Frontend

The frontend is **NOT** included in the Docker setup. Run it separately:

```bash
cd frontend
npm install
npm start
```

Frontend will run on http://localhost:3000

## Health Check

The container includes a health check:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' stego-backend

# View health logs
docker inspect --format='{{json .State.Health}}' stego-backend | jq
```

## Limitations

### Performance
- Container overhead reduces performance
- Not suitable for computationally intensive tasks
- TensorFlow.js operations may be slower

### Training
- **DO NOT** attempt real training in containers
- Only use for dry-run mode
- Heavy computations should use bare metal

### Storage
- Containers are ephemeral
- Always mount volumes for persistence
- Datasets should be on host filesystem

## Development Workflow

1. **Make code changes** on host
2. **Rebuild image**: `docker-compose build`
3. **Restart container**: `docker-compose up -d`
4. **View logs**: `docker-compose logs -f`

Or use volume mounting for hot-reload during development:

```bash
docker run -d \
  -p 8000:8000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  -e ALLOW_TRAINING=false \
  --name stego-backend \
  stego-robustness-local
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs backend

# Or
docker logs stego-backend
```

### Port already in use

```bash
# Find process using port 8000
lsof -ti:8000 | xargs kill

# Or change port
docker run -p 8001:8000 ...
```

### Permission issues with volumes

```bash
# Fix permissions on output directory
sudo chown -R $USER:$USER scripts/output logs
```

## Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove images
docker rmi stego-robustness-local

# Remove volumes (WARNING: deletes data)
docker volume prune
```

## Security Notes

- Container runs as root (for simplicity)
- Not production-hardened
- Local development only
- Do not expose to public networks
- Do not store sensitive data in containers

## Alternatives to Docker

For better performance, run directly on host:

```bash
# Install dependencies
npm install
cd frontend && npm install

# Start backend
npm run dev

# Start frontend (separate terminal)
cd frontend && npm start
```

See `scripts/run_local.sh` for automated local setup.

---

**Remember: This is a LOCAL-ONLY research tool. Do not push to remote repositories without supervisor approval.**
