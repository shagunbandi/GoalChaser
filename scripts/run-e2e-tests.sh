#!/usr/bin/env bash

# Quick E2E Test Runner
# This script starts the necessary services and runs the tests

set -e

echo "🚀 Goal Chaser E2E Test Runner"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if emulators are running
echo -e "${BLUE}📋 Checking if Firebase emulators are running...${NC}"
if curl -s http://localhost:9099 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Firebase Auth emulator is running${NC}"
else
    echo -e "${YELLOW}⚠ Firebase emulators not detected${NC}"
    echo -e "${YELLOW}Starting emulators in the background...${NC}"
    firebase emulators:start --only auth,firestore --project demo-test > /tmp/firebase-emulators.log 2>&1 &
    EMULATOR_PID=$!
    echo "Waiting for emulators to start..."
    sleep 5
fi

# Check if dev server is running
echo -e "${BLUE}📋 Checking if dev server is running...${NC}"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Dev server is running${NC}"
else
    echo -e "${YELLOW}⚠ Dev server not detected${NC}"
    echo -e "${YELLOW}Please start the dev server with: npm run dev${NC}"
    echo ""
    exit 1
fi

echo ""
echo -e "${GREEN}✓ All services ready!${NC}"
echo ""

# Run tests based on argument
case "${1:-all}" in
  auth)
    echo -e "${BLUE}🧪 Running auth tests...${NC}"
    npx playwright test auth.spec.ts "${@:2}"
    ;;
  ui)
    echo -e "${BLUE}🎨 Opening Playwright UI...${NC}"
    npx playwright test --ui
    ;;
  debug)
    echo -e "${BLUE}🐛 Running tests in debug mode...${NC}"
    npx playwright test --debug "${@:2}"
    ;;
  headed)
    echo -e "${BLUE}👀 Running tests in headed mode...${NC}"
    npx playwright test --headed "${@:2}"
    ;;
  *)
    echo -e "${BLUE}🧪 Running all e2e tests...${NC}"
    npx playwright test "$@"
    ;;
esac

# Cleanup
if [ ! -z "$EMULATOR_PID" ]; then
    echo ""
    echo -e "${YELLOW}Stopping emulators...${NC}"
    kill $EMULATOR_PID 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}✨ Done!${NC}"

