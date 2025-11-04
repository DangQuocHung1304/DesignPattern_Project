-- Script kiểm tra trước khi chạy Fix_Unicode_Treatments.sql
-- Chạy script này TRƯỚC để đảm bảo mọi thứ OK

USE QLPhongKham;
GO

PRINT N'════════════════════════════════════════════════════════════';
PRINT N'  KIỂM TRA HỆ THỐNG TRƯỚC KHI FIX UNICODE';
PRINT N'════════════════════════════════════════════════════════════';
PRINT N'';

-- 1. Kiểm tra user hoangdat@gmail.com
PRINT N'1. Kiểm tra user hoangdat@gmail.com:';
IF EXISTS (SELECT 1 FROM users WHERE email = N'hoangdat@gmail.com')
BEGIN
    DECLARE @UserId INT = (SELECT id FROM users WHERE email = N'hoangdat@gmail.com');
    DECLARE @UserName NVARCHAR(200) = (SELECT CONCAT(first_name, N' ', last_name) FROM users WHERE email = N'hoangdat@gmail.com');
    PRINT N'   ✅ Tìm thấy user ID: ' + CAST(@UserId AS NVARCHAR(10)) + N' - ' + @UserName;
END
ELSE
BEGIN
    PRINT N'   ❌ KHÔNG tìm thấy user với email hoangdat@gmail.com';
    PRINT N'   → Cần tạo user này trước hoặc đổi email trong script';
END
PRINT N'';

-- 2. Kiểm tra bác sĩ
PRINT N'2. Kiểm tra bác sĩ trong hệ thống:';
DECLARE @DoctorCount INT = (SELECT COUNT(*) FROM users WHERE role = N'doctor');
IF @DoctorCount > 0
BEGIN
    PRINT N'   ✅ Tìm thấy ' + CAST(@DoctorCount AS NVARCHAR(10)) + N' bác sĩ';
    
    -- Hiển thị danh sách bác sĩ
    SELECT TOP 5
        id,
        CONCAT(first_name, N' ', last_name) as doctor_name,
        email
    FROM users 
    WHERE role = N'doctor'
    ORDER BY id;
END
ELSE
BEGIN
    PRINT N'   ❌ KHÔNG có bác sĩ nào trong hệ thống';
    PRINT N'   → Cần thêm ít nhất 1 user với role = doctor';
END
PRINT N'';

-- 3. Kiểm tra bảng treatments và treatment_items
PRINT N'3. Kiểm tra dữ liệu hiện tại:';
DECLARE @TreatmentCount INT = (SELECT COUNT(*) FROM treatments);
DECLARE @ItemCount INT = (SELECT COUNT(*) FROM treatment_items);
PRINT N'   - Treatments hiện có: ' + CAST(@TreatmentCount AS NVARCHAR(10));
PRINT N'   - Treatment items hiện có: ' + CAST(@ItemCount AS NVARCHAR(10));
PRINT N'';

-- 4. Kiểm tra foreign key constraints
PRINT N'4. Kiểm tra constraints:';
IF EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE TABLE_NAME = 'treatment_items' 
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
)
BEGIN
    PRINT N'   ✅ Foreign key constraint tồn tại';
END
ELSE
BEGIN
    PRINT N'   ⚠️ Không tìm thấy foreign key constraint';
END
PRINT N'';

-- 5. Kết luận
PRINT N'════════════════════════════════════════════════════════════';
IF EXISTS (SELECT 1 FROM users WHERE email = N'hoangdat@gmail.com')
   AND EXISTS (SELECT 1 FROM users WHERE role = N'doctor')
BEGIN
    PRINT N'✅ HỆ THỐNG SẴN SÀNG!';
    PRINT N'   Có thể chạy script Fix_Unicode_Treatments.sql';
END
ELSE
BEGIN
    PRINT N'❌ HỆ THỐNG CHƯA SẴN SÀNG!';
    PRINT N'   Cần khắc phục các vấn đề ở trên trước';
END
PRINT N'════════════════════════════════════════════════════════════';
GO
