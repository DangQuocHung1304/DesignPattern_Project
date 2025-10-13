-- ============================================
-- Update Password Hashes for Test Accounts
-- ============================================
-- Password: Reception@123
-- SHA256 Hash (Base64): nGDKOK9E/9qQvWm/vN7VvvHqGXK4rGKzlG+8h8P/pok=

USE QLPhongKham;
GO

-- Update Reception Account
UPDATE dbo.users 
SET password_hash = 'nGDKOK9E/9qQvWm/vN7VvvHqGXK4rGKzlG+8h8P/pok='
WHERE email = 'reception@clinic.local';

-- Update Patient Account (if you want to test patient login too)
-- Password: Patient@123
-- SHA256 Hash: Run the hash function in api-test-sprint2.html to get this

-- Verify the update
SELECT 
    id,
    email,
    role,
    first_name,
    last_name,
    status,
    LEFT(password_hash, 20) + '...' as password_hash_preview
FROM dbo.users 
WHERE email IN ('reception@clinic.local', 'patient@email.com');

GO
