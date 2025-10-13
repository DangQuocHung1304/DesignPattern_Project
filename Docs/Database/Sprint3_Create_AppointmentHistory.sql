-- Create appointment_history table for Sprint 3
USE QLPhongKham;
GO

-- Drop table if exists (for development/testing)
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[appointment_history]') AND type in (N'U'))
BEGIN
    DROP TABLE [dbo].[appointment_history];
END
GO

-- Create appointment_history table
CREATE TABLE [dbo].[appointment_history] (
    [id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [appointment_id] BIGINT NOT NULL,
    [changed_by] BIGINT NOT NULL,
    [old_status] NVARCHAR(50) NULL,
    [new_status] NVARCHAR(50) NOT NULL,
    [old_start] DATETIMEOFFSET NULL,
    [new_start] DATETIMEOFFSET NULL,
    [old_end] DATETIMEOFFSET NULL,
    [new_end] DATETIMEOFFSET NULL,
    [comment] NVARCHAR(MAX) NULL,
    [changed_at] DATETIMEOFFSET NOT NULL DEFAULT (SYSDATETIMEOFFSET()),
    
    -- Foreign keys
    CONSTRAINT [FK_appointment_history_appointments] FOREIGN KEY ([appointment_id])
        REFERENCES [dbo].[appointments] ([id])
        ON DELETE CASCADE,
    
    CONSTRAINT [FK_appointment_history_users] FOREIGN KEY ([changed_by])
        REFERENCES [dbo].[users] ([id])
);
GO

-- Create indexes for better performance
CREATE INDEX [IX_appointment_history_appointment_id] ON [dbo].[appointment_history] ([appointment_id]);
CREATE INDEX [IX_appointment_history_changed_by] ON [dbo].[appointment_history] ([changed_by]);
CREATE INDEX [IX_appointment_history_changed_at] ON [dbo].[appointment_history] ([changed_at] DESC);
GO

PRINT 'Table appointment_history created successfully!';
GO
