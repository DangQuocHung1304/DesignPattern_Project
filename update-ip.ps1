# ====================================
# SCRIPT TỰ ĐỘNG CẬP NHẬT IP CHO MOBILE
# ====================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   CẬP NHẬT IP TỰ ĐỘNG" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Lấy IP hiện tại
$currentIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -like "172.*" -or $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*"
}).IPAddress | Select-Object -First 1

if (-not $currentIP) {
    Write-Host "❌ Không tìm thấy IP mạng nội bộ!" -ForegroundColor Red
    Write-Host "   Hãy kiểm tra kết nối WiFi/LAN" -ForegroundColor Yellow
    exit 1
}

Write-Host "📡 IP hiện tại: $currentIP" -ForegroundColor Green

# 2. Đường dẫn file api.js
$apiFile = "Mobile\HealthySystemMobile\src\services\api.js"

if (-not (Test-Path $apiFile)) {
    Write-Host "❌ Không tìm thấy file: $apiFile" -ForegroundColor Red
    exit 1
}

# 3. Đọc nội dung file
$content = Get-Content $apiFile -Raw

# 4. Kiểm tra IP cũ
if ($content -match "http://(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):5000/api") {
    $oldIP = $matches[1]
    
    if ($oldIP -eq $currentIP) {
        Write-Host "✅ IP đã đúng, không cần cập nhật!" -ForegroundColor Green
        Write-Host "   URL: http://${currentIP}:5000/api`n" -ForegroundColor Cyan
    } else {
        Write-Host "🔄 Cập nhật IP từ $oldIP → $currentIP" -ForegroundColor Yellow
        
        # Thay thế IP
        $newContent = $content -replace "http://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:5000/api", "http://${currentIP}:5000/api"
        
        # Ghi lại file
        Set-Content -Path $apiFile -Value $newContent -NoNewline
        
        Write-Host "✅ Đã cập nhật IP trong api.js" -ForegroundColor Green
        Write-Host "   URL mới: http://${currentIP}:5000/api`n" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ Không tìm thấy pattern IP trong file!" -ForegroundColor Red
    Write-Host "   Hãy kiểm tra file api.js thủ công" -ForegroundColor Yellow
    exit 1
}

# 5. Kiểm tra server đang chạy
Write-Host "🔍 Kiểm tra Server API..." -ForegroundColor Yellow
$port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue

if (-not $port5000) {
    Write-Host "⚠️  Server CHƯA chạy!" -ForegroundColor Yellow
    Write-Host "   → Chạy: dotnet run --project Backend\HealthySystem.API\HealthySystem.API.csproj --urls=http://0.0.0.0:5000`n" -ForegroundColor Cyan
    exit 0
}

Write-Host "✅ Server đang chạy trên port 5000`n" -ForegroundColor Green

# 6. Test kết nối API
Write-Host "🧪 Test kết nối API..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://${currentIP}:5000/api/health" -TimeoutSec 5
    Write-Host "✅ API hoạt động: $($health.status)" -ForegroundColor Green
    
    # Test Specialties
    $specialties = Invoke-RestMethod -Uri "http://${currentIP}:5000/api/specialties" -TimeoutSec 5
    Write-Host "✅ Specialties API: $($specialties.Count) chuyên khoa" -ForegroundColor Green
    
    # Test Doctors
    $doctors = Invoke-RestMethod -Uri "http://${currentIP}:5000/api/doctors" -TimeoutSec 5
    Write-Host "✅ Doctors API: $($doctors.Count) bác sĩ" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Không kết nối được API!" -ForegroundColor Red
    Write-Host "   Lỗi: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "`n   NGUYÊN NHÂN CÓ THỂ:" -ForegroundColor Yellow
    Write-Host "   1. Server không listen trên 0.0.0.0" -ForegroundColor Gray
    Write-Host "   2. Firewall chặn port 5000" -ForegroundColor Gray
    Write-Host "   3. Server chưa khởi động hoàn toàn" -ForegroundColor Gray
    Write-Host "`n   CÁCH SỬA:" -ForegroundColor Yellow
    Write-Host "   - Restart server với: --urls=http://0.0.0.0:5000" -ForegroundColor Cyan
    Write-Host "   - Tắt Firewall hoặc mở port 5000" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   HOÀN TẤT!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 GIỜ BẠN CÓ THỂ:" -ForegroundColor Green
Write-Host "   1. Reload app trên Expo Go (nhấn 'r')" -ForegroundColor White
Write-Host "   2. App sẽ kết nối: http://${currentIP}:5000/api" -ForegroundColor White
Write-Host ""
Write-Host "💡 MẸO:" -ForegroundColor Yellow
Write-Host "   - Chạy script này MỖI KHI đổi WiFi" -ForegroundColor White
Write-Host "   - Hoặc dùng Ngrok để không cần đổi IP" -ForegroundColor White
Write-Host "   - Xem: SOLUTION_DYNAMIC_IP.md" -ForegroundColor Cyan
Write-Host ""
