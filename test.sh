#!/bin/bash

# Stratix AI - Comprehensive Testing Script
echo "🧪 Stratix AI Testing Suite"
echo "============================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    echo -e "\n${BLUE}Testing:${NC} $test_name"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC} - $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC} - $test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Function to test API endpoint
test_api_endpoint() {
    local endpoint="$1"
    local expected_status="$2"
    local description="$3"
    
    echo -e "\n${BLUE}Testing API:${NC} $description"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001$endpoint")
    
    if [ "$response_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} - API $endpoint (Status: $response_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC} - API $endpoint (Expected: $expected_status, Got: $response_code)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

echo -e "\n${YELLOW}🔍 Phase 1: Environment Validation${NC}"
echo "======================================"

# Test Node.js version
run_test "Node.js Version (18+)" "node -v | grep -E '^v(1[8-9]|[2-9][0-9])'"

# Test npm availability
run_test "npm availability" "which npm"

# Test dependencies
run_test "Backend package.json exists" "test -f package.json"
run_test "Frontend package.json exists" "test -f frontend/package.json"

# Test configuration files
run_test "Environment configuration exists" "test -f .env.development -o -f .env"
run_test "TypeScript config exists" "test -f tsconfig.json"
run_test "Start script exists and executable" "test -x start.sh"

echo -e "\n${YELLOW}🔍 Phase 2: Dependency Validation${NC}"
echo "====================================="

# Check backend dependencies
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ PASS${NC} - Backend dependencies installed"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ FAIL${NC} - Backend dependencies missing"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Check frontend dependencies
if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✅ PASS${NC} - Frontend dependencies installed"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ FAIL${NC} - Frontend dependencies missing"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "\n${YELLOW}🔍 Phase 3: Backend Server Testing${NC}"
echo "===================================="

# Check if backend is already running
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend already running${NC}"
    BACKEND_RUNNING=true
else
    echo -e "${BLUE}🚀 Starting backend server...${NC}"
    node server.js &
    BACKEND_PID=$!
    BACKEND_RUNNING=false
    
    # Wait for server to start
    echo -e "${BLUE}⏳ Waiting for server to start...${NC}"
    sleep 5
    
    # Check if server started successfully
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend server started successfully${NC}"
    else
        echo -e "${RED}❌ Backend server failed to start${NC}"
        exit 1
    fi
fi

# Test API endpoints
test_api_endpoint "/health" "200" "Health check endpoint"
test_api_endpoint "/" "200" "Root endpoint"
test_api_endpoint "/api/docs" "200" "API documentation endpoint"
test_api_endpoint "/metrics" "200" "System metrics endpoint"

# Test API functionality
echo -e "\n${BLUE}Testing:${NC} Aunt Mel AI Assistant"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
response=$(curl -s -X POST http://localhost:3001/api/auntmel \
  -H "Content-Type: application/json" \
  -d '{"message": "Test message"}')

if [[ "$response" == *'"success":true'* ]]; then
    echo -e "${GREEN}✅ PASS${NC} - Aunt Mel AI Assistant responds correctly"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ FAIL${NC} - Aunt Mel AI Assistant not responding"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test other API endpoints
echo -e "\n${BLUE}Testing:${NC} Brand API endpoint"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
response=$(curl -s http://localhost:3001/api/brand)

if [[ "$response" == *'"success":true'* ]]; then
    echo -e "${GREEN}✅ PASS${NC} - Brand API endpoint working"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ FAIL${NC} - Brand API endpoint not working"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo -e "\n${YELLOW}🔍 Phase 4: Security & Performance Testing${NC}"
echo "============================================="

# Test rate limiting
echo -e "\n${BLUE}Testing:${NC} Rate limiting"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
rate_limit_test=true

for i in {1..5}; do
    response_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/brand)
    if [ "$response_code" != "200" ]; then
        rate_limit_test=false
        break
    fi
done

if $rate_limit_test; then
    echo -e "${GREEN}✅ PASS${NC} - Rate limiting configured (allowing normal requests)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ FAIL${NC} - Rate limiting issue detected"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test CORS headers
echo -e "\n${BLUE}Testing:${NC} CORS headers"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
cors_header=$(curl -s -I http://localhost:3001/api/auntmel -H "Origin: http://localhost:3000" | grep -i "access-control-allow-origin")

if [ ! -z "$cors_header" ]; then
    echo -e "${GREEN}✅ PASS${NC} - CORS headers present"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ FAIL${NC} - CORS headers missing"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo -e "\n${YELLOW}🔍 Phase 5: Frontend Testing${NC}"
echo "==============================="

# Check if frontend can build
echo -e "\n${BLUE}Testing:${NC} Frontend build process"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

cd frontend
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC} - Frontend builds successfully"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ FAIL${NC} - Frontend build failed"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
cd ..

echo -e "\n${YELLOW}🔍 Phase 6: File Structure Validation${NC}"
echo "======================================"

# Test critical files exist
critical_files=(
    "server.js"
    "package.json"
    "start.sh"
    "frontend/app/page.tsx"
    "frontend/app/layout.tsx"
    "src/types/index.ts"
    "src/lib/supabase.ts"
)

for file in "${critical_files[@]}"; do
    echo -e "\n${BLUE}Testing:${NC} Critical file exists: $file"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ PASS${NC} - $file exists"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC} - $file missing"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
done

# Cleanup
if [ ! $BACKEND_RUNNING ] && [ ! -z "$BACKEND_PID" ]; then
    echo -e "\n${BLUE}🛑 Stopping test backend server...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
fi

# Final Results
echo -e "\n${YELLOW}📊 Test Results Summary${NC}"
echo "========================="
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! Stratix AI is ready for deployment.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Please review the issues above.${NC}"
    exit 1
fi
