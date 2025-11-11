# Script to hash admin password using BCrypt
# Run this to get hashed password for admin account

Add-Type -Path "d:\2.CNPMNangCao\LyThuyet\Project\Backend\HealthySystem.WebAPI\bin\Debug\net9.0\BCrypt.Net-Next.dll"

$password = "admin123"  # Mật khẩu admin mới
$hashedPassword = [BCrypt.Net.BCrypt]::HashPassword($password)

Write-Host "=================================" -ForegroundColor Green
Write-Host "ADMIN PASSWORD HASH" -ForegroundColor Green  
Write-Host "=================================" -ForegroundColor Green
Write-Host ""
Write-Host "Original Password: $password" -ForegroundColor Yellow
Write-Host ""
Write-Host "Hashed Password:" -ForegroundColor Cyan
Write-Host $hashedPassword -ForegroundColor White
Write-Host ""
Write-Host "SQL UPDATE Query:" -ForegroundColor Magenta
Write-Host ""
Write-Host "UPDATE users" -ForegroundColor White
Write-Host "SET password_hash = '$hashedPassword'" -ForegroundColor White
Write-Host "WHERE role = 'admin' AND email LIKE '%admin%';" -ForegroundColor White
Write-Host ""
Write-Host "=================================" -ForegroundColor Green
