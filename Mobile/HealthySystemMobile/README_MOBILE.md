# HealthySystem Mobile App - Hoàn thiện

Ứng dụng mobile cho bệnh nhân sử dụng hệ thống phòng khám HealthySystem.

## 🎯 Tính năng hoàn chỉnh

### 1. **Xác thực người dùng**
- ✅ Đăng nhập với tài khoản bệnh nhân
- ✅ Đăng ký tài khoản mới
- ✅ Lưu trữ JWT token bảo mật
- ✅ Tự động redirect khi chưa đăng nhập

### 2. **Trang chủ (Home)**
- ✅ Thống kê tổng quan (bác sĩ, chuyên khoa, đánh giá)
- ✅ Quick Actions: Đặt lịch, Tin tức, Bảng giá, Lịch hẹn
- ✅ Danh sách chuyên khoa nổi bật
- ✅ Danh sách bác sĩ nổi bật
- ✅ Refresh để cập nhật dữ liệu

### 3. **Chuyên khoa (Specialties)**
- ✅ Danh sách tất cả chuyên khoa
- ✅ Tìm kiếm chuyên khoa
- ✅ Xem chi tiết chuyên khoa
- ✅ Danh sách bác sĩ theo chuyên khoa
- ✅ Đặt lịch từ chuyên khoa

### 4. **Bác sĩ (Doctors)**
- ✅ Danh sách tất cả bác sĩ
- ✅ Tìm kiếm bác sĩ theo tên
- ✅ Lọc theo chuyên khoa
- ✅ Xem chi tiết thông tin bác sĩ
- ✅ Xem lịch làm việc bác sĩ
- ✅ Đặt lịch khám trực tiếp

### 5. **Tin tức Y tế (News)** ⭐ MỚI
- ✅ Danh sách tin tức y tế
- ✅ Phân loại theo danh mục:
  - Sức khỏe tổng quát
  - Dinh dưỡng
  - Bệnh học
  - Phòng ngừa
  - Sống khỏe
- ✅ Lọc tin nổi bật
- ✅ Phân trang tự động
- ✅ Xem chi tiết bài viết
- ✅ Tự động đếm lượt xem
- ✅ Chia sẻ bài viết

### 6. **Bảng giá Dịch vụ (Pricing)** ⭐ MỚI
- ✅ Danh sách giá dịch vụ
- ✅ Phân loại theo danh mục:
  - Khám bệnh
  - Xét nghiệm
  - Chẩn đoán hình ảnh
  - Thủ thuật
  - Phẫu thuật
- ✅ Lọc theo danh mục
- ✅ Hiển thị minh bạch:
  - Tên dịch vụ
  - Giá cả
  - Mô tả chi tiết
  - Trạng thái áp dụng

### 7. **Đặt lịch khám (Book Appointment)**
- ✅ Chọn bác sĩ
- ✅ Chọn ngày khám
- ✅ Chọn ca khám (Sáng/Chiều/Tối)
- ✅ Chọn thời gian cụ thể
- ✅ Nhập lý do khám
- ✅ Xác nhận đặt lịch

### 8. **Quản lý Lịch hẹn (Appointments)**
- ✅ Danh sách lịch hẹn của bệnh nhân
- ✅ Lọc theo trạng thái:
  - Đang chờ
  - Đã xác nhận
  - Hoàn thành
  - Đã hủy
- ✅ Xem chi tiết lịch hẹn
- ✅ Hủy lịch hẹn
- ✅ Refresh dữ liệu

### 9. **Thông tin cá nhân (Profile)**
- ✅ Hiển thị thông tin bệnh nhân
- ✅ Xem lịch sử khám
- ✅ Đăng xuất

## 📱 Cấu trúc Navigation

```
Bottom Tabs:
├── Home (Trang chủ)
├── Specialties (Chuyên khoa)
├── Doctors (Bác sĩ)
├── News (Tin tức Y tế) ⭐ MỚI
├── Pricing (Bảng giá) ⭐ MỚI
├── Appointments (Lịch hẹn)
└── Profile (Cá nhân)

Stack Screens:
├── /login - Đăng nhập
├── /register - Đăng ký
├── /specialty-detail/[id] - Chi tiết chuyên khoa
├── /doctor-detail/[id] - Chi tiết bác sĩ
├── /news-detail/[id] - Chi tiết tin tức ⭐ MỚI
└── /book-appointment - Đặt lịch khám
```

## 🛠️ Công nghệ sử dụng

- **React Native** + **Expo** - Framework chính
- **Expo Router** - File-based navigation
- **TypeScript** - Type safety
- **Axios** - HTTP client
- **AsyncStorage** - Local storage
- **FontAwesome** - Icons

## 📦 Cài đặt

```bash
# Di chuyển vào thư mục mobile
cd Mobile/HealthySystemMobile

# Cài đặt dependencies
npm install

# Chạy trên Android
npm run android

# Chạy trên iOS
npm run ios

# Chạy trên web
npm run web
```

## 🔧 Cấu hình API

File: `src/services/api.js`

```javascript
const API_BASE_URL = 'http://YOUR_BACKEND_IP:5102/api';
```

**Lưu ý**: Thay đổi `YOUR_BACKEND_IP` thành:
- `10.0.2.2` cho Android Emulator
- `localhost` cho iOS Simulator
- IP thực của máy cho thiết bị thật

## 🎨 Giao diện

### Màu sắc chính
- Primary: `#0066cc` (Xanh dương)
- Success: `#00a86b` (Xanh lá)
- Danger: `#e74c3c` (Đỏ)
- Warning: `#f39c12` (Cam)
- Info: `#3498db` (Xanh nhạt)

### Font chữ
- Hệ thống mặc định của platform
- FontAwesome cho icons

## 📊 API Endpoints sử dụng

### Authentication
- `POST /auth/login` - Đăng nhập
- `POST /auth/register` - Đăng ký

### Specialties
- `GET /specialties` - Danh sách chuyên khoa
- `GET /specialties/{id}` - Chi tiết chuyên khoa

### Doctors
- `GET /doctors` - Danh sách bác sĩ
- `GET /doctors/{id}` - Chi tiết bác sĩ
- `GET /doctors/{id}/schedules` - Lịch làm việc bác sĩ

### Health News ⭐ MỚI
- `GET /healthnews` - Danh sách tin tức (có phân trang)
- `GET /healthnews/{id}` - Chi tiết tin tức
- `GET /healthnews/categories` - Danh mục tin tức

### Service Prices ⭐ MỚI
- `GET /serviceprices` - Danh sách giá dịch vụ (grouped)
- `GET /serviceprices/categories` - Danh mục dịch vụ

### Appointments
- `GET /appointments/patient/{patientId}` - Lịch hẹn của bệnh nhân
- `POST /appointments` - Tạo lịch hẹn mới
- `PUT /appointments/{id}/cancel` - Hủy lịch hẹn

## 🧪 Testing

```bash
# Chạy tests
npm test

# Test với coverage
npm run test:coverage
```

## 📱 Build Production

```bash
# Build Android APK
eas build --platform android

# Build iOS IPA
eas build --platform ios

# Build cho cả hai
eas build --platform all
```

## 🔐 Bảo mật

- ✅ JWT Token authentication
- ✅ Secure storage với AsyncStorage
- ✅ API request interceptors
- ✅ Validation dữ liệu đầu vào
- ✅ Error handling toàn diện

## 🚀 Tính năng nổi bật mới

### 1. Tin tức Y tế
- Cập nhật kiến thức sức khỏe mới nhất
- Phân loại rõ ràng theo chủ đề
- Giao diện đọc tin thoải mái
- Chia sẻ bài viết dễ dàng

### 2. Bảng giá Dịch vụ
- Minh bạch giá cả
- Dễ dàng tra cứu
- Phân loại theo từng danh mục
- Cập nhật liên tục

## 📝 Notes

### Điểm khác biệt so với Admin
- ❌ Không có chức năng quản lý (CRUD)
- ❌ Không có dashboard thống kê
- ✅ Chỉ xem và sử dụng dịch vụ
- ✅ Tập trung vào trải nghiệm bệnh nhân
- ✅ Giao diện thân thiện, dễ sử dụng

### Yêu cầu hệ thống
- Node.js >= 16
- Expo CLI
- Android Studio (cho Android)
- Xcode (cho iOS, chỉ trên macOS)

## 👥 Người dùng

Mobile app này được thiết kế cho:
- **Bệnh nhân** - Đặt lịch, xem tin tức, tra cứu giá
- **Người thân** - Hỗ trợ đặt lịch cho người thân

## 🔄 Cập nhật gần đây

### Version 2.0.0 (24/11/2025)
- ✅ Thêm màn hình Tin tức Y tế
- ✅ Thêm màn hình Bảng giá Dịch vụ
- ✅ Cải thiện UI/UX cho tất cả màn hình
- ✅ Tối ưu performance
- ✅ Fix bugs và cải thiện stability

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra kết nối Internet
2. Kiểm tra Backend đang chạy
3. Kiểm tra cấu hình API URL
4. Xem logs trong terminal

## 📄 License

Copyright © 2025 HealthySystem. All rights reserved.
