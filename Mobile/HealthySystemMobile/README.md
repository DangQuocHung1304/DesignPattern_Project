# HealthySystem Mobile App

Ứng dụng mobile cho hệ thống phòng khám được phát triển bằng React Native và Expo.

## 🚀 Tính năng

- **Đăng nhập/Đăng ký**: Xác thực người dùng với JWT token
- **Trang chủ**: Hiển thị thông tin tổng quan, truy cập nhanh các chức năng
- **Danh sách bác sĩ**: Xem thông tin các bác sĩ theo chuyên khoa
- **Đặt lịch khám**: Đặt lịch hẹn với bác sĩ
- **Quản lý lịch hẹn**: Xem và quản lý các cuộc hẹn
- **Thông tin cá nhân**: Quản lý hồ sơ người dùng

## 🛠️ Công nghệ sử dụng

- **React Native**: Framework phát triển ứng dụng mobile
- **Expo**: Platform phát triển và triển khai React Native
- **Expo Router**: File-based routing cho navigation
- **AsyncStorage**: Lưu trữ dữ liệu local
- **Axios**: HTTP client để gọi API
- **FontAwesome**: Thư viện icon

## 📱 Cấu trúc Project

```
HealthySystemMobile/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigator screens
│   │   ├── index.tsx      # Trang chủ
│   │   ├── doctors.tsx    # Danh sách bác sĩ
│   │   ├── appointments.tsx # Lịch hẹn
│   │   └── profile.tsx    # Thông tin cá nhân
│   ├── login.tsx          # Màn hình đăng nhập
│   ├── register.tsx       # Màn hình đăng ký
│   └── _layout.tsx        # Root layout
├── src/
│   ├── components/        # Các component tái sử dụng
│   │   ├── CustomButton.js
│   │   └── CustomInput.js
│   ├── contexts/          # React Context
│   │   └── AuthContext.js # Quản lý authentication
│   ├── services/          # API services
│   │   └── api.js         # Axios configuration
│   └── utils/            # Utility functions
└── assets/               # Hình ảnh, fonts, etc.
```

## 🚀 Cài đặt và Chạy

### Yêu cầu hệ thống
- Node.js (v16 hoặc cao hơn)
- npm hoặc yarn
- Expo CLI
- Expo Go app (để test trên thiết bị thật)

### Cài đặt dependencies
```bash
npm install
```

### Chạy ứng dụng
```bash
# Chạy development server
npm start

# Hoặc chạy trực tiếp trên platform cụ thể
npm run android  # Cho Android
npm run ios      # Cho iOS  
npm run web      # Cho Web
```

### Quét QR Code
1. Mở Expo Go app trên điện thoại
2. Quét QR code hiển thị trong terminal
3. Ứng dụng sẽ tải và chạy trên thiết bị

## 🔧 Cấu hình API

Cấu hình endpoint API trong file `src/services/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:7297/api';
```

Thay đổi URL này để trỏ đến server backend của bạn.

## 📱 Screenshots

*(Thêm screenshots của ứng dụng khi hoàn thành)*

## 🔐 Authentication Flow

1. User đăng nhập với email/password
2. Server trả về JWT token và refresh token
3. Token được lưu trong AsyncStorage
4. Mọi API call đều attach token vào header
5. Tự động refresh token khi hết hạn
6. Redirect về login khi token không hợp lệ

## 🚧 Tính năng đang phát triển

- [ ] Hoàn thiện màn hình danh sách bác sĩ
- [ ] Tích hợp đặt lịch khám
- [ ] Push notification
- [ ] Offline support
- [ ] Đa ngôn ngữ
- [ ] Dark mode

## 🤝 Đóng góp

1. Fork project
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Liên hệ

Project Link: [https://github.com/yourusername/healthysystem-mobile](https://github.com/yourusername/healthysystem-mobile)