# Restart Admin Portal (ESLint Disabled)
Write-Host "🔄 Restarting Admin Portal with ESLint disabled..." -ForegroundColor Yellow

# Stop any existing node processes for admin portal
Write-Host "Stopping existing admin portal process..." -ForegroundColor Cyan
Get-Process node -ErrorAction SilentlyContinue | Where-Object {$_.Path -like "*admin-portal*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait a moment
Start-Sleep -Seconds 2

# Start the admin portal
Write-Host "Starting admin portal..." -ForegroundColor Green
npm start

