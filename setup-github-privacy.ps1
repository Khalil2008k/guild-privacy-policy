# =================================================
# GitHub Privacy Policy Setup Script for GUILD
# =================================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  🚀 GitHub Privacy Policy Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Copy and rename privacy policy
Write-Host "📄 Step 1: Preparing privacy policy file..." -ForegroundColor Yellow

if (Test-Path "privacy-policy.html") {
    Copy-Item "privacy-policy.html" "index.html" -Force
    Write-Host "✅ Created index.html from privacy-policy.html" -ForegroundColor Green
} else {
    Write-Host "❌ Error: privacy-policy.html not found!" -ForegroundColor Red
    Write-Host "   Make sure you're in the GUILD-3 directory" -ForegroundColor Yellow
    exit 1
}

# Step 2: Instructions for GitHub
Write-Host "`n📋 Step 2: Next Steps for GitHub" -ForegroundColor Yellow
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "Option A - GitHub Website (Easiest):" -ForegroundColor Green
Write-Host "  1. Go to https://github.com/new" -ForegroundColor White
Write-Host "  2. Repository name: guild-privacy-policy" -ForegroundColor White
Write-Host "  3. Make it PUBLIC" -ForegroundColor White
Write-Host "  4. Check 'Add a README file'" -ForegroundColor White
Write-Host "  5. Click 'Create repository'" -ForegroundColor White
Write-Host "  6. Upload the 'index.html' file created in this directory" -ForegroundColor White
Write-Host "  7. Go to Settings → Pages" -ForegroundColor White
Write-Host "  8. Set Source to 'main' branch, '/ (root)' folder" -ForegroundColor White
Write-Host "  9. Click Save and wait 2-3 minutes`n" -ForegroundColor White

Write-Host "Option B - GitHub Desktop:" -ForegroundColor Green
Write-Host "  1. Download from https://desktop.github.com/" -ForegroundColor White
Write-Host "  2. Create new repository: guild-privacy-policy" -ForegroundColor White
Write-Host "  3. Copy index.html to that repository folder" -ForegroundColor White
Write-Host "  4. Commit and publish (make sure it's PUBLIC)" -ForegroundColor White
Write-Host "  5. Enable GitHub Pages in repository Settings → Pages`n" -ForegroundColor White

Write-Host "Option C - Git Command Line:" -ForegroundColor Green
Write-Host "  Run these commands:`n" -ForegroundColor White
Write-Host "  git init" -ForegroundColor Cyan
Write-Host "  git add index.html" -ForegroundColor Cyan
Write-Host "  git commit -m 'Add privacy policy'" -ForegroundColor Cyan
Write-Host "  (Create repo on GitHub first, then:)" -ForegroundColor Yellow
Write-Host "  git remote add origin https://github.com/YOUR-USERNAME/guild-privacy-policy.git" -ForegroundColor Cyan
Write-Host "  git branch -M main" -ForegroundColor Cyan
Write-Host "  git push -u origin main" -ForegroundColor Cyan
Write-Host "  (Then enable GitHub Pages in Settings → Pages)`n" -ForegroundColor Yellow

# Step 3: Expected URL
Write-Host "`n🌐 Step 3: Your Privacy Policy URL" -ForegroundColor Yellow
Write-Host "================================`n" -ForegroundColor Cyan
Write-Host "After setup, your URL will be:" -ForegroundColor White
Write-Host "  https://YOUR-USERNAME.github.io/guild-privacy-policy/`n" -ForegroundColor Green

# Step 4: Google Play Store
Write-Host "`n📱 Step 4: Add to Google Play Store" -ForegroundColor Yellow
Write-Host "================================`n" -ForegroundColor Cyan
Write-Host "In Play Console:" -ForegroundColor White
Write-Host "  1. Go to Store presence → Store settings" -ForegroundColor White
Write-Host "  2. Find 'Privacy Policy' section" -ForegroundColor White
Write-Host "  3. Paste your GitHub Pages URL" -ForegroundColor White
Write-Host "  4. Save changes`n" -ForegroundColor White

# Summary
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  ✅ Setup Preparation Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "📁 File created: index.html" -ForegroundColor Cyan
Write-Host "📖 Full guide: GITHUB_PRIVACY_HOSTING_GUIDE.md" -ForegroundColor Cyan
Write-Host "`n💡 Tip: Choose Option A (GitHub Website) for easiest setup`n" -ForegroundColor Yellow

# Open guide
$openGuide = Read-Host "Would you like to open the full guide? (y/n)"
if ($openGuide -eq "y" -or $openGuide -eq "Y") {
    if (Test-Path "GITHUB_PRIVACY_HOSTING_GUIDE.md") {
        Start-Process "GITHUB_PRIVACY_HOSTING_GUIDE.md"
    }
}

# Open GitHub in browser
$openGitHub = Read-Host "`nWould you like to open GitHub in your browser to create the repository? (y/n)"
if ($openGitHub -eq "y" -or $openGitHub -eq "Y") {
    Start-Process "https://github.com/new"
}

Write-Host "`n✨ Good luck with your Google Play submission!`n" -ForegroundColor Green


