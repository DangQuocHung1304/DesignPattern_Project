# Tổng hợp front-end hiện có (phục vụ nâng cấp giao diện)

## 1. Phạm vi kiểm kê

Tài liệu này tổng hợp toàn bộ các trang front-end đang có trong workspace, các thành phần chính trên từng trang, và công nghệ front-end đang sử dụng.

Số lượng trang HTML hiện có:
- `Web/HealthySystem-Frontend`: 28 trang
- `Web`: 3 trang (`health-news.html`, `health-news-detail.html`, `service-prices.html`)
- `Web/HealthySystem-Web`: 1 trang (`index.html`)

Tổng cộng: 32 trang.

## 2. Công nghệ front-end đang sử dụng

### 2.1 Nền tảng và mô hình
- Mô hình trang tĩnh đa trang (multi-page HTML), không thấy SPA framework (React/Vue/Angular).
- HTML + CSS + JavaScript thuần là chủ đạo.

### 2.2 Thư viện UI và icon
- Bootstrap 5 (đang trộn version 5.1.3 và 5.3.0 tùy trang).
- Font Awesome (chủ yếu 6.0.0 và 6.4.0).
- Bootstrap Icons (các trang trong thư mục `Web` gốc).
- Chart.js (trên trang dashboard kế toán).

### 2.3 Lớp style nội bộ
- `assets/css/main.css`: hệ màu, layout cơ bản, header/nav, utility class.
- `assets/css/components.css`: hero, card, footer, responsive, animation, UI utility bổ sung.
- `assets/css/notifications.css`: toast, loading overlay, validation style.

### 2.4 Lớp JavaScript nội bộ
- `assets/js/config.js`: cấu hình endpoint, key, biến app.
- `assets/js/api.js`: lớp gọi REST API (`fetch`) + xử lý token.
- `assets/js/auth.js`: login/register/logout, đồng bộ localStorage, cập nhật UI.
- `assets/js/main.js`: xử lý navigation, trang chủ, tải tin tức/bảng giá, demo mode.
- `assets/js/notifications.js`: toast + loading + form validator.
- Script theo trang: `book-appointment.js`, `doctors.js`, `doctor-detail.js`, `specialty-detail.js`, `profile.js`.
- Tích hợp Firebase module:
  - `assets/js/firebase-init.js`
  - `assets/js/firestore-api.js`
  - dùng Firebase SDK ESM từ CDN (`gstatic`).

### 2.5 Tích hợp dữ liệu và xác thực
- REST API backend qua `fetch` (có Bearer token).
- Lưu trạng thái đăng nhập qua `localStorage`.
- Có tích hợp Firebase (Auth/Firestore/Storage) phục vụ một số luồng công việc dữ liệu.

## 3. Danh sách trang và thành phần trên từng trang

Ghi chú cột "Thành phần chính": liệt kê theo nhóm UI để phục vụ planning redesign (header/nav, hero, form, card, table, modal, dashboard, rating, pagination...).

### 3.1 Nhóm trang chính trong `Web/HealthySystem-Frontend`

| STT | Trang | Vai trò | Thành phần chính trên trang |
|---|---|---|---|
| 1 | `index.html` | Landing page hệ thống | Header + nav, hero, section features, specialties, doctors, stats, pricing, card listing, footer |
| 2 | `login.html` | Đăng nhập | Form đăng nhập, card auth |
| 3 | `register.html` | Đăng ký | Form đăng ký tài khoản, card auth |
| 4 | `profile.html` | Hồ sơ cá nhân | Card thông tin người dùng, khu vực profile, modal/chức năng cập nhật |
| 5 | `book-appointment.html` | Đặt lịch khám | Form đặt lịch, chọn bác sĩ/chuyên khoa, khu vực slot lịch, card, thông báo thành công |
| 6 | `patient-appointments.html` | Lịch khám bệnh nhân | Navbar, bộ lọc/tìm kiếm (form), danh sách lịch hẹn, modal chi tiết/cập nhật |
| 7 | `treatment-history.html` | Quá trình điều trị | Navbar, danh sách/lịch sử điều trị theo card, modal chi tiết |
| 8 | `patient-detail.html` | Chi tiết bệnh nhân | Card thông tin cá nhân/y tế/liên hệ khẩn cấp, bảng thông tin |
| 9 | `patient-lookup.html` | Tra cứu bệnh nhân | Navbar, khu tra cứu, card kết quả |
| 10 | `doctors.html` | Danh sách bác sĩ | Header + footer, card bác sĩ, bộ lọc/tìm kiếm, đánh giá |
| 11 | `doctor-detail.html` | Chi tiết bác sĩ | Header + footer, card thông tin bác sĩ, bảng/lịch làm việc, khu rating |
| 12 | `specialty-detail.html` | Chi tiết chuyên khoa | Header + footer, mô tả chuyên khoa, danh sách bác sĩ theo chuyên khoa (card), rating |
| 13 | `doctor-schedule.html` | Lịch làm việc bác sĩ | Dashboard card + bảng lịch, khu quản lý lịch |
| 14 | `doctor-appointments.html` | Lịch hẹn của bác sĩ | Form lọc lịch hẹn, card lịch hẹn, modal xử lý lịch |
| 15 | `doctor-dashboard.html` | Dashboard bác sĩ | KPI card, khu thao tác nhanh, lịch/lịch hẹn, modal, khu rating |
| 16 | `doctor-profile-edit.html` | Sửa hồ sơ bác sĩ | Form cập nhật thông tin cơ bản/chuyên môn/đổi mật khẩu, card upload ảnh |
| 17 | `doctor-rating.html` | Đánh giá bác sĩ | Form đánh giá, card thống kê đánh giá, sao rating |
| 18 | `clinic-rating.html` | Đánh giá phòng khám | Form rating phòng khám, card nhận xét/điểm trung bình |
| 19 | `reception-dashboard.html` | Dashboard tiếp tân | Navbar, card KPI ngày, khu thao tác nhanh/tiếp nhận |
| 20 | `reception-appointments.html` | Quản lý lịch hẹn tiếp tân | Navbar, form tìm/lọc, danh sách lịch hẹn, modal xử lý |
| 21 | `admin-dashboard.html` | Dashboard quản trị | Card thống kê, bảng dữ liệu, form thao tác, modal, khu quản lý lịch sử, pagination |
| 22 | `accountant-dashboard.html` | Dashboard kế toán | Card KPI tài chính, bảng giao dịch, modal chi tiết, biểu đồ Chart.js |
| 23 | `lab-technician-dashboard.html` | Dashboard kỹ thuật viên xét nghiệm | Form tiếp nhận mẫu, bảng danh sách yêu cầu, modal cập nhật kết quả |
| 24 | `lab-request.html` | Yêu cầu xét nghiệm | Khu tạo/xem yêu cầu xét nghiệm, card thông tin |
| 25 | `news.html` | Danh sách tin tức y tế | Header/hero/news list, card bài viết, pagination, footer |
| 26 | `news-detail.html` | Chi tiết tin tức | Header, bài viết chi tiết, card bài viết liên quan, footer |
| 27 | `guides.html` | Hướng dẫn khám bệnh | Header, hero hướng dẫn, card nội dung hướng dẫn, footer |
| 28 | `pricing.html` | Bảng giá dịch vụ | Header/hero, bảng giá theo nhóm dịch vụ, card/bảng, footer |

### 3.2 Nhóm trang bổ sung trong `Web` (gốc)

| STT | Trang | Vai trò | Thành phần chính trên trang |
|---|---|---|---|
| 29 | `health-news.html` | Danh sách tin tức y tế (bản độc lập) | Navbar, grid card tin tức, pagination |
| 30 | `health-news-detail.html` | Chi tiết tin tức (bản độc lập) | Card bài viết chi tiết, thông tin bài viết |
| 31 | `service-prices.html` | Bảng giá dịch vụ (bản độc lập) | Card mô tả dịch vụ + bảng giá |

### 3.3 Nhóm trang `Web/HealthySystem-Web`

| STT | Trang | Vai trò | Thành phần chính trên trang |
|---|---|---|---|
| 32 | `index.html` | Landing tối giản/bản thử nghiệm | Nội dung trang tĩnh đơn giản, card cơ bản |

## 4. Tổng hợp component tái sử dụng theo nhóm

- Thành phần điều hướng:
  - Header/nav custom (trong bộ `main.css`) cho nhóm trang public.
  - Bootstrap navbar cho nhóm dashboard/nội bộ.
- Thành phần trình bày:
  - Card là thành phần sử dụng phổ biến nhất (danh sách bác sĩ, dịch vụ, tin tức, KPI, profile).
  - Hero section sử dụng cho trang public (`index`, `news`, `pricing`, `guides`).
- Thành phần nhập liệu:
  - Form auth, form đặt lịch, form lọc tìm kiếm, form cập nhật hồ sơ, form đánh giá.
- Thành phần dữ liệu:
  - Table cho dashboard quản trị/kế toán/lab và trang bảng giá.
  - Pagination xuất hiện ở trang danh sách tin và một số trang quản trị.
- Thành phần phản hồi UI:
  - Toast notification, loading overlay, form validation class (`notifications.css` + `notifications.js`).
- Thành phần xác thực:
  - Auth state theo token/user trong localStorage; điều hướng theo vai trò trên một số trang.

## 5. Ghi chú quan trọng cho kế hoạch nâng cấp giao diện

- Có hiện tượng trùng lặp chức năng theo 2 bộ trang:
  - `pricing.html` và `service-prices.html`.
  - `news.html` và `health-news.html`.
  => Nên xác định bộ trang chính để tránh phân mảnh giao diện.

- Phiên bản Bootstrap đang không đồng nhất (5.1.3 và 5.3.0).
  => Nên chuẩn hóa 1 version để dễ bảo trì và tránh lỗi style/component.

- Có tham chiếu script không tồn tại:
  - `doctor-rating.html` và `clinic-rating.html` gọi `assets/js/loading.js` nhưng file này chưa thấy trong `assets/js`.
  => Cần tạo file bổ sung hoặc bỏ tham chiếu để tránh lỗi runtime.

- Thư mục `components/` và `pages/` (trong `Web/HealthySystem-Frontend`) đang rỗng.
  => Có thể dùng để tái cấu trúc theo hướng component hóa trong đợt redesign tiếp theo.

## 6. Đề xuất hướng tài liệu khi bắt đầu redesign

- Chốt design system chung: màu, spacing, typo, button, form, card, table, modal.
- Định nghĩa layout mẫu theo vai trò:
  - Public pages (home/news/pricing/guides).
  - Operational dashboards (admin/reception/doctor/accountant/lab).
- Chuẩn hóa stack front-end:
  - 1 version Bootstrap.
  - 1 bộ icon chính.
  - Quy ước đặt tên class/JS module nhất quán.
- Tách component tái sử dụng:
  - Header, sidebar, card KPI, table wrapper, form fields, toast/loading.
- Lập ma trận mapping API -> UI component để dễ thay đổi giao diện mà không vỡ logic.

---
Cập nhật lần cuối: 2026-03-30.
