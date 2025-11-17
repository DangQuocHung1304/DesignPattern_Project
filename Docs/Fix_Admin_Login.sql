-- ============================================================
-- FIX ADMIN LOGIN - Update Password Hash
-- ============================================================
-- Password: Admin@123
-- SHA256 Hash: 6G94qKPK8LYNjnTllCqm2G3BUM08AzOK7yW30tfjrMc=
-- Generated: 2025-11-17
-- ============================================================

-- Step 1: Check current admin account
SELECT 
    id,
    email,
    password_hash,
    role,
    status,
    created_at
FROM users
WHERE email = 'admin@healthysystem.com';

-- Step 2: Update password hash to correct value
UPDATE users 
SET password_hash = '6G94qKPK8LYNjnTllCqm2G3BUM08AzOK7yW30tfjrMc=',
    updated_at = GETDATE()
WHERE email = 'admin@healthysystem.com';

-- Step 3: Verify the update
SELECT 
    id,
    email,
    password_hash,
    role,
    status,
    'Password updated successfully. Use: Admin@123' AS LoginInfo
FROM users
WHERE email = 'admin@healthysystem.com';

-- ============================================================
-- LOGIN CREDENTIALS
-- ============================================================
-- Email: admin@healthysystem.com
-- Password: Admin@123
-- ============================================================

-- ============================================================
-- IF ADMIN ACCOUNT DOESN'T EXIST, CREATE IT
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@healthysystem.com')
BEGIN
    INSERT INTO users (
        public_id,
        first_name,
        last_name,
        email,
        phone,
        gender,
        date_of_birth,
        password_hash,
        role,
        status,
        created_at,
        updated_at
    )
    VALUES (
        NEWID(),
        'Admin',
        'System',
        'admin@healthysystem.com',
        '0900000000',
        'Nam',
        '1990-01-01',
        '6G94qKPK8LYNjnTllCqm2G3BUM08AzOK7yW30tfjrMc=',
        'admin',
        'active',
        GETDATE(),
        GETDATE()
    );
    
    PRINT 'Admin account created successfully!';
END
ELSE
BEGIN
    PRINT 'Admin account already exists. Password updated.';
END

-- ============================================================
-- VERIFY ALL ADMIN ACCOUNTS
-- ============================================================
SELECT 
    id,
    CONCAT(first_name, ' ', last_name) AS FullName,
    email,
    phone,
    role,
    status,
    'Login: Admin@123' AS Password,
    created_at
FROM users
WHERE role = 'admin'
ORDER BY created_at DESC;

-- ============================================================
-- TEST OTHER PASSWORDS (if needed)
-- ============================================================
-- Password: admin123
-- Hash: 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
-- (Note: This is hex format, need Base64: IAvlGPq9JyTdtvBO6x2lln1I1+gxwIyPqCKAn3THIKk=)

-- Password: Admin123
-- Hash: qWx+n+fA5MFYYsLgOYlUzL/rEV6dFCO2Z++vgO1J8zg=

-- ============================================================
-- TROUBLESHOOTING
-- ============================================================
-- If login still fails after update:
-- 1. Check backend is running: http://localhost:5000/api/health
-- 2. Check CORS is enabled in backend
-- 3. Clear browser localStorage: localStorage.clear()
-- 4. Check backend console for errors
-- 5. Verify email is exactly: admin@healthysystem.com (no spaces)
-- ============================================================
