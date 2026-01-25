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

# ==================== Firebase Emulators ====================

# Start Firebase emulators for testing
emulators:
    firebase emulators:start --only auth,firestore --project demo-test

# ==================== E2E Testing ====================

# Run all E2E tests
test-e2e:
    npm run test:e2e

# Run E2E tests in UI mode (interactive)
test-e2e-ui:
    npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
test-e2e-headed:
    npm run test:e2e:headed

# Run E2E tests in debug mode
test-e2e-debug:
    npm run test:e2e:debug

# Run only auth tests
test-auth:
    npx playwright test auth.spec.ts

# Run only auth tests in UI mode
test-auth-ui:
    npx playwright test auth.spec.ts --ui

# Install Playwright browsers
install-playwright:
    npx playwright install

# Show Playwright test report
show-report:
    npx playwright show-report

# ==================== Data Management ====================

# Generate dummy user data for testing
generate-dummy-data:
    node scripts/generate-dummy-user.mjs

# Setup test user in Firebase
setup-test-user:
    node scripts/setup-test-user.mjs

# Clear agenda items
clear-agenda:
    node scripts/clear-agenda-items.mjs

# Download database backup
download-db:
    node scripts/download-database.mjs

