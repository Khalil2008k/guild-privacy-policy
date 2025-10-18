# Guild App - Quick Start Script (PowerShell)
Write-Host "🚀 Guild App - Quick Start Script" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    Write-Host "   Visit: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm is installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
npm install

# Check if Arabic fonts exist
if (-not (Test-Path "src/assets/fonts/NotoSansArabic-Regular.ttf")) {
    Write-Host "⚠️  Arabic fonts not found. Please download them from:" -ForegroundColor Yellow
    Write-Host "   https://fonts.google.com/noto/specimen/Noto+Sans+Arabic" -ForegroundColor Cyan
    Write-Host "   Place them in: src/assets/fonts/" -ForegroundColor Yellow
}

# Check if Firebase config is set up
$firebaseConfig = Get-Content "src/app/config/firebase.ts" -Raw
if ($firebaseConfig -match "your-api-key") {
    Write-Host "⚠️  Firebase configuration not set up. Please update:" -ForegroundColor Yellow
    Write-Host "   src/app/config/firebase.ts" -ForegroundColor Cyan
}

Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Download Arabic fonts (if not done)" -ForegroundColor White
Write-Host "2. Configure Firebase (if not done)" -ForegroundColor White
Write-Host "3. Run: npm start" -ForegroundColor White
Write-Host "4. Scan QR code with Expo Go app" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding!" -ForegroundColor Green
