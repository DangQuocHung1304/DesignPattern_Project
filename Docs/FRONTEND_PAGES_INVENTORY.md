# Tong hop front-end hien co

## 1. Pham vi kiem ke

Tai lieu nay tong hop cac trang front-end dang hoat dong trong workspace de phuc vu viec bao tri va nang cap giao dien.

So luong trang HTML hien co:
- Web/HealthySystem-Frontend: 31 trang

Tong cong: 31 trang.

## 2. Cong nghe front-end dang su dung

### 2.1 Nen tang va mo hinh
- Mo hinh multi-page HTML (khong su dung SPA framework nhu React/Vue/Angular)
- HTML + CSS + JavaScript thuan

### 2.2 Thu vien UI va icon
- Bootstrap 5.x
- Font Awesome
- Chart.js (xuat hien o dashboard ke toan)

### 2.3 Lop style noi bo
- assets/css/main.css
- assets/css/components.css
- assets/css/notifications.css
- assets/css/pages/*.css

### 2.4 Lop JavaScript noi bo
- assets/js/config.js
- assets/js/api.js
- assets/js/auth.js
- assets/js/app.js
- assets/js/main.js
- assets/js/notifications.js
- Cac script theo trang (doctors.js, pricing.js, news.js, doctor-detail.js, specialty-detail.js, book-appointment.js, ...)

### 2.5 Tich hop du lieu va xac thuc
- Goi REST API backend bang fetch
- Luu trang thai dang nhap trong localStorage

## 3. Danh sach trang HTML

| STT | Trang | Nhom | Vai tro chinh |
|---|---|---|---|
| 1 | index.html | Public | Landing page |
| 2 | appointment-registration.html | Public | Dang ky dat lich nhanh |
| 3 | doctors.html | Public | Danh sach bac si |
| 4 | doctor-detail.html | Public | Chi tiet bac si |
| 5 | specialty-detail.html | Public | Chi tiet chuyen khoa |
| 6 | pricing.html | Public | Bang gia dich vu |
| 7 | news.html | Public | Danh sach tin tuc |
| 8 | news-detail.html | Public | Chi tiet tin tuc |
| 9 | guides.html | Public | Huong dan kham benh |
| 10 | login.html | Auth | Dang nhap |
| 11 | register.html | Auth | Dang ky |
| 12 | profile.html | Patient | Ho so ca nhan |
| 13 | book-appointment.html | Patient | Dat lich kham |
| 14 | patient-appointments.html | Patient | Lich hen cua benh nhan |
| 15 | treatment-history.html | Patient | Lich su dieu tri |
| 16 | clinic-rating.html | Patient | Danh gia phong kham |
| 17 | doctor-rating.html | Patient | Danh gia bac si |
| 18 | doctor-dashboard.html | Doctor | Dashboard bac si |
| 19 | doctor-dashboard-modern.html | Doctor | Dashboard bac si (ban moi) |
| 20 | doctor-appointments.html | Doctor | Quan ly lich hen bac si |
| 21 | doctor-profile-edit.html | Doctor | Cap nhat ho so bac si |
| 22 | doctor-schedule.html | Doctor | Quan ly lich lam viec |
| 23 | reception-dashboard.html | Reception | Dashboard tiep tan |
| 24 | reception-appointments.html | Reception | Quan ly lich hen tiep tan |
| 25 | admin-dashboard.html | Admin | Dashboard quan tri |
| 26 | accountant-dashboard.html | Accountant | Dashboard ke toan |
| 27 | lab-technician-dashboard.html | Lab | Dashboard ky thuat vien |
| 28 | lab-request.html | Lab | Quan ly yeu cau xet nghiem |
| 29 | patient-lookup.html | Staff | Tra cuu benh nhan |
| 30 | patient-detail.html | Staff | Chi tiet benh nhan |
| 31 | design-patterns-demo.html | Demo | Trang demo |

## 4. Ghi chu bao tri

- Bo trang active hien tai duoc chuan hoa tap trung trong Web/HealthySystem-Frontend.
- Nen giu dong nhat version Bootstrap tren cac trang de tranh xung dot style.
- Nen tiep tuc tach script theo trang va tang tai su dung cho cac thanh phan chung (header, footer, loading, thong bao).

---
Cập nhật lần cuối: 2026-04-04.
