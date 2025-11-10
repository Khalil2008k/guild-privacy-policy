#!/bin/bash
# ============================================================================
# Secret Detection Script
# ============================================================================
# This script checks for hardcoded secrets in the codebase and git history
# Run before committing to ensure no secrets are exposed
# ============================================================================

set -e

echo "🔍 Checking for hardcoded secrets..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FOUND_SECRETS=0

# ============================================================================
# 1. Check for common secret patterns in current files
# ============================================================================
echo "📁 Scanning current files..."

# Firebase API Keys
if grep -r "AIza[0-9A-Za-z_-]{35}" --exclude-dir={node_modules,.git,dist,build} --exclude="*.md" --exclude="check-secrets.sh" .; then
    echo -e "${RED}❌ Found Firebase API key in files${NC}"
    FOUND_SECRETS=$((FOUND_SECRETS + 1))
fi

# AWS Keys
if grep -r "AKIA[0-9A-Z]{16}" --exclude-dir={node_modules,.git,dist,build} --exclude="*.md" .; then
    echo -e "${RED}❌ Found AWS access key in files${NC}"
    FOUND_SECRETS=$((FOUND_SECRETS + 1))
fi

# Private Keys
if grep -r "BEGIN.*PRIVATE KEY" --exclude-dir={node_modules,.git,dist,build} --exclude="*.md" .; then
    echo -e "${RED}❌ Found private key in files${NC}"
    FOUND_SECRETS=$((FOUND_SECRETS + 1))
fi

# Generic secrets
if grep -ri "password.*=.*['\"][^'\"]{8,}" --exclude-dir={node_modules,.git,dist,build} --exclude="*.md" --exclude="check-secrets.sh" . | grep -v "placeholder\|example\|your-"; then
    echo -e "${YELLOW}⚠️  Found potential password in files${NC}"
fi

# ============================================================================
# 2. Check for .env files in git
# ============================================================================
echo ""
echo "📝 Checking for .env files in git..."

if git ls-files | grep -E "\.env$|\.env\.local$|\.env\.production$"; then
    echo -e "${RED}❌ Found .env files tracked by git${NC}"
    echo "Run: git rm --cached .env"
    FOUND_SECRETS=$((FOUND_SECRETS + 1))
else
    echo -e "${GREEN}✅ No .env files in git${NC}"
fi

# ============================================================================
# 3. Check git history for secrets (last 100 commits)
# ============================================================================
echo ""
echo "🕐 Checking git history (last 100 commits)..."

# Check for Firebase keys in history
if git log --all --full-history -100 -S "AIza" --pretty=format:"%h %s" | head -5; then
    echo -e "${YELLOW}⚠️  Found Firebase API key in git history${NC}"
    echo "Consider using git-filter-repo to remove: https://github.com/newren/git-filter-repo"
fi

# Check for .env files in history
if git log --all --full-history -100 --name-only --pretty=format: | grep "\.env$" | head -5; then
    echo -e "${YELLOW}⚠️  Found .env file in git history${NC}"
fi

# ============================================================================
# 4. Verify .env.example exists
# ============================================================================
echo ""
echo "📋 Checking for .env.example..."

if [ -f ".env.example" ]; then
    echo -e "${GREEN}✅ .env.example exists${NC}"
else
    echo -e "${RED}❌ .env.example not found${NC}"
    FOUND_SECRETS=$((FOUND_SECRETS + 1))
fi

# ============================================================================
# 5. Verify .gitignore includes .env
# ============================================================================
echo ""
echo "🚫 Checking .gitignore..."

if grep -q "^\.env$" .gitignore; then
    echo -e "${GREEN}✅ .env in .gitignore${NC}"
else
    echo -e "${RED}❌ .env not in .gitignore${NC}"
    FOUND_SECRETS=$((FOUND_SECRETS + 1))
fi

# ============================================================================
# 6. Check for hardcoded URLs
# ============================================================================
echo ""
echo "🌐 Checking for hardcoded URLs..."

if grep -r "https://.*\.onrender\.com\|http://localhost:[0-9]" --exclude-dir={node_modules,.git,dist,build} --exclude="*.md" --exclude="check-secrets.sh" --exclude=".env*" . | grep -v "process\.env\|EXPO_PUBLIC"; then
    echo -e "${YELLOW}⚠️  Found hardcoded URLs (should use environment variables)${NC}"
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "============================================"
if [ $FOUND_SECRETS -eq 0 ]; then
    echo -e "${GREEN}✅ No critical secrets found!${NC}"
    echo "============================================"
    exit 0
else
    echo -e "${RED}❌ Found $FOUND_SECRETS critical issues${NC}"
    echo "============================================"
    echo ""
    echo "🔧 Recommended actions:"
    echo "1. Move secrets to .env file"
    echo "2. Add .env to .gitignore"
    echo "3. Remove secrets from git history (if found)"
    echo "4. Rotate exposed secrets immediately"
    echo ""
    exit 1
fi

