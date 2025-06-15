#!/bin/bash

# Stratix AI - Startup Script
echo "🚀 Starting Stratix AI Platform"
echo "==============================="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ and try again."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Function to start backend
start_backend() {
    echo ""
    echo "🔧 Starting Stratix Backend..."
    echo "📍 Backend will be available at: http://localhost:3001"
    echo "🏥 Health check: http://localhost:3001/health"
    echo ""
    cd backend
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing backend dependencies..."
        npm install
    fi
    
    echo "🚀 Starting server..."
    node server.js
}

# Function to start frontend
start_frontend() {
    echo ""
    echo "🎨 Starting Stratix Frontend..."
    echo "📍 Frontend will be available at: http://localhost:3000"
    echo ""
    cd frontend
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing frontend dependencies..."
        npm install
    fi
    
    echo "🚀 Starting Next.js..."
    npm run dev
}

# Function to start both
start_both() {
    echo ""
    echo "🚀 Starting both Backend and Frontend..."
    echo ""
    
    # Start backend in background
    cd backend
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing backend dependencies..."
        npm install
    fi
    echo "🔧 Starting backend server..."
    node server.js &
    BACKEND_PID=$!
    
    # Wait a moment for backend to start
    sleep 3
    
    # Start frontend
    cd ../frontend
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing frontend dependencies..."
        npm install
    fi
    echo "🎨 Starting frontend..."
    npm run dev &
    FRONTEND_PID=$!
    
    echo ""
    echo "✅ Both services started!"
    echo "📍 Backend: http://localhost:3001"
    echo "📍 Frontend: http://localhost:3000"
    echo ""
    echo "Press Ctrl+C to stop both services"
    
    # Wait for user to stop
    trap "echo ''; echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
    wait
}

# Parse command line arguments
case "${1:-backend}" in
    "backend"|"server"|"api")
        start_backend
        ;;
    "frontend"|"ui"|"web")
        start_frontend
        ;;
    "both"|"all"|"full")
        start_both
        ;;
    "help"|"-h"|"--help")
        echo "Stratix AI Startup Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  backend   - Start backend server only (default)"
        echo "  frontend  - Start frontend application only"
        echo "  both      - Start both backend and frontend"
        echo "  help      - Show this help"
        echo ""
        echo "Examples:"
        echo "  $0 backend    # Start backend on port 3001"
        echo "  $0 frontend   # Start frontend on port 3000"
        echo "  $0 both       # Start both services"
        echo ""
        echo "URLs:"
        echo "  Backend:  http://localhost:3001"
        echo "  Frontend: http://localhost:3000"
        echo "  Health:   http://localhost:3001/health"
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo "💡 Use '$0 help' to see available commands"
        exit 1
        ;;
esac
