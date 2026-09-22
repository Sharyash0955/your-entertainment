#!/usr/bin/env bash
# ==============================================================================
# CinePulse & District Entertainment Platform - Automated Setup Script
# ==============================================================================
set -e

echo "======================================================================"
echo "🎬 CinePulse & District Platform - Zero-Config Project Setup"
echo "======================================================================"

# 1. Verify Node.js is installed
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Error: Node.js is required but was not found in PATH."
  echo "   Please install Node.js 18 or higher from https://nodejs.org/"
  exit 1
fi

NODE_VERSION=$(node -v)
echo "✓ Node.js runtime detected: $NODE_VERSION"

# 2. Install all dependencies
echo -e "\n📦 Installing project dependencies..."
npm install

# 3. Run typecheck / lint
echo -e "\n🔍 Verifying codebase integrity..."
npm run lint

# 4. Compile frontend and backend bundles
echo -e "\n🔨 Compiling production bundles (Vite + esbuild)..."
npm run build

# 5. Start the server
echo -e "\n======================================================================"
echo "🚀 Setup complete! Launching CinePulse on http://localhost:3000"
echo "   - Database: SQLite (Auto-seeds events, showtimes, users, and 80 seats/hall)"
echo "   - Concurrency Engine: Single-write atomic conditional lock"
echo "   - Live Sync: Socket.IO WebSocket real-time seat lock sync"
echo "======================================================================"

npm run dev
