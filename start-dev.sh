#!/usr/bin/env bash

# InsiderPulse Development Server Starter
# Automatically manages port 5000 conflicts

# Fix PATH for Replit environment
export PATH="/nix/store/8y4ls7z2sfxbq6ch3yp45l28p29qswvx-nodejs-20.19.3-wrapped/bin:$PATH"

PORT=5000

# JWT Secret for authentication
export JWT_SECRET="P9unQrRLhC/4PD+1JpkNicCQk0jBnit81RDNSTKTDnx4EuTpz4iooEaWhfBhyM2n"

# Production Database URL
export DATABASE_URL="postgresql://neondb_owner:npg_pO2GuI4kVjUy@ep-ancient-cloud-a50dgue7.us-east-2.aws.neon.tech/neondb?sslmode=require"

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
