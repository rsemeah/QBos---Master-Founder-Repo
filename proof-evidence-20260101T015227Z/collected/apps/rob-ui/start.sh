#!/bin/bash

# Rob UI + Backend - Quick Start Script

echo "🚀 Starting Rob the QuietBuilder..."
echo ""

# Check if backend is running
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Backend already running on port 3000"
else
    echo "❌ Backend NOT running on port 3000"
    echo ""
    echo "MANUAL STEP REQUIRED:"
    echo "Open a new terminal and run:"
    echo ""
    echo "  cd /workspaces/QBos---Master-Founder-Repo/apps/proof-harness"
    echo "  npm run dev"
    echo ""
    echo "Then come back and run this script again."
    exit 1
fi

echo ""
echo "📱 Starting Vite UI on port 3001..."
echo ""
echo "Visit: http://localhost:3001/rob"
echo ""

cd /workspaces/QBos---Master-Founder-Repo/apps/rob-ui
npm run dev
