# ====================================
# RESTART BACKEND SCRIPT
# ====================================
# Để fix lỗi Doctor Detail không load

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   RESTART BACKEND - FIX APPLIED" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "🔧 FIX ĐÃ ÁP DỤNG:" -ForegroundColor Green
Write-Host "   - PublicId format consistency" -ForegroundColor White
Write-Host "   - FullName format consistency" -ForegroundColor White
Write-Host "   - Null-safe StaffProfile access`n" -ForegroundColor White

Write-Host "📍 Navigating to Backend directory..." -ForegroundColor Yellow
Set-Location -Path "Backend\HealthySystem.API"

if (-not (Test-Path "HealthySystem.API.csproj")) {
    Write-Host "`n❌ Error: Not in Backend directory!" -ForegroundColor Red
    Write-Host "Current location: $PWD" -ForegroundColor Yellow
    Write-Host "`nPlease run this from project root directory.`n" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found Backend project`n" -ForegroundColor Green

Write-Host "🚀 Starting Backend..." -ForegroundColor Yellow
Write-Host "   (Press Ctrl+C to stop)`n" -ForegroundColor Gray

# Run backend
dotnet run

# This will keep running until Ctrl+C
