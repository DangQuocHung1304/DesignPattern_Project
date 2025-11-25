-- Update image_url column to support base64 images
-- Run this script to fix existing database

USE [HealthySystemDB];
GO

-- Check if table exists before altering
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[health_news]') AND type in (N'U'))
BEGIN
    -- Check if column exists and is not already nvarchar(max)
    IF EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID(N'[dbo].[health_news]') 
        AND name = 'image_url'
        AND max_length <> -1  -- -1 means max
    )
    BEGIN
        PRINT 'Updating image_url column to nvarchar(max)...';
        
        -- Alter column to support longer base64 strings
        ALTER TABLE [dbo].[health_news]
        ALTER COLUMN [image_url] [nvarchar](max) NULL;
        
        PRINT 'Column image_url updated successfully to support base64 images!';
    END
    ELSE
    BEGIN
        PRINT 'Column image_url is already nvarchar(max) or does not exist';
    END
END
ELSE
BEGIN
    PRINT 'Table health_news does not exist. Please run AddCMSTables.sql first.';
END
GO
