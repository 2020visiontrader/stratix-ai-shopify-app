#!/bin/bash

# Stratix AI Backend with ngrok tunnel startup script

echo "🚀 Starting Stratix AI Backend with ngrok tunnel..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed. Please install it from https://ngrok.com/download"
    exit 1
fi

# Check if ngrok is authenticated
if ! ngrok config check &> /dev/null; then
    echo "❌ ngrok is not authenticated. Please run: ngrok config add-authtoken YOUR_TOKEN"
    exit 1
fi

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "simple-server.js" 2>/dev/null || true
pkill -f "ngrok http" 2>/dev/null || true

# Start the backend server
echo "🖥️  Starting backend server on port 3001..."
cd "$(dirname "$0")"
node simple-server.js &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Check if server is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ Backend server failed to start"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Backend server is running on http://localhost:3001"

# Start ngrok tunnel
echo "🌐 Starting ngrok tunnel..."
ngrok http 3001 --log=stdout &
NGROK_PID=$!

# Wait for ngrok to establish tunnel
sleep 5

# Get the ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok-free\.app' | head -1)

if [ -n "$NGROK_URL" ]; then
    echo "✅ ngrok tunnel established at: $NGROK_URL"
    echo "🔌 API Endpoints accessible at:"
    echo "   Health Check: $NGROK_URL/health"
    echo "   Analysis API: $NGROK_URL/api/analysis"
    echo "   All endpoints: $NGROK_URL/api/*"
    echo ""
    echo "📱 For Shopify integration, use this URL: $NGROK_URL"
    echo "💾 URL saved to .ngrok-url file"
    echo "$NGROK_URL" > .ngrok-url
else
    echo "❌ Failed to get ngrok URL"
    kill $SERVER_PID $NGROK_PID 2>/dev/null || true
    exit 1
fi

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    kill $SERVER_PID $NGROK_PID 2>/dev/null || true
    rm -f .ngrok-url
    echo "✅ Cleanup complete"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "⏳ Backend and ngrok tunnel are running. Press Ctrl+C to stop."
echo "🌍 ngrok Web Interface: http://localhost:4040"

# Keep the script running
wait
