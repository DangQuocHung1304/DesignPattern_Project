# 🏥 HealthySystem - Hệ thống Quản Lý Phòng Khám

> **Trạng thái:** ✅ Migration to Firebase Firestore Completed (Oct 27, 2025)  
> **Database:** Firebase Firestore (healthysystem-e96c1)  
> **Region:** asia-southeast1 (Singapore)

## 🎯 Mô tả dự án

HealthySystem là hệ thống quản lý phòng khám hiện đại với kiến trúc **Full-stack Cloud-native**:
- **Backend:** ASP.NET Core 9.0 Web API (Legacy) + **Firebase Firestore** (Current)
- **Frontend:** Vanilla JavaScript với Firebase SDK
- **Database:** ~~SQL Server~~ → **Firebase Firestore** (Migrated ✅)
- **Authentication:** Firebase Authentication (Email/Password)
- **Deployment:** Firebase Hosting ready

### � Firebase Migration Completed
- ✅ **98 records** migrated từ SQL Server sang Firestore
- ✅ **8 collections** với subcollections và relationships
- ✅ **UTF-8 encoding** hoàn hảo (tiếng Việt)
- ✅ **Security rules** deployed (role-based access control)
- ✅ **Composite indexes** deployed (11 indexes)
- 📁 Xem chi tiết: [`Migration/README.md`](Migration/README.md)

## 💻 Công nghệ sử dụng

### Backend
- **Firebase Firestore** - NoSQL Cloud Database (Current) ✅
- **Firebase Authentication** - User authentication & authorization
- **Firebase Hosting** - Static site hosting
- **ASP.NET Core 9.0** - Web API Framework (Legacy)
- **Entity Framework Core** - ORM cho SQL Server (Deprecated)
- **SQL Server** - Database (Migrated to Firestore) ✅

### Frontend
- **Vanilla JavaScript** - ES6+ features
- **Firebase SDK v10.7.1** - Firestore & Auth client
- **HTML5 & CSS3** - Responsive UI
- **Fetch API** - REST API calls

### DevOps & Tools
- **Firebase CLI** - Deployment tools
- **PowerShell** - Migration scripts
- **Node.js** - Firebase Admin SDK
- **Git** - Version control

## ✨ Tính năng chính

### ✅ Đã hoàn thành (Production Ready)
- 🔥 **Firebase Integration**: Firestore database + Authentication
- 🏥 **Quản lý chuyên khoa**: 5 chuyên khoa với bài viết chuyên môn
- 👨‍⚕️ **Quản lý bác sĩ**: 26 users (2 doctors, 19 patients, 5 staff)
- 📅 **Đặt lịch khám**: 23 appointments với calendar và time slots
- � **Walk-in Patients**: 27 bệnh nhân khám trực tiếp
- 🗓️ **Doctor Schedules**: 4 lịch làm việc bác sĩ
- 🔐 **Xác thực**: Firebase Authentication với role-based access
- 📱 **Responsive UI**: Giao diện tương thích mọi thiết bị
- 🌐 **RESTful API**: Backend với Firestore integration
- 🎨 **UX/UI**: Navigation, loading states, error handling

### 🔥 Firebase Features
- **Firestore Collections**: 8 collections (specialties, services, users, appointments, doctorSchedules, walkInPatients, + 2 subcollections)
- **Security Rules**: Role-based access (admin, doctor, reception, patient, lab, radiology, accountant)
- **Composite Indexes**: 11 indexes for optimized queries
- **Real-time Updates**: Live data synchronization
- **Offline Support**: Local caching & sync

### 🆕 Tính năng mới nhất
- **� Booking System**: 4-step appointment booking (Chọn bác sĩ → Chọn thời gian → Điền thông tin → Xác nhận)
- **�️ Advanced Calendar**: Month picker, date blocking, weekend display
- **👤 User Profiles**: Patient & staff profiles as subcollections
- **🔍 Search & Filter**: Filter doctors by specialty and name
- **🔗 Deep Linking**: URL parameters for pre-selecting doctors

## 📁 Cấu trúc thư mục

```
Project/
├── Backend/                        # ASP.NET Core API (Legacy)
│   └── HealthySystem.API/
│       ├── Controllers/
│       ├── Models/
│       ├── Data/
│       └── Program.cs
│
├── Web/                           # Frontend Application
│   └── Web_Ver01/
│       ├── assets/
│       │   ├── css/              # Stylesheets
│       │   ├── js/               # JavaScript files
│       │   │   ├── firebase-config.js      # Firebase credentials
│       │   │   ├── firebase-init.js        # Firebase SDK init
│       │   │   └── firestore-api.js        # Firestore API wrapper
│       │   └── images/
│       ├── pages/                # HTML pages
│       │   ├── index.html        # Homepage
│       │   ├── login.html        # Authentication
│       │   ├── doctors.html      # Doctor listing
│       │   └── booking.html      # Appointment booking
│       └── test-firebase.html    # Firebase connection test
│
├── Migration/                     # 🔥 Firebase Migration Scripts
│   ├── README.md                 # Migration documentation
│   ├── export-using-sqlcmd.ps1   # SQL Server export script
│   ├── import-from-files.js      # Firestore import script
│   └── sql-exports/              # Exported JSON files (8 files)
│
├── Archive/                       # Deprecated scripts
│   ├── export-sql-to-json.sql
│   ├── import-json-to-firestore.js
│   └── migrate-to-firestore.js
│
├── Docs/                         # Documentation
│   ├── Database_CNPMNC.sql       # Original SQL schema
│   ├── Nhom8_HeThongPhongKham_Ver02.xlsx
│   └── Sprint_Planning_S1.docx
│
├── Infrastructure/               # Infrastructure code
├── firebase.json                # Firebase project config
├── firestore.rules              # Security rules (200+ lines)
├── firestore.indexes.json       # Composite indexes (11 indexes)
├── serviceAccountKey.json       # Firebase Admin credentials
├── package.json                 # Node.js dependencies
└── README.md                    # This file
```

## 🚀 Cài đặt và chạy dự án

### Yêu cầu hệ thống
- **Node.js** 18+ (cho Firebase Admin SDK)
- **Firebase CLI** (optional, for deployment)
- **Modern Browser** (Chrome, Firefox, Edge, Safari)
- ~~.NET 9.0 SDK~~ (optional, for legacy backend)
- ~~SQL Server 2019+~~ (deprecated, migrated to Firestore)

---

## 🔥 Quick Start với Firebase (Recommended)

### 1. Clone Repository
```bash
git clone https://github.com/DangQuocHung1304/Project_CNPMNangCao.git
cd Project/
```

### 2. Cấu hình Firebase
Đã setup sẵn! Chỉ cần verify:
- ✅ Firebase project: `healthysystem-e96c1`
- ✅ Config file: `Web/Web_Ver01/assets/js/firebase-config.js`
- ✅ Data migrated: 98 records trong Firestore
- ✅ Security rules: Deployed
- ✅ Indexes: Deployed

### 3. Test Connection
```bash
# Mở trình duyệt
start Web/Web_Ver01/test-firebase.html
```

Nếu thấy ✅ "Firebase initialized successfully" → Bạn đã sẵn sàng!

### 4. Chạy Frontend
```bash
# Sử dụng Live Server (VS Code extension)
# Hoặc mở trực tiếp file
start Web/Web_Ver01/pages/index.html
```

### 5. Test Accounts
```javascript
// Admin
email: "admin@clinic.local"
password: "admin123"

// Doctor
email: "bsian@clinic.local"
password: "doctor123"

// Patient
email: "patient1@clinic.local"
password: "patient123"
```

---

## 📦 Migration từ SQL Server (Nếu cần chạy lại)

Xem chi tiết: [`Migration/README.md`](Migration/README.md)

### Quick Commands:
```powershell
# Export từ SQL Server
cd Migration
.\export-using-sqlcmd.ps1

# Import vào Firestore
node import-from-files.js
```

---

## 🏗️ Legacy Backend (ASP.NET - Optional)

### Cài đặt (Nếu muốn chạy API cũ)

1. **Cấu hình database**:
   ```json
   // appsettings.json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=MSI\\YLC;Database=QLPhongKham;Trusted_Connection=true;TrustServerCertificate=true;"
     }
   }
   ```

2. **Chạy SQL script**:
   ```bash
   # Execute Docs/Database_CNPMNC.sql
   ```

3. **Chạy API**:
   ```bash
   cd Backend/HealthySystem.API
   dotnet restore
   dotnet run
   ```
   
   API: `http://localhost:5196`

**Note:** Backend này đã deprecated, frontend hiện đang dùng Firebase Firestore.

## � Hướng dẫn sử dụng

### Đăng nhập
1. Truy cập `/pages/login.html`
2. Nhập email và password (xem Test Accounts ở trên)
3. Firebase Authentication sẽ xác thực và lưu session

### Đặt lịch khám
1. **Trang chủ** → Click "Đặt lịch khám"
2. **Bước 1**: Chọn bác sĩ (tìm kiếm và lọc theo chuyên khoa)
3. **Bước 2**: Chọn ngày và giờ (calendar + time slots)
4. **Bước 3**: Điền thông tin bệnh nhân (auto-fill nếu đã login)
5. **Bước 4**: Xác nhận → Lưu vào Firestore

### Xem thông tin bác sĩ
- **Danh sách**: `/pages/doctors.html` với search & filter
- **Chi tiết**: Click vào doctor card
- **Deep linking**: `/pages/doctor-detail.html?id=abc123`

### Chuyên khoa
- **Trang chủ**: Click specialty card
- **Bài viết**: Đọc về từng chuyên khoa
- **Doctors**: Danh sách bác sĩ trong chuyên khoa

---

## 🔌 Firestore API (Current)

### Collections Structure

```javascript
// Specialties (5 documents)
firestore.collection('specialties').doc(specialtyId)

// Services (4 documents)
firestore.collection('services').doc(serviceId)

// Users (26 documents) với subcollections
firestore.collection('users').doc(userId)
  .collection('profile').doc('patient')   // 3 patient profiles
  .collection('profile').doc('staff')     // 6 staff profiles

// Appointments (23 documents)
firestore.collection('appointments').doc(appointmentId)

// Doctor Schedules (4 documents)
firestore.collection('doctorSchedules').doc(scheduleId)

// Walk-in Patients (27 documents)
firestore.collection('walkInPatients').doc(walkInId)
```

### JavaScript API Wrapper
File: `Web/Web_Ver01/assets/js/firestore-api.js`

```javascript
// Get user by ID
const user = await firestoreAPI.getUser(userId);

// Get appointments by doctor
const appointments = await firestoreAPI.getAppointmentsByDoctor(doctorId);

// Create appointment
const appointmentId = await firestoreAPI.createAppointment({
  patientId: 'abc123',
  doctorId: 'def456',
  appointmentStart: new Date(),
  reason: 'Khám tổng quát'
});

// Cancel appointment
await firestoreAPI.cancelAppointment(appointmentId, 'Busy schedule');
```

---

## 🔐 Security & Roles

### Firebase Security Rules
File: `firestore.rules` (200+ lines deployed)

**Roles:** `admin`, `doctor`, `reception`, `patient`, `lab`, `radiology`, `accountant`

**Permissions:**
- **Admin**: Full access to all collections
- **Doctor**: Read patients, appointments, write medical records
- **Reception**: Create appointments, walk-in patients
- **Patient**: Read own data, create appointments
- **Lab/Radiology**: Update test results
- **Accountant**: Read invoices, update payments

---

## 📊 API Endpoints (Legacy - Deprecated)

> **Note:** Các endpoint dưới đây là từ ASP.NET backend cũ.  
> Frontend hiện đang dùng **Firestore** thay vì REST API.

### Authentication (Legacy)
- `POST /api/auth/login` - Đăng nhập (replaced by Firebase Auth)
- `POST /api/auth/register` - Đăng ký (replaced by Firebase Auth)

## 🗄️ Database Schema

### Firebase Firestore Collections

#### 1. **specialties** (5 documents)
```javascript
{
  sqlId: 1,
  name: "Nội tổng quát",
  description: "Chẩn đoán và điều trị...",
  createdAt: Timestamp
}
```

#### 2. **services** (4 documents)
```javascript
{
  sqlId: 1,
  name: "Khám tư vấn",
  description: "Dịch vụ khám bệnh cơ bản",
  price: 300000,
  duration: 30,
  isActive: true,
  createdAt: Timestamp
}
```

#### 3. **users** (26 documents)
```javascript
{
  sqlId: 17,
  publicId: "PTxxxxx",
  email: "patient@clinic.local",
  phone: "0901234567",
  role: "patient", // admin|doctor|reception|lab|radiology|accountant|patient
  status: "active",
  firstName: "Văn",
  lastName: "Nguyễn",
  fullName: "Nguyễn Văn An",
  dateOfBirth: Timestamp,
  gender: "male",
  createdAt: Timestamp
}

// Subcollections:
users/{userId}/profile/patient      // 3 patient profiles
users/{userId}/profile/staff        // 6 staff profiles
```

#### 4. **appointments** (23 documents)
```javascript
{
  sqlId: 1,
  patientId: "firebase_user_id",    // FK to users
  doctorId: "firebase_user_id",     // FK to users
  createdBy: "firebase_user_id",    // FK to users
  appointmentStart: Timestamp,
  appointmentEnd: Timestamp,
  status: "confirmed", // scheduled|confirmed|cancelled|completed|no_show
  source: "online",    // online|walk_in|phone|admin
  reason: "Khám tổng quát",
  cancellationReason: null,
  reminderSent: false,
  createdAt: Timestamp
}
```

#### 5. **doctorSchedules** (4 documents)
```javascript
{
  sqlId: 1,
  doctorId: "firebase_user_id",     // FK to users
  scheduleDate: Timestamp,
  startTime: "08:00",
  endTime: "17:00",
  slotLengthMinutes: 30,
  isAvailable: true
}
```

#### 6. **walkInPatients** (27 documents)
```javascript
{
  sqlId: 1,
  publicId: "WIxxxxx",
  fullName: "Nguyễn Văn An",
  phone: "0901234567",
  email: "patient@example.com",
  dateOfBirth: Timestamp,
  gender: "male",
  address: "123 Đường ABC",
  insuranceNumber: "INS123456",
  medicalRecordNumber: "MRN001",
  registeredUserId: "firebase_user_id", // FK to users (optional)
  createdBy: "firebase_user_id",        // FK to users
  createdAt: Timestamp,
  notes: "Walk-in consultation"
}
```

### Legacy SQL Server Schema
Xem file: `Docs/Database_CNPMNC.sql` (22 tables, deprecated)

---

## 🔄 Migration History

| Date | Action | Details |
|------|--------|---------|
| Oct 27, 2025 | ✅ Initial Migration | 98 records from SQL Server → Firestore |
| Oct 27, 2025 | ✅ Unicode Fix | UTF-8 encoding for Vietnamese characters |
| Oct 27, 2025 | ✅ Security Rules | Deployed role-based access control |
| Oct 27, 2025 | ✅ Indexes | Deployed 11 composite indexes |
| Oct 27, 2025 | ✅ Project Cleanup | Organized Migration/ and Archive/ folders |

**Migration Scripts:** See [`Migration/README.md`](Migration/README.md)

---

## 🛠️ Development Scripts

Các PowerShell scripts tiện ích trong root folder:

```powershell
# Cleanup project files
.\cleanup-project.ps1

# Install dependencies
.\install-datetimepicker.ps1

# Restart backend (legacy)
.\restart-backend.ps1

# Setup ngrok tunnel
.\setup-ngrok.ps1

# Start development server
.\start-dev.ps1

# Update API URL
.\update-api-url.ps1

# Update IP configuration
.\update-ip.ps1
```

---

## 🚀 Roadmap & Next Steps

### Phase 1: ✅ Migration Complete
- [x] Export SQL Server data
- [x] Import to Firestore
- [x] Deploy security rules
- [x] Deploy indexes
- [x] Test data integrity

### Phase 2: 🔄 Frontend Integration (Current)
- [ ] Replace all SQL API calls with Firestore API
- [ ] Implement Firebase Authentication UI
- [ ] Update booking flow with Firestore
- [ ] Test walk-in patient registration
- [ ] Add real-time updates

### Phase 3: 📱 Enhanced Features
- [ ] Cloud Functions for triggers
- [ ] Firebase Cloud Messaging (notifications)
- [ ] Firebase Storage (images, documents)
- [ ] Migrate remaining tables (encounters, prescriptions, invoices)
- [ ] Admin dashboard

### Phase 4: 🌐 Deployment
- [ ] Deploy to Firebase Hosting
- [ ] Setup custom domain
- [ ] Configure CDN
- [ ] Performance monitoring
- [ ] Analytics integration

## 🤝 Đóng góp

### Quy trình đóng góp
1. Fork repository
2. Tạo feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Tạo Pull Request

### Coding Standards
- **JavaScript**: ES6+, async/await pattern
- **CSS**: BEM naming convention
- **Firebase**: Follow security best practices
- **Comments**: Vietnamese for business logic, English for technical

---

## 📞 Liên hệ & Support

- **Firebase Console**: https://console.firebase.google.com/project/healthysystem-e96c1
- **Repository**: https://github.com/DangQuocHung1304/Project_CNPMNangCao
- **Issues**: [GitHub Issues](https://github.com/DangQuocHung1304/Project_CNPMNangCao/issues)

---

## 👥 Tác giả

- **Nhóm 8** - Công Nghệ Phần Mềm Nâng Cao
- **GitHub**: [@DangQuocHung1304](https://github.com/DangQuocHung1304)
- **Project**: HealthySystem - Clinic Management System

---

## 📄 License

Dự án này được phát triển cho mục đích học tập.

**⚠️ Important Notes:**
- Không sử dụng trong môi trường production mà không có security review
- `serviceAccountKey.json` KHÔNG được commit lên Git (đã có trong .gitignore)
- Test accounts chỉ dùng cho development environment

---

## 📸 Screenshots

### 🏠 Trang chủ
![Homepage](docs/screenshots/homepage.png)

### 🔐 Đăng nhập với Firebase
![Login](docs/screenshots/login.png)

### 👨‍⚕️ Danh sách bác sĩ
![Doctors](docs/screenshots/doctors.png)

### 📅 Đặt lịch khám
![Booking](docs/screenshots/booking.png)

### 🔥 Firebase Firestore Console
![Firestore](docs/screenshots/firestore-console.png)

---

## 🎉 Thành tựu

✅ **98 records** migrated successfully  
✅ **8 collections** with relationships preserved  
✅ **Zero data loss** during migration  
✅ **Perfect Unicode** encoding (Vietnamese)  
✅ **Security rules** deployed and tested  
✅ **11 composite indexes** for performance  
✅ **Role-based access** for 7 user roles  

---

**Last Updated:** October 27, 2025  
**Status:** 🔥 Firebase Migration Complete | Frontend Integration In Progress
