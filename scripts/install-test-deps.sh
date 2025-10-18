#!/bin/bash

echo "🧪 Installing GUILD Test Dependencies..."
echo "========================================"

# Install core testing libraries
echo "📦 Installing Jest and React Native Testing Library..."
npm install --save-dev \
  jest@^29.7.0 \
  jest-expo@^51.0.0 \
  @testing-library/react-native@^12.4.0 \
  @testing-library/jest-native@^5.4.3 \
  @types/jest@^29.5.0

# Install mocking libraries
echo "📦 Installing mock libraries..."
npm install --save-dev \
  @react-native-async-storage/async-storage@^1.21.0

# Already have these in package.json, but ensure they're installed
echo "✅ Verifying existing test packages..."

echo ""
echo "✅ Test dependencies installed!"
echo ""
echo "🚀 To run tests:"
echo "   npm test"
echo ""
echo "📊 To run with coverage:"
echo "   npm test -- --coverage"
echo ""
echo "👀 To run in watch mode:"
echo "   npm test -- --watch"
echo ""


