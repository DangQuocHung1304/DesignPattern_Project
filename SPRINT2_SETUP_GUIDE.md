# 🏥 HƯỚNG DẪN CÀI ĐẶT & CHẠY SPRINT 2
## Hệ Thống Quản Lý Phòng Khám - Appointment Management System

---

## 📋 MỤC LỤC
1. [Tổng Quan Sprint 2](#tổng-quan-sprint-2)
2. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
3. [Cài Đặt Cơ Sở Dữ Liệu](#cài-đặt-cơ-sở-dữ-liệu)
4. [Cài Đặt Backend](#cài-đặt-backend)
5. [Cài Đặt Frontend](#cài-đặt-frontend)
6. [Test API](#test-api)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 TỔNG QUAN SPRINT 2

### Chức năng đã hoàn thành:
✅ **Phase 1 - Information Pages:**
- Trang bảng giá dịch vụ (pricing.html)
- Trang tin tức (news.html, news-detail.html)
- Trang hướng dẫn (guides.html)
- Backend APIs: ServicesController, NewsController, GuidesController

✅ **Phase 2 - Appointment Management:**
- Dashboard tiếp tân (reception-dashboard.html)
- Quản lý lịch hẹn tiếp tân (reception-appointments.html)
- Xem lịch hẹn bệnh nhân (patient-appointments.html)
- Backend API: AppointmentsController với full CRUD

✅ **Optimization:**
- Toast Notification System (thay thế alert())
- Loading Spinner System (cho async operations)
- Form Validation System (real-time feedback)
- JWT Authentication (token-based login)

---

## 💻 YÊU CẦU HỆ THỐNG

### Phần mềm cần thiết:
- **SQL Server 2019+** (hoặc SQL Server Express)
- **.NET 9.0 SDK** ([Download](https://dotnet.microsoft.com/download))
- **Node.js** (không bắt buộc, cho Live Server)
- **Git** (để clone repository)
- **Visual Studio Code** (hoặc Visual Studio 2022)

### Extensions cho VS Code (khuyến nghị):
- C# Dev Kit
- Live Server
- SQL Server (mssql)

---

## 🗄️ CÀI ĐẶT CƠ SỞ DỮ LIỆU

### Bước 1: Tạo Database
```sql
-- Mở SQL Server Management Studio (SSMS)
-- Chạy script để tạo database và tables

-- File: Docs/Database/Database_CNPMNC.sql
-- Script sẽ tạo:
-- - Database: QLPhongKham
-- - 20+ tables (users, appointments, services, etc.)
-- - Sample data
```

### Bước 2: Update Password Hashes

**⚠️ QUAN TRỌNG:** Database sample có password hash giả, cần update để login được!

#### 2.1. Hash Password
1. Mở file: `Web/HealthySystem-Frontend/api-test-sprint2.html`
2. Scroll đến phần **"Password Hash Helper (SHA256)"**
3. Nhập password cần hash:
   - Reception: `Reception@123`
   - Patient: `Patient@123`
4. Click nút **"Hash Password"**
5. Copy hash result (Base64 string)

**Ví dụ output:**
```
Password: Reception@123
Hash: nGDKOK9E/9qQvWm/vN7VvvHqGXK4rGKzlG+8h8P/pok=
```

#### 2.2. Update Database
```sql
USE QLPhongKham;
GO

-- Update Reception account
UPDATE dbo.users 
SET password_hash = 'nGDKOK9E/9qQvWm/vN7VvvHqGXK4rGKzlG+8h8P/pok='
WHERE email = 'reception@clinic.local';

-- Update Patient account (hash của Patient@123)
UPDATE dbo.users 
SET password_hash = 'YOUR_HASH_HERE'
WHERE email = 'patient@email.com';

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
WHERE email IN ('reception@clinic.local', 'patient@email.com');
GO
```

### Bước 3: Verify Connection String
Mở file: `Backend/HealthySystem.API/appsettings.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=QLPhongKham;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
  }
}
```

**Chỉnh sửa nếu cần:**
- `Server=localhost` → IP hoặc tên server của bạn
- `Trusted_Connection=True` → Xóa và thêm `User Id=sa;Password=yourpassword` nếu dùng SQL auth

---

## 🔧 CÀI ĐẶT BACKEND

### Bước 1: Restore Dependencies
```powershell
cd Backend/HealthySystem.API
dotnet restore
```

### Bước 2: Build Project
```powershell
dotnet build
```

**Expected output:**
```
Build succeeded.
    5 Warning(s)
    0 Error(s)
```

**⚠️ Warnings về async/await là bình thường, không ảnh hưởng.**

### Bước 3: Run Server
```powershell
dotnet run
```

**Expected output:**
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5000
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
```

### Bước 4: Verify Server
Mở browser và truy cập:
- Health Check: http://localhost:5000/api/health
- Services API: http://localhost:5000/api/services

**Expected response (Health Check):**
```json
{
  "status": "Healthy",
  "timestamp": "2025-10-13T...",
  "database": "Connected",
  "authentication": "JWT Bearer Token"
}
```

---

## 🌐 CÀI ĐẶT FRONTEND

### Bước 1: Cấu trúc thư mục
```
Web/HealthySystem-Frontend/
├── index.html              # Homepage
├── login.html              # Login page
├── profile.html            # User profile
├── pricing.html            # Services pricing
├── news.html               # News list
├── news-detail.html        # News detail
├── guides.html             # Patient guides
├── reception-dashboard.html      # Reception dashboard
├── reception-appointments.html   # Reception appointments
├── patient-appointments.html     # Patient appointments
├── api-test-sprint2.html        # API test tool
├── assets/
│   ├── css/
│   │   ├── style.css
│   │   └── notifications.css    # Toast system
│   └── js/
│       ├── app.js
│       ├── api.js              # API service layer
│       └── notifications.js    # Notification system
```

### Bước 2: Cấu hình API URL
Mở file: `Web/HealthySystem-Frontend/assets/js/api.js`

```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

**⚠️ Đảm bảo URL khớp với backend server!**

### Bước 3: Run Frontend
**Cách 1: VS Code Live Server**
1. Cài extension "Live Server"
2. Right-click vào `index.html`
3. Chọn "Open with Live Server"
4. Browser tự động mở: http://127.0.0.1:5500

**Cách 2: Python Simple Server**
```powershell
cd Web/HealthySystem-Frontend
python -m http.server 8000
```
Truy cập: http://localhost:8000

**Cách 3: Node.js HTTP Server**
```powershell
npx http-server -p 8000
```

---

## 🧪 TEST API

### Bước 1: Mở API Test Tool
Truy cập: http://127.0.0.1:5500/api-test-sprint2.html

### Bước 2: Login để lấy Token

#### Test với Reception Account:
1. Scroll đến phần **"Login (Đăng nhập để lấy token)"**
2. Form đã điền sẵn:
   - Email: `reception@clinic.local`
   - Password: `Reception@123`
3. Click nút **"Login as Reception"**
4. Xem response box:

**Expected Success Response:**
```json
{
  "status": 200,
  "message": "✓ Login thành công với role: Reception",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 5,
    "publicId": "uuid",
    "fullName": "Lê Thu Hà",
    "email": "reception@clinic.local",
    "role": "reception"
  }
}
```

**✅ Token tự động lưu vào localStorage và hiển thị trong input field**

#### Test với Patient Account:
1. Click nút **"Login as Patient"**
2. Credentials:
   - Email: `patient@email.com`
   - Password: `Patient@123`

### Bước 3: Test Services API (Không cần token)
1. Scroll đến **"Services API (Bảng giá)"**
2. Click các nút test:
   - **Test Get All Services** → Lấy tất cả dịch vụ
   - **Test Get by Category** → Lọc theo danh mục "khám bệnh"
   - **Test Get Categories** → Lấy danh sách danh mục

**Expected Response (Get All Services):**
```json
{
  "status": 200,
  "data": [
    {
      "id": 1,
      "code": "KB001",
      "name": "Khám nội tổng quát",
      "category": "kham-benh",
      "defaultPrice": 200000,
      "unit": "Lần"
    },
    ...
  ],
  "count": 15
}
```

### Bước 4: Test News API (Không cần token)
1. Scroll đến **"News API (Tin tức)"**
2. Click các nút test:
   - **Test Get All News** → Lấy danh sách tin tức
   - **Test Get Featured News** → Lấy tin nổi bật
   - **Test Get News Detail** → Xem chi tiết tin ID=1
   - **Test Get Categories** → Lấy danh mục tin

### Bước 5: Test Guides API (Không cần token)
1. Scroll đến **"Guides API (Hướng dẫn)"**
2. Test tương tự như News API

### Bước 6: Test Appointments API (CẦN TOKEN)
**⚠️ Phải login trước (Bước 2) để có token!**

1. Scroll đến **"Appointments API (Lịch hẹn)"**
2. Verify token đã hiển thị trong input (readonly)
3. Click các nút test:

   **Get All Appointments:**
   - Reception: Thấy TẤT CẢ lịch hẹn (phân quyền: staff sees all)
   - Patient: Chỉ thấy lịch hẹn của chính mình

   **Get Appointment Detail (ID=1):**
   - Xem chi tiết 1 lịch hẹn
   - Kèm thông tin bệnh nhân, bác sĩ, chuyên khoa

   **Get History (User ID=1):**
   - Xem lịch sử lịch hẹn của user

**Expected Response (Get All Appointments - Reception):**
```json
{
  "status": 200,
  "data": [
    {
      "id": 1,
      "patientCode": "BN-001",
      "patientName": "Nguyễn Văn A",
      "doctorName": "BS. Nguyễn Thị B",
      "specialty": "Nội khoa",
      "appointmentStart": "2025-10-15T09:00:00",
      "status": "scheduled",
      "reason": "Khám tổng quát"
    },
    ...
  ],
  "count": 25
}
```

### Bước 7: Test Summary
Scroll xuống cuối trang, xem **"Test Summary"**:
```
Tổng số tests: 12
Thành công: 11 ✓
Thất bại: 1 ✗
```

---

## 🖥️ SỬ DỤNG HỆ THỐNG

### 1. Login vào hệ thống
Truy cập: http://127.0.0.1:5500/login.html

**Test Accounts:**
| Role | Email | Password | Mô tả |
|------|-------|----------|-------|
| Reception | reception@clinic.local | Reception@123 | Tiếp tân |
| Patient | patient@email.com | Patient@123 | Bệnh nhân |
| Doctor | doctor@clinic.local | Doctor@123 | Bác sĩ (nếu có) |

### 2. Reception Workflow
**Sau khi login với reception account:**

1. **Dashboard** (tự động redirect)
   - URL: `/reception-dashboard.html`
   - Xem: Thống kê hôm nay, lịch hẹn chờ xác nhận
   - Quick actions: Đặt lịch, Xem lịch, Quản lý bệnh nhân

2. **Quản lý lịch hẹn**
   - Click "Quản lý lịch hẹn" trong menu
   - URL: `/reception-appointments.html`
   - Chức năng:
     - ✅ Xem tất cả lịch hẹn (calendar + list view)
     - ✅ Tạo lịch hẹn mới (modal form)
     - ✅ Cập nhật trạng thái (scheduled → confirmed)
     - ✅ Hủy lịch hẹn (với lý do)
     - ✅ Tìm kiếm và lọc (theo ngày, trạng thái, bác sĩ)

3. **Đặt lịch hẹn mới**
   - Click "Đặt lịch hẹn"
   - Điền form:
     - Mã bệnh nhân (BN-XXX)
     - Mã bác sĩ (BS-XXX)
     - Ngày giờ hẹn
     - Lý do khám
   - **Validation tự động:**
     - Pattern matching (BN-XXX, BS-XXX)
     - Date min = today
     - End time > Start time
   - Click "Lưu" → Toast notification thành công

### 3. Patient Workflow
**Sau khi login với patient account:**

1. **Homepage**
   - URL: `/index.html`
   - Xem: Giới thiệu, dịch vụ, tin tức

2. **Profile**
   - Click "Hồ sơ của tôi" trong menu
   - URL: `/profile.html`
   - Click button **"Lịch khám của tôi"**

3. **Quản lý lịch khám**
   - URL: `/patient-appointments.html`
   - 3 tabs:
     - **Sắp tới:** Lịch hẹn chưa đến (status: scheduled, confirmed)
     - **Lịch sử:** Lịch hẹn đã hoàn thành
     - **Đã hủy:** Lịch hẹn bị hủy
   
4. **Thay đổi lịch hẹn**
   - Click "Thay đổi" trên lịch hẹn
   - Sửa ngày giờ trong modal
   - Click "Gửi yêu cầu" → Loading spinner → Toast notification

5. **Hủy lịch hẹn**
   - Click "Hủy" trên lịch hẹn
   - Confirm dialog
   - Loading spinner → Toast notification

### 4. Xem Bảng giá
- URL: `/pricing.html`
- 4 danh mục: Khám bệnh, Xét nghiệm, Chẩn đoán, Thủ thuật
- Search và filter theo danh mục

### 5. Xem Tin tức
- URL: `/news.html`
- List view với pagination
- Click vào tin → `/news-detail.html?id=1`

### 6. Xem Hướng dẫn
- URL: `/guides.html`
- 4 danh mục: Đặt lịch, Khám bệnh, Thanh toán, Dịch vụ

---

## 🔧 TROUBLESHOOTING

### 1. Login lỗi "Email hoặc mật khẩu không chính xác"

**Nguyên nhân:**
- Password hash trong database không khớp

**Giải pháp:**
1. Mở `api-test-sprint2.html`
2. Dùng "Password Hash Helper" để hash password
3. Update database với hash mới:
```sql
UPDATE users SET password_hash = 'YOUR_HASH' 
WHERE email = 'reception@clinic.local';
```

### 2. Backend lỗi "Cannot connect to SQL Server"

**Kiểm tra:**
```sql
-- Test connection trong SSMS
SELECT @@VERSION;
SELECT DB_NAME();
```

**Sửa connection string:**
```json
// appsettings.json
"DefaultConnection": "Server=YOUR_SERVER;Database=QLPhongKham;User Id=sa;Password=yourpassword;TrustServerCertificate=True"
```

### 3. Frontend lỗi CORS

**Triệu chứng:**
```
Access to fetch at 'http://localhost:5000/api/...' has been blocked by CORS policy
```

**Kiểm tra backend:** `Program.cs`
```csharp
// Đảm bảo có CORS config
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", policy => {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// ...

app.UseCors("AllowAll");
```

### 4. API trả về 401 Unauthorized (Appointments)

**Nguyên nhân:**
- Chưa login hoặc token hết hạn
- Token không được gửi trong request header

**Giải pháp:**
1. Login lại trong `api-test-sprint2.html`
2. Verify token trong localStorage:
```javascript
console.log(localStorage.getItem('auth_token'));
```
3. Check Authorization header trong request:
```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

### 5. Toast notification không hiện

**Kiểm tra:**
1. File `notifications.css` đã import chưa?
```html
<link rel="stylesheet" href="assets/css/notifications.css">
```

2. File `notifications.js` đã import chưa?
```html
<script src="assets/js/notifications.js"></script>
```

3. Thứ tự import: `notifications.js` TRƯỚC `api.js`

### 6. Form validation không hoạt động

**Kiểm tra:**
```javascript
// FormValidator phải được khởi tạo TRƯỚC khi submit
let formValidator = new FormValidator('formId');
formValidator.init();

// Trong submit handler
if (!formValidator.validateForm()) {
    notification.warning('Vui lòng kiểm tra lại thông tin!');
    return;
}
```

### 7. Loading spinner không ẩn

**Nguyên nhân:**
- `loading.hide()` không được gọi trong `finally` block

**Giải pháp:**
```javascript
try {
    loading.show('Đang tải...');
    const data = await api.getData();
    notification.success('Thành công!');
} catch (error) {
    notification.error('Lỗi: ' + error.message);
} finally {
    loading.hide(); // QUAN TRỌNG!
}
```

---

## 📚 TÀI LIỆU THAM KHẢO

### Backend APIs Documentation

**1. Authentication**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "reception@clinic.local",
  "password": "Reception@123"
}

Response: 200 OK
{
  "message": "Đăng nhập thành công",
  "token": "eyJhbGciOiJIUzI1...",
  "user": { ... }
}
```

**2. Services (Bảng giá)**
```http
GET /api/services
GET /api/services?category=kham-benh
GET /api/services/categories
```

**3. News (Tin tức)**
```http
GET /api/news?page=1&limit=10
GET /api/news/featured?limit=4
GET /api/news/{id}
GET /api/news/categories
```

**4. Guides (Hướng dẫn)**
```http
GET /api/guides
GET /api/guides?category=appointment
GET /api/guides/{id}
GET /api/guides/categories
```

**5. Appointments (Lịch hẹn) - Requires Auth**
```http
GET /api/appointments
Authorization: Bearer {token}

GET /api/appointments/{id}
Authorization: Bearer {token}

POST /api/appointments
Authorization: Bearer {token}
Content-Type: application/json
{
  "patientId": 1,
  "doctorId": 2,
  "appointmentStart": "2025-10-15T09:00:00",
  "appointmentEnd": "2025-10-15T09:30:00",
  "reason": "Khám tổng quát"
}

PUT /api/appointments/{id}/status
Authorization: Bearer {token}
Content-Type: application/json
{
  "status": "confirmed",
  "notes": "Đã xác nhận"
}

DELETE /api/appointments/{id}
Authorization: Bearer {token}
```

### Frontend Systems

**1. Notification System**
```javascript
const notification = new NotificationSystem();

notification.success('Thành công!');
notification.error('Lỗi!');
notification.warning('Cảnh báo!');
notification.info('Thông tin!');
```

**2. Loading System**
```javascript
const loading = new LoadingSystem();

loading.show('Đang tải...');
loading.update('Đang xử lý...');
loading.hide();
```

**3. Form Validation**
```javascript
const validator = new FormValidator('myFormId');
validator.init();

if (validator.validateForm()) {
    // Submit form
}
```

---

## 📊 DATABASE SCHEMA

### Core Tables:
- **users** - Tài khoản người dùng
- **patient_profiles** - Hồ sơ bệnh nhân
- **staff_profiles** - Hồ sơ nhân viên
- **appointments** - Lịch hẹn
- **services** - Dịch vụ/Bảng giá
- **specialties** - Chuyên khoa
- **doctor_schedules** - Lịch làm việc bác sĩ

### Sample Data:
- 2 patients
- 2 doctors
- 1 reception staff
- 15+ services
- 5+ specialties

---

## 🎓 NEXT STEPS

### Sprint 3 Planning:
- [ ] Online appointment booking (patient self-service)
- [ ] Doctor schedule management
- [ ] Medical records system
- [ ] Prescription module
- [ ] Payment processing

### Technical Debt:
- [ ] Add unit tests (Backend)
- [ ] Add E2E tests (Frontend)
- [ ] Improve error handling
- [ ] Add logging system
- [ ] Performance optimization

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề, kiểm tra:
1. **Console logs** (F12 trong browser)
2. **Network tab** (Xem request/response)
3. **Backend logs** (Terminal output)
4. **Database logs** (SSMS)

File hướng dẫn chi tiết:
- `FIX_LOGIN_GUIDE.md` - Hướng dẫn fix login
- `SPRINT2_SETUP_GUIDE.md` - File này

---

**Created:** October 13, 2025  
**Version:** 2.0  
**Status:** ✅ Production Ready  
**GitHub:** https://github.com/DangQuocHung1304/Project_CNPMNangCao
