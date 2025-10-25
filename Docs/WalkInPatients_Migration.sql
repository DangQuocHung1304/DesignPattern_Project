-- Migration: Add WalkInPatients table
-- Purpose: Allow multiple walk-in patients with same phone number
-- Date: 2025-10-20

-- Create walk_in_patients table
CREATE TABLE walk_in_patients (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    public_id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    full_name NVARCHAR(255) NOT NULL,
    phone NVARCHAR(20) NOT NULL,  -- No unique constraint - allow duplicates!
    email NVARCHAR(255),
    date_of_birth DATE,
    gender CHAR(1) CHECK (gender IN ('M', 'F', 'O')),
    address NVARCHAR(500),
    insurance_number NVARCHAR(50),
    medical_record_number NVARCHAR(50) UNIQUE,
    
    -- Link to registered user (if they register later)
    registered_user_id BIGINT NULL,
    
    -- Metadata
    created_by BIGINT NOT NULL,  -- Reception staff who created
    created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at DATETIMEOFFSET,
    
    -- Notes
    notes NVARCHAR(MAX),
    
    CONSTRAINT FK_WalkInPatients_CreatedBy FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT FK_WalkInPatients_RegisteredUser FOREIGN KEY (registered_user_id) REFERENCES users(id)
);

-- Create indexes
CREATE INDEX IX_WalkInPatients_Phone ON walk_in_patients(phone);
CREATE INDEX IX_WalkInPatients_PublicId ON walk_in_patients(public_id);
CREATE INDEX IX_WalkInPatients_MedicalRecordNumber ON walk_in_patients(medical_record_number);
CREATE INDEX IX_WalkInPatients_CreatedBy ON walk_in_patients(created_by);

-- Alter appointments table to support walk-in patients
ALTER TABLE appointments 
ADD walk_in_patient_id BIGINT NULL,
    CONSTRAINT FK_Appointments_WalkInPatient FOREIGN KEY (walk_in_patient_id) REFERENCES walk_in_patients(id);

-- Make patient_id nullable (either patient_id OR walk_in_patient_id must be set)
ALTER TABLE appointments 
ALTER COLUMN patient_id BIGINT NULL;

-- Add constraint to ensure either patient_id or walk_in_patient_id is set
ALTER TABLE appointments 
ADD CONSTRAINT CHK_Appointments_PatientType 
CHECK (
    (patient_id IS NOT NULL AND walk_in_patient_id IS NULL) OR
    (patient_id IS NULL AND walk_in_patient_id IS NOT NULL)
);

-- Add index
CREATE INDEX IX_Appointments_WalkInPatientId ON appointments(walk_in_patient_id);

GO

-- Add comments
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Walk-in patients who come directly to reception without registering online. Can have duplicate phone numbers.', 
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'walk_in_patients';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Medical record number - unique identifier for patient files', 
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'walk_in_patients',
    @level2type = N'COLUMN', @level2name = N'medical_record_number';

GO

PRINT 'Migration completed: walk_in_patients table created';
PRINT 'Appointments table updated to support walk-in patients';
