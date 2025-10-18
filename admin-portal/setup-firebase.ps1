# PowerShell script for Windows users

Write-Host "🔥 Setting up Firebase for Guild Admin Portal..." -ForegroundColor Green

# Check if Firebase CLI is installed
if (!(Get-Command firebase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Firebase CLI not found. Installing..." -ForegroundColor Red
    npm install -g firebase-tools
}

# Login to Firebase (if not already logged in)
Write-Host "🔐 Logging into Firebase..." -ForegroundColor Yellow
firebase login

# Initialize Firebase project (if not already initialized)
Write-Host "📦 Initializing Firebase project..." -ForegroundColor Yellow
firebase use guild-4f46b

# Deploy Firestore rules
Write-Host "🛡️ Deploying Firestore security rules..." -ForegroundColor Yellow
firebase deploy --only firestore:rules

# Deploy Firestore indexes
Write-Host "📊 Deploying Firestore indexes..." -ForegroundColor Yellow
firebase deploy --only firestore:indexes

Write-Host "✅ Firebase setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Create an admin user account in your Guild app"
Write-Host "2. Set admin role for your user in Firebase Console:"
Write-Host "   - Go to Firebase Console > Authentication > Users"
Write-Host "   - Find your user and set custom claims: {`"role`": `"super_admin`"}"
Write-Host "3. Build and deploy the admin portal:"
Write-Host "   npm run build"
Write-Host "   firebase deploy --only hosting"
Write-Host ""
Write-Host "🎯 Your admin portal is now connected to real Firebase data!" -ForegroundColor Green
