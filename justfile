# Goal Chaser - Justfile

# List all commands
default:
    @just --list

# ==================== Development ====================

# Start dev server
dev:
    npm run dev

# Build locally
build:
    npm run build

# Install dependencies
install:
    npm install

# Run linter
lint:
    npm run lint

# Run tests
test:
    npm run test:e2e

# Start Firebase emulators
emulators:
    npm run emulators

# Deploy Firestore rules
deploy-rules:
    npm run deploy:rules

# ==================== Docker ====================

# Create network (run once)
network:
    @docker network create nitya_network 2>/dev/null || echo "Network exists"

# Start production
up: network
    docker-compose up -d --build

# Stop production
down:
    docker-compose down

# Rebuild from scratch
rebuild: network
    docker-compose build --no-cache

# Restart container
restart:
    docker-compose restart

# View logs
logs:
    docker-compose logs -f nitya

# Container status
status:
    docker-compose ps

# Shell into container
shell:
    docker-compose exec nitya sh

# ==================== Utilities ====================

# Clean build artifacts
clean:
    rm -rf apps/web/.next apps/web/out node_modules/.cache

# Check environment
check:
    @[ -f "secrets/.env" ] && echo "✓ secrets/.env" || echo "✗ secrets/.env missing"
    @[ -f "secrets/gcs-key.json" ] && echo "✓ gcs-key.json" || echo "✗ gcs-key.json missing"
    @docker network ls | grep -q nitya_network && echo "✓ network exists" || echo "✗ run: just network"
