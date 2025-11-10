#!/bin/bash

# Surgical Stabilization - Firebase Rules Deployment Script
# Deploys Firestore rules, indexes, and Storage rules

set -e

echo "🚀 Starting Firebase Rules Deployment..."
echo ""

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ firebase-tools not found. Installing..."
    npm install -g firebase-tools
fi

# Check if logged in to Firebase
echo "🔐 Checking Firebase authentication..."
firebase projects:list > /dev/null 2>&1 || {
    echo "⚠️  Not logged in to Firebase. Running login..."
    firebase login
}

echo ""
echo "📋 Current Firebase project:"
firebase use

echo ""
echo "⚠️  About to deploy:"
echo "   - Firestore Rules (firestore.rules)"
echo "   - Firestore Indexes (firestore.indexes.json)"
echo "   - Storage Rules (storage.rules)"
echo ""

read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🔥 Deploying Firebase rules and indexes..."
firebase deploy --only firestore:rules,firestore:indexes,storage

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 Next steps:"
echo "   1. Test Firestore rules in Firebase Console"
echo "   2. Verify Storage rules with file upload"
echo "   3. Check indexes status (may take a few minutes)"
echo ""
echo "📊 View deployment status:"
echo "   https://console.firebase.google.com/project/guild-4f46b/firestore/rules"
echo "   https://console.firebase.google.com/project/guild-4f46b/storage/rules"
echo ""
















