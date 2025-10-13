# 🔧 Hướng dẫn Fix Lỗi Login với Reception Account

## 📋 Vấn đề gặp phải:
- Khi đăng nhập với tài khoản reception, báo lỗi "Email hoặc mật khẩu không chính xác"
- Backend API không trả về JWT token sau khi đăng nhập thành công

## ✅ Các thay đổi đã thực hiện:

### 1. **Backend - AuthController.cs**
✅ **Đã cập nhật:**
- Thêm JWT token generation trong method `Login()`
- Thêm method `GenerateJwtToken()` để tạo JWT với claims
- Import thêm: `System.IdentityModel.Tokens.Jwt`, `System.Security.Claims`, `Microsoft.IdentityModel.Tokens`
- Inject `IConfiguration` vào constructor

**Response mới:**
```json
{
  "message": "Đăng nhập thành công",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "publicId": "uuid",
    "fullName": "Lê Thu Hà",
    "email": "reception@clinic.local",
    "role": "reception"
  }
}
```

### 2. **Frontend - api-test-sprint2.html**
✅ **Đã cập nhật:**
- Đổi email reception từ `reception@hospital.com` → `reception@clinic.local` (khớp với database)
- Thêm **Password Hash Helper** với Web Crypto API (SHA256)
- Login form tự động hash và so sánh password
- Auto-save JWT token vào localStorage

### 3. **Database - Password Hash**
❌ **CẦN THỰC HIỆN:**

## 🚀 Các bước cần làm NGAY BÂY GIỜ:

### Bước 1: Hash Password "Reception@123"
1. Mở file `api-test-sprint2.html` trong browser
2. Scroll xuống phần **"Password Hash Helper (SHA256)"**
3. Nhập password: `Reception@123`
4. Click nút **"Hash Password"**
5. Copy hash result (Base64 string)

**Ví dụ output:**
```
nGDKOK9E/9qQvWm/vN7VvvHqGXK4rGKzlG+8h8P/pok=
```

### Bước 2: Cập nhật Database
1. Mở SQL Server Management Studio
2. Connect vào database `QLPhongKham`
3. Chạy script `Update_Password_Hashes.sql`:

```sql
USE QLPhongKham;
GO

-- Thay YOUR_HASH_HERE bằng hash vừa copy từ bước 1
UPDATE dbo.users 
SET password_hash = 'nGDKOK9E/9qQvWm/vN7VvvHqGXK4rGKzlG+8h8P/pok='
WHERE email = 'reception@clinic.local';

-- Verify
SELECT 
    id,
    email,
    role,
    first_name,
    last_name,
    status,
    LEFT(password_hash, 30) + '...' as password_hash_preview
FROM dbo.users 
WHERE email = 'reception@clinic.local';
GO
```

### Bước 3: Test Login
1. Quay lại `api-test-sprint2.html`
2. Scroll xuống phần **"Login (Đăng nhập để lấy token)"**
3. Click nút **"Login as Reception"**
4. Kiểm tra response box:
   - ✅ Status: 200
   - ✅ Message: "Đăng nhập thành công"
   - ✅ Token: hiển thị JWT token
   - ✅ User: {id, publicId, fullName, email, role}

### Bước 4: Test Appointments API
1. Sau khi login thành công, token tự động lưu vào localStorage
2. Scroll xuống phần **"Appointments API (Lịch hẹn)"**
3. Click các nút test:
   - **Test Get All Appointments** - Xem tất cả lịch hẹn (theo role reception sẽ thấy tất cả)
   - **Test Get Appointment Detail** - Xem chi tiết 1 lịch hẹn
   - **Test Get History** - Xem lịch sử

## 🔍 Troubleshooting:

### Lỗi: "Email hoặc mật khẩu không chính xác"
**Nguyên nhân:**
- Password hash trong database không khớp với hash của password "Reception@123"

**Giải pháp:**
- Hash password bằng tool trong `api-test-sprint2.html`
- Cập nhật database với hash mới

### Lỗi: "Cannot read property 'token' of undefined"
**Nguyên nhân:**
- Backend chưa restart sau khi cập nhật code

**Giải pháp:**
```powershell
cd Backend\HealthySystem.API
dotnet build
dotnet run
```

### Lỗi: CORS / Network Error
**Nguyên nhân:**
- Backend không chạy hoặc chạy sai port

**Giải pháp:**
- Kiểm tra backend đang chạy: http://localhost:5000
- Kiểm tra CORS config trong `Program.cs`

## 📝 Thông tin tài khoản test:

| Role | Email | Password | Note |
|------|-------|----------|------|
| Reception | reception@clinic.local | Reception@123 | Cần update password_hash |
| Patient | patient@email.com | Patient@123 | Cần tạo account mới hoặc update existing |
| Doctor | doctor@clinic.local | Doctor@123 | (Sample) |

## 📚 Files liên quan:

1. **Backend:**
   - `Backend/HealthySystem.API/Controllers/AuthController.cs` - ✅ Đã update
   - `Backend/HealthySystem.API/Program.cs` - JWT config (OK)

2. **Frontend:**
   - `Web/HealthySystem-Frontend/api-test-sprint2.html` - ✅ Đã update
   - `Web/HealthySystem-Frontend/assets/js/api.js` - API methods

3. **Database:**
   - `Docs/Database/Database_CNPMNC.sql` - Schema & sample data
   - `Docs/Database/Update_Password_Hashes.sql` - ✅ Đã tạo (script update hash)

## 🎯 Expected Results:

Sau khi hoàn thành các bước trên, bạn sẽ:
1. ✅ Login thành công với reception@clinic.local / Reception@123
2. ✅ Nhận được JWT token hợp lệ
3. ✅ Token tự động lưu vào localStorage
4. ✅ Test được tất cả Appointments API với token
5. ✅ Phân quyền đúng: reception thấy tất cả lịch hẹn, patient chỉ thấy của mình

---
**Created:** October 13, 2025  
**Author:** GitHub Copilot  
**Status:** ✅ Backend updated, ⏳ Database pending update
