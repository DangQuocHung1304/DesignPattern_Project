# 🚀 QUICK START - TESTING GUIDE

## 🎯 MỤC TIÊU
Test toàn bộ tính năng Sprint 1 sau khi:
- ✅ Đã fix API compatibility
- ✅ Đã cài DateTimePicker
- ✅ Sẵn sàng demo

---

## 🔧 SETUP

### 1. Start Backend
```bash
cd Backend/HealthySystem.API
dotnet run
```

**Verify**: Server chạy tại `http://localhost:5000`

### 2. Start Mobile
```bash
cd Mobile/HealthySystemMobile
npx expo start --tunnel
```

**Verify**: 
- QR code hiển thị
- Mở Expo Go trên điện thoại
- Scan QR code

---

## ✅ TEST CHECKLIST

### Test Flow 1: Doctor Discovery & Booking 🏥

#### Step 1: Home Screen
- [ ] App loads successfully
- [ ] Hero section hiển thị
- [ ] Stats cards hiển thị (4 cards)
- [ ] Quick Actions buttons (4 buttons)
- [ ] Featured Doctors carousel
- [ ] Emergency button

#### Step 2: Browse Doctors
- [ ] Tap "Tìm bác sĩ" → Navigate to Doctors tab
- [ ] Doctors list loads từ API
- [ ] Mỗi doctor card hiển thị: avatar, name, title, department, rating
- [ ] Search box hoạt động
- [ ] Filter by specialty hoạt động
- [ ] Pull-to-refresh works

#### Step 3: Doctor Detail
- [ ] Tap vào một doctor card
- [ ] Doctor detail screen loads
- [ ] Hiển thị: full info, specialties, rating, description
- [ ] "Đặt lịch khám" button visible

#### Step 4: Book Appointment
- [ ] Tap "Đặt lịch khám"
- [ ] Book appointment screen loads
- [ ] Doctor info hiển thị đúng
- [ ] Chọn ngày → DatePicker mở
- [ ] Chọn giờ → Time slots hiển thị (9:00, 10:00, 11:00, etc.)
- [ ] Nhập notes
- [ ] Check/uncheck Emergency
- [ ] Tap "Xác nhận đặt lịch"
- [ ] Success message hoặc error hiển thị

**Expected**: ✅ Full flow từ Home → Book appointment works!

---

### Test Flow 2: Specialty Exploration 🔬

#### Step 1: Browse Specialties
- [ ] Navigate to Specialties tab
- [ ] Specialties grid loads
- [ ] Icons và colors hiển thị đúng
- [ ] Search specialties works
- [ ] Pull-to-refresh works

#### Step 2: Specialty Detail
- [ ] Tap vào một specialty (e.g., "Tim mạch")
- [ ] Specialty detail loads
- [ ] Description hiển thị
- [ ] List of doctors in specialty hiển thị
- [ ] Doctor count chính xác

#### Step 3: Navigate to Doctor
- [ ] Tap vào doctor từ specialty detail
- [ ] Doctor detail screen loads
- [ ] Same as Test Flow 1 Step 3

**Expected**: ✅ Specialty → Doctor navigation works!

---

### Test Flow 3: Appointments Management 📅

#### Test 3A: With Auth Token (User Logged In)

**Setup**: Ensure valid token in AsyncStorage
```javascript
// In Expo Go console or via login
AsyncStorage.setItem('accessToken', 'your-valid-token');
```

- [ ] Navigate to Appointments tab
- [ ] API call includes Authorization header
- [ ] Appointments list loads
- [ ] Each appointment shows:
  - [ ] Date & time
  - [ ] Doctor info (title + fullName)
  - [ ] Department
  - [ ] Status badge with color
  - [ ] Emergency indicator (if applicable)
- [ ] Pull-to-refresh works
- [ ] Status colors correct:
  - [ ] Confirmed = Green
  - [ ] Pending = Yellow
  - [ ] Completed = Gray
  - [ ] Cancelled = Red

#### Test 3B: Without Auth Token (User Not Logged In)

**Setup**: Clear token
```javascript
AsyncStorage.removeItem('accessToken');
```

- [ ] Navigate to Appointments tab
- [ ] API returns 401 Unauthorized
- [ ] Error message: "Vui lòng đăng nhập để xem lịch hẹn"
- [ ] No crash
- [ ] App continues to work

#### Test 3C: Empty State (No Appointments)

**Setup**: User logged in but has no appointments

- [ ] Navigate to Appointments tab
- [ ] API returns 404 or empty array
- [ ] Empty state hiển thị:
  - [ ] Icon (calendar)
  - [ ] Message: "Bạn chưa có lịch hẹn nào"
  - [ ] CTA button: "Đặt lịch khám ngay"
- [ ] Tap button → Navigate to Doctors tab

**Expected**: ✅ All 3 scenarios work correctly!

---

### Test Flow 4: Medical History 📋

#### Step 1: Navigate from Profile
- [ ] Navigate to Profile tab
- [ ] Tap "Lịch sử khám bệnh" option
- [ ] Medical History screen loads

#### Step 2: View History
- [ ] Appointments list loads (same API as Appointments tab)
- [ ] Each appointment card shows:
  - [ ] Doctor info: `{doctor.title} {doctor.fullName}` (NOT doctorTitle/doctorName)
  - [ ] Department: `{doctor.department}`
  - [ ] Date & time
  - [ ] Status badge
  - [ ] Notes (if any)
  - [ ] Emergency badge (if applicable)

#### Step 3: Stats Footer
- [ ] Total appointments count
- [ ] Completed count
- [ ] Pending count
- [ ] Numbers match actual data

#### Step 4: Empty State
- [ ] If no appointments → Empty state shows
- [ ] No alert popup (alerts removed)
- [ ] Only console.error logging

**Expected**: ✅ Medical History works with new interface!

---

### Test Flow 5: Error Handling 🚨

#### Test 5A: No Internet
- [ ] Turn off WiFi/Data
- [ ] Try to load doctors
- [ ] Error message appears
- [ ] Pull-to-refresh available
- [ ] App doesn't crash

#### Test 5B: Backend Down
- [ ] Stop backend server
- [ ] Try to load any list
- [ ] Error message: "Không thể kết nối server"
- [ ] App remains functional

#### Test 5C: Invalid Data
- [ ] Backend returns invalid JSON
- [ ] App handles gracefully
- [ ] Error message shown
- [ ] No crash

**Expected**: ✅ All error scenarios handled!

---

### Test Flow 6: Search & Filter 🔍

#### Search Doctors
- [ ] Type doctor name in search
- [ ] Results filter in real-time
- [ ] Case-insensitive search works
- [ ] Clear search shows all doctors

#### Filter Doctors by Specialty
- [ ] Select specialty from dropdown
- [ ] Only doctors in that specialty shown
- [ ] "All Specialties" shows all doctors

#### Search Specialties
- [ ] Type specialty name
- [ ] Results filter correctly
- [ ] Clear search works

**Expected**: ✅ Search/filter works smoothly!

---

### Test Flow 7: DateTimePicker 📆

#### Date Selection
- [ ] Open Book Appointment
- [ ] Tap "Chọn ngày"
- [ ] DatePicker modal opens
- [ ] Select date
- [ ] DatePicker closes
- [ ] Selected date displays in format "DD/MM/YYYY"

#### Time Selection
- [ ] Time slots grid visible
- [ ] 9 slots available (9:00 - 17:00)
- [ ] Tap time slot → highlights
- [ ] Tap another slot → previous unhighlights
- [ ] Selected time stored

#### Package Verification
- [ ] No errors related to @react-native-community/datetimepicker
- [ ] Picker renders correctly on Android
- [ ] Picker renders correctly on iOS

**Expected**: ✅ DateTimePicker works perfectly!

---

## 📊 TEST SUMMARY TEMPLATE

Use this to record your test results:

```
=== SPRINT 1 TESTING REPORT ===

Date: ______________
Tester: ______________

✅ PASSED | ❌ FAILED | ⚠️ ISSUES

Flow 1: Doctor Discovery & Booking
[ ] Home Screen
[ ] Browse Doctors  
[ ] Doctor Detail
[ ] Book Appointment
Issues: ___________

Flow 2: Specialty Exploration
[ ] Browse Specialties
[ ] Specialty Detail
[ ] Navigate to Doctor
Issues: ___________

Flow 3: Appointments Management
[ ] With Auth Token
[ ] Without Auth Token
[ ] Empty State
Issues: ___________

Flow 4: Medical History
[ ] Navigate from Profile
[ ] View History
[ ] Stats Footer
[ ] Empty State
Issues: ___________

Flow 5: Error Handling
[ ] No Internet
[ ] Backend Down
[ ] Invalid Data
Issues: ___________

Flow 6: Search & Filter
[ ] Search Doctors
[ ] Filter by Specialty
[ ] Search Specialties
Issues: ___________

Flow 7: DateTimePicker
[ ] Date Selection
[ ] Time Selection
[ ] Package Verification
Issues: ___________

=== OVERALL RESULT ===
Total Tests: ___/50
Passed: ___
Failed: ___
Issues Found: ___

Ready for Demo: [ ] YES [ ] NO

Notes:
_______________________
_______________________
```

---

## 🐛 KNOWN ISSUES TO CHECK

### Check These Specifically:

1. **API Field Names**
   - ✅ Verify `doctor.fullName` (NOT `doctorName`)
   - ✅ Verify `doctor.title` (NOT `doctorTitle`)
   - ✅ Verify `doctor.department` (NOT `department`)

2. **Authentication**
   - ✅ Token is sent in Authorization header
   - ✅ 401 errors handled gracefully
   - ✅ No crashes on unauthorized access

3. **Empty States**
   - ✅ No unwanted alerts
   - ✅ CTA buttons work
   - ✅ Helpful messages shown

4. **DateTimePicker**
   - ✅ No import errors
   - ✅ Renders on both platforms
   - ✅ Date/time selection works

---

## 🎯 SUCCESS CRITERIA

Sprint 1 is considered successful if:

- ✅ All 7 User Stories work end-to-end
- ✅ Book Appointment flow completes
- ✅ API calls return data correctly
- ✅ Error handling works
- ✅ No crashes during normal usage
- ✅ UI/UX is smooth and responsive
- ✅ DateTimePicker installed and working

---

## 🚀 READY TO TEST!

1. **Start Backend**: `cd Backend/HealthySystem.API && dotnet run`
2. **Start Mobile**: `cd Mobile/HealthySystemMobile && npx expo start --tunnel`
3. **Follow Test Flows**: Check each box as you test
4. **Record Issues**: Note any problems found
5. **Report Results**: Fill in summary template

---

**Good luck with testing! 🎉**

**Remember**: If you find issues, that's GOOD! Better to find them now than in production! 🔍
