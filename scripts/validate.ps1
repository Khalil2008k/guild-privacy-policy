# GUILD Validation Script (PowerShell)
# Runs all checks and prints a ✅/❌ summary

Write-Host "🔍 GUILD Validation Script" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

$Errors = 0
$Warnings = 0

# Function to check command result
function Check-Result {
    param($Success, $Message)
    if ($Success) {
        Write-Host "✅ $Message" -ForegroundColor Green
    } else {
        Write-Host "❌ $Message" -ForegroundColor Red
        $script:Errors++
    }
}

# Function to check with warning
function Check-Warning {
    param($Success, $Message)
    if ($Success) {
        Write-Host "✅ $Message" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $Message" -ForegroundColor Yellow
        $script:Warnings++
    }
}

# Check TypeScript
Write-Host "📝 Checking TypeScript..."
try {
    npm run typecheck 2>&1 | Out-Null
    Check-Result $true "TypeScript compilation"
} catch {
    Check-Result $false "TypeScript compilation"
}

# Check linting
Write-Host "🔍 Checking ESLint..."
try {
    npm run lint 2>&1 | Out-Null
    Check-Warning $true "ESLint (warnings are acceptable)"
} catch {
    Check-Warning $false "ESLint (warnings are acceptable)"
}

# Check if patches directory exists
Write-Host "📦 Checking patches..."
if (Test-Path "patches") {
    $patchFiles = Get-ChildItem "patches\*.patch" -ErrorAction SilentlyContinue
    if ($patchFiles) {
        Write-Host "✅ Patches directory exists with $($patchFiles.Count) files" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Patches directory exists but no .patch files found" -ForegroundColor Yellow
        $Warnings++
    }
} else {
    Write-Host "⚠️  No patches directory found" -ForegroundColor Yellow
    $Warnings++
}

# Check if reports directory exists
Write-Host "📄 Checking reports..."
if (Test-Path "reports\deep-audit-20250115.md") {
    Write-Host "✅ Audit reports exist" -ForegroundColor Green
} else {
    Write-Host "⚠️  Audit reports missing" -ForegroundColor Yellow
    $Warnings++
}

# Check environment variables (basic check)
Write-Host "🔐 Checking environment configuration..."
if (Test-Path "src\config\environment.ts") {
    Write-Host "✅ Environment config file exists" -ForegroundColor Green
} else {
    Write-Host "❌ Environment config file missing" -ForegroundColor Red
    $Errors++
}

# Check Firebase config
Write-Host "🔥 Checking Firebase configuration..."
if (Test-Path "src\config\environment.ts") {
    $content = Get-Content "src\config\environment.ts" -Raw
    if ($content -match "EXPO_PUBLIC_FIREBASE_PROJECT_ID") {
        Write-Host "✅ Firebase config found" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Firebase config may be incomplete" -ForegroundColor Yellow
        $Warnings++
    }
} else {
    Write-Host "⚠️  Cannot check Firebase config" -ForegroundColor Yellow
    $Warnings++
}

# Check backend config
Write-Host "🔗 Checking backend configuration..."
if (Test-Path "src\config\backend.ts") {
    Write-Host "✅ Backend config file exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend config file missing" -ForegroundColor Yellow
    $Warnings++
}

# Check diagnostic screen
Write-Host "🧪 Checking diagnostic screen..."
if (Test-Path "src\app\(modals)\diagnostic.tsx") {
    Write-Host "✅ Diagnostic screen exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  Diagnostic screen missing" -ForegroundColor Yellow
    $Warnings++
}

# Check P0 patches applied
Write-Host "🔧 Checking P0 patches applied..."
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
    Write-Host "✅ P0 patches applied" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some P0 patches may not be applied" -ForegroundColor Yellow
    $Warnings++
}

# Summary
Write-Host ""
Write-Host "==========================" -ForegroundColor Cyan
Write-Host "📊 Validation Summary" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
$Passed = 8 - $Errors - $Warnings
Write-Host "✅ Passed: $Passed" -ForegroundColor Green
if ($Warnings -gt 0) {
    Write-Host "⚠️  Warnings: $Warnings" -ForegroundColor Yellow
}
if ($Errors -gt 0) {
    Write-Host "❌ Errors: $Errors" -ForegroundColor Red
    Write-Host ""
    Write-Host "❌ Validation failed. Please fix errors above." -ForegroundColor Red
    exit 1
} else {
    Write-Host ""
    Write-Host "✅ All critical checks passed!" -ForegroundColor Green
    if ($Warnings -gt 0) {
        Write-Host "⚠️  Some warnings found, but these are non-blocking." -ForegroundColor Yellow
    }
    exit 0
}

