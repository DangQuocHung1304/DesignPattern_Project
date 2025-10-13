# 🧹 PROJECT CLEANUP PLAN

## 📋 FILES TO DELETE

### Root Level Documentation (9 files)
Các file documentation tạm thời trong quá trình debug:
- ❌ `DEBUG_401_500.md`
- ❌ `FIX_401_500_COMPLETE.md`
- ❌ `FIX_EMPTY_ALERT_SUMMARY.md`
- ❌ `MEDICAL_HISTORY_COMPLETION.md`
- ❌ `MEDICAL_HISTORY_QUICK_SUMMARY.md`
- ❌ `QUICKFIX_SUMMARY.md`
- ❌ `QUICK_FIX_401_500.md`
- ❌ `QUICK_START.md`
- ❌ `SUMMARY.md`

### Mobile Documentation (15 files)
Các file documentation dư thừa trong Mobile folder:
- ❌ `API_FIXES_SUMMARY.md`
- ❌ `API_VERIFICATION_REPORT.md`
- ❌ `BUGFIX_DOCTOR_DETAIL.md`
- ❌ `COMPLETION_SUMMARY.md`
- ❌ `DEBUG_DOCTOR_DETAIL.md`
- ❌ `FIXES_APPLIED.md`
- ❌ `FIX_API_DUPLICATE.md`
- ❌ `FIX_DOCTOR_DETAIL.md`
- ❌ `FIX_EMPTY_ALERT.md`
- ❌ `FIX_REMOVE_ALL_ALERTS.md`
- ❌ `GIT_COMMIT_MESSAGE.md`
- ❌ `INSTALLATION_GUIDE.md`
- ❌ `MEDICAL_HISTORY_FEATURE.md`
- ❌ `MEDICAL_HISTORY_NAVIGATION.md`
- ❌ `NAVIGATION_VERIFICATION.md`
- ❌ `README_MOBILE_SETUP.md`
- ❌ `SOLUTION_DYNAMIC_IP.md`

### Backup Files (2 files)
Các file backup không cần thiết:
- ❌ `src/services/api_backup.js`
- ❌ `app/(tabs)/index_backup.tsx`

### Unused Source Files (7 files)
Các file src cũ không dùng (old structure before Expo Router):
- ❌ `src/contexts/AuthContext.js`
- ❌ `src/screens/HomeScreen.js`
- ❌ `src/screens/LoginScreen.js`
- ❌ `src/navigation/Navigation.js`
- ❌ `src/components/CustomButton.js`
- ❌ `src/components/CustomInput.js`
- ❌ `src/components/NetworkTestScreen.js`

---

## ✅ FILES TO KEEP (IMPORTANT)

### Essential Documentation
- ✅ `README.md` (root)
- ✅ `README.md` (mobile)
- ✅ `README_SPRINT1.md` - Sprint 1 summary
- ✅ `SPRINT1_COMPLETION_REPORT.md` - Full report
- ✅ `TESTING_GUIDE.md` - Test instructions

### Essential Scripts
- ✅ `start-dev.ps1` - Development server
- ✅ `install-datetimepicker.ps1` - Package installation
- ✅ `restart-backend.ps1` - Backend restart
- ✅ `test-mobile-connection.ps1` - Connection test
- ✅ `update-ip.ps1` - IP configuration

### Active Code
- ✅ `src/services/api.js` - Active API service
- ✅ `app/**/*.tsx` - All app screens
- ✅ All other active source files

---

## 📊 SUMMARY

| Category | Files to Delete |
|----------|----------------|
| Root Documentation | 9 |
| Mobile Documentation | 15 |
| Backup Files | 2 |
| Unused Source Files | 7 |
| **TOTAL** | **33 files** |

---

## 🚀 HOW TO RUN CLEANUP

### Option 1: Run Script (Recommended)
```powershell
.\cleanup-project.ps1
```

**What it does**:
1. Lists all files to be deleted
2. Asks for confirmation
3. Deletes files safely
4. Shows summary

### Option 2: Manual Deletion
Delete files listed above one by one.

---

## ⚠️ SAFETY

### Before Running:
- ✅ All important docs are kept
- ✅ All active code is kept
- ✅ Only temp/debug/backup files deleted

### After Running:
1. Check git status: `git status`
2. Review deleted files
3. Test app: `npm start`
4. Commit if OK: `git commit -m "chore: cleanup unused files"`

---

## 💡 WHY CLEANUP?

### Benefits:
1. **Cleaner project structure**
2. **Easier navigation**
3. **Less confusion**
4. **Smaller repository size**
5. **Better organization**

### What's Being Removed:
- Temporary debug docs created during development
- Multiple fix documentation for same issues
- Backup files no longer needed
- Old structure files (before Expo Router migration)

---

## 🎯 RESULT AFTER CLEANUP

### Root Level:
```
Project/
├── Backend/
├── Docs/
├── Mobile/
├── Web/
├── README.md ✅
├── start-dev.ps1 ✅
├── install-datetimepicker.ps1 ✅
├── restart-backend.ps1 ✅
└── ... (clean!)
```

### Mobile Level:
```
Mobile/HealthySystemMobile/
├── app/ ✅
├── src/
│   └── services/
│       └── api.js ✅ (backup removed)
├── README.md ✅
├── README_SPRINT1.md ✅
├── SPRINT1_COMPLETION_REPORT.md ✅
├── TESTING_GUIDE.md ✅
└── ... (much cleaner!)
```

---

## 🔍 DETAILED BREAKDOWN

### Root Documentation Cleanup
**Why delete?**
- Created during debugging
- Information consolidated in SPRINT1_COMPLETION_REPORT.md
- No longer needed

**What's kept?**
- README.md - Main project info
- Essential scripts for development

### Mobile Documentation Cleanup
**Why delete?**
- Multiple docs for same fixes
- Temporary debugging guides
- Superseded by final reports

**What's kept?**
- README.md - Mobile setup
- README_SPRINT1.md - Sprint summary
- SPRINT1_COMPLETION_REPORT.md - Complete report
- TESTING_GUIDE.md - Test instructions

### Backup Files Cleanup
**Why delete?**
- Backups no longer needed
- Current versions working fine
- Version control has history

### Unused Source Files Cleanup
**Why delete?**
- Old structure before Expo Router
- Not used in current app
- Replaced by app/ directory structure

---

## ✅ READY TO CLEAN?

**Run**:
```powershell
.\cleanup-project.ps1
```

**Total files to delete**: 33  
**Safety**: High (only temp/debug files)  
**Impact**: None on functionality  
**Benefit**: Much cleaner project!

---

**Let's make this project clean and organized!** 🧹✨
