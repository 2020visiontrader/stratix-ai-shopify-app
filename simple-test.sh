#!/bin/bash

# Stratix AI - Simple Testing Script
echo "🧪 Stratix AI Testing Suite"
echo "============================"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -n "Testing: $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo "✅ PASS"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "❌ FAIL"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

echo ""
echo "🔍 Environment Tests"
echo "===================="

# Basic environment tests
run_test "Node.js available" "which node"
run_test "npm available" "which npm"
run_test "Package.json exists" "test -f package.json"
run_test "Start script exists" "test -f start.sh"
run_test "Frontend directory exists" "test -d frontend"
run_test "Source directory exists" "test -d src"

echo ""
echo "🔍 Dependencies Tests"
echo "====================="

# Dependencies tests
run_test "Backend node_modules exists" "test -d node_modules"
run_test "Frontend package.json exists" "test -f frontend/package.json"

echo ""
echo "🔍 Backend Server Tests"
echo "======================="

# Check if backend is running
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "Backend server is already running ✅"
    
    # Test API endpoints
    run_test "Health endpoint responds" "curl -s http://localhost:3001/health"
    run_test "Root endpoint responds" "curl -s http://localhost:3001/"
    run_test "API docs endpoint responds" "curl -s http://localhost:3001/api/docs"
    
    # Test Aunt Mel endpoint
    echo -n "Testing: Aunt Mel AI Assistant... "
    if curl -s -X POST http://localhost:3001/api/auntmel \
       -H "Content-Type: application/json" \
       -d '{"message": "test"}' | grep -q "success"; then
        echo "✅ PASS"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "❌ FAIL"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
else
    echo "❌ Backend server is not running"
    echo "Please run: ./start.sh backend"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""
echo "🔍 File Structure Tests"
echo "======================="

# Critical files
critical_files=(
    "server.js"
    "start.sh"
    "README.md"
    "frontend/app/page.tsx"
    "frontend/app/layout.tsx"
    "src/types/index.ts"
)

for file in "${critical_files[@]}"; do
    run_test "File exists: $file" "test -f $file"
done

echo ""
echo "📊 Final Results"
echo "================"
echo "Tests Passed: $TESTS_PASSED"
echo "Tests Failed: $TESTS_FAILED"
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo "🎉 ALL TESTS PASSED!"
    echo "Stratix AI is ready for use!"
    echo ""
    echo "Quick Start:"
    echo "1. ./start.sh backend    # Start backend server"
    echo "2. ./start.sh frontend   # Start frontend (optional)"
    echo "3. Visit http://localhost:3001/health"
else
    echo ""
    echo "⚠️  Some tests failed. Please review and fix issues."
fi
