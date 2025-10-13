# 🔍 DEBUG SCRIPT - DOCTOR DETAIL ISSUE

## Vấn đề: Không tải được thông tin bác sĩ khi ấn vào

---

## 🧪 KIỂM TRA TỪNG BƯỚC

### Bước 1: Kiểm tra Backend đang chạy

```bash
# Mở terminal và test
curl http://192.168.68.119:5000/api/doctors
```

**Expected**: Trả về JSON array của doctors

---

### Bước 2: Kiểm tra publicId trong response

Xem console log khi fetch doctors:
- Mở Expo Go app
- Navigate to Doctors tab  
- Xem console log: `Doctors fetched: [...]`

**Check**: Mỗi doctor có field `publicId`?

**Example**:
```json
{
  "id": 1,
  "publicId": "uuid-string-here",  // ⚠️ PHẢI CÓ!
  "fullName": "Nguyễn Văn A",
  "title": "BS.",
  ...
}
```

---

### Bước 3: Kiểm tra navigation URL

Khi tap vào doctor, xem console log URL:

**Current code**:
```typescript
router.push(`/doctor-detail/${item.publicId}`)
```

**Check**: `item.publicId` có giá trị không?

---

### Bước 4: Kiểm tra API endpoint

Test trực tiếp API:

```bash
# Thay YOUR_PUBLIC_ID bằng publicId thực tế từ bước 2
curl http://192.168.68.119:5000/api/doctors/YOUR_PUBLIC_ID
```

**Expected**: Trả về doctor object

---

## 🔧 POSSIBLE ISSUES & FIXES

### Issue 1: Backend không trả về `publicId`

**Check Backend**: `DoctorsController.cs`

```csharp
// PHẢI có PublicId trong Select
.Select(u => new {
    Id = u.Id,
    PublicId = u.PublicId,  // ⚠️ CHECK THIS!
    FullName = u.FullName,
    // ...
})
```

**Fix**: Thêm `PublicId` vào response

---

### Issue 2: Frontend dùng sai field

**Check**: `doctors.tsx` line 93

```typescript
// Nếu backend dùng "id" thay vì "publicId"
router.push(`/doctor-detail/${item.id}`)  // Use id instead

// Hoặc
router.push(`/doctor-detail/${item.publicId}`)  // Use publicId
```

---

### Issue 3: Backend endpoint sai

**Check**: `DoctorsController.cs`

Endpoint phải là:
```csharp
// GET: api/doctors/{publicId}
[HttpGet("{publicId}")]
public async Task<ActionResult<object>> GetDoctor(string publicId)
{
    var doctor = await _context.Users
        .Where(u => u.PublicId.ToString() == publicId)  // ⚠️ CHECK THIS
        // ...
}
```

Hoặc:
```csharp
// GET: api/doctors/{id}
[HttpGet("{id}")]
public async Task<ActionResult<object>> GetDoctor(int id)
{
    var doctor = await _context.Users
        .Where(u => u.Id == id)  // Use Id instead
        // ...
}
```

---

## 🛠️ QUICK FIXES

### Fix Option 1: Use `id` instead of `publicId`

**File**: `app/(tabs)/doctors.tsx`

```typescript
// LINE 93 - Change from:
onPress={() => router.push(`/doctor-detail/${item.publicId}` as any)}

// TO:
onPress={() => router.push(`/doctor-detail/${item.id}` as any)}
```

**File**: `app/doctor-detail/[id].tsx`

```typescript
// LINE 48 - Already using id, should work
const response = await api.get(`/doctors/${id}`);
```

**File**: `Backend/HealthySystem.API/Controllers/DoctorsController.cs`

```csharp
// Make sure endpoint uses Id:
[HttpGet("{id:int}")]
public async Task<ActionResult<object>> GetDoctor(int id)
{
    var doctor = await _context.Users
        .Where(u => u.Id == id && ...)
        // ...
}
```

---

### Fix Option 2: Ensure `publicId` is returned and used correctly

**File**: `Backend/HealthySystem.API/Controllers/DoctorsController.cs`

```csharp
// LIST endpoint - MUST include PublicId
[HttpGet]
public async Task<ActionResult<IEnumerable<object>>> GetDoctors()
{
    var doctors = await _context.Users
        .Where(...)
        .Select(u => new {
            Id = u.Id,
            PublicId = u.PublicId,  // ✅ ADD THIS
            FullName = u.FullName,
            // ...
        })
        .ToListAsync();
}

// DETAIL endpoint
[HttpGet("{publicId}")]
public async Task<ActionResult<object>> GetDoctor(string publicId)
{
    var doctor = await _context.Users
        .Where(u => u.PublicId.ToString() == publicId)
        // ...
}
```

---

## 🧪 TESTING STEPS

### Test 1: Backend Response
```bash
# Test list
curl http://192.168.68.119:5000/api/doctors

# Check response has publicId or id
```

### Test 2: Mobile Logs
```
Open Expo Go → Doctors tab
Check console: "Doctors fetched: [...]"
Find: publicId or id?
```

### Test 3: Navigation
```
Tap a doctor
Check console: URL being navigated to
Check error message
```

### Test 4: Detail API
```bash
# Test with actual id/publicId from step 2
curl http://192.168.68.119:5000/api/doctors/1
# or
curl http://192.168.68.119:5000/api/doctors/uuid-string
```

---

## 📋 DEBUGGING CHECKLIST

- [ ] Backend server running at http://192.168.68.119:5000
- [ ] GET /api/doctors returns array
- [ ] Each doctor has `id` or `publicId` field
- [ ] Mobile can fetch doctors list
- [ ] Console shows doctors data
- [ ] Click doctor → check navigation URL
- [ ] GET /api/doctors/{id} endpoint exists
- [ ] Backend endpoint matches mobile URL
- [ ] Detail page receives correct id parameter

---

## 🚀 RECOMMENDED FIX (QUICK)

**Most likely issue**: Backend uses `Id` but mobile tries to use `publicId`

**Solution**: Use `id` everywhere (simpler)

1. **Mobile**: `doctors.tsx` line 93
   ```typescript
   onPress={() => router.push(`/doctor-detail/${item.id}` as any)}
   ```

2. **Backend**: Ensure endpoint
   ```csharp
   [HttpGet("{id:int}")]
   public async Task<ActionResult<object>> GetDoctor(int id)
   ```

3. **Test**: 
   ```bash
   curl http://192.168.68.119:5000/api/doctors/1
   ```

---

## 📞 HELP

If still not working, collect this info:

1. **Console logs** when tapping doctor
2. **Backend logs** when request comes in  
3. **Network tab** in Expo DevTools (Ctrl+M → Debug → Network)
4. **Actual error message** displayed

Then we can debug further!
