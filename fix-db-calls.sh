#!/bin/bash

# Script to fix common database call patterns
cd "/Users/franckie/Desktop/Stratix Ai/frontend"

# Fix .create( patterns
find src/ -name "*.ts" -exec sed -i '' 's/db\.\([a-zA-Z_]*\)\.create(/db.from('\''\\1'\'').insert(/g' {} \;

# Fix .getById( patterns
find src/ -name "*.ts" -exec sed -i '' 's/db\.\([a-zA-Z_]*\)\.getById(\([^)]*\))/db.from('\''\\1'\'').select('\''*'\'').eq('\''id'\'', \2).single()/g' {} \;

# Fix .update( patterns
find src/ -name "*.ts" -exec sed -i '' 's/db\.\([a-zA-Z_]*\)\.update(\([^,]*\), \([^)]*\))/db.from('\''\\1'\'').update(\3).eq('\''id'\'', \2)/g' {} \;

# Fix .list() patterns
find src/ -name "*.ts" -exec sed -i '' 's/db\.\([a-zA-Z_]*\)\.list()/db.from('\''\\1'\'').select('\''*'\'')/g' {} \;

# Fix .getByBrandId( patterns
find src/ -name "*.ts" -exec sed -i '' 's/db\.\([a-zA-Z_]*\)\.getByBrandId(\([^)]*\))/db.from('\''\\1'\'').select('\''*'\'').eq('\''brand_id'\'', \2)/g' {} \;

# Fix .getByCategory( patterns
find src/ -name "*.ts" -exec sed -i '' 's/db\.\([a-zA-Z_]*\)\.getByCategory(\([^)]*\))/db.from('\''\\1'\'').select('\''*'\'').eq('\''category'\'', \2)/g' {} \;

echo "Database call patterns fixed!"

# Test the build
npm run build
