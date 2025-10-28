# 📋 SPRINT 5 - USER ACCEPTANCE CHECKLIST

Dành cho người dùng để kiểm tra và chấp nhận Sprint 5 US-01.

---

## ✅ BACKEND API

### Bước 1: Kiểm tra API đang chạy
- [ ] Mở terminal mới
- [ ] Chạy lệnh: `cd Backend\HealthySystem.API`
- [ ] Chạy lệnh: `dotnet run --urls http://localhost:5296`
- [ ] Thấy thông báo: "Now listening on: http://localhost:5296"

### Bước 2: Test API với Browser
- [ ] Mở: `Web/HealthySystem-Frontend/test-api.html`
- [ ] Click nút "Test Login" → Thấy ✅ Login Success
- [ ] Click "Test Current Treatments" → Thấy 2 treatments
- [ ] Click "Test Treatment History" → Thấy 2 treatments  
- [ ] Click "Test Treatment Details" → Thấy đầy đủ thông tin

---

## ✅ FRONTEND UI

### Bước 3: Test trang chính
- [ ] Mở: `Web/HealthySystem-Frontend/auto-login-treatment.html`
- [ ] Trang tự động login và redirect
- [ ] Thấy trang Treatment History mở ra

### Bước 4: Kiểm tra tab "Đang điều trị"
- [ ] Thấy 2 treatment cards
- [ ] Card 1: "Điều trị cao huyết áp" - Progress 45%
- [ ] Card 2: "Điều trị viêm loét dạ dày" - Progress 60%
- [ ] Mỗi card hiển thị:
  - [x] Tên liệu trình
  - [x] Thời gian (ngày bắt đầu - kết thúc)
  - [x] Chẩn đoán (hộp màu vàng)
  - [x] Mô tả
  - [x] Progress bar với %
  - [x] Danh sách thuốc (icon pill + dosage + frequency)
  - [x] Ghi chú của bác sĩ
  - [x] Nút "Xem chi tiết"

### Bước 5: Kiểm tra tab "Lịch sử"
- [ ] Click tab "Lịch sử"
- [ ] Thấy 2 treatment cards
- [ ] Card 1: "Điều trị viêm amidan cấp" - 100%
- [ ] Card 2: "Điều trị dị ứng da" - 100%
- [ ] Mỗi card hiển thị:
  - [x] Badge "Hoàn thành" (màu xanh)
  - [x] Ngày hoàn thành
  - [x] Kết quả điều trị (hộp màu xanh)

### Bước 6: Kiểm tra Modal chi tiết
- [ ] Click nút "Xem chi tiết" bất kỳ
- [ ] Modal mở ra với:
  - [x] Thông tin chung (tên, thời gian, tiến độ)
  - [x] Chẩn đoán
  - [x] Mô tả chi tiết
  - [x] Danh sách Treatment Items:
    * Badge loại (Thuốc/Thủ thuật/Liệu pháp/Tái khám)
    * Tên item
    * Liều lượng (nếu có)
    * Tần suất
    * Thời gian
    * Hướng dẫn
  - [x] Kết quả (nếu đã hoàn thành)
  - [x] Ghi chú
- [ ] Click nút X hoặc bên ngoài để đóng modal

### Bước 7: Kiểm tra Responsive
- [ ] Thu nhỏ cửa sổ browser (< 768px)
- [ ] Layout tự động chuyển sang mobile view
- [ ] Cards hiển thị full width
- [ ] Text vẫn đọc được
- [ ] Nút vẫn click được

---

## ✅ DATABASE

### Bước 8: Verify dữ liệu
- [ ] Mở SQL Server Management Studio
- [ ] Connect: MSI\YLC
- [ ] Database: QLPhongKham
- [ ] Chạy query:
```sql
-- Kiểm tra treatments
SELECT * FROM treatments WHERE patient_id = 43;
-- Kết quả: 4 rows

-- Kiểm tra treatment_items
SELECT * FROM treatment_items ti
INNER JOIN treatments t ON ti.treatment_id = t.id
WHERE t.patient_id = 43;
-- Kết quả: 17 rows
```

---

## ✅ DOCUMENTATION

### Bước 9: Đọc tài liệu
- [ ] Mở: `Docs/Sprint05/SPRINT5_SUMMARY.md`
- [ ] Đọc qua tổng quan implementation
- [ ] Mở: `Docs/Sprint05/TEST_REPORT.md`  
- [ ] Xem kết quả test chi tiết
- [ ] Mở: `Docs/Sprint05/FINAL_REPORT.md`
- [ ] Xem tổng kết và checklist deployment

---

## ✅ CODE QUALITY

### Bước 10: Kiểm tra code
- [ ] Mở: `Backend/HealthySystem.API/Controllers/TreatmentsController.cs`
- [ ] Code có comment rõ ràng
- [ ] Có try-catch error handling
- [ ] Có authorization checks
- [ ] Mở: `Backend/HealthySystem.API/Models/Treatment.cs`
- [ ] Models có đầy đủ annotations
- [ ] Navigation properties configured
- [ ] Mở: `Web/HealthySystem-Frontend/treatment-history.html`
- [ ] HTML structure tốt
- [ ] CSS organized
- [ ] JavaScript functions có comment

---

## 📊 ACCEPTANCE CRITERIA

Để chấp nhận Sprint 5, cần đạt **ít nhất 90%** các mục trên.

### Kết quả kiểm tra của bạn:
- Tổng số mục: 45
- Đã check: ___ / 45
- Tỷ lệ: ____%

### Đánh giá:
- [ ] **ACCEPT** - Tất cả chức năng hoạt động tốt
- [ ] **ACCEPT WITH MINOR ISSUES** - Có vấn đề nhỏ nhưng không ảnh hưởng
- [ ] **REJECT** - Có lỗi nghiêm trọng cần sửa

### Ghi chú:
```
Người kiểm tra: _______________
Ngày kiểm tra: _______________
Ý kiến:



Chữ ký: _______________
```

---

## 🐛 BUG REPORT (Nếu có)

Nếu phát hiện lỗi, ghi vào đây:

| # | Mô tả lỗi | Mức độ | Trang/API | Cách tái hiện |
|---|-----------|--------|-----------|---------------|
| 1 |           |        |           |               |
| 2 |           |        |           |               |
| 3 |           |        |           |               |

Mức độ: Critical / Major / Minor

---

## 📞 SUPPORT

Nếu gặp vấn đề:
1. Kiểm tra API có chạy không (http://localhost:5296)
2. Kiểm tra database có dữ liệu không
3. Clear browser cache và thử lại
4. Xem console log trong Developer Tools (F12)

**Contact:** GitHub Copilot Assistant  
**Date:** 27/10/2025  
**Sprint:** Sprint 5 (22/10 - 27/10/2025)
