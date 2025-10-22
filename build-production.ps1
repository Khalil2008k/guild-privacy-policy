# GUILD Production Build Script (PowerShell)
# This script builds production-ready apps for iOS and Android

Write-Host "🚀 GUILD Production Build Script" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Check if EAS CLI is installed
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Cyan
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue

if (-not $easInstalled) {
    Write-Host "❌ EAS CLI not found!" -ForegroundColor Red
    Write-Host "📦 Installing EAS CLI..." -ForegroundColor Yellow
    npm install -g eas-cli
}

# Check if logged in to Expo
Write-Host "🔐 Checking Expo login status..." -ForegroundColor Cyan
$loginCheck = eas whoami 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Expo" -ForegroundColor Red
    Write-Host "🔑 Please log in:" -ForegroundColor Yellow
    eas login
}

Write-Host ""
Write-Host "✅ Prerequisites check complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Building GUILD for production..." -ForegroundColor Cyan
Write-Host ""
Write-Host "This will build:"
Write-Host "  - iOS App (IPA) for App Store" -ForegroundColor White
Write-Host "  - Android App (AAB) for Play Store" -ForegroundColor White
Write-Host ""
Write-Host "⏱️  Estimated time: 20-40 minutes" -ForegroundColor Yellow
Write-Host ""

# Ask for confirmation
$confirmation = Read-Host "Continue with production build? (y/n)"

if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
    Write-Host ""
    Write-Host "🏗️  Starting production build..." -ForegroundColor Green
    Write-Host ""
    
    # Run EAS build
    eas build --platform all --profile production
    
    Write-Host ""
    Write-Host "✅ Build submitted!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Monitor build status at:" -ForegroundColor Cyan
    Write-Host "   https://expo.dev/accounts/mazen123333/projects/guild/builds" -ForegroundColor White
    Write-Host ""
    Write-Host "📧 You'll receive an email when builds are complete." -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Build cancelled." -ForegroundColor Red
    Write-Host ""
}

