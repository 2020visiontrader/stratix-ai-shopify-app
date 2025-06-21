#!/bin/bash

echo "Testing login API endpoint..."
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password"}' \
  -v

echo -e "\n\nTesting status API endpoint..."
curl http://localhost:3000/api/auth/status \
  -v
