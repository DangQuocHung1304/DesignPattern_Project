# HealthySystem - Hệ thống Quản lý Phòng khám

## Mô tả dự án

HealthySystem là một hệ thống quản lý phòng khám hiện đại, được phát triển bằng ASP.NET Core Web API cho backend và Vanilla JavaScript cho frontend. Hệ thống hỗ trợ quản lý bác sĩ, chuyên khoa, lịch hẹn và bệnh nhân.

## Công nghệ sử dụng

### Backend
- **ASP.NET Core 9.0** - Web API Framework
- **Entity Framework Core** - ORM cho SQL Server
- **SQL Server** - Cơ sở dữ liệu
- **JWT Authentication** - Xác thực người dùng
- **Swagger/OpenAPI** - Tài liệu API

### Frontend
- **Vanilla JavaScript** - Không sử dụng framework
- **HTML5 & CSS3** - Giao diện responsive
- **Fetch API** - Gọi REST API
- **Local Storage** - Lưu trữ session

## Tính năng chính

### ✅ Đã hoàn thành
- 🏥 **Quản lý chuyên khoa**: Hiển thị danh sách các chuyên khoa y tế
- 👨‍⚕️ **Quản lý bác sĩ**: Danh sách bác sĩ với thông tin chi tiết
- 🔐 **Hệ thống đăng nhập**: Authentication với trang đăng nhập riêng
- 📱 **Giao diện responsive**: Tương thích trên mọi thiết bị
- 🌐 **API RESTful**: Endpoints đầy đủ cho frontend

### 🚧 Đang phát triển
- 📅 **Đặt lịch khám**: Booking appointments
- 👤 **Quản lý hồ sơ bệnh nhân**: Patient profiles
- 📊 **Dashboard quản trị**: Admin dashboard
- 📧 **Thông báo**: Email/SMS notifications

## Cấu trúc thư mục

```
Project/
├── Backend/
│   └── HealthySystem.API/          # ASP.NET Core Web API
│       ├── Controllers/            # API Controllers
│       ├── Models/                # Entity Models
│       ├── Data/                  # Database Context
│       └── Program.cs             # Entry point
├── Web/
│   └── HealthySystem-Frontend/    # Vanilla JS Frontend
│       ├── assets/
│       │   ├── css/              # Stylesheets
│       │   └── js/               # JavaScript files
│       ├── index.html            # Trang chủ
│       └── login.html            # Trang đăng nhập
├── Docs/
│   ├── Database_CNPMNC.sql       # Database schema
│   └── Sprint_Planning_S1.docx   # Sprint planning
└── README.md
```

## Cài đặt và chạy dự án

### Yêu cầu hệ thống
- .NET 9.0 SDK
- SQL Server 2019+
- Visual Studio 2022 hoặc VS Code
- Trình duyệt web hiện đại

### Cài đặt Backend

1. **Clone repository**:
   ```bash
   git clone <repository-url>
   cd Project/Backend/HealthySystem.API
   ```

2. **Cấu hình database**:
   - Cập nhật connection string trong `appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=YOUR_SERVER;Database=QLPhongKham;Trusted_Connection=true;TrustServerCertificate=true;"
     }
   }
   ```

3. **Chạy SQL script**:
   - Thực thi `Docs/Database_CNPMNC.sql` để tạo database và sample data

4. **Chạy API**:
   ```bash
   dotnet restore
   dotnet run
   ```
   
   API sẽ chạy tại: `http://localhost:5196`

### Cài đặt Frontend

1. **Mở file HTML**:
   - Mở `Web/HealthySystem-Frontend/index.html` trong trình duyệt
   - Hoặc sử dụng Live Server extension trong VS Code

2. **Đăng nhập test**:
   - Email: `dr.an@clinic.local`
   - Password: `123456`

## API Endpoints

### Authentication
- `POST /api/simpleauth/login` - Đăng nhập

### Specialties
- `GET /api/specialties` - Lấy danh sách chuyên khoa
- `GET /api/specialties/{id}` - Lấy thông tin chuyên khoa
- `GET /api/specialties/{id}/doctors` - Lấy bác sĩ theo chuyên khoa

### Doctors
- `GET /api/doctors` - Lấy danh sách bác sĩ
- `GET /api/doctors/{publicId}` - Lấy thông tin bác sĩ
- `GET /api/doctors/{publicId}/schedule` - Lấy lịch làm việc
- `GET /api/doctors/{publicId}/available-slots` - Lấy khung giờ trống

### Health Check
- `GET /api/health` - Kiểm tra trạng thái API

## Database Schema

### Bảng chính
- `users` - Thông tin người dùng (bệnh nhân, bác sĩ, nhân viên)
- `specialties` - Chuyên khoa y tế
- `patient_profiles` - Hồ sơ bệnh nhân
- `staff_profiles` - Hồ sơ nhân viên
- `doctor_specialties` - Liên kết bác sĩ và chuyên khoa
- `appointments` - Lịch hẹn khám
- `doctor_schedules` - Lịch làm việc của bác sĩ

## Đóng góp

1. Fork repository
2. Tạo feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Tạo Pull Request

## Tác giả

- **Nhóm 8** - CNPM Nâng cao
- **Trường**: [Tên trường]
- **Khóa**: [Khóa học]

## License

Dự án này được phát triển cho mục đích học tập.

## Screenshots

### Trang chủ
![Trang chủ](screenshots/homepage.png)

### Trang đăng nhập
![Đăng nhập](screenshots/login.png)

### Danh sách bác sĩ
![Danh sách bác sĩ](screenshots/doctors.png)

---

**Lưu ý**: Đây là dự án học tập, không sử dụng trong môi trường production mà không có security review đầy đủ.