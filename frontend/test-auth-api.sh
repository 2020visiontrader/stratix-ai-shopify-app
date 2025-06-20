#!/bin/bash

echo "Testing Authentication API"
echo "=========================="

# Test login
echo -e "\nTesting login API..."
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password"}' \
  -c cookies.txt \
  -v

# Test auth status with cookie
echo -e "\n\nTesting auth status with cookie..."
curl -X GET http://localhost:3000/api/auth/status \
  -b cookies.txt \
  -v

# Test logout
echo -e "\n\nTesting logout..."
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt \
  -v

echo -e "\n\nTest complete!"
