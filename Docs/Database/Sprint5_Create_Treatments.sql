/*************************************************************
 * SPRINT 5 - CREATE TREATMENTS TABLES AND SAMPLE DATA
 * Created: 2025-10-27
 * Purpose: Tạo bảng treatments và treatment_items để quản lý
 *          liệu trình điều trị cho bệnh nhân
 *************************************************************/

USE QLPhongKham;
GO

/**********************
 1) CREATE TREATMENTS TABLE
**********************/
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[treatments]') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.treatments (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        patient_id BIGINT NOT NULL,
        doctor_id BIGINT NOT NULL,
        name NVARCHAR(500) NOT NULL,
        description NVARCHAR(MAX) NULL,
        diagnosis NVARCHAR(MAX) NULL,
        start_date DATE NOT NULL,
        end_date DATE NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'active', -- active|completed|cancelled|on_hold
        progress INT NOT NULL DEFAULT 0, -- 0-100%
        outcome NVARCHAR(MAX) NULL, -- Kết quả điều trị (sau khi hoàn thành)
        notes NVARCHAR(MAX) NULL,
        created_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIMEOFFSET NULL,
        completed_at DATETIMEOFFSET NULL,
        CONSTRAINT FK_treatments_patient FOREIGN KEY (patient_id) REFERENCES dbo.users(id),
        CONSTRAINT FK_treatments_doctor FOREIGN KEY (doctor_id) REFERENCES dbo.users(id),
        CONSTRAINT CHK_treatments_progress CHECK (progress BETWEEN 0 AND 100),
        CONSTRAINT CHK_treatments_status CHECK (status IN ('active', 'completed', 'cancelled', 'on_hold'))
    );
    
    CREATE INDEX IX_treatments_patient ON dbo.treatments(patient_id);
    CREATE INDEX IX_treatments_doctor ON dbo.treatments(doctor_id);
    CREATE INDEX IX_treatments_status ON dbo.treatments(status);
    CREATE INDEX IX_treatments_dates ON dbo.treatments(start_date, end_date);
    
    PRINT 'Table [treatments] created successfully';
END
ELSE
BEGIN
    PRINT 'Table [treatments] already exists';
END
GO

/**********************
 2) CREATE TREATMENT_ITEMS TABLE (Chi tiết điều trị)
**********************/
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[treatment_items]') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.treatment_items (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        treatment_id BIGINT NOT NULL,
        item_type NVARCHAR(50) NOT NULL, -- medication|procedure|therapy|followup
        item_name NVARCHAR(500) NOT NULL,
        dosage NVARCHAR(200) NULL, -- Liều lượng (cho thuốc)
        frequency NVARCHAR(200) NULL, -- Tần suất (3 lần/ngày)
        duration NVARCHAR(200) NULL, -- Thời gian (30 ngày, 2 tuần)
        instructions NVARCHAR(MAX) NULL, -- Hướng dẫn sử dụng
        schedule_date DATE NULL, -- Ngày hẹn tái khám/thủ thuật
        completed BIT NOT NULL DEFAULT 0,
        completed_at DATETIMEOFFSET NULL,
        notes NVARCHAR(MAX) NULL,
        created_at DATETIMEOFFSET NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_treatment_items_treatment FOREIGN KEY (treatment_id) REFERENCES dbo.treatments(id) ON DELETE CASCADE,
        CONSTRAINT CHK_treatment_items_type CHECK (item_type IN ('medication', 'procedure', 'therapy', 'followup'))
    );
    
    CREATE INDEX IX_treatment_items_treatment ON dbo.treatment_items(treatment_id);
    CREATE INDEX IX_treatment_items_type ON dbo.treatment_items(item_type);
    
    PRINT 'Table [treatment_items] created successfully';
END
ELSE
BEGIN
    PRINT 'Table [treatment_items] already exists';
END
GO

/**********************
 3) INSERT SAMPLE DATA
**********************/

-- Tìm user hoangdat@gmail.com
DECLARE @patientId BIGINT;
DECLARE @doctorId BIGINT;

-- Tìm patient với email hoangdat@gmail.com
SELECT @patientId = id FROM dbo.users WHERE email = 'hoangdat@gmail.com' AND role = 'patient';

-- Nếu chưa có user, tạo mới
IF @patientId IS NULL
BEGIN
    PRINT 'Tạo user mới: hoangdat@gmail.com';
    
    -- Hash password '123456789' với BCrypt
    -- Hash này tương ứng với password: 123456789
    DECLARE @passwordHash NVARCHAR(512) = '$2a$11$8Z3YqX8yxKpZ5L9gy0F5I.VZvYLqx7ZvqJ8aN7p4gKJ0v3F5LvZ3S';
    
    INSERT INTO dbo.users (
        public_id, email, phone, password_hash, role, status, 
        first_name, last_name, dob, gender, 
        created_at, updated_at
    )
    VALUES (
        NEWID(),
        'hoangdat@gmail.com',
        '0901234567',
        @passwordHash,
        'patient',
        'active',
        N'Đạt',
        N'Hoàng',
        '1995-05-15',
        'male',
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
    );
    
    SELECT @patientId = SCOPE_IDENTITY();
    
    -- Tạo patient profile
    INSERT INTO dbo.patient_profiles (
        user_id, medical_record_number, address, emergency_contact_name, 
        emergency_contact_phone, created_at
    )
    VALUES (
        @patientId,
        'MRN-' + CAST(@patientId AS VARCHAR(10)),
        N'123 Đường ABC, Quận 1, TP.HCM',
        N'Nguyễn Văn A',
        '0912345678',
        SYSUTCDATETIME()
    );
    
    PRINT 'User hoangdat@gmail.com created with ID: ' + CAST(@patientId AS VARCHAR(10));
END
ELSE
BEGIN
    PRINT 'Found existing user hoangdat@gmail.com with ID: ' + CAST(@patientId AS VARCHAR(10));
END

-- Tìm bác sĩ (lấy bác sĩ đầu tiên)
SELECT TOP 1 @doctorId = id FROM dbo.users WHERE role = 'doctor' AND status = 'active';

IF @doctorId IS NULL
BEGIN
    PRINT 'ERROR: Không tìm thấy bác sĩ nào trong hệ thống!';
    RETURN;
END

PRINT 'Using doctor ID: ' + CAST(@doctorId AS VARCHAR(10));

-- Xóa treatments cũ của user này (nếu có)
DELETE FROM dbo.treatments WHERE patient_id = @patientId;
PRINT 'Deleted old treatments for patient';

/**********************
 4) INSERT TREATMENT DATA
**********************/

-- Treatment 1: Đang điều trị - Cao huyết áp
DECLARE @treatment1 BIGINT;
INSERT INTO dbo.treatments (
    patient_id, doctor_id, name, description, diagnosis,
    start_date, end_date, status, progress, notes, created_at
)
VALUES (
    @patientId,
    @doctorId,
    N'Điều trị cao huyết áp',
    N'Liệu trình điều trị cao huyết áp mãn tính bằng thuốc và thay đổi lối sống',
    N'Cao huyết áp độ 1 (140/90 mmHg)',
    '2024-10-01',
    '2025-04-01', -- 6 tháng
    'active',
    45,
    N'Bệnh nhân đang đáp ứng tốt với điều trị. Cần theo dõi huyết áp hàng tuần.',
    SYSUTCDATETIME()
);
SET @treatment1 = SCOPE_IDENTITY();

-- Treatment items cho cao huyết áp
INSERT INTO dbo.treatment_items (treatment_id, item_type, item_name, dosage, frequency, duration, instructions, completed)
VALUES
(@treatment1, 'medication', N'Amlodipine 5mg', N'5mg', N'1 lần/ngày', N'6 tháng', N'Uống vào buổi sáng sau ăn', 0),
(@treatment1, 'medication', N'Losartan 50mg', N'50mg', N'1 lần/ngày', N'6 tháng', N'Uống vào buổi tối trước khi ngủ', 0),
(@treatment1, 'therapy', N'Thay đổi chế độ ăn', NULL, N'Hàng ngày', N'6 tháng', N'Giảm muối, tăng rau xanh, hạn chế chất béo', 0),
(@treatment1, 'followup', N'Tái khám định kỳ', NULL, N'Mỗi tháng', N'6 tháng', N'Đo huyết áp và kiểm tra tiến độ điều trị', 0);

-- Treatment 2: Đang điều trị - Đau dạ dày
DECLARE @treatment2 BIGINT;
INSERT INTO dbo.treatments (
    patient_id, doctor_id, name, description, diagnosis,
    start_date, end_date, status, progress, notes, created_at
)
VALUES (
    @patientId,
    @doctorId,
    N'Điều trị viêm loét dạ dày',
    N'Liệu trình điều trị viêm loét dạ dày do HP dương tính',
    N'Viêm loét dạ dày tá tràng, HP (+)',
    '2024-11-15',
    '2025-02-15', -- 3 tháng
    'active',
    60,
    N'Đã hoàn thành đợt diệt HP. Hiện tại đang điều trị bảo vệ niêm mạc.',
    SYSUTCDATETIME()
);
SET @treatment2 = SCOPE_IDENTITY();

-- Treatment items cho dạ dày
INSERT INTO dbo.treatment_items (treatment_id, item_type, item_name, dosage, frequency, duration, instructions, completed)
VALUES
(@treatment2, 'medication', N'Omeprazole 20mg', N'20mg', N'2 lần/ngày', N'3 tháng', N'Uống trước bữa ăn sáng và tối 30 phút', 0),
(@treatment2, 'medication', N'Rebamipide 100mg', N'100mg', N'3 lần/ngày', N'3 tháng', N'Uống sau các bữa ăn', 0),
(@treatment2, 'therapy', N'Chế độ ăn kiêng', NULL, N'Hàng ngày', N'3 tháng', N'Ăn nhẹ nhiều bữa, tránh đồ cay nóng, cà phê, rượu', 0),
(@treatment2, 'followup', N'Nội soi kiểm tra', NULL, NULL, NULL, N'Nội soi lại sau 3 tháng để đánh giá kết quả điều trị', 0);

-- Treatment 3: Đã hoàn thành - Viêm amidan
DECLARE @treatment3 BIGINT;
INSERT INTO dbo.treatments (
    patient_id, doctor_id, name, description, diagnosis,
    start_date, end_date, status, progress, outcome, completed_at, created_at
)
VALUES (
    @patientId,
    @doctorId,
    N'Điều trị viêm amidan cấp',
    N'Liệu trình kháng sinh điều trị viêm amidan cấp',
    N'Viêm amidan cấp do liên cầu khuẩn',
    '2024-08-01',
    '2024-08-15',
    'completed',
    100,
    N'Khỏi hoàn toàn, không còn triệu chứng đau họng, sốt. Amidan về kích thước bình thường.',
    CAST('2024-08-15' AS DATETIMEOFFSET),
    SYSUTCDATETIME()
);
SET @treatment3 = SCOPE_IDENTITY();

-- Treatment items cho viêm amidan (đã hoàn thành)
INSERT INTO dbo.treatment_items (treatment_id, item_type, item_name, dosage, frequency, duration, instructions, completed, completed_at)
VALUES
(@treatment3, 'medication', N'Amoxicillin 500mg', N'500mg', N'3 lần/ngày', N'7 ngày', N'Uống sau ăn, uống đủ liệu trình', 1, CAST('2024-08-08' AS DATETIMEOFFSET)),
(@treatment3, 'medication', N'Paracetamol 500mg', N'500mg', N'Khi sốt > 38.5°C', N'7 ngày', N'Uống khi sốt cao, cách nhau ít nhất 4-6 giờ', 1, CAST('2024-08-05' AS DATETIMEOFFSET)),
(@treatment3, 'therapy', N'Súc miệng nước muối', NULL, N'4-5 lần/ngày', N'10 ngày', N'Nước muối ấm, súc 2-3 phút mỗi lần', 1, CAST('2024-08-12' AS DATETIMEOFFSET)),
(@treatment3, 'followup', N'Tái khám sau điều trị', NULL, NULL, NULL, N'Tái khám nếu còn triệu chứng sau 7 ngày', 1, CAST('2024-08-15' AS DATETIMEOFFSET));

-- Treatment 4: Đã hoàn thành - Dị ứng da
DECLARE @treatment4 BIGINT;
INSERT INTO dbo.treatments (
    patient_id, doctor_id, name, description, diagnosis,
    start_date, end_date, status, progress, outcome, completed_at, created_at
)
VALUES (
    @patientId,
    @doctorId,
    N'Điều trị dị ứng da',
    N'Liệu trình điều trị dị ứng da và viêm da cơ địa',
    N'Viêm da dị ứng, mày đay mạn tính',
    '2024-06-15',
    '2024-08-15',
    'completed',
    100,
    N'Cải thiện 90%, da không còn ngứa và đỏ. Bệnh nhân đã xác định được nguồn dị ứng và tránh tiếp xúc.',
    CAST('2024-08-15' AS DATETIMEOFFSET),
    SYSUTCDATETIME()
);
SET @treatment4 = SCOPE_IDENTITY();

-- Treatment items cho dị ứng da (đã hoàn thành)
INSERT INTO dbo.treatment_items (treatment_id, item_type, item_name, dosage, frequency, duration, instructions, completed, completed_at)
VALUES
(@treatment4, 'medication', N'Cetirizine 10mg', N'10mg', N'1 lần/ngày', N'30 ngày', N'Uống vào buổi tối trước khi ngủ', 1, CAST('2024-07-15' AS DATETIMEOFFSET)),
(@treatment4, 'medication', N'Kem Betamethasone 0.1%', N'Mỏng', N'2 lần/ngày', N'14 ngày', N'Thoa vào vùng da bị viêm, tránh vùng mặt', 1, CAST('2024-06-30' AS DATETIMEOFFSET)),
(@treatment4, 'medication', N'Kem dưỡng ẩm Cetaphil', N'Theo nhu cầu', N'3-4 lần/ngày', N'60 ngày', N'Thoa đều khắp cơ thể sau khi tắm', 1, CAST('2024-08-15' AS DATETIMEOFFSET)),
(@treatment4, 'therapy', N'Tránh tiếp xúc dị ứng nguyên', NULL, N'Hàng ngày', N'Vĩnh viễn', N'Tránh hải sản, phấn hoa, bụi nhà. Giữ nhà cửa sạch sẽ.', 1, CAST('2024-08-15' AS DATETIMEOFFSET)),
(@treatment4, 'followup', N'Tái khám kiểm tra', NULL, NULL, NULL, N'Tái khám nếu tái phát hoặc không đáp ứng điều trị', 1, CAST('2024-08-15' AS DATETIMEOFFSET));

PRINT '';
PRINT '============================================';
PRINT 'TREATMENT DATA INSERTED SUCCESSFULLY';
PRINT '============================================';
PRINT 'Patient: hoangdat@gmail.com (ID: ' + CAST(@patientId AS VARCHAR(10)) + ')';
PRINT 'Doctor ID: ' + CAST(@doctorId AS VARCHAR(10));
PRINT '';
PRINT 'Treatments created:';
PRINT '  1. Điều trị cao huyết áp (active, 45%)';
PRINT '  2. Điều trị viêm loét dạ dày (active, 60%)';
PRINT '  3. Điều trị viêm amidan cấp (completed, 100%)';
PRINT '  4. Điều trị dị ứng da (completed, 100%)';
PRINT '';
PRINT 'Total treatment items: 16';
PRINT '============================================';
GO

-- Verify data
SELECT 
    t.id,
    t.name,
    t.status,
    t.progress,
    t.start_date,
    t.end_date,
    u_patient.email AS patient_email,
    u_doctor.first_name + ' ' + u_doctor.last_name AS doctor_name,
    (SELECT COUNT(*) FROM dbo.treatment_items WHERE treatment_id = t.id) AS total_items
FROM dbo.treatments t
INNER JOIN dbo.users u_patient ON t.patient_id = u_patient.id
INNER JOIN dbo.users u_doctor ON t.doctor_id = u_doctor.id
WHERE u_patient.email = 'hoangdat@gmail.com'
ORDER BY t.status DESC, t.start_date DESC;

PRINT '';
PRINT 'Verification query completed!';
GO
