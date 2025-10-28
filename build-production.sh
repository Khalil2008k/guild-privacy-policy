#!/bin/bash

# GUILD Production Build Script
# This script builds production-ready apps for iOS and Android

echo "🚀 GUILD Production Build Script"
echo "================================="
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found!"
    echo "📦 Installing EAS CLI..."
    npm install -g eas-cli
fi

# Check if logged in to Expo
echo "🔐 Checking Expo login status..."
if ! eas whoami &> /dev/null; then
    echo "❌ Not logged in to Expo"
    echo "🔑 Please log in:"
    eas login
fi

echo ""
echo "✅ Prerequisites check complete!"
echo ""
echo "📱 Building GUILD for production..."
echo ""
echo "This will build:"
echo "  - iOS App (IPA) for App Store"
echo "  - Android App (AAB) for Play Store"
echo ""
echo "⏱️  Estimated time: 20-40 minutes"
echo ""

# Ask for confirmation
read -p "Continue with production build? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🏗️  Starting production build..."
    echo ""
    
    # Run EAS build
    eas build --platform all --profile production
    
    echo ""
    echo "✅ Build submitted!"
    echo ""
    echo "📊 Monitor build status at:"
    echo "   https://expo.dev/accounts/mazen123333/projects/guild/builds"
    echo ""
    echo "📧 You'll receive an email when builds are complete."
    echo ""
else
    echo ""
    echo "❌ Build cancelled."
    echo ""
fi



