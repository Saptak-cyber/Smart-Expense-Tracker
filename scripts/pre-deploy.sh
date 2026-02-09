#!/bin/bash

echo "🔍 Running pre-deployment checks..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Type checking
echo "📝 Type checking..."
if ! npm run type-check; then
  echo -e "${RED}❌ Type check failed!${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Type check passed${NC}"
echo ""

# Linting
echo "🔎 Linting..."
if ! npm run lint; then
  echo -e "${RED}❌ Linting failed!${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Lint passed${NC}"
echo ""

# Format check
echo "💅 Checking code formatting..."
if ! npm run format:check; then
  echo -e "${YELLOW}⚠️  Code formatting issues found. Run 'npm run format' to fix.${NC}"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
else
  echo -e "${GREEN}✓ Format check passed${NC}"
fi
echo ""

# Build test
echo "🏗️  Building..."
if ! npm run build; then
  echo -e "${RED}❌ Build failed!${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}"
echo ""

echo -e "${GREEN}✅ All checks passed! Ready to deploy.${NC}"
echo ""
echo "You can now run: git push"
