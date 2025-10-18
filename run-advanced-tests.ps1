# Advanced Test Runner for GUILD Platform
# PowerShell script to run comprehensive test suites

param(
    [string]$Phase = "all",
    [switch]$Verbose,
    [switch]$Parallel,
    [int]$Timeout = 3600,
    [string]$OutputDir = "test-results"
)

Write-Host "🚀 GUILD Platform - Advanced Test Runner" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Create output directory
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Test phases configuration
$testPhases = @{
    "integration" = @{
        "file" = "tests/phase4-advanced-integration.test.ts"
        "description" = "Advanced Integration Tests (151-250)"
        "timeout" = 1800
    }
    "performance" = @{
        "file" = "tests/phase5-advanced-performance.test.ts"
        "description" = "Advanced Performance Tests (251-350)"
        "timeout" = 2400
    }
    "security" = @{
        "file" = "tests/phase6-advanced-security.test.ts"
        "description" = "Advanced Security Tests (301-400)"
        "timeout" = 1800
    }
    "chaos" = @{
        "file" = "tests/phase7-chaos-engineering.test.ts"
        "description" = "Chaos Engineering Tests (401-500)"
        "timeout" = 1200
    }
}

# Function to run a single test phase
function Run-TestPhase {
    param(
        [string]$PhaseName,
        [hashtable]$PhaseConfig
    )
    
    Write-Host "`n🧪 Running $($PhaseConfig.description)" -ForegroundColor Yellow
    Write-Host "File: $($PhaseConfig.file)" -ForegroundColor Gray
    Write-Host "Timeout: $($PhaseConfig.timeout) seconds" -ForegroundColor Gray
    
    $startTime = Get-Date
    $outputFile = "$OutputDir/$PhaseName-results.json"
    $logFile = "$OutputDir/$PhaseName.log"
    
    try {
        # Run the test with timeout
        $process = Start-Process -FilePath "npm" -ArgumentList "test", $PhaseConfig.file, "--json" -PassThru -NoNewWindow -RedirectStandardOutput $outputFile -RedirectStandardError $logFile
        
        # Wait for completion with timeout
        $completed = $process.WaitForExit($PhaseConfig.timeout * 1000)
        
        if (!$completed) {
            Write-Host "❌ Test phase timed out after $($PhaseConfig.timeout) seconds" -ForegroundColor Red
            $process.Kill()
            return $false
        }
        
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        if ($process.ExitCode -eq 0) {
            Write-Host "✅ $($PhaseConfig.description) completed successfully in $([math]::Round($duration, 2)) seconds" -ForegroundColor Green
            
            # Parse and display results
            if (Test-Path $outputFile) {
                $results = Get-Content $outputFile | ConvertFrom-Json
                Write-Host "   Tests: $($results.numTotalTests)" -ForegroundColor Gray
                Write-Host "   Passed: $($results.numPassedTests)" -ForegroundColor Green
                Write-Host "   Failed: $($results.numFailedTests)" -ForegroundColor Red
                Write-Host "   Skipped: $($results.numPendingTests)" -ForegroundColor Yellow
            }
            
            return $true
        } else {
            Write-Host "❌ $($PhaseConfig.description) failed with exit code $($process.ExitCode)" -ForegroundColor Red
            
            # Display error log
            if (Test-Path $logFile) {
                Write-Host "Error log:" -ForegroundColor Red
                Get-Content $logFile | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
            }
            
            return $false
        }
    }
    catch {
        Write-Host "❌ Error running $($PhaseConfig.description): $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to run tests in parallel
function Run-TestsParallel {
    param([array]$PhasesToRun)
    
    Write-Host "`n🔄 Running tests in parallel..." -ForegroundColor Cyan
    
    $jobs = @()
    
    foreach ($phaseName in $PhasesToRun) {
        $phaseConfig = $testPhases[$phaseName]
        Write-Host "Starting $phaseName test phase..." -ForegroundColor Yellow
        
        $job = Start-Job -ScriptBlock {
            param($PhaseName, $PhaseConfig, $OutputDir)
            
            $outputFile = "$OutputDir/$PhaseName-results.json"
            $logFile = "$OutputDir/$PhaseName.log"
            
            try {
                $process = Start-Process -FilePath "npm" -ArgumentList "test", $PhaseConfig.file, "--json" -PassThru -NoNewWindow -RedirectStandardOutput $outputFile -RedirectStandardError $logFile
                $completed = $process.WaitForExit($PhaseConfig.timeout * 1000)
                
                if (!$completed) {
                    $process.Kill()
                    return @{ Success = $false; Message = "Timeout" }
                }
                
                return @{ 
                    Success = ($process.ExitCode -eq 0)
                    ExitCode = $process.ExitCode
                    OutputFile = $outputFile
                    LogFile = $logFile
                }
            }
            catch {
                return @{ Success = $false; Message = $_.Exception.Message }
            }
        } -ArgumentList $phaseName, $phaseConfig, $OutputDir
        
        $jobs += @{ Name = $phaseName; Job = $job; Config = $phaseConfig }
    }
    
    # Wait for all jobs to complete
    $results = @()
    foreach ($jobInfo in $jobs) {
        Write-Host "Waiting for $($jobInfo.Name) to complete..." -ForegroundColor Gray
        $result = Receive-Job -Job $jobInfo.Job -Wait
        Remove-Job -Job $jobInfo.Job
        
        $results += @{
            Phase = $jobInfo.Name
            Success = $result.Success
            Message = $result.Message
            ExitCode = $result.ExitCode
            OutputFile = $result.OutputFile
            LogFile = $result.LogFile
        }
    }
    
    return $results
}

# Main execution logic
$phasesToRun = @()

if ($Phase -eq "all") {
    $phasesToRun = $testPhases.Keys
} elseif ($testPhases.ContainsKey($Phase)) {
    $phasesToRun = @($Phase)
} else {
    Write-Host "❌ Invalid phase: $Phase" -ForegroundColor Red
    Write-Host "Available phases: all, integration, performance, security, chaos" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n📋 Test Configuration:" -ForegroundColor Cyan
Write-Host "Phases to run: $($phasesToRun -join ', ')" -ForegroundColor Gray
Write-Host "Parallel execution: $Parallel" -ForegroundColor Gray
Write-Host "Output directory: $OutputDir" -ForegroundColor Gray
Write-Host "Verbose mode: $Verbose" -ForegroundColor Gray

# Check if backend is running
Write-Host "`n🔍 Checking backend status..." -ForegroundColor Cyan
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 10
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "✅ Backend is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Backend responded with status: $($healthResponse.StatusCode)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Backend is not running or not accessible" -ForegroundColor Red
    Write-Host "Please start the backend server before running tests" -ForegroundColor Yellow
    exit 1
}

# Run tests
$startTime = Get-Date
$overallSuccess = $true

if ($Parallel -and $phasesToRun.Count -gt 1) {
    $results = Run-TestsParallel -PhasesToRun $phasesToRun
    
    foreach ($result in $results) {
        if ($result.Success) {
            Write-Host "✅ $($result.Phase) completed successfully" -ForegroundColor Green
            
            # Display results if available
            if ($result.OutputFile -and (Test-Path $result.OutputFile)) {
                $testResults = Get-Content $result.OutputFile | ConvertFrom-Json
                Write-Host "   Tests: $($testResults.numTotalTests), Passed: $($testResults.numPassedTests), Failed: $($testResults.numFailedTests)" -ForegroundColor Gray
            }
        } else {
            Write-Host "❌ $($result.Phase) failed: $($result.Message)" -ForegroundColor Red
            $overallSuccess = $false
            
            # Display error log if available
            if ($result.LogFile -and (Test-Path $result.LogFile)) {
                Write-Host "Error log for $($result.Phase):" -ForegroundColor Red
                Get-Content $result.LogFile | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
            }
        }
    }
} else {
    foreach ($phaseName in $phasesToRun) {
        $phaseConfig = $testPhases[$phaseName]
        $success = Run-TestPhase -PhaseName $phaseName -PhaseConfig $phaseConfig
        
        if (!$success) {
            $overallSuccess = $false
        }
    }
}

$endTime = Get-Date
$totalDuration = ($endTime - $startTime).TotalSeconds

# Generate summary report
Write-Host "`n📊 Test Summary Report" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host "Total duration: $([math]::Round($totalDuration, 2)) seconds" -ForegroundColor Gray
Write-Host "Phases run: $($phasesToRun.Count)" -ForegroundColor Gray
Write-Host "Overall result: $(if ($overallSuccess) { '✅ PASSED' } else { '❌ FAILED' })" -ForegroundColor $(if ($overallSuccess) { 'Green' } else { 'Red' })

# Generate detailed report
$reportFile = "$OutputDir/test-summary-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$report = @{
    timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
    duration = $totalDuration
    phases = $phasesToRun
    overallSuccess = $overallSuccess
    results = @()
}

foreach ($phaseName in $phasesToRun) {
    $resultFile = "$OutputDir/$phaseName-results.json"
    if (Test-Path $resultFile) {
        $phaseResults = Get-Content $resultFile | ConvertFrom-Json
        $report.results += @{
            phase = $phaseName
            description = $testPhases[$phaseName].description
            totalTests = $phaseResults.numTotalTests
            passedTests = $phaseResults.numPassedTests
            failedTests = $phaseResults.numFailedTests
            skippedTests = $phaseResults.numPendingTests
            success = ($phaseResults.numFailedTests -eq 0)
        }
    }
}

$report | ConvertTo-Json -Depth 3 | Out-File -FilePath $reportFile -Encoding UTF8
Write-Host "`n📄 Detailed report saved to: $reportFile" -ForegroundColor Gray

# Display final results
if ($overallSuccess) {
    Write-Host "`n🎉 All tests completed successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n💥 Some tests failed. Check the logs above for details." -ForegroundColor Red
    exit 1
}


