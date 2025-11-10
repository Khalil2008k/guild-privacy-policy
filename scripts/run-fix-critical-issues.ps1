# GUILD Critical Issues Fix Script - PowerShell Version
# 
# Run this from the GUILD-3 directory:
#   .\scripts\run-fix-critical-issues.ps1
#
# Or from project root:
#   cd GUILD-3
#   .\scripts\run-fix-critical-issues.ps1

Write-Host "🔧 GUILD Critical Issues Fix Script" -ForegroundColor Cyan
Write-Host ""

# Change to GUILD-3 directory if not already there
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
$projectName = Split-Path -Leaf $projectRoot

if ($projectName -ne "GUILD-3") {
    Write-Host "⚠️  Warning: Script should be run from GUILD-3 directory" -ForegroundColor Yellow
    Write-Host "   Current directory: $projectRoot" -ForegroundColor Yellow
    Write-Host "   Looking for GUILD-3 directory..." -ForegroundColor Yellow
    
    if (Test-Path "$projectRoot\GUILD-3") {
        Set-Location "$projectRoot\GUILD-3"
        Write-Host "✅ Changed to GUILD-3 directory" -ForegroundColor Green
    } else {
        Write-Host "❌ GUILD-3 directory not found" -ForegroundColor Red
        exit 1
    }
}

# Verify script exists
$scriptFile = Join-Path $PSScriptRoot "fix-critical-issues.ts"
if (-not (Test-Path $scriptFile)) {
    Write-Host "❌ Script not found: $scriptFile" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Running fix script..." -ForegroundColor Cyan
Write-Host ""

# Run the TypeScript script
try {
    npx ts-node $scriptFile
} catch {
    Write-Host "❌ Error running script: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Script complete!" -ForegroundColor Green









