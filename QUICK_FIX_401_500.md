# ⚡ QUICK FIX - 401 & 500 ERRORS

## 🎯 2 ISSUES, 2 FIXES

### Issue 1: Lỗi 500 - Doctor Detail
**Fixed**: Backend null reference  
**Action**: Restart backend

### Issue 2: Lỗi 401 - Appointments  
**Reason**: No authentication token  
**Action**: Check token with debug screen

---

## 🚀 IMMEDIATE STEPS

### 1. Restart Backend (FIX 500)
```powershell
cd Backend\HealthySystem.API
dotnet run
```

### 2. Check Token (FIX 401)

**Navigate to**: `/debug-token` trong app

**If no token**:
- Login lại
- Hoặc set dummy token để test

---

## ✅ EXPECTED RESULTS

After backend restart:
- ✅ Doctor detail loads (no 500)
- ✅ Appointments load if have token (no 401)

---

## 📱 NEW DEBUG TOOL

**File**: `app/debug-token.tsx`

**Features**:
- Check token exists
- Show token info
- Test API calls
- Set/clear tokens

**Access**: Navigate to `/debug-token`

---

## 🔧 FILES CHANGED

1. ✅ `Backend/Controllers/DoctorsController.cs` - Null-safe
2. ✅ `Mobile/app/debug-token.tsx` - NEW debug screen

---

## 📝 NOTES

### Token Issue:
- API interceptor đã có ✅
- Nhưng cần token trong AsyncStorage
- Nếu chưa có → Login lại

### Login Flow:
```javascript
// After login success:
await AsyncStorage.setItem('accessToken', token);
```

---

**Just restart backend and check token!** 🎉

See `FIX_401_500_COMPLETE.md` for details.
