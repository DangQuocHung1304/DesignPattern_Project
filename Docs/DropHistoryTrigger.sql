-- Drop AFTER trigger because it conflicts with INSTEAD OF trigger in EF Core
-- The trg_appointment_history_after only logs changes to history table
-- We can recreate it later if needed, or log history in application code

USE QLPhongKham;
GO

IF EXISTS (SELECT 1 FROM sys.triggers WHERE name = 'trg_appointment_history_after')
BEGIN
    DROP TRIGGER dbo.trg_appointment_history_after;
    PRINT 'Dropped trigger trg_appointment_history_after successfully';
END
ELSE
BEGIN
    PRINT 'Trigger trg_appointment_history_after does not exist';
END
GO
