# CHỨC NĂNG TẠO TÀI KHOẢN NHÂN VIÊN (Sprint 10)

## 📋 Tổng quan

**Tên chức năng**: Tạo tài khoản cho Bác sĩ và Tiếp tân  
**Sprint**: Sprint 10  
**Người thực hiện**: Admin  
**Ngày hoàn thành**: 11/11/2025  
**Commit**: `e66f1c7`

---

## 🎯 Mục đích

Cho phép Quản trị viên (Admin) tạo tài khoản mới cho:
- **Bác sĩ** (Doctor) - Với thông tin chuyên môn đầy đủ
- **Tiếp tân** (Reception) - Với thông tin cơ bản

Chức năng này giúp Admin quản lý nhân sự dễ dàng, không cần nhân viên tự đăng ký.

---

## 🔧 Các thay đổi kỹ thuật

### 1. Backend API (AdminController.cs)

#### Endpoint mới
```http
POST /api/admin/users/create-staff
Authorization: Bearer {token}
Role: admin
```

#### Request Body
```json
{
  "firstName": "Nguyễn",
  "lastName": "Văn A",
  "email": "doctor.a@hospital.com",
  "phone": "0912345678",
  "password": "123456",
  "role": "doctor",  // "doctor" hoặc "reception"
  
  // Chỉ cho Bác sĩ (Optional)
  "specialization": "Nội khoa",
  "licenseNumber": "BS123456",
  "dateOfBirth": "1985-05-15T00:00:00Z",
  "gender": "Nam",
  "address": "123 Đường ABC, Quận 1, TP.HCM"
}
```

#### Response Success
```json
{
  "success": true,
  "message": "Tạo tài khoản bác sĩ thành công",
  "data": {
    "userId": 25,
    "email": "doctor.a@hospital.com",
    "fullName": "Nguyễn Văn A",
    "role": "doctor"
  }
}
```

#### Response Error
```json
{
  "success": false,
  "error": "Email đã tồn tại trong hệ thống"
}
```

### 2. Validation Rules

✅ **Email**:
- Required, phải là email hợp lệ
- Không được trùng với email đã có trong hệ thống

✅ **Password**:
- Required, tối thiểu 6 ký tự
- Được mã hóa bằng BCrypt trước khi lưu

✅ **Phone**:
- Required, định dạng 10-11 số
- Không được trùng với số điện thoại đã có

✅ **Role**:
- Chỉ chấp nhận: `"doctor"` hoặc `"reception"`

✅ **Specialization** (Bác sĩ):
- Default: "Tổng quát" nếu không nhập

✅ **License Number** (Bác sĩ):
- Tự động generate: `BS{userId:D6}` nếu không nhập
- Ví dụ: `BS000025`

### 3. Database Operations

#### Transaction Flow
```
1. BEGIN TRANSACTION
2. Create User (trong bảng users)
   - Hash password với BCrypt
   - Set IsActive = true
   - Set CreatedAt = DateTime.Now
3. IF role = "doctor":
      Create Doctor (trong bảng doctors)
   ELSE IF role = "reception":
      Create StaffProfile (trong bảng staff_profiles)
4. COMMIT TRANSACTION
```

#### Tables Modified
- `users` - Tài khoản đăng nhập
- `doctors` - Hồ sơ bác sĩ (nếu role = doctor)
- `staff_profiles` - Hồ sơ nhân viên (nếu role = reception)

### 4. Frontend UI (admin-dashboard.html)

#### Tab mới: "Tạo tài khoản"
- Icon: `<i class="fas fa-user-plus"></i>`
- Vị trí: Giữa tab "Người dùng" và "Lịch làm việc BS"

#### Form Fields

**Loại tài khoản** (Radio buttons):
- 🩺 Bác sĩ
- 👔 Tiếp tân

**Thông tin cơ bản** (Tất cả account types):
- Họ (required)
- Tên (required)
- Email (required, email validation)
- Số điện thoại (required, pattern: [0-9]{10,11})
- Mật khẩu (required, minlength: 6)
- Xác nhận mật khẩu (required)

**Thông tin Bác sĩ** (Chỉ hiện khi chọn "Bác sĩ"):
- Chuyên khoa (dropdown)
  - Tổng quát, Nội khoa, Ngoại khoa, Nhi khoa, Sản phụ khoa
  - Da liễu, Tai mũi họng, Mắt, Răng hàm mặt
  - Tim mạch, Thần kinh
- Số chứng chỉ hành nghề (optional)
- Ngày sinh (date picker)
- Giới tính (dropdown: Nam/Nữ/Khác)
- Địa chỉ (textarea)

#### JavaScript Functions

```javascript
// Toggle hiển thị fields bác sĩ
function toggleDoctorFields()

// Reset form
function resetCreateStaffForm()

// Tạo tài khoản (async)
async function createStaffAccount(event)

// Hiển thị thông báo
function showCreateAccountMessage(message, type)
```

#### UX Features
- ✅ Auto-hide success message sau 5 giây
- ✅ Auto-reset form sau khi tạo thành công
- ✅ Real-time toggle Doctor fields
- ✅ Password confirmation validation
- ✅ Responsive design

---

## 📸 Screenshots

### 1. Tab "Tạo tài khoản" - Bác sĩ
```
┌─────────────────────────────────────────────────────────┐
│ 👤 Tạo tài khoản nhân viên mới                          │
├─────────────────────────────────────────────────────────┤
│ Loại tài khoản:                                         │
│ [🩺 Bác sĩ] [👔 Tiếp tân]                                │
│                                                         │
│ Họ: [____________]    Tên: [____________]              │
│ Email: [_____________________________]                  │
│ Số điện thoại: [_____________]                          │
│ Mật khẩu: [____________]  Xác nhận: [____________]     │
│                                                         │
│ ───────────────────────────────────────────────────    │
│ 🩺 Thông tin bác sĩ                                     │
│                                                         │
│ Chuyên khoa: [Tổng quát ▼]                            │
│ Số chứng chỉ: [_____________]                           │
│ Ngày sinh: [DD/MM/YYYY]   Giới tính: [Nam ▼]          │
│ Địa chỉ: [_____________________________________]        │
│                                                         │
│ [💾 Tạo tài khoản] [🔄 Làm mới]                         │
└─────────────────────────────────────────────────────────┘
```

### 2. Success Message
```
┌─────────────────────────────────────────────────────────┐
│ ✅ Tạo tài khoản bác sĩ thành công                      │
│ Email: doctor.a@hospital.com                            │
│ Họ tên: Nguyễn Văn A                                    │
│ Vai trò: doctor                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Features

1. **Authentication**: Chỉ Admin mới có quyền truy cập
   ```csharp
   [Authorize(Roles = "admin")]
   ```

2. **Password Hashing**: Sử dụng BCrypt
   ```csharp
   PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
   ```

3. **Email Uniqueness**: Kiểm tra trùng lặp
   ```csharp
   var existingUser = await _context.Users
       .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());
   ```

4. **Transaction Safety**: Rollback nếu có lỗi
   ```csharp
   using var transaction = await _context.Database.BeginTransactionAsync();
   // ... operations ...
   await transaction.CommitAsync();
   ```

---

## 📊 Test Cases

### Test Case 1: Tạo tài khoản Bác sĩ thành công
**Input**:
- Role: doctor
- Email: doctor.test@hospital.com
- Password: 123456
- Specialization: Nội khoa

**Expected**: 
- ✅ User record created in `users` table
- ✅ Doctor record created in `doctors` table
- ✅ Success message displayed
- ✅ Form auto-reset

### Test Case 2: Email đã tồn tại
**Input**:
- Email: existing@hospital.com (đã có trong DB)

**Expected**: 
- ❌ Error: "Email đã tồn tại trong hệ thống"

### Test Case 3: Password không khớp
**Input**:
- Password: 123456
- Confirm Password: 654321

**Expected**: 
- ❌ Error: "Mật khẩu xác nhận không khớp"

### Test Case 4: Tạo tài khoản Tiếp tân
**Input**:
- Role: reception
- Email: reception.test@hospital.com

**Expected**: 
- ✅ User record created in `users` table
- ✅ StaffProfile record created in `staff_profiles` table
- ✅ Doctor fields không hiển thị

### Test Case 5: Password quá ngắn
**Input**:
- Password: 123 (< 6 ký tự)

**Expected**: 
- ❌ HTML5 validation: "Mật khẩu phải có ít nhất 6 ký tự"

---

## 🚀 Cách sử dụng

### Cho Admin:

1. **Đăng nhập** với tài khoản Admin
2. Vào **Quản trị viên Dashboard**
3. Click tab **"Tạo tài khoản"**
4. Chọn loại tài khoản: **Bác sĩ** hoặc **Tiếp tân**
5. Điền thông tin:
   - Thông tin cơ bản (bắt buộc)
   - Thông tin bác sĩ (nếu chọn Bác sĩ)
6. Click **"Tạo tài khoản"**
7. Nhận thông báo thành công
8. Nhân viên mới có thể đăng nhập ngay

### Lưu ý:
- 📧 Email sẽ được dùng để đăng nhập
- 🔒 Mật khẩu tối thiểu 6 ký tự
- 📱 Số điện thoại phải 10-11 số
- 🩺 Số chứng chỉ bác sĩ tự động tạo nếu không nhập

---

## 📁 Files Changed

### Backend (3 files)
1. **AdminController.cs** (+163 lines)
   - Thêm endpoint `CreateStaffAccount`
   - Thêm DTO class `CreateStaffAccountRequest`

2. **ApplicationDbContext.cs** (+1 line)
   - Thêm `DbSet<StaffProfile> StaffProfiles`

### Frontend (1 file)
3. **admin-dashboard.html** (+254 lines)
   - Thêm tab "Tạo tài khoản"
   - Thêm form tạo tài khoản
   - Thêm 4 JavaScript functions

### Documentation (4 files)
4. **Docs/Sprint10/** (folder)
   - Sprint_Planning_S10.docx
   - Sprint_Review_S10.docx
   - Sprint_Retrospective_S10.docx
   - desktop.ini

**Tổng**: 418 insertions, 7 files changed

---

## 📈 Thống kê

| Metric | Value |
|--------|-------|
| Lines of Code Added | 418 |
| Files Changed | 7 |
| API Endpoints | 1 (POST) |
| Database Tables | 3 (users, doctors, staff_profiles) |
| Frontend Components | 1 (Tab + Form) |
| JavaScript Functions | 4 |
| Test Cases | 5 |
| Sprint | 10 |

---

## 🔄 Workflow

```
┌─────────────┐
│  Admin      │
│  Dashboard  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│ Click "Tạo tài khoản" Tab  │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Chọn Role (Doctor/Reception)│
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Điền thông tin              │
│ - Email, Phone, Password    │
│ - Doctor fields (nếu có)    │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Submit Form                 │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ POST /api/admin/users/      │
│      create-staff           │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Validation                  │
│ - Email unique?             │
│ - Password match?           │
│ - Phone unique?             │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Create Records              │
│ 1. User (hash password)     │
│ 2. Doctor / StaffProfile    │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Success Message             │
│ + Auto-reset form           │
└─────────────────────────────┘
```

---

## 🎓 Kiến thức áp dụng

- ✅ ASP.NET Core Web API
- ✅ Entity Framework Core (Transaction)
- ✅ JWT Authentication & Authorization
- ✅ BCrypt Password Hashing
- ✅ RESTful API Design
- ✅ Bootstrap 5 UI
- ✅ Vanilla JavaScript (Async/Await)
- ✅ Form Validation (HTML5 + Custom)
- ✅ Database Design (Multiple tables)
- ✅ Git Version Control

---

## 📝 Future Enhancements

- [ ] Gửi email chào mừng cho nhân viên mới
- [ ] Upload ảnh đại diện khi tạo tài khoản
- [ ] Import hàng loạt từ Excel
- [ ] Tạo mật khẩu ngẫu nhiên tự động
- [ ] Xác thực email/phone trước khi kích hoạt
- [ ] Thêm role: Pharmacist, Nurse, etc.
- [ ] Audit log cho hành động tạo tài khoản

---

**Version**: 1.0  
**Last Updated**: 11/11/2025  
**Author**: Nhóm 8 - Healthy System
