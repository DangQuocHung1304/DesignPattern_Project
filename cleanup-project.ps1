# ====================================
# CLEANUP PROJECT - XÓA FILE DƯ THỪA
# ====================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   DỌN DẸP PROJECT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$filesToDelete = @()

# ============================================
# ROOT LEVEL - Documentation dư thừa
# ============================================
Write-Host "📋 ROOT LEVEL FILES TO DELETE:" -ForegroundColor Yellow
$rootFiles = @(
    "DEBUG_401_500.md",
    "FIX_401_500_COMPLETE.md",
    "FIX_EMPTY_ALERT_SUMMARY.md",
    "MEDICAL_HISTORY_COMPLETION.md",
    "MEDICAL_HISTORY_QUICK_SUMMARY.md",
    "QUICKFIX_SUMMARY.md",
    "QUICK_FIX_401_500.md",
    "QUICK_START.md",
    "SUMMARY.md"
)

foreach ($file in $rootFiles) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        Write-Host "   ❌ $file" -ForegroundColor Red
        $filesToDelete += $fullPath
    }
}

# ============================================
# MOBILE APP - Documentation dư thừa
# ============================================
Write-Host "`n📱 MOBILE DOCUMENTATION FILES TO DELETE:" -ForegroundColor Yellow
$mobileDocFiles = @(
    "API_FIXES_SUMMARY.md",
    "API_VERIFICATION_REPORT.md",
    "BUGFIX_DOCTOR_DETAIL.md",
    "COMPLETION_SUMMARY.md",
    "DEBUG_DOCTOR_DETAIL.md",
    "FIXES_APPLIED.md",
    "FIX_API_DUPLICATE.md",
    "FIX_DOCTOR_DETAIL.md",
    "FIX_EMPTY_ALERT.md",
    "FIX_REMOVE_ALL_ALERTS.md",
    "GIT_COMMIT_MESSAGE.md",
    "INSTALLATION_GUIDE.md",
    "MEDICAL_HISTORY_FEATURE.md",
    "MEDICAL_HISTORY_NAVIGATION.md",
    "NAVIGATION_VERIFICATION.md",
    "README_MOBILE_SETUP.md",
    "SOLUTION_DYNAMIC_IP.md"
)

$mobileRoot = Join-Path $PSScriptRoot "Mobile\HealthySystemMobile"
foreach ($file in $mobileDocFiles) {
    $fullPath = Join-Path $mobileRoot $file
    if (Test-Path $fullPath) {
        Write-Host "   ❌ $file" -ForegroundColor Red
        $filesToDelete += $fullPath
    }
}

# ============================================
# MOBILE APP - Backup files
# ============================================
Write-Host "`n💾 BACKUP FILES TO DELETE:" -ForegroundColor Yellow
$backupFiles = @(
    "src\services\api_backup.js",
    "app\(tabs)\index_backup.tsx"
)

foreach ($file in $backupFiles) {
    $fullPath = Join-Path $mobileRoot $file
    if (Test-Path $fullPath) {
        Write-Host "   ❌ $file" -ForegroundColor Red
        $filesToDelete += $fullPath
    }
}

# ============================================
# MOBILE APP - Unused src files (old structure)
# ============================================
Write-Host "`n🗑️ UNUSED SRC FILES TO DELETE:" -ForegroundColor Yellow
$unusedSrcFiles = @(
    "src\contexts\AuthContext.js",
    "src\screens\HomeScreen.js",
    "src\screens\LoginScreen.js",
    "src\navigation\Navigation.js",
    "src\components\CustomButton.js",
    "src\components\CustomInput.js",
    "src\components\NetworkTestScreen.js"
)

foreach ($file in $unusedSrcFiles) {
    $fullPath = Join-Path $mobileRoot $file
    if (Test-Path $fullPath) {
        Write-Host "   ❌ $file" -ForegroundColor Red
        $filesToDelete += $fullPath
    }
}

# ============================================
# SUMMARY
# ============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   TỔNG KẾT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📊 Total files to delete: $($filesToDelete.Count)" -ForegroundColor Yellow

if ($filesToDelete.Count -eq 0) {
    Write-Host "`n✅ Project đã sạch! Không có file dư thừa.`n" -ForegroundColor Green
    exit 0
}

# ============================================
# CONFIRMATION
# ============================================
Write-Host "`n⚠️  WARNING: This will DELETE $($filesToDelete.Count) files!`n" -ForegroundColor Yellow

$confirmation = Read-Host "Bạn có chắc muốn xóa? (yes/no)"

if ($confirmation -ne "yes") {
    Write-Host "`n❌ Cancelled. No files deleted.`n" -ForegroundColor Red
    exit 0
}

# ============================================
# DELETE FILES
# ============================================
Write-Host "`n🗑️  Deleting files...`n" -ForegroundColor Yellow

$deletedCount = 0
$failedCount = 0

foreach ($file in $filesToDelete) {
    try {
        Remove-Item -Path $file -Force
        $fileName = Split-Path $file -Leaf
        Write-Host "   ✅ Deleted: $fileName" -ForegroundColor Green
        $deletedCount++
    } catch {
        $fileName = Split-Path $file -Leaf
        Write-Host "   ❌ Failed: $fileName - $($_.Exception.Message)" -ForegroundColor Red
        $failedCount++
    }
}

# ============================================
# FINAL SUMMARY
# ============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   HOÀN TẤT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "✅ Deleted: $deletedCount files" -ForegroundColor Green
if ($failedCount -gt 0) {
    Write-Host "❌ Failed: $failedCount files" -ForegroundColor Red
}

Write-Host "`n📝 Files kept (important):" -ForegroundColor Yellow
Write-Host "   ✅ README.md (root)" -ForegroundColor Green
Write-Host "   ✅ README.md (mobile)" -ForegroundColor Green
Write-Host "   ✅ README_SPRINT1.md (mobile)" -ForegroundColor Green
Write-Host "   ✅ SPRINT1_COMPLETION_REPORT.md" -ForegroundColor Green
Write-Host "   ✅ TESTING_GUIDE.md" -ForegroundColor Green
Write-Host "   ✅ src/services/api.js (active)" -ForegroundColor Green

Write-Host "`n🎉 Project cleanup completed!`n" -ForegroundColor Cyan

# ============================================
# RECOMMENDATIONS
# ============================================
Write-Host "💡 RECOMMENDATIONS:" -ForegroundColor Yellow
Write-Host "   1. Check git status: git status" -ForegroundColor White
Write-Host "   2. If looks good, commit: git add . && git commit -m 'chore: cleanup unused files'" -ForegroundColor White
Write-Host "   3. Test app still works: npm start" -ForegroundColor White
Write-Host ""
