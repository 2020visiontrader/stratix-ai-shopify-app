#!/bin/bash

echo "Testing Authentication Flow"
echo "========================="

# Test 1: Check if login API is accessible
echo -e "\n1. Testing login API..."
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password"}' \
  -c cookies.txt \
  -w "\nStatus: %{http_code}\n" \
  -s

# Test 2: Check auth status with cookie
echo -e "\n2. Testing auth status with cookie..."
curl -X GET http://localhost:3000/api/auth/status \
  -b cookies.txt \
  -w "\nStatus: %{http_code}\n" \
  -s

# Test 3: Test protected route (campaigns)
echo -e "\n3. Testing protected API route..."
curl -X GET http://localhost:3000/api/campaigns \
  -b cookies.txt \
  -w "\nStatus: %{http_code}\n" \
  -s

echo -e "\nTest complete!"
