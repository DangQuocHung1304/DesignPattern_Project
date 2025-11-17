-- ============================================================
-- TẠO TÀI KHOẢN ADMIN VỚI PASSWORD ĐÃ HASH
-- ============================================================
-- Mật khẩu: Admin@123
-- Hash method: SHA256 (matching AuthController.cs)
-- ============================================================
use QLPhongKham
-- 1. Kiểm tra xem đã có admin chưa
SELECT 
    id,
    CONCAT(first_name, ' ', last_name) AS FullName,
    email,
    role,
    status,
    created_at
FROM users
WHERE role = 'admin';

-- 2. Xóa tài khoản admin cũ nếu có (optional - comment dòng này nếu không muốn xóa)
-- DELETE FROM users WHERE role = 'admin';

-- 3. Tạo tài khoản admin mới với password đã hash
-- Password: Admin@123
-- SHA256 Hash: jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=

IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@healthysystem.com')
BEGIN
    INSERT INTO users (
        public_id,
        first_name,
        last_name,
        email,
        phone,
        gender,
        dob,
        password_hash,
        role,
        status,
        created_at,
        updated_at
    )
    VALUES (
        NEWID(),
        'Admin',
        'System',
        'admin@healthysystem.com',
        '0900000000',
        'N',
        '1990-01-01',
        'jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=', -- SHA256 hash of "Admin@123"
        'admin',
        'active',
        GETDATE(),
        GETDATE()
    );
    
    PRINT 'Tài khoản admin đã được tạo thành công!';
    PRINT 'Email: admin@healthysystem.com';
    PRINT 'Password: Admin@123';
END
ELSE
BEGIN
    -- Nếu admin đã tồn tại, cập nhật password
    UPDATE users
    SET password_hash = 'jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=',
        updated_at = GETDATE()
    WHERE email = 'admin@healthysystem.com';
    
    PRINT 'Password của tài khoản admin đã được cập nhật!';
    PRINT 'Email: admin@healthysystem.com';
    PRINT 'Password: Admin@123';
END

-- 4. Verify tài khoản admin sau khi tạo
SELECT 
    id,
    public_id,
    CONCAT(first_name, ' ', last_name) AS FullName,
    email,
    phone,
    role,
    status,
    created_at,
    'Password: Admin@123' AS LoginInfo
FROM users
WHERE email = 'admin@healthysystem.com';

-- ============================================================
-- THÔNG TIN ĐĂNG NHẬP
-- ============================================================
-- Email: admin@healthysystem.com
-- Password: Admin@123
-- Role: admin
-- ============================================================

-- ============================================================
-- DANH SÁCH MẬT KHẨU MẶC ĐỊNH ĐÃ HASH (SHA256)
-- ============================================================
-- Password: Admin@123
-- Hash: jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=

-- Password: admin123  
-- Hash: 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
-- (Note: Đây là hex format, cần convert sang Base64)

-- ============================================================
-- TEST LOGIN
-- ============================================================
-- 1. Đảm bảo backend đang chạy (dotnet run)
-- 2. Sử dụng Postman hoặc Thunder Client:
--    POST http://localhost:5000/api/auth/login
--    Body (JSON):
--    {
--      "email": "admin@healthysystem.com",
--      "password": "Admin@123"
--    }
--
-- 3. Hoặc đăng nhập trực tiếp trên web:
--    http://localhost:5500/login.html
--    Email: admin@healthysystem.com
--    Password: Admin@123
-- ============================================================

-- ============================================================
-- TẠO THÊM TÀI KHOẢN TEST (Optional)
-- ============================================================

-- Admin khác
INSERT INTO users (public_id, first_name, last_name, email, phone, gender, date_of_birth, password_hash, role, status, created_at, updated_at)
SELECT NEWID(), 'Admin', 'Test', 'admin@test.com', '0900000001', 'Nam', '1990-01-01', 
       'jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=', 'admin', 'active', GETDATE(), GETDATE()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@test.com');

PRINT 'Đã tạo tài khoản admin@test.com (nếu chưa tồn tại) với password: Admin@123';

-- ============================================================
-- XEM TẤT CẢ TÀI KHOẢN ADMIN
-- ============================================================
SELECT 
    id,
    CONCAT(first_name, ' ', last_name) AS FullName,
    email,
    phone,
    role,
    status,
    'Admin@123' AS DefaultPassword,
    created_at
FROM users
WHERE role = 'admin'
ORDER BY created_at DESC;
