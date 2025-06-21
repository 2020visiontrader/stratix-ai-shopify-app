#!/bin/bash
echo "Starting simple backend server..."
cd "$(dirname "$0")"
NODE_ENV=development npx ts-node-dev --respawn --transpile-only src/simple-server.ts
