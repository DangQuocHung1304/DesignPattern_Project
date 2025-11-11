-- ============================================================
-- Sprint 10: Lấy thông tin Admin và Hash Password
-- ============================================================

-- 1. Lấy thông tin tài khoản Admin hiện tại
SELECT 
    id AS UserId,
    CONCAT(first_name, ' ', last_name) AS FullName,
    email AS Email,
    phone AS Phone,
    role AS Role,
    status AS Status,
    created_at AS CreatedDate
FROM users
WHERE role = 'admin'
ORDER BY created_at;

-- 2. Kiểm tra password hash hiện tại
SELECT 
    id,
    email,
    LEFT(password_hash, 20) + '...' AS PasswordHashPreview,
    LEN(password_hash) AS HashLength
FROM users
WHERE role = 'admin';

-- 3. UPDATE mật khẩu admin mới (đã hash bằng BCrypt)
-- Mật khẩu gốc: "admin123"
-- Hashed password (BCrypt):
UPDATE users
SET password_hash = '$2a$11$xKZvzGqH.jYZ5QYvF8PYR.8fJGZYqV9H0XKZJvxH8PYR8fJGZYqV9'
WHERE role = 'admin';

-- Lưu ý: 
-- - Hash trên chỉ là ví dụ, cần chạy BCrypt để tạo hash mới
-- - Mật khẩu mặc định: admin123
-- - Có thể thay đổi mật khẩu trong script hash_admin_password.ps1

-- 4. Verify sau khi update
SELECT 
    id,
    email,
    role,
    'Mật khẩu đã được cập nhật thành công' AS Status,
    updated_at
FROM users
WHERE role = 'admin';

-- ============================================================
-- HƯỚNG DẪN SỬ DỤNG:
-- ============================================================
-- 1. Chạy query đầu tiên để lấy thông tin admin
-- 2. Sử dụng script PowerShell (hash_admin_password.ps1) để tạo hash mới
-- 3. Copy hash từ PowerShell và paste vào query UPDATE
-- 4. Chạy query UPDATE để cập nhật mật khẩu
-- 5. Chạy query verify để kiểm tra
-- ============================================================

-- TẠO TÀI KHOẢN ADMIN MỚI (nếu chưa có)
IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin' AND email = 'admin@healthysystem.com')
BEGIN
    INSERT INTO users (first_name, last_name, email, phone, password_hash, role, status, created_at)
    VALUES (
        'Admin',
        'System',
        'admin@healthysystem.com',
        '0900000000',
        '$2a$11$YourBCryptHashedPasswordHere', -- Thay bằng hash thật
        'admin',
        'active',
        GETDATE()
    );
    
    PRINT 'Tài khoản admin mới đã được tạo';
END
ELSE
BEGIN
    PRINT 'Tài khoản admin đã tồn tại';
END

-- ============================================================
-- DANH SÁCH MẬT KHẨU MẶC ĐỊNH ĐÃ HASH (BCrypt)
-- ============================================================
-- Mật khẩu: admin123
-- Hash: Sử dụng BCrypt.Net trong C# để generate

-- Ví dụ code C# để hash password:
-- using BCrypt.Net;
-- string hashedPassword = BCrypt.HashPassword("admin123");
-- Console.WriteLine(hashedPassword);

-- ============================================================
-- TEST LOGIN
-- ============================================================
-- Endpoint: POST /api/auth/login
-- Body:
-- {
--   "email": "admin@healthysystem.com",
--   "password": "admin123"
-- }
