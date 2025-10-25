-- Fix appointments table for walk-in patients
-- Step 1: Add walk_in_patient_id column
ALTER TABLE appointments 
ADD walk_in_patient_id BIGINT NULL;

-- Step 2: Make patient_id nullable
-- First, find and drop existing FK constraint
DECLARE @ConstraintName NVARCHAR(200);
SELECT @ConstraintName = fk.name 
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
WHERE fk.parent_object_id = OBJECT_ID('appointments') 
  AND fk.referenced_object_id = OBJECT_ID('users')
  AND COL_NAME(fk.parent_object_id, fkc.parent_column_id) = 'patient_id';

IF @ConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE appointments DROP CONSTRAINT ' + @ConstraintName);
END;

-- Now make patient_id nullable
ALTER TABLE appointments 
ALTER COLUMN patient_id BIGINT NULL;

-- Recreate FK constraint
ALTER TABLE appointments
ADD CONSTRAINT FK_Appointments_Patient FOREIGN KEY (patient_id) REFERENCES users(id);

-- Step 3: Add FK for walk_in_patient_id
ALTER TABLE appointments 
ADD CONSTRAINT FK_Appointments_WalkInPatient FOREIGN KEY (walk_in_patient_id) REFERENCES walk_in_patients(id);

-- Step 4: Add check constraint
ALTER TABLE appointments 
ADD CONSTRAINT CHK_Appointments_PatientType 
CHECK (
    (patient_id IS NOT NULL AND walk_in_patient_id IS NULL) OR 
    (patient_id IS NULL AND walk_in_patient_id IS NOT NULL)
);

-- Step 5: Create indexes
CREATE INDEX IX_Appointments_WalkInPatientId ON appointments(walk_in_patient_id);

PRINT 'Appointments table updated successfully for walk-in patients';
