#!/bin/bash

echo "🚀 Guild App - Quick Start Script"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if Arabic fonts exist
if [ ! -f "src/assets/fonts/NotoSansArabic-Regular.ttf" ]; then
    echo "⚠️  Arabic fonts not found. Please download them from:"
    echo "   https://fonts.google.com/noto/specimen/Noto+Sans+Arabic"
    echo "   Place them in: src/assets/fonts/"
fi

# Check if Firebase config is set up
if grep -q "your-api-key" "src/app/config/firebase.ts"; then
    echo "⚠️  Firebase configuration not set up. Please update:"
    echo "   src/app/config/firebase.ts"
fi

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Download Arabic fonts (if not done)"
echo "2. Configure Firebase (if not done)"
echo "3. Run: npm start"
echo "4. Scan QR code with Expo Go app"
echo ""
echo "Happy coding! 🎯"
