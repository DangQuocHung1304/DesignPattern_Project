-- ============================================
-- SCRIPT FIX UNICODE CHO BẢNG TREATMENTS
-- Phiên bản: 2.2 (Đã fix tên cột đúng với database)
-- ============================================

USE QLPhongKham;
GO

PRINT '========================================';
PRINT 'BẮT ĐẦU FIX UNICODE CHO TREATMENTS';
PRINT '========================================';
PRINT '';

-- ============================================
-- BƯỚC 1: KHAI BÁO BIẾN TRƯỚC
-- ============================================
DECLARE @PatientId BIGINT;
DECLARE @DoctorId1 BIGINT;
DECLARE @DoctorId2 BIGINT;

-- ============================================
-- BƯỚC 2: LẤY THÔNG TIN USER VÀ DOCTOR
-- ============================================
PRINT N'1️⃣ Đang kiểm tra user và doctor...';

-- Lấy PatientId
SELECT @PatientId = id FROM users WHERE email = N'hoangdat@gmail.com';

-- Lấy DoctorId1 (bác sĩ đầu tiên)
SELECT TOP 1 @DoctorId1 = id FROM users WHERE role = N'doctor' ORDER BY created_at;

-- Lấy DoctorId2 (bác sĩ thứ hai)
SELECT TOP 1 @DoctorId2 = id FROM users WHERE role = N'doctor' AND id != @DoctorId1 ORDER BY created_at;

-- ============================================
-- BƯỚC 3: KIỂM TRA BIẾN
-- ============================================
-- Kiểm tra xem có tìm thấy users không
IF @PatientId IS NULL
BEGIN
    PRINT N'❌ KHÔNG TÌM THẤY user với email hoangdat@gmail.com';
    PRINT N'Vui lòng kiểm tra lại email trong bảng users';
    RETURN;
END
ELSE
BEGIN
    PRINT N'✅ Tìm thấy patient: hoangdat@gmail.com';
    PRINT N'   Patient ID: ' + CAST(@PatientId AS NVARCHAR(50));
END

IF @DoctorId1 IS NULL
BEGIN
    PRINT N'❌ KHÔNG TÌM THẤY bác sĩ nào trong hệ thống';
    PRINT N'Vui lòng thêm ít nhất 1 user với role = doctor';
    RETURN;
END
ELSE
BEGIN
    PRINT N'✅ Tìm thấy doctor 1';
    PRINT N'   Doctor ID: ' + CAST(@DoctorId1 AS NVARCHAR(50));
END

-- Nếu không tìm thấy bác sĩ thứ 2, dùng lại bác sĩ thứ 1
IF @DoctorId2 IS NULL
BEGIN
    SET @DoctorId2 = @DoctorId1;
    PRINT N'⚠️ Chỉ có 1 bác sĩ, sẽ dùng chung cho cả 2 treatments';
END
ELSE
BEGIN
    PRINT N'✅ Tìm thấy doctor 2';
    PRINT N'   Doctor ID: ' + CAST(@DoctorId2 AS NVARCHAR(50));
END

PRINT N'';

-- ============================================
-- BƯỚC 4: XÓA DỮ LIỆU CŨ (ĐÚNG THỨ TỰ)
-- ============================================
PRINT N'2️⃣ Đang xóa dữ liệu cũ...';

-- Xóa treatment_items trước (bảng con)
IF EXISTS (SELECT 1 FROM treatment_items WHERE treatment_id IN (SELECT id FROM treatments WHERE patient_id = @PatientId))
BEGIN
    DELETE FROM treatment_items 
    WHERE treatment_id IN (SELECT id FROM treatments WHERE patient_id = @PatientId);
    PRINT N'✅ Đã xóa treatment_items cũ';
END

-- Xóa treatments sau (bảng cha)
IF EXISTS (SELECT 1 FROM treatments WHERE patient_id = @PatientId)
BEGIN
    DELETE FROM treatments WHERE patient_id = @PatientId;
    PRINT N'✅ Đã xóa treatments cũ';
END

PRINT N'';

-- ============================================
-- BƯỚC 5: THÊM DỮ LIỆU MỚI VỚI UNICODE ĐÚNG
-- ============================================
PRINT N'3️⃣ Đang thêm dữ liệu mới...';

SET NOCOUNT ON;

-- Khai báo biến để lưu treatment id
DECLARE @Treatment1Id BIGINT;
DECLARE @Treatment2Id BIGINT;
DECLARE @Treatment3Id BIGINT;
DECLARE @Treatment4Id BIGINT;

-- Treatment 1: Đang điều trị
INSERT INTO treatments (
    patient_id,
    doctor_id,
    name,
    description,
    diagnosis,
    status,
    progress,
    start_date,
    end_date,
    created_at,
    updated_at
) VALUES (
    @PatientId,
    @DoctorId1,
    N'Điều trị viêm khớp mãn tính',
    N'Liệu trình điều trị viêm khớp dạng thấp với thuốc và vật lý trị liệu',
    N'Viêm khớp dạng thấp giai đoạn 2',
    'active',
    65,
    '2025-03-15',
    '2025-09-15',
    GETDATE(),
    GETDATE()
);

-- Lấy treatment_id vừa tạo
SET @Treatment1Id = SCOPE_IDENTITY();

-- Treatment items cho Treatment 1
INSERT INTO treatment_items (treatment_id, item_type, item_name, dosage, frequency, duration, instructions, schedule_date, completed, created_at)
VALUES 
(@Treatment1Id, 'medication', N'Methotrexate', N'15mg', N'1 lần/tuần', N'6 tháng', N'Uống sau bữa ăn, tránh uống rượu', NULL, 0, GETDATE()),
(@Treatment1Id, 'medication', N'Prednisolone', N'5mg', N'1 viên/ngày', N'3 tháng', N'Uống vào buổi sáng sau ăn', NULL, 0, GETDATE()),
(@Treatment1Id, 'therapy', N'Vật lý trị liệu', NULL, N'3 lần/tuần', N'2 tháng', N'Tập vận động nhẹ nhàng, không gắng sức', NULL, 0, GETDATE()),
(@Treatment1Id, 'followup', N'Tái khám', NULL, NULL, NULL, N'Kiểm tra chỉ số viêm, chức năng gan thận', '2025-06-15', 0, GETDATE());

-- Treatment 2: Đang điều trị
INSERT INTO treatments (
    patient_id,
    doctor_id,
    name,
    description,
    diagnosis,
    status,
    progress,
    start_date,
    end_date,
    created_at,
    updated_at
) VALUES (
    @PatientId,
    @DoctorId2,
    N'Phục hồi chức năng sau phẫu thuật',
    N'Chương trình phục hồi chức năng vận động chi dưới sau phẫu thuật ACL',
    N'Phục hồi chức năng vận động chi dưới',
    'active',
    40,
    '2025-04-01',
    '2025-10-01',
    GETDATE(),
    GETDATE()
);

-- Lấy treatment_id vừa tạo
SET @Treatment2Id = SCOPE_IDENTITY();

-- Treatment items cho Treatment 2
INSERT INTO treatment_items (treatment_id, item_type, item_name, dosage, frequency, duration, instructions, schedule_date, completed, created_at)
VALUES 
(@Treatment2Id, 'therapy', N'Vật lý trị liệu chuyên sâu', NULL, N'5 lần/tuần', N'3 tháng', N'Tập phục hồi dưới sự hướng dẫn của chuyên gia', NULL, 0, GETDATE()),
(@Treatment2Id, 'medication', N'Ibuprofen', N'400mg', N'2 lần/ngày', N'1 tháng', N'Uống sau ăn, giảm đau và viêm', NULL, 0, GETDATE()),
(@Treatment2Id, 'procedure', N'Massage trị liệu', NULL, N'3 lần/tuần', N'2 tháng', N'Massage cơ và dây chằng vùng đầu gối', NULL, 0, GETDATE()),
(@Treatment2Id, 'followup', N'Đánh giá tiến độ', NULL, NULL, NULL, N'Kiểm tra khả năng vận động và độ mạnh cơ', '2025-07-01', 0, GETDATE());

-- Treatment 3: Đã hoàn thành
INSERT INTO treatments (
    patient_id,
    doctor_id,
    name,
    description,
    diagnosis,
    status,
    progress,
    start_date,
    end_date,
    completed_at,
    outcome,
    created_at,
    updated_at
) VALUES (
    @PatientId,
    @DoctorId1,
    N'Điều trị viêm họng cấp',
    N'Điều trị viêm amidan cấp tính bằng kháng sinh',
    N'Viêm amidan cấp có mủ',
    'completed',
    100,
    '2025-01-10',
    '2025-01-24',
    '2025-01-24',
    N'Bệnh nhân hồi phục hoàn toàn, không còn triệu chứng đau họng và sốt. Amidan đã tiêu mủ, không còn sưng đỏ.',
    GETDATE(),
    GETDATE()
);

-- Lấy treatment_id vừa tạo
SET @Treatment3Id = SCOPE_IDENTITY();

-- Treatment items cho Treatment 3 (đã hoàn thành)
INSERT INTO treatment_items (treatment_id, item_type, item_name, dosage, frequency, duration, instructions, completed, completed_at, created_at)
VALUES 
(@Treatment3Id, 'medication', N'Amoxicillin', N'500mg', N'3 lần/ngày', N'7 ngày', N'Uống sau ăn', 1, '2025-01-17', GETDATE()),
(@Treatment3Id, 'medication', N'Paracetamol', N'500mg', N'Khi cần', N'5 ngày', N'Hạ sốt, giảm đau', 1, '2025-01-15', GETDATE());

-- Treatment 4: Đã hoàn thành
INSERT INTO treatments (
    patient_id,
    doctor_id,
    name,
    description,
    diagnosis,
    status,
    progress,
    start_date,
    end_date,
    completed_at,
    outcome,
    created_at,
    updated_at
) VALUES (
    @PatientId,
    @DoctorId2,
    N'Điều trị viêm dạ dày',
    N'Điều trị viêm loét dạ dày Hp dương tính',
    N'Viêm loét dạ dày, Helicobacter Pylori (+)',
    'completed',
    100,
    '2024-11-01',
    '2024-12-15',
    '2024-12-15',
    N'Xét nghiệm sau điều trị: Hp âm tính. Triệu chứng đau thượng vị, ợ nóng đã hết. Nội soi tái khám cho thấy niêm mạc dạ dày đã lành.',
    GETDATE(),
    GETDATE()
);

-- Lấy treatment_id vừa tạo
SET @Treatment4Id = SCOPE_IDENTITY();

-- Treatment items cho Treatment 4 (đã hoàn thành)
INSERT INTO treatment_items (treatment_id, item_type, item_name, dosage, frequency, duration, instructions, completed, completed_at, created_at)
VALUES 
(@Treatment4Id, 'medication', N'Esomeprazole', N'40mg', N'2 lần/ngày', N'4 tuần', N'Uống trước ăn 30 phút', 1, '2024-11-29', GETDATE()),
(@Treatment4Id, 'medication', N'Amoxicillin', N'1g', N'2 lần/ngày', N'2 tuần', N'Phác đồ diệt Hp', 1, '2024-11-15', GETDATE()),
(@Treatment4Id, 'medication', N'Clarithromycin', N'500mg', N'2 lần/ngày', N'2 tuần', N'Phác đồ diệt Hp', 1, '2024-11-15', GETDATE()),
(@Treatment4Id, 'followup', N'Nội soi tái khám', NULL, NULL, NULL, N'Kiểm tra vết loét và xét nghiệm Hp', 1, '2024-12-15', GETDATE());

PRINT N'✅ Đã thêm dữ liệu thành công!';
PRINT N'   - 2 treatments đang điều trị';
PRINT N'   - 2 treatments đã hoàn thành';
PRINT N'';

-- Kiểm tra kết quả
PRINT N'📊 KẾT QUẢ:';
SELECT 
    t.id,
    t.name,
    t.status,
    t.progress,
    COUNT(ti.id) as total_items
FROM treatments t
LEFT JOIN treatment_items ti ON t.id = ti.treatment_id
WHERE t.patient_id = @PatientId
GROUP BY t.id, t.name, t.status, t.progress
ORDER BY t.status DESC, t.id DESC;

PRINT N'';
PRINT N'✅ HOÀN TẤT! Dữ liệu đã được cập nhật với Unicode đúng.';
GO
