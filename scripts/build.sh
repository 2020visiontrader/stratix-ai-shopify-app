#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting production build..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run type checking
echo "🔍 Running type checking..."
npm run type-check

# Run linting
echo "🔍 Running linting..."
npm run lint

# Run tests
echo "🧪 Running tests..."
npm run test

# Build the application
echo "🏗️ Building the application..."
npm run build

# Verify the build
echo "✅ Verifying the build..."
if [ -d ".next" ]; then
  echo "✅ Build successful!"
else
  echo "❌ Build failed!"
  exit 1
fi

# Create production environment file
echo "📝 Creating production environment file..."
if [ ! -f ".env.production" ]; then
  cp .env.production.example .env.production
  echo "⚠️ Please update .env.production with your production values"
fi

echo "🎉 Build process completed successfully!" 