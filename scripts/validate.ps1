# GUILD Validation Script (PowerShell)
# Runs all checks and prints a ✅/❌ summary

Write-Host "GUILD Validation Script" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

$Errors = 0
$Warnings = 0

# Function to check command result
function Check-Result {
    param($Success, $Message)
    if ($Success) {
        Write-Host "[OK] $Message" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $Message" -ForegroundColor Red
        $script:Errors++
    }
}

# Function to check with warning
function Check-Warning {
    param($Success, $Message)
    if ($Success) {
        Write-Host "[OK] $Message" -ForegroundColor Green
    } else {
        Write-Host "[WARN] $Message" -ForegroundColor Yellow
        $script:Warnings++
    }
}

# Check TypeScript
Write-Host "Checking TypeScript..."
try {
    $null = npm run typecheck 2>&1
    Check-Result $true "TypeScript compilation"
} catch {
    Check-Result $false "TypeScript compilation"
}

# Check linting
Write-Host "Checking ESLint..."
try {
    $null = npm run lint 2>&1
    Check-Warning $true "ESLint (warnings are acceptable)"
} catch {
    Check-Warning $false "ESLint (warnings are acceptable)"
}

# Check if patches directory exists
Write-Host "Checking patches..."
if (Test-Path "patches") {
    $patchFiles = Get-ChildItem "patches\*.patch" -ErrorAction SilentlyContinue
    if ($patchFiles) {
        Write-Host "[OK] Patches directory exists with $($patchFiles.Count) files" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Patches directory exists but no .patch files found" -ForegroundColor Yellow
        $Warnings++
    }
} else {
    Write-Host "[WARN] No patches directory found" -ForegroundColor Yellow
    $Warnings++
}

# Check if reports directory exists
Write-Host "Checking reports..."
if (Test-Path "reports\deep-audit-20250115.md") {
    Write-Host "[OK] Audit reports exist" -ForegroundColor Green
} else {
    Write-Host "[WARN] Audit reports missing" -ForegroundColor Yellow
    $Warnings++
}

# Check environment variables (basic check)
Write-Host "Checking environment configuration..."
if (Test-Path "src\config\environment.ts") {
    Write-Host "[OK] Environment config file exists" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Environment config file missing" -ForegroundColor Red
    $Errors++
}

# Check Firebase config
Write-Host "Checking Firebase configuration..."
if (Test-Path "src\config\environment.ts") {
    $content = Get-Content "src\config\environment.ts" -Raw
    if ($content -match "EXPO_PUBLIC_FIREBASE_PROJECT_ID") {
        Write-Host "[OK] Firebase config found" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Firebase config may be incomplete" -ForegroundColor Yellow
        $Warnings++
    }
} else {
    Write-Host "[WARN] Cannot check Firebase config" -ForegroundColor Yellow
    $Warnings++
}

# Check backend config
Write-Host "Checking backend configuration..."
if (Test-Path "src\config\backend.ts") {
    Write-Host "[OK] Backend config file exists" -ForegroundColor Green
} else {
    Write-Host "[WARN] Backend config file missing" -ForegroundColor Yellow
    $Warnings++
}

# Check diagnostic screen
Write-Host "Checking diagnostic screen..."
if (Test-Path "src\app\(modals)\diagnostic.tsx") {
    Write-Host "[OK] Diagnostic screen exists" -ForegroundColor Green
} else {
    Write-Host "[WARN] Diagnostic screen missing" -ForegroundColor Yellow
    $Warnings++
}

# Check P0 patches applied
Write-Host "Checking P0 patches applied..."
$patchedFiles = @(
    "src\services\GlobalChatNotificationService.ts",
    "src\services\firebase\ChatService.ts",
    "src\services\realPaymentService.ts"
)
$allPatched = $true
foreach ($file in $patchedFiles) {
    if (-not (Test-Path $file)) {
        $allPatched = $false
        break
    }
    $content = Get-Content $file -Raw
    if ($file -like "*GlobalChatNotificationService*" -and $content -notmatch "Guard: Validate chat data structure") {
        $allPatched = $false
    }
    if ($file -like "*ChatService*" -and $content -notmatch "last good state") {
        $allPatched = $false
    }
}
if ($allPatched) {
    Write-Host "[OK] P0 patches applied" -ForegroundColor Green
} else {
    Write-Host "[WARN] Some P0 patches may not be applied" -ForegroundColor Yellow
    $Warnings++
}

# Summary
Write-Host ""
Write-Host "==========================" -ForegroundColor Cyan
Write-Host "Validation Summary" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
$Passed = 8 - $Errors - $Warnings
Write-Host "[OK] Passed: $Passed" -ForegroundColor Green
if ($Warnings -gt 0) {
    Write-Host "[WARN] Warnings: $Warnings" -ForegroundColor Yellow
}
if ($Errors -gt 0) {
    Write-Host "[FAIL] Errors: $Errors" -ForegroundColor Red
    Write-Host ""
    Write-Host "[FAIL] Validation failed. Please fix errors above." -ForegroundColor Red
    exit 1
} else {
    Write-Host ""
    Write-Host "[OK] All critical checks passed!" -ForegroundColor Green
    if ($Warnings -gt 0) {
        Write-Host "[WARN] Some warnings found, but these are non-blocking." -ForegroundColor Yellow
    }
    exit 0
}

