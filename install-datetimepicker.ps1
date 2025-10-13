# ====================================
# SCRIPT CÀI ĐẶT DATETIMEPICKER
# ====================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   CÀI ĐẶT PACKAGE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "Mobile\HealthySystemMobile\package.json")) {
    Write-Host "❌ Vui lòng chạy script từ thư mục gốc project!" -ForegroundColor Red
    Write-Host "   Thư mục hiện tại: $PWD" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Đang cài đặt @react-native-community/datetimepicker..." -ForegroundColor Yellow

# Navigate to mobile directory
cd Mobile\HealthySystemMobile

# Install package
npx expo install @react-native-community/datetimepicker

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Cài đặt thành công!" -ForegroundColor Green
    Write-Host "`n📱 HƯỚNG DẪN TIẾP THEO:" -ForegroundColor Yellow
    Write-Host "   1. Khởi động lại Expo:" -ForegroundColor White
    Write-Host "      cd Mobile\HealthySystemMobile" -ForegroundColor Cyan
    Write-Host "      npx expo start --tunnel" -ForegroundColor Cyan
    Write-Host "`n   2. Test trang đặt lịch khám:" -ForegroundColor White
    Write-Host "      - Mở Expo Go trên điện thoại" -ForegroundColor Gray
    Write-Host "      - Home → Doctors → Doctor Detail → Đặt lịch khám" -ForegroundColor Gray
    Write-Host "      - Chọn ngày, giờ, ghi chú" -ForegroundColor Gray
    Write-Host "      - Submit appointment" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "`n❌ Cài đặt thất bại!" -ForegroundColor Red
    Write-Host "   Vui lòng chạy lại lệnh thủ công:" -ForegroundColor Yellow
    Write-Host "   cd Mobile\HealthySystemMobile" -ForegroundColor Cyan
    Write-Host "   npx expo install @react-native-community/datetimepicker" -ForegroundColor Cyan
    exit 1
}
