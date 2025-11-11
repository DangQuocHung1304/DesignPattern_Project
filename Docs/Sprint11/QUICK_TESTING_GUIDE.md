# 🧪 Sprint 11 - Quick Testing Guide

## ⚡ Quick Start

### Prerequisites
- ✅ Database migration đã chạy (`Add_ProfileImage_Column.sql`)
- ✅ Backend đang chạy (`dotnet run` trong HealthySystem.WebAPI)
- ✅ Frontend đang phục vụ qua web server hoặc Live Server
- ✅ Có ảnh test (JPG/PNG/GIF, dưới 5MB)

---

## 🎯 Test Scenarios

### 1️⃣ Test Public Service Prices Page (2 phút)

**Steps:**
1. Mở browser: `http://localhost:5500/service-prices.html`
2. ✅ Check: Header "Bảng Giá Dịch Vụ Phòng Khám" hiển thị
3. ✅ Check: 4 sections hiển thị:
   - Dịch vụ Khám bệnh
   - Dịch vụ Xét nghiệm
   - Dịch vụ Chẩn đoán hình ảnh
   - Dịch vụ khác
4. ✅ Check: Giá tiền format đúng (VND)
5. ✅ Check: Responsive trên mobile

**Expected:** Tất cả dịch vụ hiển thị với giá chuẩn

---

### 2️⃣ Test Health News List Page (3 phút)

**Steps:**
1. Mở browser: `http://localhost:5500/health-news.html`
2. ✅ Check: 9 bài viết hiển thị (page 1)
3. ✅ Check: Badge "Nổi bật" trên các bài featured
4. Click tab "Dinh dưỡng"
   - ✅ Check: Chỉ hiển thị bài category "Dinh dưỡng"
5. Click pagination "Trang 2"
   - ✅ Check: Load 9 bài tiếp theo
6. Click vào 1 bài viết
   - ✅ Check: Navigate to `health-news-detail.html?id={id}`

**Expected:** Pagination works, filter works, navigation works

---

### 3️⃣ Test Health News Detail Page (3 phút)

**Steps:**
1. Mở: `http://localhost:5500/health-news-detail.html?id=1`
2. ✅ Check: Tiêu đề bài viết hiển thị
3. ✅ Check: Featured image hiển thị (nếu có)
4. ✅ Check: Nội dung HTML render đúng
5. ✅ Check: Meta info (Tác giả, Ngày đăng, Lượt xem)
6. ✅ Check: 3 "Bài viết liên quan" hiển thị ở cuối
7. Click icon Facebook/Twitter/LinkedIn
   - ✅ Check: Mở popup share (có thể block popup)
8. Click "In bài viết"
   - ✅ Check: Print dialog mở

**Expected:** Full article with images, related posts, share buttons work

---

### 4️⃣ Test Doctor Profile Image Upload (5 phút)

**Steps:**
1. **Login** vào hệ thống với tài khoản bác sĩ
   - Email: `doctor@test.com` (hoặc bác sĩ có sẵn)
   - Password: `Doctor@123` (hoặc password có sẵn)

2. Navigate to: `http://localhost:5500/doctor-profile-edit.html`

3. **Check ảnh hiện tại:**
   - ✅ Profile image section hiển thị
   - ✅ Nếu có ảnh cũ, load từ database
   - ✅ Nếu chưa có, hiển thị UI Avatar placeholder

4. **Test Upload:**
   - Click "Chọn ảnh"
   - Chọn file `test-avatar.jpg` (< 5MB)
   - ✅ Check: Preview hiển thị ngay trong circular frame
   - ✅ Check: Button "Upload ảnh" xuất hiện

5. **Test Validation:**
   - Thử chọn file PDF
     - ✅ Error: "Chỉ chấp nhận file ảnh JPG, PNG, GIF"
   - Thử chọn file > 5MB
     - ✅ Error: "Kích thước file không được vượt quá 5MB"

6. **Upload:**
   - Chọn file hợp lệ
   - Click "Upload ảnh"
   - ✅ Check: Progress bar hiển thị và chạy
   - ✅ Check: Success message: "Upload ảnh thành công!"
   - ✅ Check: Ảnh mới hiển thị trong preview
   - ✅ Check: Button "Upload ảnh" biến mất

7. **Verify in Database:**
   ```sql
   SELECT user_id, profile_image_url 
   FROM staff_profiles 
   WHERE user_id = {doctor_user_id};
   ```
   - ✅ Check: `profile_image_url` có giá trị `/uploads/doctors/{guid}.jpg`

8. **Verify File System:**
   - Navigate to `wwwroot/uploads/doctors/`
   - ✅ Check: File ảnh tồn tại với tên unique (GUID)

**Expected:** Upload thành công, preview update, database updated, file saved

---

### 5️⃣ Test Admin Upload Image for Staff (5 phút)

**Steps:**
1. **Login Admin:**
   - Email: `admin@test.com`
   - Password: `Admin@123`

2. Navigate to: `http://localhost:5500/admin-dashboard.html`

3. Click tab **"Tạo tài khoản"**

4. **Fill Form:**
   - Chọn: ☑ Bác sĩ
   - Họ: `Nguyễn`
   - Tên: `Test Sprint11`
   - Email: `doctor.sprint11@test.com`
   - SĐT: `0901234567`
   - Password: `Test@123`
   - Xác nhận: `Test@123`

5. **Upload Image:**
   - Scroll to field "Ảnh đại diện"
   - Click "Choose File"
   - Chọn `test-doctor.jpg`
   - ✅ Check: Preview hiển thị ngay (150x150 styled container)

6. **Fill Doctor Fields:**
   - Chuyên khoa: `Nội khoa`
   - Ngày sinh: `1990-01-01`
   - Giới tính: `Nam`

7. **Submit:**
   - Click "Tạo tài khoản"
   - ✅ Check: Success message hiển thị
   - ✅ Check: Form reset (bao gồm cả image preview)

8. **Verify:**
   - Query database:
     ```sql
     SELECT u.email, sp.profile_image_url 
     FROM users u
     JOIN staff_profiles sp ON u.user_id = sp.user_id
     WHERE u.email = 'doctor.sprint11@test.com';
     ```
   - ✅ Check: Record tồn tại với `profile_image_url` có giá trị

9. **Verify File:**
   - Check `wwwroot/uploads/doctors/`
   - ✅ Check: File mới được tạo

**Expected:** Account created, image uploaded, preview works, validation works

---

### 6️⃣ Test File Validation (3 phút)

**Test Cases:**

#### A. Invalid File Type
```
File: test-document.pdf
Expected: ❌ "Chỉ chấp nhận file ảnh JPG, PNG, GIF"
```

#### B. File Too Large
```
File: large-image-10mb.jpg (10MB)
Expected: ❌ "Kích thước file không được vượt quá 5MB"
```

#### C. Valid Files
```
File: test1.jpg (2MB) ✅
File: test2.png (3MB) ✅
File: test3.gif (1MB) ✅
```

#### D. No File Selected
```
Action: Click "Upload ảnh" without selecting file
Expected: ❌ "Vui lòng chọn file ảnh" (if applicable)
```

---

### 7️⃣ Test API Endpoints (5 phút)

#### Using Postman/Thunder Client:

**1. Public Service Prices**
```http
GET https://localhost:7034/api/public/service-prices

Expected: 200 OK
Response: [
  {
    "category": "Khám bệnh",
    "services": [...]
  },
  ...
]
```

**2. Public Health News List**
```http
GET https://localhost:7034/api/public/health-news?page=1&category=Dinh%20dưỡng

Expected: 200 OK
Response: {
  "totalItems": 15,
  "currentPage": 1,
  "totalPages": 2,
  "items": [...]
}
```

**3. Public Health News Detail**
```http
GET https://localhost:7034/api/public/health-news/1

Expected: 200 OK
Response: {
  "id": 1,
  "title": "...",
  "content": "...",
  "viewCount": 123, // Incremented by 1
  ...
}
```

**4. Doctor Upload Image**
```http
POST https://localhost:7034/api/doctorprofile/profile-image
Authorization: Bearer {doctor-token}
Content-Type: multipart/form-data
Body: 
  - image: [file]

Expected: 200 OK
Response: {
  "message": "Upload ảnh thành công",
  "imageUrl": "/uploads/doctors/xxx.jpg"
}
```

**5. Admin Upload Image for Staff**
```http
POST https://localhost:7034/api/admin/users/12/profile-image
Authorization: Bearer {admin-token}
Content-Type: multipart/form-data
Body:
  - image: [file]

Expected: 200 OK
Response: {
  "message": "Upload ảnh thành công",
  "imageUrl": "/uploads/doctors/xxx.jpg"
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot read properties of null"
**Cause:** Element ID không tồn tại  
**Solution:** Check HTML có đúng ID không

### Issue 2: CORS Error
**Cause:** Backend không cho phép origin của frontend  
**Solution:** Thêm CORS policy trong `Program.cs`

### Issue 3: 401 Unauthorized
**Cause:** Token không hợp lệ hoặc hết hạn  
**Solution:** Login lại để lấy token mới

### Issue 4: File not found after upload
**Cause:** Folder `wwwroot/uploads/doctors/` không tồn tại  
**Solution:** 
```bash
mkdir -p wwwroot/uploads/doctors
chmod 755 wwwroot/uploads/doctors
```

### Issue 5: Image preview not showing
**Cause:** FileReader API not supported (old browser)  
**Solution:** Update browser to latest version

### Issue 6: Database column not found
**Cause:** Migration script chưa chạy  
**Solution:** Run `Add_ProfileImage_Column.sql`

---

## ✅ Final Verification Checklist

### Backend APIs
- [ ] GET /api/public/service-prices → 200 OK
- [ ] GET /api/public/health-news → 200 OK (with pagination)
- [ ] GET /api/public/health-news/{id} → 200 OK (view count +1)
- [ ] GET /api/public/health-news/featured → 200 OK
- [ ] GET /api/public/health-news/{id}/related → 200 OK
- [ ] POST /api/doctorprofile/profile-image → 200 OK
- [ ] POST /api/admin/users/{userId}/profile-image → 200 OK

### Frontend Pages
- [ ] service-prices.html loads and displays all services
- [ ] health-news.html loads with pagination
- [ ] health-news-detail.html displays full content
- [ ] doctor-profile-edit.html image upload works
- [ ] admin-dashboard.html create account with image works

### Database
- [ ] Column `profile_image_url` exists in `staff_profiles`
- [ ] Sample data loaded (10 doctors with UI Avatars)
- [ ] View counts increase when accessing news detail

### File System
- [ ] Folder `wwwroot/uploads/doctors/` exists
- [ ] Uploaded files have unique GUID names
- [ ] Old images deleted when new image uploaded

### Security
- [ ] Only JPG/PNG/GIF accepted
- [ ] File size limited to 5MB
- [ ] Authentication required for upload APIs
- [ ] Doctor can only upload for themselves
- [ ] Admin can upload for any staff

---

## 📊 Testing Summary Template

**Tester:** _______________  
**Date:** _______________  
**Environment:** Development / Staging / Production

| Test Case | Status | Notes |
|-----------|--------|-------|
| Public Service Prices | ⬜ Pass / ❌ Fail | |
| Health News List | ⬜ Pass / ❌ Fail | |
| Health News Detail | ⬜ Pass / ❌ Fail | |
| Doctor Image Upload | ⬜ Pass / ❌ Fail | |
| Admin Image Upload | ⬜ Pass / ❌ Fail | |
| File Validation | ⬜ Pass / ❌ Fail | |
| API Endpoints | ⬜ Pass / ❌ Fail | |

**Overall Result:** ⬜ All Pass / ❌ Some Failed

**Issues Found:**
1. _______________
2. _______________

**Sign-off:** _______________

---

## 🎯 Quick Commands

### Start Backend
```bash
cd Backend/HealthySystem.WebAPI
dotnet run
```

### Start Frontend (Live Server)
```bash
# Install Live Server extension in VS Code
# Right-click on HTML file → "Open with Live Server"
```

### Database Query
```sql
-- Check all doctors with images
SELECT 
    u.email,
    CONCAT(u.first_name, ' ', u.last_name) AS full_name,
    sp.profile_image_url
FROM users u
JOIN staff_profiles sp ON u.user_id = sp.user_id
WHERE sp.profile_image_url IS NOT NULL;
```

### Clear Test Data
```sql
-- Remove test accounts
DELETE FROM users WHERE email LIKE '%sprint11%';

-- Clear uploaded images
-- Manually delete files in wwwroot/uploads/doctors/
```

---

**Testing Time Estimate:** 25-30 minutes total  
**Priority:** HIGH (Sprint 11 deployment blocker)  
**Status:** Ready for Testing ✅

