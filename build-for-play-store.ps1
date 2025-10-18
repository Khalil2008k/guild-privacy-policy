# GUILD App - Build for Google Play Store
# Quick Start Script

Write-Host "========================================" -ForegroundColor Green
Write-Host "  GUILD - Google Play Build Script" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check if EAS CLI is installed
Write-Host "Checking EAS CLI installation..." -ForegroundColor Cyan
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue

if (-not $easInstalled) {
    Write-Host "❌ EAS CLI not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing EAS CLI globally..." -ForegroundColor Yellow
    npm install -g eas-cli
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install EAS CLI" -ForegroundColor Red
        Write-Host "Please run manually: npm install -g eas-cli" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ EAS CLI installed successfully" -ForegroundColor Green
} else {
    Write-Host "✅ EAS CLI already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Current App Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "App Name: GUILD" -ForegroundColor White
Write-Host "Package: com.mazen123333.guild2" -ForegroundColor White
Write-Host "Version: 1.0.0" -ForegroundColor White
Write-Host "Owner: mazen123333" -ForegroundColor White
Write-Host "EAS Project: 03fc46b1-43ec-4b63-a1fc-329d0e5f1d1b" -ForegroundColor White
Write-Host ""

# Show next steps
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  NEXT STEPS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Login to Expo Account:" -ForegroundColor Cyan
Write-Host "   eas login" -ForegroundColor White
Write-Host ""
Write-Host "2. Build Production AAB:" -ForegroundColor Cyan
Write-Host "   eas build --platform android --profile production" -ForegroundColor White
Write-Host ""
Write-Host "3. Check Build Status:" -ForegroundColor Cyan
Write-Host "   eas build:list" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Ask if user wants to proceed
$proceed = Read-Host "Do you want to login to Expo now? (y/n)"

if ($proceed -eq "y" -or $proceed -eq "Y") {
    Write-Host ""
    Write-Host "Opening Expo login..." -ForegroundColor Green
    eas login
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Logged in successfully!" -ForegroundColor Green
        Write-Host ""
        
        $build = Read-Host "Do you want to start building the production AAB now? (y/n)"
        
        if ($build -eq "y" -or $build -eq "Y") {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "  Starting Production Build" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "This will:" -ForegroundColor Yellow
            Write-Host "  1. Upload your code to EAS servers" -ForegroundColor White
            Write-Host "  2. Build Android App Bundle (AAB)" -ForegroundColor White
            Write-Host "  3. Sign with managed credentials" -ForegroundColor White
            Write-Host "  4. Provide download link" -ForegroundColor White
            Write-Host ""
            Write-Host "Build time: 10-30 minutes" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Starting build..." -ForegroundColor Green
            
            eas build --platform android --profile production
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "========================================" -ForegroundColor Green
                Write-Host "  Build Started Successfully!" -ForegroundColor Green
                Write-Host "========================================" -ForegroundColor Green
                Write-Host ""
                Write-Host "✅ Your build has been queued" -ForegroundColor Green
                Write-Host ""
                Write-Host "What happens next:" -ForegroundColor Cyan
                Write-Host "  1. EAS will build your app (10-30 mins)" -ForegroundColor White
                Write-Host "  2. You'll receive an email when complete" -ForegroundColor White
                Write-Host "  3. Download the .aab file from the link" -ForegroundColor White
                Write-Host "  4. Upload to Google Play Console" -ForegroundColor White
                Write-Host ""
                Write-Host "Check build status:" -ForegroundColor Yellow
                Write-Host "  eas build:list" -ForegroundColor White
                Write-Host ""
                Write-Host "Or visit: https://expo.dev/accounts/mazen123333/projects/guild/builds" -ForegroundColor Cyan
                Write-Host ""
            } else {
                Write-Host ""
                Write-Host "❌ Build failed" -ForegroundColor Red
                Write-Host "Check the error messages above" -ForegroundColor Yellow
            }
        } else {
            Write-Host ""
            Write-Host "No problem! When you're ready, run:" -ForegroundColor Cyan
            Write-Host "  eas build --platform android --profile production" -ForegroundColor White
        }
    }
} else {
    Write-Host ""
    Write-Host "No problem! When you're ready, run:" -ForegroundColor Cyan
    Write-Host "  eas login" -ForegroundColor White
    Write-Host "  eas build --platform android --profile production" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Helpful Resources" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 Full Guide:" -ForegroundColor Yellow
Write-Host "   GOOGLE_PLAY_LAUNCH_GUIDE.md" -ForegroundColor White
Write-Host ""
Write-Host "🌐 EAS Dashboard:" -ForegroundColor Yellow
Write-Host "   https://expo.dev/" -ForegroundColor White
Write-Host ""
Write-Host "🏪 Google Play Console:" -ForegroundColor Yellow
Write-Host "   https://play.google.com/console" -ForegroundColor White
Write-Host ""
Write-Host "Need help? Check the guide for detailed instructions!" -ForegroundColor Green
Write-Host ""


