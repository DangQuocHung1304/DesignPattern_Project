-- =============================================
-- Sprint 11: Thêm cột profile_image_url cho Staff Profiles
-- Cho phép thêm ảnh đại diện cho bác sĩ và nhân viên
-- =============================================

USE [HealthySystem];
GO

-- Kiểm tra nếu cột profile_image_url chưa tồn tại thì thêm vào
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[staff_profiles]') 
    AND name = 'profile_image_url'
)
BEGIN
    ALTER TABLE [dbo].[staff_profiles]
    ADD [profile_image_url] NVARCHAR(500) NULL;
    
    PRINT 'Đã thêm cột profile_image_url vào bảng staff_profiles';
END
ELSE
BEGIN
    PRINT 'Cột profile_image_url đã tồn tại';
END
GO

-- =============================================
-- Thêm sample image URLs cho test data
-- =============================================

-- Cập nhật ảnh cho các bác sĩ hiện có (nếu có)
-- Sử dụng ảnh demo từ UI Avatars hoặc placeholder images

-- Bác sĩ nam (Male doctors)
UPDATE sp
SET sp.profile_image_url = 'https://ui-avatars.com/api/?name=' + 
    REPLACE(CONCAT(u.first_name, '+', u.last_name), ' ', '+') + 
    '&background=0D8ABC&color=fff&size=200'
FROM staff_profiles sp
INNER JOIN users u ON sp.user_id = u.id
WHERE u.role = 'doctor' 
AND u.gender = 'M'
AND sp.profile_image_url IS NULL;

-- Bác sĩ nữ (Female doctors)
UPDATE sp
SET sp.profile_image_url = 'https://ui-avatars.com/api/?name=' + 
    REPLACE(CONCAT(u.first_name, '+', u.last_name), ' ', '+') + 
    '&background=FF69B4&color=fff&size=200'
FROM staff_profiles sp
INNER JOIN users u ON sp.user_id = u.id
WHERE u.role = 'doctor' 
AND u.gender = 'F'
AND sp.profile_image_url IS NULL;

-- Nhân viên tiếp tân
UPDATE sp
SET sp.profile_image_url = 'https://ui-avatars.com/api/?name=' + 
    REPLACE(CONCAT(u.first_name, '+', u.last_name), ' ', '+') + 
    '&background=28a745&color=fff&size=200'
FROM staff_profiles sp
INNER JOIN users u ON sp.user_id = u.id
WHERE u.role = 'reception'
AND sp.profile_image_url IS NULL;

PRINT 'Đã cập nhật sample image URLs cho staff profiles';
GO

-- =============================================
-- Kiểm tra kết quả
-- =============================================

SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.role,
    u.gender,
    sp.staff_code,
    sp.department,
    sp.position,
    sp.profile_image_url
FROM users u
INNER JOIN staff_profiles sp ON u.id = sp.user_id
WHERE u.role IN ('doctor', 'reception')
ORDER BY u.role, u.id;

PRINT 'Migration hoàn tất!';
GO

-- =============================================
-- NOTES:
-- =============================================
-- 1. Script này an toàn để chạy nhiều lần (idempotent)
-- 2. Chỉ thêm cột nếu chưa tồn tại
-- 3. Sử dụng UI Avatars API để tạo ảnh đại diện tạm thời
-- 4. Trong production, nên upload ảnh thật và lưu vào /wwwroot/uploads/doctors/
-- 5. Có thể thay thế URLs bằng ảnh thật sau khi upload
-- =============================================
