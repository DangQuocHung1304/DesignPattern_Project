-- Add max_appointments_per_slot column if not exists
USE HealthySystemDB;
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'doctor_schedules') 
    AND name = 'max_appointments_per_slot'
)
BEGIN
    ALTER TABLE doctor_schedules
    ADD max_appointments_per_slot INT NOT NULL DEFAULT 4;
    
    PRINT 'Column max_appointments_per_slot added successfully';
END
ELSE
BEGIN
    PRINT 'Column max_appointments_per_slot already exists';
END
GO
