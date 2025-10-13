# 🧪 HƯỚNG DẪN TESTING SPRINT 2 - STEP BY STEP

**Status:** ✅ Backend Running | 🌐 Browser Opened  
**Current URL:** http://127.0.0.1:5500/api-test-sprint2.html

---

## 📋 CHECKLIST TESTING

### Phase 1: Database Setup ⏳
- [ ] **Step 1.1:** Hash password "Reception@123"
- [ ] **Step 1.2:** Update database với hash
- [ ] **Step 1.3:** Verify database update

### Phase 2: API Testing 🔧
- [ ] **Step 2.1:** Test Login (Reception)
- [ ] **Step 2.2:** Test Services API (3 endpoints)
- [ ] **Step 2.3:** Test News API (4 endpoints)
- [ ] **Step 2.4:** Test Guides API (4 endpoints)
- [ ] **Step 2.5:** Test Appointments API (3 endpoints - requires token)

### Phase 3: Frontend Testing 🌐
- [ ] **Step 3.1:** Reception Dashboard
- [ ] **Step 3.2:** Reception Appointments Management
- [ ] **Step 3.3:** Patient Appointments View

---

## 🔐 PHASE 1: DATABASE SETUP

### ⚡ Step 1.1: Hash Password

**Trong browser (api-test-sprint2.html):**

1. Scroll xuống phần **"Password Hash Helper (SHA256)"**
2. Input field có sẵn: `Reception@123`
3. Click nút **"Hash Password"** (màu xanh primary)
4. Chờ 1 giây, hash sẽ xuất hiện trong textarea bên phải

**Expected Output:**
```
SHA256 Hash Result:
nGDKOK9E/9qQvWm/vN7VvvHqGXK4rGKzlG+8h8P/pok=
```

5. Click nút **"Copy Hash"** để copy vào clipboard
6. Bạn sẽ thấy alert: **"✓ Đã copy hash vào clipboard!"**

**✅ Action Required:** Copy hash này, chuẩn bị cho bước tiếp theo!

---

### ⚡ Step 1.2: Update Database

**Mở SQL Server Management Studio (SSMS):**

```sql
-- Connect to SQL Server
-- Database: QLPhongKham

USE QLPhongKham;
GO

-- Update Reception account password hash
UPDATE dbo.users 
SET password_hash = 'nGDKOK9E/9qQvWm/vN7VvvHqGXK4rGKzlG+8h8P/pok='
WHERE email = 'reception@clinic.local';
GO

-- Verify update
SELECT 
    id,
    email,
    role,
    first_name + ' ' + last_name AS full_name,
    status,
    LEFT(password_hash, 40) + '...' as password_hash_preview
FROM dbo.users 
WHERE email = 'reception@clinic.local';
GO
```

**Expected Result:**
```
id  | email                    | role      | full_name  | status | password_hash_preview
----|--------------------------|-----------|------------|--------|----------------------
5   | reception@clinic.local   | reception | Lê Thu Hà  | active | nGDKOK9E/9qQvWm/vN7VvvHqGXK4rGKzlG+8h...
```

**✅ Verification:** Password hash đã được update thành công!

---

### ⚡ Step 1.3: (Optional) Create Patient Account

**Nếu bạn muốn test với patient account:**

1. Hash password "Patient@123" trong browser
2. Tạo hoặc update patient account:

```sql
-- Check if patient exists
SELECT * FROM users WHERE email = 'patient@email.com';

-- If exists, update hash
UPDATE dbo.users 
SET password_hash = 'YOUR_PATIENT_HASH_HERE'
WHERE email = 'patient@email.com';

-- If not exists, insert new
INSERT INTO dbo.users (
    email, phone, password_hash, role, status, 
    first_name, last_name, dob, gender
)
VALUES (
    'patient@email.com', 
    '0901234567', 
    'YOUR_PATIENT_HASH_HERE', 
    'patient', 
    'active',
    'Nguyễn', 
    'Văn A', 
    '1990-01-01', 
    'M'
);
GO
```

---

## 🧪 PHASE 2: API TESTING

### ⚡ Step 2.1: Test Login - Reception Account

**Trong browser (api-test-sprint2.html):**

1. Scroll xuống phần **"Login (Đăng nhập để lấy token)"**
2. Form đã điền sẵn:
   - **Email:** reception@clinic.local
   - **Password:** Reception@123
3. Click nút **"Login as Reception"** (màu xanh primary)
4. Chờ 2-3 giây cho API response

**Expected Success Response (trong response box màu xám):**
```json
✓ SUCCESS - 10:30:45

status: 200
statusText: "OK"
message: "✓ Login thành công với role: Reception"
token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8v..."
user: {
  id: 5,
  publicId: "uuid-here",
  fullName: "Lê Thu Hà",
  email: "reception@clinic.local",
  role: "reception"
}
```

**Alert popup:**
```
✓ Login thành công! Token đã được lưu.
Role: Reception
Email: reception@clinic.local
```

5. **Verify Token Display:**
   - Scroll xuống phần **"Appointments API (Lịch hẹn)"**
   - Alert info box hiển thị: **"Token hiện tại: eyJhbGciOiJI..."**
   - Input field (readonly) có token đầy đủ

**✅ Test Passed nếu:**
- Status = 200
- Token được trả về
- Alert thành công
- Token xuất hiện trong input field

**❌ Test Failed nếu:**
- Status = 401 (Unauthorized)
- Message: "Email hoặc mật khẩu không chính xác"
→ Quay lại Step 1.2, kiểm tra password hash

---

### ⚡ Step 2.2: Test Services API

**Không cần token - Public API**

Scroll xuống phần **"Services API (Bảng giá)"**

#### Test 2.2.1: Get All Services
1. Click **"Test Get All Services"**
2. Xem response box

**Expected Response:**
```json
✓ SUCCESS

status: 200
data: [
  {
    id: 1,
    code: "KB001",
    name: "Khám nội tổng quát",
    category: "kham-benh",
    defaultPrice: 200000,
    unit: "Lần"
  },
  {
    id: 2,
    code: "KB002",
    name: "Khám ngoại tổng quát",
    category: "kham-benh",
    defaultPrice: 200000,
    unit: "Lần"
  },
  ...
]
count: 15
```

**✅ Pass:** Status 200, có data array, count > 0

#### Test 2.2.2: Get by Category
1. Click **"Test Get by Category (khám bệnh)"**
2. Xem response

**Expected Response:**
```json
✓ SUCCESS

status: 200
category: "kham-benh"
data: [ ... ] (chỉ dịch vụ khám bệnh)
count: 5
```

**✅ Pass:** Status 200, data filtered by category

#### Test 2.2.3: Get Categories
1. Click **"Test Get Categories"**

**Expected Response:**
```json
✓ SUCCESS

status: 200
data: [
  "kham-benh",
  "xet-nghiem",
  "chan-doan-hinh-anh",
  "thu-thuat"
]
```

**✅ Pass:** Status 200, có list categories

---

### ⚡ Step 2.3: Test News API

Scroll xuống phần **"News API (Tin tức)"**

#### Test 2.3.1: Get All News
1. Click **"Test Get All News"**

**Expected Response:**
```json
✓ SUCCESS

status: 200
data: [
  {
    id: 1,
    title: "Tin tức 1",
    category: "health-tips",
    isFeatured: true,
    author: "Dr. Nguyễn",
    publishedDate: "2025-10-01T00:00:00",
    excerpt: "..."
  },
  ...
]
count: 10
```

#### Test 2.3.2: Get Featured News
1. Click **"Test Get Featured News"**

**Expected Response:**
```json
status: 200
data: [ ... ] (chỉ tin featured)
count: 4
```

#### Test 2.3.3: Get News Detail
1. Click **"Test Get News Detail (ID: 1)"**

**Expected Response:**
```json
status: 200
data: {
  id: 1,
  title: "...",
  content: "Full content here...",
  category: "health-tips",
  ...
}
```

#### Test 2.3.4: Get Categories
1. Click **"Test Get Categories"**

**Expected Response:**
```json
status: 200
data: [
  "health-tips",
  "disease-info",
  "hospital-news"
]
```

**✅ All Tests Pass:** 4/4 endpoints success

---

### ⚡ Step 2.4: Test Guides API

Scroll xuống phần **"Guides API (Hướng dẫn)"**

Tương tự News API, test 4 endpoints:
1. **Get All Guides**
2. **Get by Category (appointment)**
3. **Get Guide Detail (ID: 1)**
4. **Get Categories**

**Expected categories:**
```json
[
  "appointment",
  "examination",
  "payment",
  "services"
]
```

**✅ All Tests Pass:** 4/4 endpoints success

---

### ⚡ Step 2.5: Test Appointments API (Requires Auth)

**⚠️ Cần token từ Step 2.1!**

Scroll xuống phần **"Appointments API (Lịch hẹn)"**

#### Test 2.5.1: Get All Appointments
1. Verify token hiển thị trong alert box
2. Click **"Test Get All Appointments"**
3. Chờ response

**Expected Response (Reception sees ALL):**
```json
✓ SUCCESS

status: 200
data: [
  {
    id: 1,
    patientCode: "BN-001",
    patientName: "Nguyễn Văn A",
    doctorName: "BS. Nguyễn Thị B",
    specialty: "Nội khoa",
    appointmentStart: "2025-10-15T09:00:00",
    appointmentEnd: "2025-10-15T09:30:00",
    status: "scheduled",
    reason: "Khám tổng quát"
  },
  ...
]
count: 25
```

**✅ Pass:** 
- Status 200
- Reception thấy TẤT CẢ appointments (count lớn)
- Data có đầy đủ thông tin patient, doctor

**❌ Fail if:**
- Status 401: Token invalid hoặc expired
- Status 403: Permission denied

#### Test 2.5.2: Get Appointment Detail
1. Click **"Test Get Appointment Detail (ID: 1)"**

**Expected Response:**
```json
status: 200
data: {
  id: 1,
  patientId: 1,
  patientCode: "BN-001",
  patientName: "Nguyễn Văn A",
  patientPhone: "0901234567",
  doctorId: 2,
  doctorName: "BS. Nguyễn Thị B",
  specialtyId: 1,
  specialtyName: "Nội khoa",
  appointmentStart: "2025-10-15T09:00:00",
  appointmentEnd: "2025-10-15T09:30:00",
  status: "scheduled",
  reason: "Khám tổng quát",
  createdAt: "2025-10-13T08:00:00",
  createdBy: 5
}
```

**✅ Pass:** Status 200, chi tiết đầy đủ

#### Test 2.5.3: Get History
1. Click **"Test Get History (User ID: 1)"**

**Expected Response:**
```json
status: 200
data: [ ... ] (lịch sử appointments)
```

**✅ Pass:** Status 200

---

### ⚡ Step 2.6: Verify Test Summary

Scroll xuống cuối trang, xem **"Test Summary"**

**Expected Result:**
```
Tổng số tests: 15
Thành công: 15 ✓
Thất bại: 0 ✗
```

**✅ Phase 2 Complete nếu:** 
- 15/15 tests passed
- Không có lỗi 401, 403, 500

---

## 🌐 PHASE 3: FRONTEND TESTING

### ⚡ Step 3.1: Test Reception Dashboard

1. **Mở URL:** http://127.0.0.1:5500/login.html
2. **Login:**
   - Email: reception@clinic.local
   - Password: Reception@123
3. **Auto redirect:** → reception-dashboard.html

**Verify Dashboard Elements:**

#### 3.1.1: Statistics Cards
- [ ] **Lịch hẹn hôm nay:** Hiển thị số (ví dụ: 12)
- [ ] **Chờ xác nhận:** Hiển thị số (ví dụ: 5)
- [ ] **Đã xác nhận:** Hiển thị số (ví dụ: 7)
- [ ] **Hoàn thành:** Hiển thị số (ví dụ: 3)

#### 3.1.2: Quick Actions
- [ ] Button **"Đặt lịch hẹn"** → Click test
- [ ] Button **"Xem lịch hẹn"** → Click test
- [ ] Button **"Quản lý bệnh nhân"** → Click test

#### 3.1.3: Today's Appointments List
- [ ] Hiển thị danh sách lịch hẹn hôm nay
- [ ] Mỗi item có: Tên BN, Bác sĩ, Giờ hẹn, Status
- [ ] Button **"Xác nhận"** hoạt động

#### 3.1.4: Pending Confirmations
- [ ] Hiển thị lịch chờ xác nhận (status: scheduled)
- [ ] Button **"Xác nhận"** → Click test
- [ ] Toast notification xuất hiện

**✅ Dashboard Pass:** Tất cả elements hiển thị đúng, không có lỗi console

---

### ⚡ Step 3.2: Test Reception Appointments

Click **"Quản lý lịch hẹn"** trong menu → reception-appointments.html

#### 3.2.1: View Appointments List
- [ ] Table hiển thị appointments
- [ ] Columns: ID, Mã BN, Tên BN, Bác sĩ, Ngày giờ, Trạng thái, Actions
- [ ] Pagination hoạt động (nếu > 10 items)

#### 3.2.2: Create New Appointment
1. Click **"Đặt lịch hẹn"** (button xanh)
2. Modal mở ra
3. Điền form:
   - **Mã bệnh nhân:** BN-001
   - **Mã bác sĩ:** BS-001
   - **Ngày hẹn:** Chọn ngày mai
   - **Giờ bắt đầu:** 09:00
   - **Giờ kết thúc:** 09:30
   - **Lý do:** Test appointment
4. Click **"Lưu"**

**Expected:**
- [ ] Loading spinner xuất hiện
- [ ] Toast success: "Đã đặt lịch hẹn thành công!"
- [ ] Modal đóng
- [ ] Table refresh với lịch mới

#### 3.2.3: Update Appointment Status
1. Tìm appointment có status "scheduled"
2. Click button **"Xác nhận"** (màu xanh)
3. Confirm dialog xuất hiện
4. Click "OK"

**Expected:**
- [ ] Loading spinner
- [ ] Toast success: "Đã xác nhận lịch hẹn!"
- [ ] Status đổi thành "confirmed"

#### 3.2.4: Cancel Appointment
1. Tìm appointment bất kỳ
2. Click button **"Hủy"** (màu đỏ)
3. Modal mở với textarea lý do hủy
4. Nhập lý do: "Test cancellation"
5. Click **"Xác nhận hủy"**

**Expected:**
- [ ] Loading spinner
- [ ] Toast success: "Đã hủy lịch hẹn!"
- [ ] Status đổi thành "cancelled"

#### 3.2.5: Search & Filter
- [ ] Search box: Nhập "Nguyễn" → Filter results
- [ ] Filter by status: Chọn "scheduled" → Show only scheduled
- [ ] Filter by date: Chọn ngày → Show appointments on that date

**✅ Appointments Management Pass:** CRUD operations hoạt động, no errors

---

### ⚡ Step 3.3: Test Patient Appointments

1. **Logout** khỏi reception account
2. **Login lại với patient:**
   - Email: patient@email.com
   - Password: Patient@123
3. **Navigate:** Profile → Click **"Lịch khám của tôi"**

#### 3.3.1: View Tabs
- [ ] **Tab "Sắp tới":** Hiển thị lịch scheduled/confirmed
- [ ] **Tab "Lịch sử":** Hiển thị lịch completed
- [ ] **Tab "Đã hủy":** Hiển thị lịch cancelled

#### 3.3.2: View Appointment Details
1. Click button **"Chi tiết"** trên 1 appointment
2. Modal mở với thông tin đầy đủ

**Expected Fields:**
- [ ] Mã lịch hẹn
- [ ] Bác sĩ
- [ ] Chuyên khoa
- [ ] Ngày giờ
- [ ] Trạng thái
- [ ] Lý do khám

#### 3.3.3: Update Appointment (Patient)
1. Click **"Thay đổi"** trên lịch scheduled
2. Modal mở với form
3. Sửa ngày giờ
4. Click **"Gửi yêu cầu"**

**Expected:**
- [ ] Form validation hoạt động
- [ ] Loading spinner
- [ ] Toast success: "Đã gửi yêu cầu thay đổi lịch!"
- [ ] Modal đóng

#### 3.3.4: Cancel Appointment (Patient)
1. Click **"Hủy"** trên lịch scheduled
2. Confirm dialog
3. Click "OK"

**Expected:**
- [ ] Loading spinner
- [ ] Toast success: "Đã hủy lịch hẹn thành công!"
- [ ] Appointment chuyển sang tab "Đã hủy"

**✅ Patient View Pass:** Patient chỉ thấy appointments của mình, CRUD hoạt động

---

## 📊 FINAL VERIFICATION

### ✅ Checklist Tổng Kết:

**Database:**
- [x] Password hash updated
- [x] Database connection stable

**API Testing:**
- [ ] Login API: 200 OK, token returned
- [ ] Services API: 3/3 endpoints passed
- [ ] News API: 4/4 endpoints passed
- [ ] Guides API: 4/4 endpoints passed
- [ ] Appointments API: 3/3 endpoints passed (with token)
- [ ] Test Summary: 15/15 passed

**Frontend Testing:**
- [ ] Reception Dashboard: Statistics, Quick actions work
- [ ] Reception Appointments: CRUD operations work
- [ ] Patient Appointments: View/Update/Cancel work
- [ ] Notifications: Toast system works (no alert())
- [ ] Loading: Spinners show during async operations
- [ ] Validation: Form validation real-time feedback

**Authorization:**
- [ ] Reception sees ALL appointments
- [ ] Patient sees ONLY their appointments
- [ ] 401/403 handled correctly

---

## 🐛 ISSUES FOUND (if any)

| Issue ID | Description | Severity | Status |
|----------|-------------|----------|--------|
| - | - | - | - |

---

## 📝 NOTES

- Backend URL: http://localhost:5000
- Frontend URL: http://127.0.0.1:5500
- Test Date: October 13, 2025
- Tester: [Your Name]

---

**Next Steps:**
1. Complete all tests
2. Document issues (if any)
3. Create SPRINT2_TEST_REPORT.md
4. Mark Sprint 2 as COMPLETE ✅
