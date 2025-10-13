# 🧹 QUICK CLEANUP GUIDE

## ⚡ FAST TRACK

```powershell
# Xem file nào sẽ bị xóa
cat CLEANUP_PLAN.md

# Chạy cleanup (sẽ hỏi xác nhận)
.\cleanup-project.ps1
```

---

## 📊 WHAT WILL BE DELETED?

**33 files total**:
- 9 root-level debug docs
- 15 mobile debug docs  
- 2 backup files
- 7 unused source files

---

## ✅ WHAT WILL BE KEPT?

**All important files**:
- ✅ README.md (both root & mobile)
- ✅ SPRINT1_COMPLETION_REPORT.md
- ✅ TESTING_GUIDE.md
- ✅ All scripts (.ps1)
- ✅ All active code
- ✅ src/services/api.js (current)

---

## 🎯 RESULT

**Before**: 60+ files  
**After**: ~27 files (clean!)

**Impact**: None on functionality  
**Benefit**: Much easier to navigate!

---

## 🚀 RUN IT

```powershell
.\cleanup-project.ps1
```

Type `yes` when prompted.

Done! 🎉
