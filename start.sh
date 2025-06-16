#!/bin/bash

# Stratix AI - Enhanced Startup Script
echo "🚀 Starting Stratix AI Platform"
echo "==============================="

# Set error handling
set -e

# Load environment variables
if [ -f ".env.development" ]; then
    export $(grep -v '^#' .env.development | xargs)
    echo "✅ Loaded development environment"
elif [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
    echo "✅ Loaded default environment"
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ and try again."
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js $NODE_VERSION detected"

# Validate Node.js version (18+)
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
    echo "⚠️  Warning: Node.js 18+ recommended. Current version: $NODE_VERSION"
fi

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1
    else
        return 0
    fi
}

# Function to wait for server to be ready
wait_for_server() {
    local url=$1
    local timeout=${2:-30}
    local counter=0
    
    echo "⏳ Waiting for server to be ready..."
    
    while [ $counter -lt $timeout ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            echo "✅ Server is ready!"
            return 0
        fi
        sleep 1
        counter=$((counter + 1))
        printf "."
    done
    
    echo ""
    echo "⚠️  Server took too long to start"
    return 1
}

# Function to install dependencies if needed
install_dependencies() {
    local dir=$1
    local service_name=$2
    
    if [ ! -d "$dir/node_modules" ]; then
        echo "📦 Installing $service_name dependencies..."
        cd "$dir"
        npm install --silent
        if [ $? -eq 0 ]; then
            echo "✅ $service_name dependencies installed"
        else
            echo "❌ Failed to install $service_name dependencies"
            exit 1
        fi
        cd - > /dev/null
    else
        echo "✅ $service_name dependencies already installed"
    fi
}

# Function to start backend with enhanced features
start_backend() {
    echo ""
    echo "🔧 Starting Stratix Backend..."
    echo "📍 Backend will be available at: http://localhost:3001"
    echo "🏥 Health check: http://localhost:3001/health"
    echo "📚 API Docs: http://localhost:3001/api/docs"
    echo ""
    
    # Check if port is already in use
    if ! check_port 3001; then
        echo "⚠️  Port 3001 is already in use. Please stop the existing service or use a different port."
        exit 1
    fi
    
    # Install dependencies
    install_dependencies "." "backend"
    
    echo "🚀 Starting enhanced server with security features..."
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
