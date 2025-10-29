#!/bin/bash

# GUILD Validation Script
# Runs all checks and prints a ✅/❌ summary

echo "🔍 GUILD Validation Script"
echo "=========================="
echo ""

ERRORS=0
WARNINGS=0

# Function to check command result
check_result() {
    if [ $? -eq 0 ]; then
        echo "✅ $1"
    else
        echo "❌ $1"
        ERRORS=$((ERRORS + 1))
    fi
}

# Function to check with warning
check_warning() {
    if [ $? -eq 0 ]; then
        echo "✅ $1"
    else
        echo "⚠️  $1"
        WARNINGS=$((WARNINGS + 1))
    fi
}

# Check TypeScript
echo "📝 Checking TypeScript..."
npm run typecheck > /dev/null 2>&1
check_result "TypeScript compilation"

# Check linting
echo "🔍 Checking ESLint..."
npm run lint > /dev/null 2>&1
check_warning "ESLint (warnings are acceptable)"

# Check if patches directory exists
echo "📦 Checking patches..."
if [ -d "patches" ] && [ "$(ls -A patches/*.patch 2>/dev/null)" ]; then
    echo "✅ Patches directory exists with files"
else
    echo "⚠️  No patches found"
    WARNINGS=$((WARNINGS + 1))
fi

# Check if reports directory exists
echo "📄 Checking reports..."
if [ -d "reports" ] && [ -f "reports/deep-audit-20250115.md" ]; then
    echo "✅ Audit reports exist"
else
    echo "⚠️  Audit reports missing"
    WARNINGS=$((WARNINGS + 1))
fi

# Check environment variables (basic check)
echo "🔐 Checking environment configuration..."
if [ -f "src/config/environment.ts" ]; then
    echo "✅ Environment config file exists"
else
    echo "❌ Environment config file missing"
    ERRORS=$((ERRORS + 1))
fi

# Check Firebase config
echo "🔥 Checking Firebase configuration..."
if grep -q "EXPO_PUBLIC_FIREBASE_PROJECT_ID" src/config/environment.ts 2>/dev/null; then
    echo "✅ Firebase config found"
else
    echo "⚠️  Firebase config may be incomplete"
    WARNINGS=$((WARNINGS + 1))
fi

# Check backend config
echo "🔗 Checking backend configuration..."
if [ -f "src/config/backend.ts" ]; then
    echo "✅ Backend config file exists"
else
    echo "⚠️  Backend config file missing"
    WARNINGS=$((WARNINGS + 1))
fi

# Check diagnostic screen
echo "🧪 Checking diagnostic screen..."
if [ -f "src/app/(modals)/diagnostic.tsx" ]; then
    echo "✅ Diagnostic screen exists"
else
    echo "⚠️  Diagnostic screen missing"
    WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo ""
echo "=========================="
echo "📊 Validation Summary"
echo "=========================="
echo "✅ Passed: $((8 - ERRORS - WARNINGS))"
if [ $WARNINGS -gt 0 ]; then
    echo "⚠️  Warnings: $WARNINGS"
fi
if [ $ERRORS -gt 0 ]; then
    echo "❌ Errors: $ERRORS"
    echo ""
    echo "❌ Validation failed. Please fix errors above."
    exit 1
else
    echo ""
    echo "✅ All critical checks passed!"
    if [ $WARNINGS -gt 0 ]; then
        echo "⚠️  Some warnings found, but these are non-blocking."
    fi
    exit 0
fi

