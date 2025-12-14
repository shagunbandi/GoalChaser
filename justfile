# Nitya - Habit Tracker

# Default recipe
default:
    @just --list

# ==================== Development ====================

# Run development server
dev:
    npm run dev

# Install dependencies
install:
    npm install

# Run linting
lint:
    npm run lint

# Build the application locally
build:
    npm run build

# Start production server locally
start:
    npm run start

# ==================== Docker ====================

# Create the external network (run once)
network-create:
    docker network create nitya_network || true

# Build docker image
docker-build:
    docker-compose build

# Start containers in detached mode
docker-up:
    docker-compose up -d

# Stop containers
docker-down:
    docker-compose down

# Restart containers
docker-restart:
    docker-compose restart

# View logs
docker-logs:
    docker-compose logs -f

# Build and start containers
docker-deploy: network-create docker-build docker-up

# Full rebuild (no cache)
docker-rebuild:
    docker-compose build --no-cache

# Full redeploy with rebuild
prod-up: network-create docker-rebuild docker-up

# Show container status
docker-status:
    docker-compose ps

# Shell into the running container
docker-shell:
    docker-compose exec nitya sh

# Clean up unused docker resources
docker-prune:
    docker system prune -f

# ==================== Traefik Integration ====================

# Check if traefik can see this container
traefik-check:
    docker network inspect nitya_network

