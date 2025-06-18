#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Setting up database...${NC}"

# Check if environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo -e "${RED}❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set${NC}"
  exit 1
fi

# Run database initialization
echo -e "${YELLOW}📝 Running database initialization...${NC}"
npx ts-node src/db/index.ts

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Database setup completed successfully!${NC}"
else
  echo -e "${RED}❌ Database setup failed${NC}"
  exit 1
fi 