# Surgical Stabilization - Firebase Rules Deployment Script (PowerShell)
# Deploys Firestore rules, indexes, and Storage rules

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Firebase Rules Deployment..." -ForegroundColor Green
Write-Host ""

# Check if firebase-tools is installed
try {
    firebase --version | Out-Null
} catch {
    Write-Host "❌ firebase-tools not found. Installing..." -ForegroundColor Red
    npm install -g firebase-tools
}

# Check if logged in to Firebase
Write-Host "🔐 Checking Firebase authentication..." -ForegroundColor Cyan
try {
    firebase projects:list | Out-Null
} catch {
    Write-Host "⚠️  Not logged in to Firebase. Running login..." -ForegroundColor Yellow
    firebase login
}

Write-Host ""
Write-Host "📋 Current Firebase project:" -ForegroundColor Cyan
firebase use

Write-Host ""
Write-Host "⚠️  About to deploy:" -ForegroundColor Yellow
Write-Host "   - Firestore Rules (firestore.rules)"
Write-Host "   - Firestore Indexes (firestore.indexes.json)"
Write-Host "   - Storage Rules (storage.rules)"
Write-Host ""

$confirmation = Read-Host "Continue with deployment? (y/n)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔥 Deploying Firebase rules and indexes..." -ForegroundColor Green
firebase deploy --only firestore:rules,firestore:indexes,storage

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🧪 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Test Firestore rules in Firebase Console"
Write-Host "   2. Verify Storage rules with file upload"
Write-Host "   3. Check indexes status (may take a few minutes)"
Write-Host ""
Write-Host "📊 View deployment status:" -ForegroundColor Cyan
Write-Host "   https://console.firebase.google.com/project/guild-4f46b/firestore/rules"
Write-Host "   https://console.firebase.google.com/project/guild-4f46b/storage/rules"
Write-Host ""















