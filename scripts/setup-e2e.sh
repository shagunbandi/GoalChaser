#!/usr/bin/env zsh

# Setup script for E2E testing with Firebase Emulator

echo "🔧 Setting up E2E testing environment..."

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase tools not found globally"
    echo "   Using local installation from node_modules"
fi

# Check/fix configstore permissions
CONFIG_DIR="$HOME/.config/configstore"
if [ -d "$CONFIG_DIR" ]; then
    if [ ! -w "$CONFIG_DIR" ]; then
        echo "⚠️  Config directory not writable: $CONFIG_DIR"
        echo "   Attempting to fix permissions..."
        sudo chmod -R 755 "$CONFIG_DIR" 2>/dev/null || {
            echo "❌ Cannot fix permissions. You may need to manually run:"
            echo "   sudo chmod -R 755 ~/.config/configstore"
            echo ""
            echo "💡 Workaround: Tests will still work! Just ignore permission warnings."
        }
    fi
fi

# Install Playwright browsers if needed
echo ""
echo "📦 Installing Playwright browsers..."
npx playwright install chromium

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Run tests with:"
echo "   npm run test:e2e:ui     (Recommended - UI mode)"
echo "   npm run test:e2e        (Headless mode)"
echo "   npm run test:e2e:headed (Watch tests run)"
echo ""
echo "📚 See E2E_TESTING_GUIDE.md for more info"

