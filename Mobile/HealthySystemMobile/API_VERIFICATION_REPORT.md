# 🔍 KIỂM TRA API ENDPOINTS - MOBILE vs BACKEND

## 📋 SUMMARY

### ✅ API Endpoints Đúng
1. ✅ **Doctor Detail**: `/doctors/{publicId}` - Đúng endpoint, đúng format
2. ⚠️ **Appointments**: `/appointments` - Endpoint đúng, NHƯNG CÓ VẤN ĐỀ

---

## 🔧 CHI TIẾT KIỂM TRA

### 1. DOCTOR DETAIL API ✅

#### Mobile Code
**File**: `app/doctor-detail/[id].tsx`
```typescript
const response = await api.get(`/doctors/${id}`);
```

#### Backend API
**File**: `Controllers/DoctorsController.cs`
```csharp
// GET: api/doctors/{publicId}
[HttpGet("{publicId}")]
public async Task<ActionResult<object>> GetDoctor(string publicId)
{
    var doctor = await _context.Users
        .Where(u => u.PublicId.ToString() == publicId && 
                    u.Role == "doctor" && 
                    u.Status == "active" && 
                    u.DeletedAt == null)
        .Include(u => u.StaffProfile)
        .Include(u => u.DoctorSpecialties)
        .ThenInclude(ds => ds.Specialty)
        .Select(u => new {
            Id = u.Id,
            PublicId = u.PublicId,
            FullName = u.FullName,
            Phone = u.Phone,
            Email = u.Email,
            Gender = u.Gender,
            DateOfBirth = u.DateOfBirth,
            Title = u.StaffProfile!.Title,
            Department = u.StaffProfile.Department,
            Description = u.StaffProfile.Description,
            YearsOfExperience = u.StaffProfile.YearsOfExperience,
            Specialties = [...],
            AverageRating = [...],
            TotalRatings = [...],
            Ratings = [...]
        })
        .FirstOrDefaultAsync();
}
```

#### Response Format (Backend)
```json
{
  "id": 1,
  "publicId": "uuid-string",
  "fullName": "Nguyễn Văn A",
  "phone": "0123456789",
  "email": "doctor@example.com",
  "gender": "male",
  "dateOfBirth": "1980-01-01",
  "title": "BS.",
  "department": "Khoa Tim Mạch",
  "description": "Mô tả bác sĩ",
  "yearsOfExperience": 10,
  "specialties": [
    {
      "id": 1,
      "name": "Tim mạch",
      "description": "..."
    }
  ],
  "averageRating": 4.5,
  "totalRatings": 10,
  "ratings": [...]
}
```

#### Mobile Interface
**File**: `app/doctor-detail/[id].tsx`
```typescript
interface Doctor {
  id: number;
  publicId: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth?: string;
  title: string;
  department: string;
  description?: string;
  yearsOfExperience: number;
  specialties: Specialty[];
}
```

**✅ KẾT LUẬN**: HOÀN TOÀN KHỚP!

---

### 2. APPOINTMENTS API ⚠️

#### Mobile Code
**File**: `app/(tabs)/appointments.tsx`
```typescript
const response = await api.get('/appointments');
```

#### Backend API
**File**: `Controllers/AppointmentsController.cs`
```csharp
// GET: api/appointments (for authenticated users)
[HttpGet]
[Authorize]  // ⚠️ REQUIRES AUTHENTICATION!
public async Task<ActionResult<IEnumerable<object>>> GetAppointments()
{
    var userId = GetCurrentUserId();
    var userRole = GetCurrentUserRole();
    
    IQueryable<Appointment> query = _context.Appointments;
    
    // Filter based on user role
    if (userRole == "patient")
    {
        query = query.Where(a => a.PatientId == userId);
    }
    else if (userRole == "doctor")
    {
        query = query.Where(a => a.DoctorId == userId);
    }
    
    var appointments = await query
        .Include(a => a.Patient)
        .Include(a => a.Doctor)
        .ThenInclude(d => d.StaffProfile)
        .Include(a => a.Doctor)
        .ThenInclude(d => d.DoctorSpecialties)
        .ThenInclude(ds => ds.Specialty)
        .OrderByDescending(a => a.AppointmentStart)
        .Select(a => new {
            Id = a.Id,
            AppointmentStart = a.AppointmentStart,
            AppointmentEnd = a.AppointmentEnd,
            Status = a.Status,
            Notes = a.Notes,
            IsEmergency = a.IsEmergency,
            Patient = new { ... },
            Doctor = new {
                Id = a.Doctor.Id,
                PublicId = a.Doctor.PublicId,
                FullName = a.Doctor.FullName,
                Title = a.Doctor.StaffProfile!.Title,
                Department = a.Doctor.StaffProfile.Department,
                Specialties = [...]
            },
            CreatedDate = a.CreatedDate,
            UpdatedDate = a.UpdatedDate
        })
        .ToListAsync();
        
    return Ok(appointments);
}
```

#### Response Format (Backend)
```json
[
  {
    "id": 1,
    "appointmentStart": "2024-10-15T09:00:00",
    "appointmentEnd": "2024-10-15T09:30:00",
    "status": "Pending",
    "notes": "Đau ngực",
    "isEmergency": false,
    "patient": {
      "id": 2,
      "publicId": "uuid",
      "fullName": "Nguyễn Văn B",
      "phone": "0987654321",
      "email": "patient@example.com"
    },
    "doctor": {
      "id": 1,
      "publicId": "uuid",
      "fullName": "BS. Nguyễn Văn A",
      "title": "BS.",
      "department": "Khoa Tim Mạch",
      "specialties": [
        { "id": 1, "name": "Tim mạch" }
      ]
    },
    "createdDate": "2024-10-01T10:00:00",
    "updatedDate": "2024-10-01T10:00:00"
  }
]
```

#### Mobile Interface
**File**: `app/(tabs)/appointments.tsx`
```typescript
interface Appointment {
  id: number;
  appointmentStart: string;
  appointmentEnd: string;
  status: string;
  notes?: string;
  isEmergency: boolean;
  doctor: {
    id: number;
    publicId: string;
    fullName: string;
    title: string;
    department: string;
    specialties: { id: number; name: string }[];
  };
  createdDate: string;
  updatedDate?: string;
}
```

**⚠️ PHÁT HIỆN VẤN ĐỀ!**

---

## ⚠️ ISSUES PHÁT HIỆN

### Issue 1: Appointments API Requires Authentication ❌

**Vấn đề:**
```csharp
[HttpGet]
[Authorize]  // ⚠️ API yêu cầu authentication!
public async Task<ActionResult<IEnumerable<object>>> GetAppointments()
```

**Impact:**
- ❌ Mobile call `/appointments` mà **KHÔNG có token** → 401 Unauthorized
- ❌ User chưa login → Không thể xem lịch hẹn
- ❌ Empty state hiển thị vì API fail (not 404, but 401)

**Evidence:**
```typescript
// Mobile code (appointments.tsx)
const response = await api.get('/appointments');
// ❌ Không có Authorization header!
```

---

### Issue 2: Interface Mapping Mismatch ⚠️

**Backend trả về:**
```json
{
  "doctor": {
    "fullName": "BS. Nguyễn Văn A"  // ✅ Có sẵn Title trong name
  }
}
```

**Mobile expect:**
```typescript
doctor: {
  fullName: string;  // ✅ OK
  title: string;     // ✅ OK (separate)
}
```

**BUT Backend also returns:**
```json
{
  "doctor": {
    "fullName": "Nguyễn Văn A",  // Tên không có title
    "title": "BS."                // Title riêng
  }
}
```

**✅ KẾT LUẬN**: Format ĐÚNG, nhưng cần check xem fullName có bao gồm title không

---

### Issue 3: Missing Properties in Mobile Interface ⚠️

**Backend returns:**
```json
{
  "patient": { ... },  // ✅ Backend có
  "createdDate": "...", // ✅ Backend có
  "updatedDate": "..." // ✅ Backend có
}
```

**Mobile interface:**
```typescript
interface Appointment {
  // ❌ KHÔNG có patient
  // ✅ Có createdDate
  // ✅ Có updatedDate
}
```

**Issue:** Mobile không định nghĩa `patient` trong interface, nhưng backend trả về.

---

## 🔧 RECOMMENDED FIXES

### Fix 1: Add Authentication to Mobile API Calls

**File**: `src/services/api.js`

**Current:**
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.68.119:5000/api',
});

export default api;
```

**Fixed:**
```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'http://192.168.68.119:5000/api',
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
```

---

### Fix 2: Update Mobile Interface to Match Backend

**File**: `app/(tabs)/appointments.tsx`

**Current:**
```typescript
interface Appointment {
  id: number;
  appointmentStart: string;
  appointmentEnd: string;
  status: string;
  notes?: string;
  isEmergency: boolean;
  doctor: {
    id: number;
    publicId: string;
    fullName: string;
    title: string;
    department: string;
    specialties: { id: number; name: string }[];
  };
  createdDate: string;
  updatedDate?: string;
}
```

**Fixed:**
```typescript
interface Appointment {
  id: number;
  appointmentStart: string;
  appointmentEnd: string;
  status: string;
  notes?: string;
  isEmergency: boolean;
  patient: {  // ✅ ADD THIS
    id: number;
    publicId: string;
    fullName: string;
    phone: string;
    email: string;
  };
  doctor: {
    id: number;
    publicId: string;
    fullName: string;
    title: string;
    department: string;
    specialties: { id: number; name: string }[];
  };
  createdDate: string;
  updatedDate?: string;
}
```

---

### Fix 3: Handle 401 Unauthorized in Mobile

**File**: `app/(tabs)/appointments.tsx`

**Current:**
```typescript
catch (err: any) {
  console.error('Error fetching appointments:', err);
  if (err.response?.status !== 404) {
    setError(err.response?.data?.message || 'Không thể tải lịch hẹn');
  }
  setAppointments([]);
}
```

**Fixed:**
```typescript
catch (err: any) {
  console.error('Error fetching appointments:', err);
  
  // Handle 401 Unauthorized (not logged in)
  if (err.response?.status === 401) {
    setError('Vui lòng đăng nhập để xem lịch hẹn');
    // Optional: Navigate to login
    // router.push('/login');
  }
  // Handle 404 (no appointments)
  else if (err.response?.status === 404) {
    setAppointments([]);
  }
  // Handle other errors
  else {
    setError(err.response?.data?.message || 'Không thể tải lịch hẹn');
  }
  
  setAppointments([]);
}
```

---

### Fix 4: Update Medical History API Call

**File**: `app/medical-history.tsx`

Same issue - needs authentication!

**Current:**
```typescript
const response = await api.get('/appointments');
```

**Same fix needed:**
```typescript
catch (error: any) {
  console.error('Error loading appointments:', error);
  
  // Handle 401 Unauthorized
  if (error.response?.status === 401) {
    // User not logged in - show empty state
    setAppointments([]);
  } else {
    // Other errors - just log and show empty
    setAppointments([]);
  }
}
```

---

## 📊 COMPARISON TABLE

| Aspect | Mobile | Backend | Status |
|--------|--------|---------|--------|
| **Doctor Detail Endpoint** | `/doctors/{id}` | `/doctors/{publicId}` | ✅ Match |
| **Doctor Detail Auth** | None | None | ✅ Match |
| **Doctor Response Format** | Match interface | Returns full data | ✅ Match |
| **Appointments Endpoint** | `/appointments` | `/appointments` | ✅ Match |
| **Appointments Auth** | ❌ None | ✅ [Authorize] | ❌ **MISMATCH** |
| **Appointments Format** | Missing `patient` | Returns `patient` | ⚠️ Incomplete |
| **Error Handling** | 404 only | 401, 404, etc | ⚠️ Incomplete |

---

## 🧪 TEST SCENARIOS

### Scenario 1: Get Doctor Detail (✅ Works)
```
1. Mobile: GET /doctors/{publicId}
2. Backend: Returns doctor info (no auth required)
3. ✅ SUCCESS
```

### Scenario 2: Get Appointments - Not Logged In (❌ Fails)
```
1. Mobile: GET /appointments (no token)
2. Backend: [Authorize] → 401 Unauthorized
3. ❌ Mobile shows empty state (thinks no data)
4. ❌ User confused
```

### Scenario 3: Get Appointments - Logged In (⚠️ Untested)
```
1. Mobile: GET /appointments (with token)
2. Backend: Returns appointments
3. ✅ Should work IF token is included
```

---

## 🎯 ACTION ITEMS

### Priority 1: Critical
- [ ] **Add authentication interceptor to api.js**
- [ ] **Test appointments API with auth token**
- [ ] **Handle 401 errors gracefully**

### Priority 2: Important
- [ ] **Update Appointment interface to include `patient`**
- [ ] **Test medical history with auth**
- [ ] **Verify doctor fullName format (with/without title)**

### Priority 3: Nice to Have
- [ ] **Add loading states for auth check**
- [ ] **Add retry mechanism for failed API calls**
- [ ] **Add offline support**

---

## 📝 NOTES

### Doctor API
- ✅ Không cần authentication
- ✅ Format match 100%
- ✅ Sẵn sàng sử dụng

### Appointments API
- ⚠️ **CẦN AUTHENTICATION** (hiện tại chưa có)
- ⚠️ Interface thiếu `patient` field
- ⚠️ Error handling chưa đủ

### Recommendation
1. **Implement authentication FIRST** trước khi test appointments
2. **Update interfaces** để match backend response
3. **Test với user đã login** để verify full flow

---

## 🔍 VERIFICATION COMMANDS

### Test Doctor API (Should work)
```bash
curl http://192.168.68.119:5000/api/doctors/{publicId}
```

### Test Appointments API (Will fail without token)
```bash
# Without token (will fail)
curl http://192.168.68.119:5000/api/appointments

# With token (should work)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://192.168.68.119:5000/api/appointments
```

---

**🎯 CONCLUSION:**

1. ✅ **Doctor Detail API**: ĐÚNG VÀ HOẠT ĐỘNG
2. ⚠️ **Appointments API**: ĐÚNG ENDPOINT nhưng **THIẾU AUTHENTICATION**

**Next Steps:**
1. Implement auth interceptor
2. Test với user đã login
3. Update error handling
