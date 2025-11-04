-- Create Doctor Schedules Table
-- Quản lý lịch làm việc của bác sĩ theo ngày trong tuần
-- Date: 2025-11-04

USE HealthySystemDB;
GO

-- Tạo bảng lịch làm việc bác sĩ
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'doctor_schedules')
BEGIN
    CREATE TABLE doctor_schedules (
        id INT IDENTITY(1,1) PRIMARY KEY,
        doctor_id INT NOT NULL,
        day_of_week INT NOT NULL, -- 0=Sunday, 1=Monday, ..., 6=Saturday
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_available BIT NOT NULL DEFAULT 1,
        max_appointments_per_slot INT NOT NULL DEFAULT 4, -- Số lượng BN tối đa mỗi slot
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NULL,
        
        CONSTRAINT FK_doctor_schedules_doctor FOREIGN KEY (doctor_id) 
            REFERENCES users(id) ON DELETE CASCADE,
        
        -- Đảm bảo không có overlap thời gian cho cùng bác sĩ trong cùng ngày
        CONSTRAINT UQ_doctor_schedule UNIQUE (doctor_id, day_of_week, start_time)
    );

    -- Index để tối ưu query
    CREATE INDEX IX_doctor_schedules_doctor ON doctor_schedules(doctor_id);
    CREATE INDEX IX_doctor_schedules_day ON doctor_schedules(day_of_week);
    CREATE INDEX IX_doctor_schedules_available ON doctor_schedules(is_available);
END
GO

-- Thêm dữ liệu mẫu (ví dụ cho 1 bác sĩ)
DECLARE @doctorId INT;

-- Lấy ID bác sĩ đầu tiên (hoặc thay bằng ID cụ thể)
SELECT TOP 1 @doctorId = id FROM users WHERE role = 'doctor';

IF @doctorId IS NOT NULL
BEGIN
    -- Thứ 2: 8:00 - 12:00 và 13:00 - 17:00
    INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_available, max_appointments_per_slot)
    VALUES 
        (@doctorId, 1, '08:00:00', '12:00:00', 1, 4),
        (@doctorId, 1, '13:00:00', '17:00:00', 1, 4);
    
    -- Thứ 3: 8:00 - 12:00 và 13:00 - 17:00
    INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_available, max_appointments_per_slot)
    VALUES 
        (@doctorId, 2, '08:00:00', '12:00:00', 1, 4),
        (@doctorId, 2, '13:00:00', '17:00:00', 1, 4);
    
    -- Thứ 4: 8:00 - 12:00 và 13:00 - 17:00
    INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_available, max_appointments_per_slot)
    VALUES 
        (@doctorId, 3, '08:00:00', '12:00:00', 1, 4),
        (@doctorId, 3, '13:00:00', '17:00:00', 1, 4);
    
    -- Thứ 5: 8:00 - 12:00 và 13:00 - 17:00
    INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_available, max_appointments_per_slot)
    VALUES 
        (@doctorId, 4, '08:00:00', '12:00:00', 1, 4),
        (@doctorId, 4, '13:00:00', '17:00:00', 1, 4);
    
    -- Thứ 6: 8:00 - 12:00 (chỉ buổi sáng)
    INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_available, max_appointments_per_slot)
    VALUES 
        (@doctorId, 5, '08:00:00', '12:00:00', 1, 4);
    
    PRINT 'Sample doctor schedule created successfully.';
END
ELSE
BEGIN
    PRINT 'No doctor found. Please create a doctor account first.';
END
GO

-- View để xem lịch làm việc dễ dàng hơn
IF NOT EXISTS (SELECT * FROM sys.views WHERE name = 'v_doctor_schedules')
BEGIN
    EXEC('
    CREATE VIEW v_doctor_schedules AS
    SELECT 
        ds.id,
        ds.doctor_id,
        u.first_name + '' '' + u.last_name AS doctor_name,
        u.email AS doctor_email,
        ds.day_of_week,
        CASE ds.day_of_week
            WHEN 0 THEN ''Chủ nhật''
            WHEN 1 THEN ''Thứ hai''
            WHEN 2 THEN ''Thứ ba''
            WHEN 3 THEN ''Thứ tư''
            WHEN 4 THEN ''Thứ năm''
            WHEN 5 THEN ''Thứ sáu''
            WHEN 6 THEN ''Thứ bảy''
        END AS day_name,
        ds.start_time,
        ds.end_time,
        ds.is_available,
        ds.max_appointments_per_slot,
        ds.created_at,
        ds.updated_at
    FROM doctor_schedules ds
    INNER JOIN users u ON ds.doctor_id = u.id
    WHERE u.role = ''doctor'' AND u.is_active = 1
    ');
END
GO

-- Function để check xem bác sĩ có làm việc vào ngày cụ thể không
IF OBJECT_ID('fn_IsDoctorAvailable', 'FN') IS NOT NULL
    DROP FUNCTION fn_IsDoctorAvailable;
GO

CREATE FUNCTION fn_IsDoctorAvailable(
    @doctorId INT,
    @appointmentDate DATE,
    @appointmentTime TIME
)
RETURNS BIT
AS
BEGIN
    DECLARE @dayOfWeek INT = DATEPART(WEEKDAY, @appointmentDate) - 1; -- SQL Server: 1=Sunday, convert to 0=Sunday
    DECLARE @isAvailable BIT = 0;
    
    -- Check nếu có lịch làm việc trong ngày đó và thời gian nằm trong khoảng
    IF EXISTS (
        SELECT 1 
        FROM doctor_schedules 
        WHERE doctor_id = @doctorId 
          AND day_of_week = @dayOfWeek
          AND is_available = 1
          AND @appointmentTime >= start_time 
          AND @appointmentTime < end_time
    )
    BEGIN
        SET @isAvailable = 1;
    END
    
    RETURN @isAvailable;
END
GO

-- Test function
DECLARE @testDoctorId INT;
SELECT TOP 1 @testDoctorId = id FROM users WHERE role = 'doctor';

IF @testDoctorId IS NOT NULL
BEGIN
    DECLARE @testDate DATE = GETDATE();
    DECLARE @testTime TIME = '09:00:00';
    
    DECLARE @available BIT = dbo.fn_IsDoctorAvailable(@testDoctorId, @testDate, @testTime);
    
    PRINT 'Doctor ID: ' + CAST(@testDoctorId AS VARCHAR(10));
    PRINT 'Test Date: ' + CONVERT(VARCHAR(10), @testDate, 120);
    PRINT 'Test Time: ' + CONVERT(VARCHAR(8), @testTime, 108);
    PRINT 'Available: ' + CASE WHEN @available = 1 THEN 'YES' ELSE 'NO' END;
END
GO

-- Verify data
SELECT * FROM v_doctor_schedules ORDER BY doctor_id, day_of_week, start_time;
GO

PRINT 'Doctor schedules table created successfully!';
