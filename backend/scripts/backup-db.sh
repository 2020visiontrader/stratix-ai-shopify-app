#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

echo -e "${YELLOW}🚀 Starting database backup...${NC}"

# Check if environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo -e "${RED}❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set${NC}"
  exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Run backup
echo -e "${YELLOW}📝 Creating backup...${NC}"
npx ts-node src/db/backup.ts "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Backup completed successfully!${NC}"
  echo -e "${GREEN}📦 Backup saved to: ${BACKUP_FILE}${NC}"
else
  echo -e "${RED}❌ Backup failed${NC}"
  exit 1
fi

# Clean up old backups (keep last 7 days)
echo -e "${YELLOW}🧹 Cleaning up old backups...${NC}"
find "$BACKUP_DIR" -name "backup_*.sql" -mtime +7 -delete

echo -e "${GREEN}✅ Cleanup completed${NC}" 