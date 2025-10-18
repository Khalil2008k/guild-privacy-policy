#!/bin/bash

echo "🔥 Setting up Firebase for Guild Admin Portal..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Login to Firebase (if not already logged in)
echo "🔐 Logging into Firebase..."
firebase login

# Initialize Firebase project (if not already initialized)
echo "📦 Initializing Firebase project..."
firebase use guild-4f46b

# Deploy Firestore rules
echo "🛡️ Deploying Firestore security rules..."
firebase deploy --only firestore:rules

# Deploy Firestore indexes
echo "📊 Deploying Firestore indexes..."
firebase deploy --only firestore:indexes

echo "✅ Firebase setup complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Create an admin user account in your Guild app"
echo "2. Set admin role for your user in Firebase Console:"
echo "   - Go to Firebase Console > Authentication > Users"
echo "   - Find your user and set custom claims: {\"role\": \"super_admin\"}"
echo "3. Build and deploy the admin portal:"
echo "   npm run build"
echo "   firebase deploy --only hosting"
echo ""
echo "🎯 Your admin portal is now connected to real Firebase data!"
