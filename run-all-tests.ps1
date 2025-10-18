# GUILD PLATFORM - COMPREHENSIVE TEST SUITE (150+ Tests)
# PowerShell version for Windows
# Usage: .\run-all-tests.ps1 [phase]

param(
    [string]$Phase = "all"
)

Write-Host "`n╔═══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                 GUILD PLATFORM - TEST SUITE                       ║" -ForegroundColor Cyan
Write-Host "║                   150+ Comprehensive Tests                        ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Check dependencies
Write-Host "📦 Checking dependencies..." -ForegroundColor Blue
try {
    $nodeVersion = node -v
    $npmVersion = npm -v
    Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green
    Write-Host "✅ npm $npmVersion`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js or npm not installed" -ForegroundColor Red
    exit 1
}

# Check backend status
Write-Host "🔍 Checking backend status..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Backend is running`n" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend not running - some tests will be skipped" -ForegroundColor Yellow
    Write-Host "   Start with: cd backend; npm run dev`n" -ForegroundColor Yellow
}

# Run tests based on phase
$testsPassed = 0
$testsFailed = 0

switch ($Phase) {
    "phase1" {
        Write-Host "▶️  Running PHASE 1: General Tests (1-50)`n" -ForegroundColor Blue
        npm test -- tests/phase1-general.test.ts --verbose
        if ($LASTEXITCODE -eq 0) { $testsPassed++ } else { $testsFailed++ }
    }
    "phase2" {
        Write-Host "▶️  Running PHASE 2: API Tests (51-100)`n" -ForegroundColor Blue
        npm test -- tests/phase2-api.test.ts --verbose
        if ($LASTEXITCODE -eq 0) { $testsPassed++ } else { $testsFailed++ }
    }
    "phase3" {
        Write-Host "▶️  Running PHASE 3: UX/Flow Tests (101-150)`n" -ForegroundColor Blue
        npm test -- tests/phase3-ux-flow.test.ts --verbose
        if ($LASTEXITCODE -eq 0) { $testsPassed++ } else { $testsFailed++ }
    }
    "quick" {
        Write-Host "⚡ Quick mode - running essential checks`n" -ForegroundColor Yellow
        Write-Host "1. Checking lint..." -ForegroundColor Blue
        npm run lint
        Write-Host "`n2. Checking dependencies..." -ForegroundColor Blue
        npm audit --audit-level=high
        Write-Host "`n✅ Quick checks complete" -ForegroundColor Green
        exit 0
    }
    default {
        Write-Host "▶️  Running ALL PHASES`n" -ForegroundColor Blue
        
        Write-Host "═══ PHASE 1: General Tests (1-50) ═══" -ForegroundColor Cyan
        npm test -- tests/phase1-general.test.ts --verbose
        if ($LASTEXITCODE -eq 0) { $testsPassed++ } else { $testsFailed++ }
        
        Write-Host "`n═══ PHASE 2: API Tests (51-100) ═══" -ForegroundColor Cyan
        npm test -- tests/phase2-api.test.ts --verbose
        if ($LASTEXITCODE -eq 0) { $testsPassed++ } else { $testsFailed++ }
        
        Write-Host "`n═══ PHASE 3: UX/Flow Tests (101-150) ═══" -ForegroundColor Cyan
        npm test -- tests/phase3-ux-flow.test.ts --verbose
        if ($LASTEXITCODE -eq 0) { $testsPassed++ } else { $testsFailed++ }
    }
}

# Final Summary
Write-Host "`n╔═══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                      FINAL SUMMARY                                ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "✅ Phases Passed: $testsPassed" -ForegroundColor Green
Write-Host "❌ Phases Failed: $testsFailed`n" -ForegroundColor Red

if ($testsFailed -eq 0) {
    Write-Host "🎉 ALL TESTS PASSED! READY FOR DEPLOYMENT ✅`n" -ForegroundColor Green
    Write-Host "📋 Next Steps:" -ForegroundColor Blue
    Write-Host "  1. Deploy to staging: npm run deploy:staging"
    Write-Host "  2. Deploy to production: npm run deploy:production`n"
    exit 0
} else {
    Write-Host "⚠️  TESTS FAILED - Fix issues before deploying`n" -ForegroundColor Red
    exit 1
}






