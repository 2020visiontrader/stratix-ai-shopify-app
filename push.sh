#!/bin/bash

# This is a simple script to push to GitHub
# Repository: https://github.com/2020visiontrader/stratix-ai-shopify-app

echo "Starting GitHub push process..."

# Make sure we're in the right directory
cd /Users/franckie/Desktop/stratix-ai-shopify-app

# Check git status
echo "Current git status:"
git status

# Stage all changes
echo "Staging all changes..."
git add .

# Commit changes
echo "Committing changes..."
git commit -m "Stratix AI Shopify App - Production Readiness Update (2025-06-21)"

# Configure remote if needed
if ! git remote | grep -q "^origin$"; then
  echo "Adding remote repository..."
  git remote add origin https://github.com/2020visiontrader/stratix-ai-shopify-app.git
else
  echo "Remote already exists. Setting URL to ensure it's correct..."
  git remote set-url origin https://github.com/2020visiontrader/stratix-ai-shopify-app.git
fi

# Verify remote
echo "Remote configuration:"
git remote -v

# Determine branch name
BRANCH=$(git branch --show-current)
if [ -z "$BRANCH" ]; then
  echo "No branch detected. Creating main branch..."
  git checkout -b main
  BRANCH="main"
fi
echo "Current branch: $BRANCH"

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin $BRANCH

# Check result
if [ $? -eq 0 ]; then
  echo "Successfully pushed to GitHub!"
else
  echo "Push failed. Trying SSH method..."
  git remote set-url origin git@github.com:2020visiontrader/stratix-ai-shopify-app.git
  git push -u origin $BRANCH
  
  if [ $? -eq 0 ]; then
    echo "Successfully pushed using SSH!"
  else
    echo "Push failed with both HTTPS and SSH."
    echo "Please check your GitHub credentials and repository permissions."
  fi
fi

echo "Done!"
