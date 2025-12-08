#!/bin/bash

# InsiderPulse Development Server Starter
# Automatically manages port 5000 conflicts

PORT=5000

# JWT Secret for authentication
export JWT_SECRET="P9unQrRLhC/4PD+1JpkNicCQk0jBnit81RDNSTKTDnx4EuTpz4iooEaWhfBhyM2n"

echo "🚀 Starting InsiderPulse development server..."

# Check if port 5000 is in use
if ps aux | grep -q "[t]sx server/index.ts"; then
    echo "⚠️  Development server already running on port $PORT"
    echo "🔄 Stopping existing server..."

    # Kill existing tsx process
    pkill -f "tsx server/index.ts"

    # Wait for process to fully terminate
    sleep 2

    echo "✅ Existing server stopped"
fi

# Start the development server
echo "▶️  Starting development server..."
npm run dev
