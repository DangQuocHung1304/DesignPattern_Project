-- Add Test Accounts for New Roles (Lab Technician, Accountant, Admin)
-- Sprint 8, 9, 10 Implementation
-- Date: 2025-11-04

USE HealthySystemDB;
GO

-- Lab Technician Account
-- Password: Lab@123456 (hashed)
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, created_at)
VALUES (
    'lab@healthysystem.com',
    '$2a$11$YourHashedPasswordHere', -- TODO: Replace with actual bcrypt hash
    N'Nguyễn',
    N'Xét Nghiệm',
    '0901234567',
    'lab',
    1,
    GETDATE()
);

-- Accountant Account
-- Password: Acc@123456 (hashed)
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, created_at)
VALUES (
    'accountant@healthysystem.com',
    '$2a$11$YourHashedPasswordHere', -- TODO: Replace with actual bcrypt hash
    N'Trần',
    N'Kế Toán',
    '0901234568',
    'accountant',
    1,
    GETDATE()
);

-- System Admin Account
-- Password: Admin@123456 (hashed)
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, created_at)
VALUES (
    'admin@healthysystem.com',
    '$2a$11$YourHashedPasswordHere', -- TODO: Replace with actual bcrypt hash
    N'Lê',
    N'Quản Trị',
    '0901234569',
    'admin',
    1,
    GETDATE()
);

-- Verify the accounts
SELECT 
    id,
    email,
    first_name + ' ' + last_name AS full_name,
    role,
    is_active,
    created_at
FROM users
WHERE role IN ('lab', 'accountant', 'admin')
ORDER BY role;

GO

-- Note: You need to generate proper password hashes using your backend
-- For testing, you can use the backend's registration endpoint or 
-- generate hashes using BCrypt with cost factor 11
