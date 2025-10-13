# ====================================
# SCRIPT TEST MOBILE APP CONNECTION
# ====================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   KIỂM TRA KẾT NỐI MOBILE APP" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Lấy IP hiện tại
$currentIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -like "172.*" -or $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*"
}).IPAddress | Select-Object -First 1

Write-Host "1️⃣  IP Máy tính hiện tại" -ForegroundColor Yellow
Write-Host "   IP: $currentIP`n" -ForegroundColor Green

# 2. Kiểm tra server đang chạy
Write-Host "2️⃣  Kiểm tra Server API" -ForegroundColor Yellow
$port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($port5000) {
    Write-Host "   ✓ Server đang chạy trên port 5000" -ForegroundColor Green
    Write-Host "   ✓ Listening on: $($port5000.LocalAddress -join ', ')`n" -ForegroundColor Green
} else {
    Write-Host "   ✗ Server KHÔNG chạy!" -ForegroundColor Red
    Write-Host "   → Chạy: dotnet run --project Backend\HealthySystem.API\HealthySystem.API.csproj --urls=http://0.0.0.0:5000`n" -ForegroundColor Yellow
    exit
}

# 3. Test API endpoints
Write-Host "3️⃣  Test API Endpoints" -ForegroundColor Yellow

# Test Health
try {
    $health = Invoke-RestMethod -Uri "http://${currentIP}:5000/api/health" -TimeoutSec 5
    Write-Host "   ✓ Health API: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Health API failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n   NGUYÊN NHÂN: Server không listen trên IP mạng!" -ForegroundColor Yellow
    Write-Host "   CÁCH SỬA: Chạy server với --urls=http://0.0.0.0:5000" -ForegroundColor Yellow
    exit
}

# Test Specialties
try {
    $specialties = Invoke-RestMethod -Uri "http://${currentIP}:5000/api/specialties" -TimeoutSec 5
    Write-Host "   ✓ Specialties API: $($specialties.Count) chuyên khoa" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Specialties API failed" -ForegroundColor Red
}

# Test Doctors
try {
    $doctors = Invoke-RestMethod -Uri "http://${currentIP}:5000/api/doctors" -TimeoutSec 5
    Write-Host "   ✓ Doctors API: $($doctors.Count) bác sĩ" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Doctors API failed" -ForegroundColor Red
}

Write-Host ""

# 4. Kiểm tra config mobile app
Write-Host "4️⃣  Kiểm tra Config Mobile App" -ForegroundColor Yellow
$apiConfigPath = "Mobile\HealthySystemMobile\src\services\api.js"
if (Test-Path $apiConfigPath) {
    $apiConfig = Get-Content $apiConfigPath | Select-String "http://.*:5000/api"
    if ($apiConfig) {
        $configIP = ($apiConfig -split "http://")[1] -split ":5000" | Select-Object -First 1
        
        if ($configIP -eq $currentIP) {
            Write-Host "   ✓ Config IP đúng: $configIP" -ForegroundColor Green
        } else {
            Write-Host "   ✗ Config IP SAI!" -ForegroundColor Red
            Write-Host "   → Config hiện tại: $configIP" -ForegroundColor Yellow
            Write-Host "   → IP đúng phải là: $currentIP" -ForegroundColor Yellow
            Write-Host "`n   CẦN SỬA FILE: $apiConfigPath" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ✗ Không tìm thấy file config!" -ForegroundColor Red
}

Write-Host ""

# 5. Kiểm tra Expo
Write-Host "5️⃣  Kiểm tra Expo Server" -ForegroundColor Yellow
$expoPort = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
if ($expoPort) {
    Write-Host "   ✓ Expo đang chạy trên port 8081" -ForegroundColor Green
} else {
    Write-Host "   ⚪ Expo chưa chạy" -ForegroundColor Gray
    Write-Host "   → Chạy: cd Mobile\HealthySystemMobile && npx expo start --tunnel" -ForegroundColor Yellow
}

Write-Host ""

# Tóm tắt
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   TÓM TẮT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 ĐỂ CHẠY MOBILE APP:" -ForegroundColor Yellow
Write-Host "   1. Server API: ✓ Đã chạy" -ForegroundColor Green
Write-Host "   2. IP đúng: $currentIP" -ForegroundColor Green
Write-Host "   3. API URL: http://${currentIP}:5000/api" -ForegroundColor Green
Write-Host ""
Write-Host "▶️  LỆNH KHỞI ĐỘNG EXPO:" -ForegroundColor Yellow
Write-Host "   cd Mobile\HealthySystemMobile" -ForegroundColor White
Write-Host "   npx expo start --tunnel" -ForegroundColor White
Write-Host ""
Write-Host "📲 SAU ĐÓ:" -ForegroundColor Yellow
Write-Host "   - Mở Expo Go trên điện thoại" -ForegroundColor White
Write-Host "   - Quét QR code" -ForegroundColor White
Write-Host "   - App sẽ tự kết nối API" -ForegroundColor White
Write-Host ""
