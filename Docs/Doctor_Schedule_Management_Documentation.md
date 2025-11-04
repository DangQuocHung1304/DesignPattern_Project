# Chức năng Quản lý Lịch làm việc Bác sĩ - Tài liệu Kỹ thuật

## 📋 Tổng quan

Chức năng mới cho phép:
- **Admin**: Tạo và quản lý lịch làm việc tuần cho bác sĩ (CRUD đầy đủ)
- **Bác sĩ**: Xem lịch làm việc của mình (chỉ đọc)
- **Bệnh nhân**: Đặt lịch khám dựa trên lịch làm việc có sẵn của bác sĩ

## 🗄️ Database Schema

### Bảng `doctor_schedules`

```sql
CREATE TABLE doctor_schedules (
    id INT IDENTITY(1,1) PRIMARY KEY,
    doctor_id INT NOT NULL,
    day_of_week INT NOT NULL,          -- 0=Sunday, 1=Monday, ..., 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BIT NOT NULL DEFAULT 1,
    max_appointments_per_slot INT NOT NULL DEFAULT 4,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NULL,
    
    CONSTRAINT FK_doctor_schedules_doctor 
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT UQ_doctor_schedule 
        UNIQUE (doctor_id, day_of_week, start_time)
);

CREATE INDEX IX_doctor_schedules_doctor_id ON doctor_schedules(doctor_id);
CREATE INDEX IX_doctor_schedules_day_of_week ON doctor_schedules(day_of_week);
CREATE INDEX IX_doctor_schedules_is_available ON doctor_schedules(is_available);
```

### View `v_doctor_schedules` (Helper)

```sql
CREATE VIEW v_doctor_schedules AS
SELECT 
    ds.id,
    ds.doctor_id,
    u.first_name + ' ' + u.last_name AS doctor_name,
    ds.day_of_week,
    CASE ds.day_of_week
        WHEN 0 THEN 'Chủ nhật'
        WHEN 1 THEN 'Thứ hai'
        WHEN 2 THEN 'Thứ ba'
        WHEN 3 THEN 'Thứ tư'
        WHEN 4 THEN 'Thứ năm'
        WHEN 5 THEN 'Thứ sáu'
        WHEN 6 THEN 'Thứ bảy'
    END AS day_name,
    ds.start_time,
    ds.end_time,
    ds.is_available,
    ds.max_appointments_per_slot,
    ds.created_at,
    ds.updated_at
FROM doctor_schedules ds
INNER JOIN users u ON ds.doctor_id = u.id
WHERE u.role = 'doctor' AND u.status = 'active';
```

### Function `fn_IsDoctorAvailable` (Validation Helper)

```sql
CREATE FUNCTION fn_IsDoctorAvailable(
    @doctorId INT,
    @appointmentDate DATE,
    @appointmentTime TIME
) RETURNS BIT
AS
BEGIN
    DECLARE @dayOfWeek INT = DATEPART(WEEKDAY, @appointmentDate) - 1;
    
    IF EXISTS (
        SELECT 1 
        FROM doctor_schedules
        WHERE doctor_id = @doctorId
            AND day_of_week = @dayOfWeek
            AND is_available = 1
            AND @appointmentTime >= start_time
            AND @appointmentTime < end_time
    )
        RETURN 1;
    
    RETURN 0;
END;
```

## 🔧 Backend API

### Model

**File**: `Backend/HealthySystem.API/Models/DoctorSchedule.cs` (48 lines)

```csharp
public class DoctorSchedule
{
    public int Id { get; set; }
    public long DoctorId { get; set; }
    public int DayOfWeek { get; set; }          // 0-6
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public bool IsAvailable { get; set; }
    public int MaxAppointmentsPerSlot { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    public virtual User? Doctor { get; set; }
}
```

### API Endpoints

**File**: `Backend/HealthySystem.WebAPI/Controllers/AdminController.cs`

#### 1. Lấy tất cả lịch làm việc (Admin only)
```
GET /api/admin/schedules/all
Authorization: Bearer {token}
Role: admin

Response:
{
    "success": true,
    "data": [
        {
            "id": 1,
            "doctorId": 2,
            "doctorName": "Nguyễn Văn A",
            "dayOfWeek": 1,
            "dayName": "Thứ hai",
            "startTime": "08:00",
            "endTime": "12:00",
            "isAvailable": true,
            "maxAppointmentsPerSlot": 4,
            "createdAt": "2025-11-04T10:00:00"
        }
    ]
}
```

#### 2. Lấy lịch làm việc của một bác sĩ (Admin + Doctor)
```
GET /api/admin/doctors/{doctorId}/schedules
Authorization: Bearer {token}
Role: admin, doctor

Response:
{
    "success": true,
    "data": {
        "doctorId": 2,
        "doctorName": "Nguyễn Văn A",
        "schedules": [...]
    }
}
```

#### 3. Tạo lịch làm việc mới (Admin only)
```
POST /api/admin/doctors/{doctorId}/schedules
Authorization: Bearer {token}
Role: admin

Body:
{
    "dayOfWeek": 1,
    "startTime": "08:00",
    "endTime": "12:00",
    "maxAppointmentsPerSlot": 4,
    "isAvailable": true
}

Response:
{
    "success": true,
    "message": "Tạo lịch làm việc thành công",
    "data": {...}
}
```

#### 4. Cập nhật lịch làm việc (Admin only)
```
PUT /api/admin/schedules/{scheduleId}
Authorization: Bearer {token}
Role: admin

Body:
{
    "startTime": "09:00",
    "endTime": "13:00",
    "maxAppointmentsPerSlot": 5,
    "isAvailable": true
}
```

#### 5. Xóa lịch làm việc (Admin only)
```
DELETE /api/admin/schedules/{scheduleId}
Authorization: Bearer {token}
Role: admin

Response:
{
    "success": true,
    "message": "Đã xóa lịch làm việc"
}
```

#### 6. Lấy danh sách bác sĩ (Admin only)
```
GET /api/admin/doctors
Authorization: Bearer {token}
Role: admin

Response:
{
    "success": true,
    "data": [
        {
            "id": 2,
            "fullName": "Nguyễn Văn A",
            "email": "doctor@example.com",
            "phone": "0123456789"
        }
    ]
}
```

#### 7. Lấy các time slots có sẵn (Public API)
```
GET /api/admin/doctors/{doctorId}/available-slots?date=2025-11-05
Authorization: None (AllowAnonymous)

Response:
{
    "success": true,
    "data": {
        "doctorId": 2,
        "date": "2025-11-05",
        "dayOfWeek": 2,
        "dayName": "Thứ ba",
        "availableSlots": [
            {
                "startTime": "08:00",
                "endTime": "12:00",
                "maxSlots": 4,
                "bookedSlots": 1,
                "remainingSlots": 3,
                "isAvailable": true
            },
            {
                "startTime": "13:00",
                "endTime": "17:00",
                "maxSlots": 4,
                "bookedSlots": 4,
                "remainingSlots": 0,
                "isAvailable": false
            }
        ],
        "allSlots": [...]
    }
}
```

### DTO Classes

```csharp
public class CreateDoctorScheduleRequest
{
    public int DayOfWeek { get; set; }
    public string StartTime { get; set; }
    public string EndTime { get; set; }
    public bool IsAvailable { get; set; } = true;
    public int MaxAppointmentsPerSlot { get; set; } = 4;
}

public class UpdateDoctorScheduleRequest
{
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public bool? IsAvailable { get; set; }
    public int? MaxAppointmentsPerSlot { get; set; }
}
```

### Validation Logic

Backend tự động kiểm tra:
- ✅ StartTime < EndTime
- ✅ Không trùng lặp lịch làm việc (cùng bác sĩ, cùng ngày, cùng khoảng thời gian)
- ✅ Doctor có tồn tại và có role='doctor'
- ✅ DayOfWeek hợp lệ (0-6)

## 🎨 Frontend UI

### 1. Admin Dashboard (admin-dashboard.html)

**Tab mới**: "Lịch làm việc BS"

**Chức năng**:
- Chọn bác sĩ từ dropdown
- Xem lịch làm việc theo tuần (Weekly Calendar View)
- Thêm lịch làm việc mới
- Sửa lịch làm việc hiện có
- Xóa lịch làm việc
- Xem danh sách chi tiết

**Giao diện**:
```
+------------------------------------------+
| Chọn bác sĩ: [Dropdown]  [Thêm lịch]   |
+------------------------------------------+
| Lịch làm việc tuần của BS. Nguyễn Văn A |
+------------------------------------------+
| Thứ hai   | 08:00-12:00 (4 BN) [✏️][🗑️] |
|           | 13:00-17:00 (4 BN) [✏️][🗑️] |
| Thứ ba    | 08:00-12:00 (4 BN) [✏️][🗑️] |
| ...       | ...                          |
+------------------------------------------+
```

**JavaScript Functions**:
- `loadDoctors()` - Tải danh sách bác sĩ
- `loadDoctorSchedules()` - Tải lịch làm việc
- `renderScheduleCalendar()` - Render lịch tuần
- `renderScheduleList()` - Render danh sách chi tiết
- `showAddScheduleModal()` - Hiện modal thêm mới
- `editSchedule(id)` - Sửa lịch
- `saveSchedule()` - Lưu lịch (create/update)
- `deleteSchedule(id)` - Xóa lịch

### 2. Doctor Schedule View (doctor-schedule.html)

**Trang mới**: Bác sĩ xem lịch làm việc của mình

**Chức năng**:
- Chỉ xem, không chỉnh sửa
- Thống kê: Số ngày làm việc/tuần, tổng giờ, tổng ca
- Lịch tuần với status (Hoạt động/Tạm dừng)
- Danh sách chi tiết với thời lượng

**Giao diện**:
```
+------------------------------------------+
| 📊 Thống kê                              |
| 5 ngày/tuần | 40 giờ/tuần | 10 ca/tuần   |
+------------------------------------------+
| Thứ hai                                  |
| ⏰ 08:00-12:00 (Max 4 BN) ✅ Hoạt động   |
| ⏰ 13:00-17:00 (Max 4 BN) ✅ Hoạt động   |
+------------------------------------------+
```

**JavaScript Functions**:
- `loadDoctorSchedules()` - Tải lịch của bác sĩ hiện tại
- `renderSchedules()` - Render lịch tuần
- `renderDaySchedule()` - Render lịch một ngày
- `renderScheduleList()` - Render danh sách
- `calculateSummary()` - Tính thống kê

**Access**: 
- URL: `doctor-schedule.html`
- Role: doctor only
- Link từ doctor-dashboard.html

### 3. Patient Booking Integration (book-appointment.html)

**Tích hợp**: Chọn giờ khám dựa trên lịch làm việc bác sĩ

**API Call trong Step 2 - Chọn thời gian**:

```javascript
async function loadAvailableTimeSlots(doctorId, date) {
    const response = await fetch(
        `${API_URL}/admin/doctors/${doctorId}/available-slots?date=${date}`
    );
    const result = await response.json();
    
    if (result.success) {
        const availableSlots = result.data.availableSlots;
        renderTimeSlots(availableSlots);
    }
}

function renderTimeSlots(slots) {
    let html = '';
    slots.forEach(slot => {
        if (slot.isAvailable) {
            html += `
                <div class="time-slot" data-time="${slot.startTime}">
                    ${slot.startTime} - ${slot.endTime}
                    <small>(Còn ${slot.remainingSlots} chỗ)</small>
                </div>
            `;
        }
    });
    document.getElementById('time-slots-container').innerHTML = html;
}
```

## 📊 Luồng hoạt động

### 1. Admin tạo lịch làm việc cho bác sĩ

```
Admin → Chọn BS → Tab "Lịch làm việc BS" 
     → Nhấn "Thêm lịch" 
     → Chọn thứ, giờ, số BN
     → Lưu 
     → API POST /api/admin/doctors/{id}/schedules
     → Database insert doctor_schedules
     → Reload lịch tuần
```

### 2. Bác sĩ xem lịch làm việc

```
Doctor → Login 
       → doctor-dashboard.html 
       → Nhấn "Xem lịch làm việc"
       → doctor-schedule.html
       → API GET /api/admin/doctors/{currentUserId}/schedules
       → Hiển thị lịch tuần + thống kê
```

### 3. Bệnh nhân đặt lịch khám

```
Patient → book-appointment.html
        → Chọn bác sĩ (Step 1)
        → Chọn ngày (Step 2)
        → API GET /api/admin/doctors/{doctorId}/available-slots?date={date}
        → Hiển thị các time slots còn trống
        → Chọn giờ
        → Điền thông tin (Step 3)
        → Xác nhận (Step 4)
        → API POST /api/appointments/book
        → Kiểm tra fn_IsDoctorAvailable()
        → Tạo appointment nếu hợp lệ
```

## 🔒 Phân quyền

| Chức năng | Admin | Doctor | Patient | Public |
|-----------|-------|--------|---------|--------|
| Xem tất cả lịch làm việc | ✅ | ❌ | ❌ | ❌ |
| Xem lịch của một BS | ✅ | ✅* | ❌ | ❌ |
| Tạo lịch làm việc | ✅ | ❌ | ❌ | ❌ |
| Sửa lịch làm việc | ✅ | ❌ | ❌ | ❌ |
| Xóa lịch làm việc | ✅ | ❌ | ❌ | ❌ |
| Xem time slots available | ✅ | ✅ | ✅ | ✅ |

*Doctor chỉ xem được lịch của chính mình

## 📁 Tệp tin đã tạo/cập nhật

### Backend (6 files)

1. **DoctorSchedule.cs** (Model - 48 lines)
   - Path: `Backend/HealthySystem.API/Models/`
   - Entity cho bảng doctor_schedules

2. **AdminController.cs** (Updated - +430 lines)
   - Path: `Backend/HealthySystem.WebAPI/Controllers/`
   - Thêm 7 endpoints mới cho schedule management

3. **ApplicationDbContext.cs** (New - 71 lines)
   - Path: `Backend/HealthySystem.WebAPI/Data/`
   - DbContext cho WebAPI project
   - Kế thừa HealthySystemDbContext

4. **HealthySystemDbContext.cs** (Updated - +25 lines)
   - Path: `Backend/HealthySystem.API/Data/`
   - Thêm DbSet<DoctorSchedule>
   - Thêm configurations

5. **Create_Doctor_Schedules.sql** (New - 180 lines)
   - Path: `Docs/Database/`
   - Table schema, view, function, sample data

6. **Doctor_Schedule_Management_Documentation.md** (New - 500+ lines)
   - Path: `Docs/`
   - Tài liệu kỹ thuật đầy đủ (file này)

### Frontend (2 files)

7. **admin-dashboard.html** (Updated - +450 lines)
   - Path: `Web/HealthySystem-Frontend/`
   - Thêm tab "Lịch làm việc BS"
   - Thêm modal Add/Edit schedule
   - Thêm 10 JavaScript functions

8. **doctor-schedule.html** (New - 470 lines)
   - Path: `Web/HealthySystem-Frontend/`
   - Trang xem lịch làm việc cho bác sĩ
   - Read-only view với statistics

## 🧪 Testing Checklist

### Backend Testing

- [ ] Tạo lịch làm việc thành công
- [ ] Không cho phép tạo lịch trùng lặp
- [ ] Không cho phép StartTime >= EndTime
- [ ] Cập nhật lịch làm việc
- [ ] Xóa lịch làm việc
- [ ] Lấy lịch của bác sĩ
- [ ] Lấy available slots cho ngày cụ thể
- [ ] Kiểm tra capacity (max_appointments_per_slot)

### Frontend Testing (Admin)

- [ ] Load danh sách bác sĩ
- [ ] Chọn bác sĩ hiển thị lịch tuần
- [ ] Thêm lịch mới thành công
- [ ] Sửa lịch thành công
- [ ] Xóa lịch thành công
- [ ] Validation form (thời gian hợp lệ)
- [ ] Calendar view hiển thị đúng
- [ ] List view hiển thị đúng

### Frontend Testing (Doctor)

- [ ] Doctor login và access doctor-schedule.html
- [ ] Hiển thị đúng lịch của doctor hiện tại
- [ ] Statistics tính toán chính xác
- [ ] Weekly view render đúng
- [ ] List view đầy đủ thông tin
- [ ] Print view hoạt động

### Integration Testing (Patient Booking)

- [ ] Chọn bác sĩ và ngày
- [ ] API trả về đúng available slots
- [ ] Chỉ hiển thị slots còn chỗ trống
- [ ] Đặt lịch thành công
- [ ] Không cho phép đặt khi hết chỗ
- [ ] Không cho phép đặt khi bác sĩ không làm việc

## 📈 Metrics & Success Criteria

- ✅ **Backend**: 7 API endpoints mới
- ✅ **Database**: 1 table, 1 view, 1 function, 3 indexes
- ✅ **Frontend**: 2 pages (1 new, 1 updated)
- ✅ **Code**: ~1,600 lines mới
- ✅ **Features**: CRUD đầy đủ cho schedules
- ✅ **Security**: Role-based authorization
- ✅ **UX**: Weekly calendar view + List view
- ✅ **Integration**: Patient booking tích hợp

## 🚀 Deployment Steps

### 1. Database Migration
```sql
-- Run Create_Doctor_Schedules.sql
USE HealthySystemDB;
GO
-- Execute all statements in the file
```

### 2. Backend Deployment
```bash
cd Backend/HealthySystem.API
dotnet build
dotnet ef migrations add AddDoctorSchedules
dotnet ef database update
dotnet run
```

### 3. Frontend Deployment
- Copy admin-dashboard.html (updated)
- Copy doctor-schedule.html (new)
- No additional dependencies needed

### 4. Verification
- Check API endpoints: `GET /api/admin/doctors`
- Check database table: `SELECT * FROM doctor_schedules`
- Test admin UI: Login as admin → Tab "Lịch làm việc BS"
- Test doctor UI: Login as doctor → `doctor-schedule.html`

## 🎯 Next Steps (Future Enhancements)

1. **Email/SMS Notifications**: Thông báo khi có thay đổi lịch làm việc
2. **Recurring Schedules**: Template lịch để copy nhanh
3. **Holiday Management**: Đánh dấu ngày nghỉ lễ
4. **Statistics Dashboard**: Thống kê công việc của bác sĩ
5. **Mobile App**: Ứng dụng mobile cho bác sĩ xem lịch
6. **Calendar Sync**: Đồng bộ với Google Calendar, Outlook
7. **Overtime Tracking**: Theo dõi giờ làm thêm
8. **Shift Swap**: Bác sĩ đổi ca với nhau (cần admin approve)

## 📝 Notes

- Lịch làm việc theo tuần lặp lại (recurring weekly pattern)
- DayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday (theo C# DayOfWeek enum)
- TimeOnly type (C# 6.0+) cho start_time và end_time
- MaxAppointmentsPerSlot kiểm soát số lượng bệnh nhân/ca
- Function fn_IsDoctorAvailable() có thể dùng trong trigger hoặc check constraint
- AllowAnonymous cho endpoint available-slots để patient có thể truy cập

## 🐛 Known Issues

- Chưa handle timezone (hiện tại dùng server time)
- Chưa có conflict resolution khi nhiều user cùng đặt lịch
- Chưa có audit log cho schedule changes

## 📞 Support

Nếu có vấn đề, liên hệ:
- Developer: Healthy System Team
- Email: support@healthysystem.vn
- Documentation Date: 2025-11-04
