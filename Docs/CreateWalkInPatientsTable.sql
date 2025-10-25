SET QUOTED_IDENTIFIER ON;
GO

-- Step 1: Create walk_in_patients table
CREATE TABLE walk_in_patients (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    public_id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    full_name NVARCHAR(255) NOT NULL,
    phone NVARCHAR(20) NOT NULL,  -- NO unique constraint
    email NVARCHAR(255) NULL,
    date_of_birth DATE NULL,
    gender CHAR(1) NULL,
    address NVARCHAR(500) NULL,
    insurance_number NVARCHAR(50) NULL,
    medical_record_number NVARCHAR(50) NULL,
    registered_user_id BIGINT NULL,
    created_by BIGINT NOT NULL,
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET NULL,
    notes NVARCHAR(MAX) NULL,
    
    CONSTRAINT FK_WalkInPatients_CreatedBy FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT FK_WalkInPatients_RegisteredUser FOREIGN KEY (registered_user_id) REFERENCES users(id)
);

-- Create indexes on walk_in_patients
CREATE INDEX IX_WalkInPatients_Phone ON walk_in_patients(phone);
CREATE UNIQUE INDEX IX_WalkInPatients_PublicId ON walk_in_patients(public_id);
CREATE UNIQUE INDEX IX_WalkInPatients_MedicalRecordNumber ON walk_in_patients(medical_record_number) WHERE medical_record_number IS NOT NULL;
CREATE INDEX IX_WalkInPatients_CreatedBy ON walk_in_patients(created_by);

PRINT 'walk_in_patients table created successfully';
