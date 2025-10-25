# ====================================
# SCRIPT KHỞI ĐỘNG ĐẦY ĐỦ: API + MOBILE
# ====================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   KHỞI ĐỘNG HỆ THỐNG" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Lấy IP hiện tại
$currentIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -like "172.*" -or $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*"
}).IPAddress | Select-Object -First 1

Write-Host "📡 IP hiện tại: $currentIP" -ForegroundColor Green

# 2. Cập nhật IP trong api.js
Write-Host "🔄 Cập nhật IP trong api.js..." -ForegroundColor Yellow
$apiFile = "Mobile\HealthySystemMobile\src\services\api.js"
$content = Get-Content $apiFile -Raw
$newContent = $content -replace "http://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:5000/api", "http://${currentIP}:5000/api"
Set-Content -Path $apiFile -Value $newContent -NoNewline
Write-Host "✅ Đã cập nhật IP: http://${currentIP}:5000/api`n" -ForegroundColor Green

# 3. Dừng server cũ (nếu có)
Write-Host "🛑 Dừng server cũ (nếu có)..." -ForegroundColor Yellow
Stop-Process -Name "dotnet" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✅ Đã dừng`n" -ForegroundColor Green

# 4. Khởi động API Server
Write-Host "🚀 Khởi động API Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\Backend\HealthySystem.API'; dotnet run --launch-profile unified"
Write-Host "⏳ Đợi server khởi động (10 giây)..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# 5. Kiểm tra server
$serverOK = $false
try {
    $health = Invoke-RestMethod -Uri "http://${currentIP}:5000/api/health" -TimeoutSec 5
    Write-Host "✅ API Server: $($health.status)`n" -ForegroundColor Green
    $serverOK = $true
} catch {
    Write-Host "❌ API Server CHƯA SẴN SÀNG!" -ForegroundColor Red
    Write-Host "   Hãy đợi thêm vài giây và kiểm tra terminal dotnet`n" -ForegroundColor Yellow
}

# 6. Khởi động Expo (nếu server OK)
if ($serverOK) {
    Write-Host "🚀 Khởi động Expo Dev Server..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\Mobile\HealthySystemMobile'; npx expo start --tunnel"
    Write-Host "✅ Đã khởi động Expo`n" -ForegroundColor Green
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   HOÀN TẤT!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 HƯỚNG DẪN:" -ForegroundColor Yellow
Write-Host "   1. Mở Expo Go trên điện thoại" -ForegroundColor White
Write-Host "   2. Quét QR code từ terminal Expo" -ForegroundColor White
Write-Host "   3. App sẽ kết nối: http://${currentIP}:5000/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 LƯU Ý:" -ForegroundColor Yellow
Write-Host "   - Mỗi lần đổi WiFi, chạy lại script này" -ForegroundColor White
Write-Host "   - Hoặc dùng Ngrok (xem SOLUTION_DYNAMIC_IP.md)" -ForegroundColor White
Write-Host ""
