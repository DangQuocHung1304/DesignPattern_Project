# ====================================================================
# Generate Password Hash - PowerShell Version
# ====================================================================
# Run: .\GeneratePasswordHash.ps1
# ====================================================================

Write-Host "=== Password Hash Generator (SHA256) ===" -ForegroundColor Cyan
Write-Host "This matches the hashing in AuthController.cs`n" -ForegroundColor Yellow

function Get-SHA256Hash {
    param([string]$password)
    
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($password)
    $hash = $sha256.ComputeHash($bytes)
    $hashString = [Convert]::ToBase64String($hash)
    $sha256.Dispose()
    
    return $hashString
}

# Test common passwords
$passwords = @(
    "Admin@123",
    "admin123",
    "Admin123",
    "admin@123"
)

Write-Host "--- Common Passwords ---" -ForegroundColor Green
foreach ($pwd in $passwords) {
    $hash = Get-SHA256Hash -password $pwd
    Write-Host "Password: $pwd" -ForegroundColor White
    Write-Host "Hash:     $hash" -ForegroundColor Yellow
    Write-Host ""
}

# Interactive mode
Write-Host "`n--- Custom Password ---" -ForegroundColor Green
$customPassword = Read-Host "Enter password to hash"

if ($customPassword) {
    $customHash = Get-SHA256Hash -password $customPassword
    Write-Host "`nPassword: $customPassword" -ForegroundColor White
    Write-Host "Hash:     $customHash" -ForegroundColor Yellow
    Write-Host "`nCopy and run this SQL:" -ForegroundColor Cyan
    Write-Host "UPDATE users SET password_hash = '$customHash' WHERE email = 'admin@healthysystem.com';" -ForegroundColor Green
}

Write-Host "`n=== QUICK FIX ===" -ForegroundColor Cyan
Write-Host "If you want to use password: Admin@123" -ForegroundColor Yellow
Write-Host "Run this SQL query:" -ForegroundColor Yellow
Write-Host @"
UPDATE users 
SET password_hash = 'jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg='
WHERE email = 'admin@healthysystem.com';
"@ -ForegroundColor Green

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
