#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backup file is provided
if [ -z "$1" ]; then
  echo -e "${RED}❌ Error: Please provide a backup file path${NC}"
  echo -e "Usage: $0 <backup_file>"
  exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}❌ Error: Backup file not found: ${BACKUP_FILE}${NC}"
  exit 1
fi

echo -e "${YELLOW}🚀 Starting database restore...${NC}"

# Check if environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo -e "${RED}❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set${NC}"
  exit 1
fi

# Run restore
echo -e "${YELLOW}📝 Restoring from backup...${NC}"
npx ts-node src/db/restore.ts "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Restore completed successfully!${NC}"
else
  echo -e "${RED}❌ Restore failed${NC}"
  exit 1
fi 