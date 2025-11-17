-- Migrate QLPhongKham.doctor_schedules to new schema
-- Backup data first, then alter table structure
USE QLPhongKham;
GO

-- Step 1: Rename old table (backup)
IF OBJECT_ID('doctor_schedules_backup', 'U') IS NOT NULL
    DROP TABLE doctor_schedules_backup;
GO

EXEC sp_rename 'doctor_schedules', 'doctor_schedules_backup';
GO

-- Step 2: Create new table with correct schema
CREATE TABLE doctor_schedules (
    id INT IDENTITY(1,1) PRIMARY KEY,
    doctor_user_id INT NOT NULL,  -- Match with your users table
    day_of_week INT NOT NULL,     -- 0=Sunday, 1=Monday, ..., 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BIT NOT NULL DEFAULT 1,
    max_appointments_per_slot INT NOT NULL DEFAULT 4,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NULL,
    
    CONSTRAINT FK_doctor_schedules_doctor FOREIGN KEY (doctor_user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT UQ_doctor_schedule UNIQUE (doctor_user_id, day_of_week, start_time)
);
GO

-- Step 3: Create indexes
CREATE INDEX IX_doctor_schedules_doctor ON doctor_schedules(doctor_user_id);
CREATE INDEX IX_doctor_schedules_day ON doctor_schedules(day_of_week);
CREATE INDEX IX_doctor_schedules_available ON doctor_schedules(is_available);
GO

-- Step 4: Migrate data if needed (convert schedule_date to day_of_week)
-- Only migrate if you want to keep old schedules
-- This converts specific dates to recurring weekly schedules
/*
INSERT INTO doctor_schedules (doctor_user_id, day_of_week, start_time, end_time, is_available, max_appointments_per_slot, created_at)
SELECT 
    doctor_user_id,
    DATEPART(WEEKDAY, schedule_date) - 1 as day_of_week,  -- Convert to 0-6
    start_time,
    end_time,
    is_available,
    4 as max_appointments_per_slot,  -- Default value
    created_at
FROM doctor_schedules_backup
WHERE schedule_date >= GETDATE();  -- Only future schedules
*/

PRINT 'Schema migration completed. Old table backed up as doctor_schedules_backup';
PRINT 'Review and manually migrate data if needed using the commented INSERT statement';
GO
