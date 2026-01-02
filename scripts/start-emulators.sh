#!/usr/bin/env zsh

# Start Firebase Emulators for testing
# Run this in a separate terminal: ./scripts/start-emulators.sh

echo "🔥 Starting Firebase Emulators..."
echo ""
echo "This will start:"
echo "  - Auth Emulator on port 9099"
echo "  - Firestore Emulator on port 8080"
echo "  - Emulator UI on http://localhost:4000"
echo ""

cd "$(dirname "$0")/.."

# Set environment to avoid permission issues
export FIREBASE_EMULATORS_PATH="$PWD/node_modules/.cache/firebase/emulators"
mkdir -p "$FIREBASE_EMULATORS_PATH"

# Start emulators
npx firebase emulators:start --only auth,firestore --project demo-test

