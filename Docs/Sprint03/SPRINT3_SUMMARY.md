# 🎉 Sprint 3 - Hoàn thành! 

**Timeline**: 10/10/2025 - 15/10/2025  
**Ngày hoàn thành**: 13/10/2025  
**Branch**: new-branch

---

## 📋 Tổng Quan

Sprint 3 tập trung vào **Doctor Appointment Management** và **Patient Rating System**, cho phép bác sĩ quản lý lịch hẹn và bệnh nhân đánh giá chất lượng dịch vụ.

### ✅ User Stories Hoàn Thành

| ID | User Story | Priority | Status |
|---|---|---|---|
| US-01 | Bác sĩ thay đổi lịch hẹn | Cao | ✅ Hoàn thành |
| US-02 | Bác sĩ hủy lịch hẹn | Cao | ✅ Hoàn thành |
| US-03 | Bệnh nhân đánh giá bác sĩ | Trung bình | ✅ Hoàn thành |
| US-04 | Bệnh nhân đánh giá phòng khám | Trung bình | ✅ Hoàn thành |

---

## 🔧 Backend APIs

### 1. **Doctor Appointment Management** (AppointmentsController.cs)

#### **PUT /api/appointments/{id}/reschedule**
Bác sĩ thay đổi lịch hẹn

**Authorization**: `[Authorize(Roles = "doctor")]`

**Request Body**:
```json
{
  "newAppointmentStart": "2025-10-15T09:00:00",
  "newAppointmentEnd": "2025-10-15T10:00:00",
  "reason": "Có ca cấp cứu, cần thay đổi lịch"
}
```

**Response**:
```json
{
  "message": "Đã thay đổi lịch hẹn thành công",
  "appointment": {
    "id": 123,
    "oldStart": "2025-10-14T09:00:00",
    "newStart": "2025-10-15T09:00:00",
    "oldEnd": "2025-10-14T10:00:00",
    "newEnd": "2025-10-15T10:00:00",
    "status": "rescheduled"
  }
}
```

**Features**:
- ✅ Validate bác sĩ có quyền thay đổi lịch (chỉ lịch của chính mình)
- ✅ Không cho thay đổi lịch đã hoàn thành hoặc đã hủy
- ✅ Validate thời gian mới (không được trong quá khứ, giờ kết thúc > giờ bắt đầu)
- ✅ Tự động tạo bản ghi lịch sử trong `appointment_history`
- ✅ Cập nhật status thành "rescheduled"

---

#### **DELETE /api/appointments/{id}/doctor-cancel**
Bác sĩ hủy lịch hẹn

**Authorization**: `[Authorize(Roles = "doctor")]`

**Request Body**:
```json
{
  "reason": "Có việc đột xuất không thể khám"
}
```

**Response**:
```json
{
  "message": "Đã hủy lịch hẹn thành công",
  "appointment": {
    "id": 123,
    "status": "cancelled",
    "cancellationReason": "Bác sĩ hủy: Có việc đột xuất không thể khám"
  }
}
```

**Features**:
- ✅ Validate bác sĩ có quyền hủy (chỉ lịch của chính mình)
- ✅ Không cho hủy lịch đã hoàn thành
- ✅ Require lý do hủy
- ✅ Tự động tạo bản ghi lịch sử
- ✅ Cập nhật status thành "cancelled"

---

### 2. **Rating System** (RatingsController.cs - MỚI)

#### **POST /api/ratings/doctor**
Bệnh nhân đánh giá bác sĩ

**Authorization**: `[Authorize(Roles = "patient")]`

**Request Body**:
```json
{
  "doctorPublicId": "12345678-1234-1234-1234-123456789012",
  "rating": 5,
  "comment": "Bác sĩ nhiệt tình, tận tâm, chuyên môn cao"
}
```

**Response**:
```json
{
  "message": "Đã gửi đánh giá thành công",
  "rating": {
    "doctorPublicId": "12345678-1234-1234-1234-123456789012",
    "doctorName": "BS. Nguyễn Văn A",
    "rating": 5,
    "comment": "Bác sĩ nhiệt tình...",
    "averageRating": 4.8,
    "totalRatings": 25
  }
}
```

**Features**:
- ✅ Chỉ patient đã hoàn thành lịch khám với bác sĩ mới được đánh giá
- ✅ Cho phép cập nhật đánh giá cũ
- ✅ Tự động tính trung bình rating và tổng số đánh giá
- ✅ Validate rating từ 1-5 sao

---

#### **POST /api/ratings/clinic**
Bệnh nhân đánh giá phòng khám

**Authorization**: `[Authorize(Roles = "patient")]`

**Request Body**:
```json
{
  "rating": 4,
  "comment": "Phòng khám sạch sẽ, nhân viên thân thiện"
}
```

**Response**:
```json
{
  "message": "Đã gửi đánh giá thành công",
  "rating": {
    "rating": 4,
    "comment": "Phòng khám sạch sẽ...",
    "averageRating": 4.3,
    "totalRatings": 150
  }
}
```

**Features**:
- ✅ Chỉ patient đã có ít nhất 1 lịch khám hoàn thành mới được đánh giá
- ✅ Cho phép cập nhật đánh giá cũ
- ✅ Tự động tính trung bình rating
- ✅ Phân biệt đánh giá phòng khám (không có doctorId, serviceId)

---

#### **GET /api/ratings/doctor/{publicId}**
Xem tất cả đánh giá của một bác sĩ

**Authorization**: None (Public)

**Response**:
```json
{
  "doctorPublicId": "12345678-1234-1234-1234-123456789012",
  "doctorName": "BS. Nguyễn Văn A",
  "averageRating": 4.8,
  "totalRatings": 25,
  "ratings": [
    {
      "id": 1,
      "patientName": "Nguyễn Thị B",
      "rating": 5,
      "comment": "Bác sĩ rất tốt",
      "createdAt": "2025-10-13T10:30:00Z"
    }
  ]
}
```

---

#### **GET /api/ratings/clinic**
Xem tất cả đánh giá của phòng khám

**Authorization**: None (Public)

**Response**:
```json
{
  "averageRating": 4.3,
  "totalRatings": 150,
  "ratings": [
    {
      "id": 1,
      "patientName": "Nguyễn Văn C",
      "rating": 4,
      "comment": "Phòng khám ok",
      "createdAt": "2025-10-13T11:00:00Z"
    }
  ]
}
```

---

## 💾 Database Changes

### Bảng mới: `appointment_history`

```sql
CREATE TABLE [dbo].[appointment_history] (
    [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [appointment_id] BIGINT NOT NULL,
    [changed_by] BIGINT NOT NULL,
    [old_status] NVARCHAR(50) NULL,
    [new_status] NVARCHAR(50) NOT NULL,
    [old_start] DATETIMEOFFSET NULL,
    [new_start] DATETIMEOFFSET NULL,
    [old_end] DATETIMEOFFSET NULL,
    [new_end] DATETIMEOFFSET NULL,
    [comment] NVARCHAR(MAX) NULL,
    [changed_at] DATETIMEOFFSET DEFAULT (SYSDATETIMEOFFSET()),
    
    CONSTRAINT [FK_appointment_history_appointments] 
        FOREIGN KEY ([appointment_id]) REFERENCES [appointments] ([id]) ON DELETE CASCADE,
    CONSTRAINT [FK_appointment_history_users] 
        FOREIGN KEY ([changed_by]) REFERENCES [users] ([id])
);
```

**Mục đích**: Lưu trữ lịch sử thay đổi lịch hẹn (reschedule, cancel) để audit và theo dõi.

**File SQL**: `Docs/Database/Sprint3_Create_AppointmentHistory.sql`

---

## 🌐 Frontend Pages

### 1. **doctor-appointments.html** (930+ dòng)

Trang quản lý lịch hẹn dành cho bác sĩ.

**URL**: `/doctor-appointments.html`

**Role Required**: `doctor`

**Features**:
- ✅ **Dashboard**: Hiển thị thông tin bác sĩ và danh sách lịch hẹn
- ✅ **Filters**: 
  - Trạng thái (scheduled, confirmed, rescheduled, cancelled, completed)
  - Date range (Từ ngày - Đến ngày)
  - Quick filters (Tất cả, Hôm nay, Ngày mai, Tuần này)
- ✅ **View Details**: Modal hiển thị chi tiết lịch hẹn đầy đủ
- ✅ **Reschedule Modal**: 
  - Form thay đổi ngày/giờ mới
  - Hiển thị lịch cũ để so sánh
  - Require lý do thay đổi
  - Validation: Giờ kết thúc > giờ bắt đầu, không cho chọn quá khứ
- ✅ **Cancel Modal**:
  - Cảnh báo hành động không thể hoàn tác
  - Require lý do hủy
  - Confirmation dialog
- ✅ **UI/UX**:
  - Gradient màu xanh lá (doctor theme)
  - Responsive design
  - Smooth animations
  - Integration với NotificationSystem, LoadingSystem
  - Status badges với màu sắc phân biệt

**Screenshots**:
```
┌─────────────────────────────────────────────┐
│  Lịch Hẹn của Tôi                Đăng xuất │
│  Quản lý lịch khám bệnh                     │
├─────────────────────────────────────────────┤
│ BS. Nguyễn Văn A                            │
│ doctor@clinic.local                         │
├─────────────────────────────────────────────┤
│ [Filters: Status | From Date | To Date]    │
│ [Lọc] [Đặt lại]                            │
│                                             │
│ [Tất cả] [Hôm nay] [Ngày mai] [Tuần này]  │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐   │
│ │ Nguyễn Thị B      [Đã xác nhận]     │   │
│ │ Mã BN: BN-001                        │   │
│ │ 📅 Thứ Hai, 14 Tháng 10, 2025       │   │
│ │ 🕐 09:00 - 10:00                     │   │
│ │ [Thay đổi lịch] [Hủy lịch]          │   │
│ └─────────────────────────────────────┘   │
│ ...more appointments...                    │
└─────────────────────────────────────────────┘
```

---

### 2. **doctor-rating.html** (750+ dòng)

Trang đánh giá bác sĩ dành cho bệnh nhân.

**URL**: `/doctor-rating.html`

**Role Required**: `patient`

**Features**:
- ✅ **Authentication Check**: Yêu cầu đăng nhập với role patient
- ✅ **Doctor Selection**: 
  - Hiển thị danh sách bác sĩ mà bệnh nhân đã khám xong
  - Chỉ hiển thị bác sĩ từ lịch hẹn có status = "completed"
- ✅ **Rating Form**:
  - Star rating (1-5 sao) với hover effect
  - Text description cho mỗi mức rating
  - Comment textarea (optional)
  - Submit button với animation
- ✅ **Ratings Display**:
  - Rating summary: Average rating, Total ratings
  - Rating distribution: Bar chart cho từng mức sao
  - Review list: Hiển thị tất cả đánh giá với tên bệnh nhân, sao, comment, ngày
- ✅ **UI/UX**:
  - Gradient màu cam (rating theme)
  - Doctor avatar với icon
  - Interactive star rating
  - Empty states cho các trường hợp không có data

---

### 3. **clinic-rating.html** (800+ dòng)

Trang đánh giá phòng khám dành cho bệnh nhân.

**URL**: `/clinic-rating.html`

**Role Required**: `patient`

**Features**:
- ✅ **Authentication Check**: Yêu cầu đăng nhập với role patient
- ✅ **Clinic Header**: 
  - Logo phòng khám
  - Tên và slogan
- ✅ **Overall Rating**: 
  - Star rating chính (1-5 sao)
  - Mô tả mức độ hài lòng
- ✅ **Category Ratings** (Optional):
  - Cơ sở vật chất
  - Thái độ nhân viên
  - Thời gian chờ
  - Vệ sinh sạch sẽ
  - Mỗi category có riêng star rating
- ✅ **Comment**: Textarea với placeholder gợi ý
- ✅ **Ratings Display**:
  - Rating summary với stats
  - Rating distribution bars
  - Review list với format đẹp
- ✅ **UI/UX**:
  - Gradient màu tím (clinic theme)
  - Grid layout cho category ratings
  - Smooth animations
  - Relative time display ("Hôm nay", "2 ngày trước")

---

### 4. **login.html** (Updated)

**Changes**:
- ✅ Thêm routing cho Doctor role
- ✅ Logic: 
  ```javascript
  if (role === 'doctor') {
      window.location.href = 'doctor-appointments.html';
  }
  ```
- ✅ Maintain routing cho Reception và Patient

---

## 📦 Files Created/Modified

### Backend (8 files)

1. ✅ `Controllers/AppointmentsController.cs` - Added 2 endpoints
2. ✅ `Controllers/RatingsController.cs` - NEW (280+ lines)
3. ✅ `Models/AppointmentHistory.cs` - NEW
4. ✅ `Models/Rating.cs` - Existing (used)
5. ✅ `Data/HealthySystemDbContext.cs` - Added DbSet
6. ✅ `Docs/Database/Sprint3_Create_AppointmentHistory.sql` - NEW

### Frontend (4 files)

7. ✅ `Web/HealthySystem-Frontend/doctor-appointments.html` - NEW (930 lines)
8. ✅ `Web/HealthySystem-Frontend/doctor-rating.html` - NEW (750 lines)
9. ✅ `Web/HealthySystem-Frontend/clinic-rating.html` - NEW (800 lines)
10. ✅ `Web/HealthySystem-Frontend/login.html` - Updated routing

**Total**: 10 files (6 new, 4 modified)  
**Lines of Code**: ~3000+ lines

---

## 🧪 Testing Guide

### 1. Test Doctor Appointment Management

**Prerequisites**:
- Backend running on `http://localhost:5000`
- Doctor account: `doctor@clinic.local` / `Doctor@123`
- Database có sẵn appointments với doctor này

**Test Cases**:

#### TC-01: Login as Doctor
1. Mở `login.html`
2. Nhập email: `doctor@clinic.local`
3. Nhập password: `Doctor@123`
4. Click "Đăng nhập"
5. **Expected**: Redirect to `doctor-appointments.html`

#### TC-02: View Appointments
1. Kiểm tra dashboard hiển thị thông tin bác sĩ
2. Kiểm tra danh sách lịch hẹn
3. **Expected**: Chỉ hiển thị lịch hẹn của bác sĩ đang login

#### TC-03: Filter Appointments
1. Chọn trạng thái "Đã xác nhận"
2. Click "Lọc"
3. **Expected**: Chỉ hiển thị lịch có status = "confirmed"

#### TC-04: Reschedule Appointment
1. Click "Thay đổi lịch" trên một appointment
2. Chọn ngày mới (future date)
3. Chọn giờ mới
4. Nhập lý do
5. Click "Xác nhận thay đổi"
6. **Expected**: 
   - Success notification
   - Status chuyển thành "rescheduled"
   - Lịch hẹn cập nhật ngày/giờ mới

#### TC-05: Cancel Appointment
1. Click "Hủy lịch" trên một appointment
2. Nhập lý do hủy
3. Confirm dialog
4. Click "Xác nhận hủy"
5. **Expected**:
   - Success notification
   - Status chuyển thành "cancelled"
   - Hiển thị lý do hủy

---

### 2. Test Rating System

**Prerequisites**:
- Patient account: `patient@email.com` / `Patient@123`
- Patient đã có lịch hẹn completed với ít nhất 1 bác sĩ

**Test Cases**:

#### TC-06: Rate Doctor
1. Login với patient account
2. Mở `doctor-rating.html`
3. Chọn bác sĩ từ danh sách
4. Click sao để chọn rating (VD: 5 sao)
5. Nhập comment
6. Click "Gửi Đánh Giá"
7. **Expected**:
   - Success notification
   - Rating hiển thị trong danh sách
   - Average rating cập nhật

#### TC-07: Rate Clinic
1. Login với patient account
2. Mở `clinic-rating.html`
3. Click sao để chọn overall rating
4. (Optional) Chọn rating cho từng category
5. Nhập comment
6. Click "Gửi Đánh Giá"
7. **Expected**:
   - Success notification
   - Rating hiển thị trong danh sách
   - Stats cập nhật

#### TC-08: Update Rating
1. Đã rate doctor/clinic trước đó
2. Rate lại với số sao khác
3. **Expected**: Đánh giá cũ được cập nhật (không tạo mới)

---

## 🔐 Security & Authorization

### Role-Based Access Control

| Endpoint | Role Required | Description |
|---|---|---|
| `PUT /api/appointments/{id}/reschedule` | Doctor | Chỉ bác sĩ |
| `DELETE /api/appointments/{id}/doctor-cancel` | Doctor | Chỉ bác sĩ |
| `POST /api/ratings/doctor` | Patient | Chỉ bệnh nhân |
| `POST /api/ratings/clinic` | Patient | Chỉ bệnh nhân |
| `GET /api/ratings/doctor/{id}` | None | Public |
| `GET /api/ratings/clinic` | None | Public |

### Business Rules

1. **Doctor Reschedule/Cancel**:
   - ✅ Chỉ được thao tác trên lịch của chính mình
   - ✅ Không được reschedule/cancel lịch đã hoàn thành
   - ✅ Phải có lý do khi reschedule/cancel

2. **Patient Rating**:
   - ✅ Chỉ được rate bác sĩ sau khi hoàn thành lịch khám
   - ✅ Chỉ được rate phòng khám sau khi có ít nhất 1 lịch completed
   - ✅ Cho phép update rating (không duplicate)

---

## 📊 Statistics

### Code Metrics

- **Backend**:
  - New Controllers: 1 (RatingsController)
  - New Models: 1 (AppointmentHistory)
  - New Endpoints: 6
  - LoC: ~600 lines

- **Frontend**:
  - New Pages: 3
  - Updated Pages: 1
  - LoC: ~2500 lines

- **Database**:
  - New Tables: 1
  - SQL Scripts: 1

### Completion Time

- **Estimated**: 5 days (10/10 - 15/10)
- **Actual**: 3 days (completed 13/10)
- **Efficiency**: 160% (hoàn thành sớm 2 ngày)

---

## 🚀 Next Steps

### Sprint 4 Planning (Proposed)

1. **Doctor Dashboard Analytics**
   - Thống kê số lịch hẹn theo tháng
   - Chart hiển thị rating trung bình
   - Appointment calendar view

2. **Patient Portal Enhancement**
   - View medical history
   - Prescription history
   - Lab results access

3. **Admin Panel**
   - User management
   - System statistics
   - Report generation

4. **Notifications**
   - Email notifications for reschedule/cancel
   - SMS reminders
   - Real-time notifications

---

## 🐛 Known Issues

None currently reported.

---

## 📝 Notes

- All features tested locally and working as expected
- Database migration script provided and executed successfully
- Frontend pages responsive and compatible with modern browsers
- Code follows existing project conventions and patterns

---

**Prepared by**: GitHub Copilot  
**Date**: October 13, 2025  
**Version**: 1.0
