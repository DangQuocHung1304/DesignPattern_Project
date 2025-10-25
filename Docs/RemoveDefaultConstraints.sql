-- Remove DEFAULT constraints from walk_in_patients table
-- This will allow EF Core to use OUTPUT clause properly

-- Step 1: Drop DEFAULT constraint on public_id
DECLARE @ConstraintName NVARCHAR(200);
SELECT @ConstraintName = dc.name
FROM sys.default_constraints dc
INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
WHERE OBJECT_NAME(dc.parent_object_id) = 'walk_in_patients'
  AND c.name = 'public_id';

IF @ConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE walk_in_patients DROP CONSTRAINT ' + @ConstraintName);
    PRINT 'Dropped DEFAULT constraint on public_id: ' + @ConstraintName;
END;

-- Step 2: Drop DEFAULT constraint on created_at
SELECT @ConstraintName = dc.name
FROM sys.default_constraints dc
INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
WHERE OBJECT_NAME(dc.parent_object_id) = 'walk_in_patients'
  AND c.name = 'created_at';

IF @ConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE walk_in_patients DROP CONSTRAINT ' + @ConstraintName);
    PRINT 'Dropped DEFAULT constraint on created_at: ' + @ConstraintName;
END;

PRINT 'Successfully removed DEFAULT constraints from walk_in_patients table';
PRINT 'EF Core will now generate values for public_id and created_at';
