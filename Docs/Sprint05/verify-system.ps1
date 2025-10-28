# Sprint 5 - Complete System Verification Script
# Tests Database, API, and verifies all components

Write-Host "`n" -NoNewline
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     SPRINT 5 - TREATMENT HISTORY SYSTEM VERIFICATION     ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()
$passed = 0
$total = 0

# Helper function
function Test-Component {
    param($Name, $ScriptBlock)
    $total++
    Write-Host "[$total] Testing: $Name..." -ForegroundColor Yellow -NoNewline
    try {
        $result = & $ScriptBlock
        if ($result) {
            Write-Host " ✅ PASS" -ForegroundColor Green
            $script:passed++
            return $true
        } else {
            Write-Host " ⚠️  WARN" -ForegroundColor Yellow
            $script:warnings += $Name
            return $false
        }
    } catch {
        Write-Host " ❌ FAIL" -ForegroundColor Red
        $script:errors += "$Name : $($_.Exception.Message)"
        return $false
    }
}

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "  DATABASE VERIFICATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray

# Test 1: Treatments table exists
Test-Component "Treatments table exists" {
    $result = sqlcmd -S "MSI\YLC" -d "QLPhongKham" -Q "SELECT COUNT(*) FROM treatments" -h -1
    [int]$count = $result.Trim()
    return $count -ge 0
}

# Test 2: Treatment items table exists
Test-Component "Treatment_items table exists" {
    $result = sqlcmd -S "MSI\YLC" -d "QLPhongKham" -Q "SELECT COUNT(*) FROM treatment_items" -h -1
    [int]$count = $result.Trim()
    return $count -ge 0
}

# Test 3: Test user exists
Test-Component "Test user (hoangdat@gmail.com) exists" {
    $result = sqlcmd -S "MSI\YLC" -d "QLPhongKham" -Q "SELECT COUNT(*) FROM users WHERE email = 'hoangdat@gmail.com'" -h -1
    [int]$count = $result.Trim()
    return $count -eq 1
}

# Test 4: Treatments for test user
Test-Component "Test user has 4 treatments" {
    $result = sqlcmd -S "MSI\YLC" -d "QLPhongKham" -Q "SELECT COUNT(*) FROM treatments WHERE patient_id = 43" -h -1
    [int]$count = $result.Trim()
    return $count -eq 4
}

# Test 5: Active treatments
Test-Component "Test user has 2 active treatments" {
    $result = sqlcmd -S "MSI\YLC" -d "QLPhongKham" -Q "SELECT COUNT(*) FROM treatments WHERE patient_id = 43 AND status = 'active'" -h -1
    [int]$count = $result.Trim()
    return $count -eq 2
}

# Test 6: Completed treatments
Test-Component "Test user has 2 completed treatments" {
    $result = sqlcmd -S "MSI\YLC" -d "QLPhongKham" -Q "SELECT COUNT(*) FROM treatments WHERE patient_id = 43 AND status = 'completed'" -h -1
    [int]$count = $result.Trim()
    return $count -eq 2
}

# Test 7: Treatment items count
Test-Component "Total 17 treatment items exist" {
    $result = sqlcmd -S "MSI\YLC" -d "QLPhongKham" -Q "SELECT COUNT(*) FROM treatment_items ti INNER JOIN treatments t ON ti.treatment_id = t.id WHERE t.patient_id = 43" -h -1
    [int]$count = $result.Trim()
    return $count -eq 17
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "  BACKEND FILES VERIFICATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray

# Test 8: Treatment model exists
Test-Component "Treatment.cs model file exists" {
    Test-Path "D:\2.CNPMNangCao\LyThuyet\Project\Backend\HealthySystem.API\Models\Treatment.cs"
}

# Test 9: TreatmentsController exists
Test-Component "TreatmentsController.cs exists" {
    Test-Path "D:\2.CNPMNangCao\LyThuyet\Project\Backend\HealthySystem.API\Controllers\TreatmentsController.cs"
}

# Test 10: DbContext updated
Test-Component "DbContext contains Treatment DbSet" {
    $content = Get-Content "D:\2.CNPMNangCao\LyThuyet\Project\Backend\HealthySystem.API\Data\HealthySystemDbContext.cs" -Raw
    $content -match "DbSet<Treatment>" -and $content -match "DbSet<TreatmentItem>"
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "  FRONTEND FILES VERIFICATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray

# Test 11: Treatment history page exists
Test-Component "treatment-history.html exists" {
    Test-Path "D:\2.CNPMNangCao\LyThuyet\Project\Web\HealthySystem-Frontend\treatment-history.html"
}

# Test 12: Test page exists
Test-Component "test-api.html exists" {
    Test-Path "D:\2.CNPMNangCao\LyThuyet\Project\Web\HealthySystem-Frontend\test-api.html"
}

# Test 13: Auto-login page exists
Test-Component "auto-login-treatment.html exists" {
    Test-Path "D:\2.CNPMNangCao\LyThuyet\Project\Web\HealthySystem-Frontend\auto-login-treatment.html"
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "  API ENDPOINTS VERIFICATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray

# Test 14: API is running
Test-Component "API is accessible (http://localhost:5296)" {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5296/api/health" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
        return $true
    } catch {
        # Try alternative health check
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5296" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
            return $true
        } catch {
            return $false
        }
    }
}

# Test 15: Login endpoint
Test-Component "Login API endpoint works" {
    try {
        $body = @{
            email = "hoangdat@gmail.com"
            password = "123456789"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "http://localhost:5296/api/auth/login" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 5
        $script:testToken = $response.token
        $script:testUserId = $response.user.id
        return ($null -ne $response.token)
    } catch {
        return $false
    }
}

# Test 16: Current treatments endpoint
Test-Component "Current treatments endpoint works" {
    if ($script:testToken) {
        try {
            $headers = @{Authorization = "Bearer $($script:testToken)"}
            $response = Invoke-RestMethod -Uri "http://localhost:5296/api/treatments/current/$($script:testUserId)" -Method GET -Headers $headers -TimeoutSec 5
            return ($response.success -and $response.data.Count -eq 2)
        } catch {
            return $false
        }
    }
    return $false
}

# Test 17: Treatment history endpoint
Test-Component "Treatment history endpoint works" {
    if ($script:testToken) {
        try {
            $headers = @{Authorization = "Bearer $($script:testToken)"}
            $response = Invoke-RestMethod -Uri "http://localhost:5296/api/treatments/history/$($script:testUserId)" -Method GET -Headers $headers -TimeoutSec 5
            return ($response.success -and $response.data.Count -eq 2)
        } catch {
            return $false
        }
    }
    return $false
}

# Test 18: Treatment details endpoint
Test-Component "Treatment details endpoint works" {
    if ($script:testToken) {
        try {
            $headers = @{Authorization = "Bearer $($script:testToken)"}
            $response = Invoke-RestMethod -Uri "http://localhost:5296/api/treatments/1" -Method GET -Headers $headers -TimeoutSec 5
            return ($response.success -and $response.data.items.Count -eq 4)
        } catch {
            return $false
        }
    }
    return $false
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "  DOCUMENTATION VERIFICATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray

# Test 19: Sprint summary exists
Test-Component "Sprint summary document exists" {
    Test-Path "D:\2.CNPMNangCao\LyThuyet\Project\Docs\Sprint05\SPRINT5_SUMMARY.md"
}

# Test 20: Test report exists
Test-Component "Test report document exists" {
    Test-Path "D:\2.CNPMNangCao\LyThuyet\Project\Docs\Sprint05\TEST_REPORT.md"
}

# Test 21: SQL script exists
Test-Component "Database creation script exists" {
    Test-Path "D:\2.CNPMNangCao\LyThuyet\Project\Docs\Database\Sprint5_Create_Treatments.sql"
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "  FINAL RESULTS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""

$passRate = [math]::Round(($passed / $total) * 100, 1)

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Warnings: $($warnings.Count)" -ForegroundColor Yellow
Write-Host "Failed: $($errors.Count)" -ForegroundColor Red
Write-Host "Pass Rate: $passRate%" -ForegroundColor $(if($passRate -ge 90){"Green"}elseif($passRate -ge 70){"Yellow"}else{"Red"})
Write-Host ""

if ($warnings.Count -gt 0) {
    Write-Host "⚠️  WARNINGS:" -ForegroundColor Yellow
    foreach ($w in $warnings) {
        Write-Host "   - $w" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($errors.Count -gt 0) {
    Write-Host "❌ ERRORS:" -ForegroundColor Red
    foreach ($e in $errors) {
        Write-Host "   - $e" -ForegroundColor Red
    }
    Write-Host ""
}

if ($passRate -ge 90) {
    Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║              ✅ SYSTEM VERIFICATION PASSED               ║" -ForegroundColor Green
    Write-Host "║         Sprint 5 US-01 Ready for Production!            ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
} elseif ($passRate -ge 70) {
    Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║           ⚠️  SYSTEM VERIFICATION PARTIAL PASS           ║" -ForegroundColor Yellow
    Write-Host "║            Please review warnings and errors             ║" -ForegroundColor Yellow
    Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
} else {
    Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║             ❌ SYSTEM VERIFICATION FAILED                ║" -ForegroundColor Red
    Write-Host "║              Please fix errors before deploy             ║" -ForegroundColor Red
    Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Red
}

Write-Host ""
Write-Host "Report generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""
