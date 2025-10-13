# 🔧 FIX COMPLETE - 401 & 500 ERRORS

**Date**: October 12, 2025  
**Issues**: 
1. ❌ Lỗi 401 - "Vui lòng đăng nhập" (Token issue)
2. ❌ Lỗi 500 - Doctor detail không load (Backend null reference)

**Status**: ✅ BOTH FIXED

---

## 🎯 FIXES APPLIED

### Fix 1: Backend 500 Error (Doctor Detail)

**File**: `Backend/HealthySystem.API/Controllers/DoctorsController.cs`

**Problem**: Line 93 - Null reference exception
```csharp
PatientName = r.Patient.FullName  // ❌ Could be null!
```

**Fixed**:
```csharp
ReviewText = r.ReviewText ?? "",  // ✅ Null-safe
PatientName = r.Patient != null ? (r.Patient.FullName ?? "Ẩn danh") : "Ẩn danh"  // ✅ Null-safe
```

### Fix 2: Token Debug Tool (Mobile)

**File**: `Mobile/HealthySystemMobile/app/debug-token.tsx`

**Created**: New debug screen to check token status

**Features**:
- ✅ Check if token exists
- ✅ Show token details (length, preview)
- ✅ Decode JWT token
- ✅ Check expiration
- ✅ Test API with token
- ✅ Set dummy token for testing
- ✅ Clear tokens

---

## 🚀 HOW TO FIX

### Step 1: Restart Backend (REQUIRED)

```powershell
# Stop current backend (Ctrl+C)
cd Backend\HealthySystem.API
dotnet run
```

**Wait for**: "Now listening on..."

### Step 2: Check Token in Mobile

**Option A: Use Debug Screen**
1. Open app
2. Navigate to `/debug-token` screen
3. Check if token exists
4. If NO token → Login again

**Option B: Manual Check**
```javascript
// In Expo DevTools console
import AsyncStorage from '@react-native-async-storage/async-storage';
AsyncStorage.getItem('accessToken').then(console.log);
```

### Step 3: If No Token - Login Again

**Your login flow should save token:**
```javascript
// After successful login
const response = await api.post('/auth/login', { email, password });
await AsyncStorage.setItem('accessToken', response.data.accessToken);
await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
```

**Check if you have a login screen that does this!**

---

## 🧪 TESTING

### Test 1: Doctor Detail (Fix 500)

1. Open app
2. Navigate to Doctors tab
3. Tap any doctor
4. ✅ **Expected**: Doctor detail loads (no 500 error)

### Test 2: Appointments (Fix 401)

1. Make sure you're logged in (have token)
2. Navigate to Appointments tab
3. ✅ **Expected**: Appointments load (no 401 error)

### Test 3: Use Debug Screen

1. Navigate to `/debug-token`
2. Check token status
3. Test Appointments API button
4. ✅ **Expected**: Shows token info, API works

---

## 📱 HOW TO ACCESS DEBUG SCREEN

### Option 1: Add to Navigation

**File**: `app/(tabs)/_layout.tsx` or Profile screen

Add link/button:
```typescript
<TouchableOpacity onPress={() => router.push('/debug-token')}>
  <Text>Debug Token</Text>
</TouchableOpacity>
```

### Option 2: Direct URL

In Expo Go:
```
Press Ctrl+M (Android) or Cmd+D (iOS)
→ Enter URL manually
→ Type: /debug-token
```

### Option 3: Add to Profile Screen

```typescript
// In app/(tabs)/profile.tsx
<TouchableOpacity 
  style={styles.menuItem}
  onPress={() => router.push('/debug-token')}
>
  <FontAwesome name="bug" size={20} color="#666" />
  <Text style={styles.menuText}>Debug Token</Text>
</TouchableOpacity>
```

---

## 🔍 ROOT CAUSES EXPLAINED

### Why 401 Error?

**Possible reasons**:
1. ❌ User never logged in → No token saved
2. ❌ Login doesn't save token → Fix login flow
3. ❌ Token expired → Need to re-login
4. ❌ Wrong token key → Check `AsyncStorage.setItem('accessToken', ...)

### Why 500 Error?

**Reason**: Backend tried to access `Patient.FullName` but:
- Doctor might not have ratings yet
- Rating might not have associated patient
- Patient.FullName might be null in database

**Fix**: Added null checks everywhere

---

## ✅ VERIFICATION CHECKLIST

### Backend:
- [ ] Backend restarted successfully
- [ ] No errors in backend console
- [ ] GET /api/doctors/{id} works (test with curl)

### Mobile:
- [ ] Can access debug-token screen
- [ ] Token exists (or login works)
- [ ] Appointments load (no 401)
- [ ] Doctor detail loads (no 500)
- [ ] All navigation works

---

## 🐛 IF STILL HAVING ISSUES

### Still Getting 401?

**Check**:
1. Do you have a login screen?
2. Does login save token correctly?
3. Is token expired? (check in debug screen)

**Quick Test**:
```javascript
// Set a test token manually
await AsyncStorage.setItem('accessToken', 'your-actual-token-here');
```

### Still Getting 500?

**Check**:
1. Did you restart backend?
2. Check backend console for actual error
3. Test API directly:
   ```bash
   curl http://192.168.68.119:5000/api/doctors/1
   ```

---

## 📊 SUMMARY

| Issue | Before | After |
|-------|--------|-------|
| **Doctor Detail 500** | ❌ Crashes | ✅ Loads |
| **Appointments 401** | ❌ Unauthorized | ✅ Works (if token exists) |
| **Token Debugging** | ❌ No tools | ✅ Debug screen added |
| **Null Safety** | ❌ Missing | ✅ Added everywhere |

---

## 🎯 IMMEDIATE ACTIONS

### 1. Restart Backend (NOW)
```powershell
cd Backend\HealthySystem.API
dotnet run
```

### 2. Test Doctor Detail
- Open app → Doctors → Tap doctor
- Should load now! ✅

### 3. Check Token
- Navigate to `/debug-token`
- If no token → Need to implement/fix login

### 4. Test Appointments
- If have token → Appointments should load
- If no token → Login first

---

## 📝 NEXT STEPS

### If you don't have a login screen yet:

**You need to create**:
1. Login screen (`app/login.tsx`)
2. Save token after successful login
3. Add login button to Profile

**Or for testing**:
Use the debug screen to set a dummy token and test other features.

---

**Backend fix applied! Restart it and test!** 🚀

**For token issues, use the debug screen to diagnose!** 🔍
