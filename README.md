# HealthySystem - Design Pattern Driven Clinic Management System

HealthySystem la he thong quan ly phong kham duoc tai cau truc theo huong kien truc huong mau thiet ke, ket hop backend ASP.NET Core Web API, SQL Server, va frontend multi-page JavaScript.

## 1) Architectural Value

Du an tap trung vao 12 Design Patterns de giai quyet cac van de cua legacy code:

- Giam coupling giua module nghiep vu
- Giam if-else phan nhanh phuc tap
- Tang kha nang mo rong theo role va quy trinh
- Chuan hoa endpoint pattern cho demo va testing

## 2) Quick Setup

### Prerequisites

- .NET SDK 9.0+
- SQL Server (local hoac network)
- Python 3.x (de host frontend static) hoac bat ky static server nao

### 2.1 Configure Backend

Cap nhat connection string tai file sau:

- Backend/HealthySystem.API/appsettings.json

Gia tri mau:

```json
"ConnectionStrings": {
	"DefaultConnection": "Server=MSI\\YLC;Database=QLPhongKham;Trusted_Connection=true;TrustServerCertificate=true;"
}
```

Neu can tao schema du lieu, tham khao:

- Docs/Database/Database_CNPMNC.sql

### 2.2 Run Backend

```powershell
dotnet restore Project.sln
dotnet build Project.sln -v minimal
dotnet run --project Backend/HealthySystem.API/HealthySystem.API.csproj --urls "http://0.0.0.0:5000"
```

Kiem tra health:

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/health" | ConvertTo-Json -Depth 5
```

### 2.3 Run Frontend

```powershell
cd Web/HealthySystem-Frontend
python -m http.server 5501
```

Truy cap:

- Home: http://localhost:5501/index.html
- Doctor Dashboard: http://localhost:5501/doctor-dashboard.html
- Reception Appointments: http://localhost:5501/reception-appointments.html
- Admin Dashboard: http://localhost:5501/admin-dashboard.html
- Accountant Dashboard: http://localhost:5501/accountant-dashboard.html

## 3) Map of 12 Design Patterns (/pattern Endpoints)

| # | Pattern | Vai tro trong he thong | Endpoint /pattern tieu bieu |
|---|---|---|---|
| 1 | State | Quan ly chuyen trang thai lich hen theo rule | PUT /api/appointments/{id}/status/pattern |
| 2 | Observer | Phat su kien khi trang thai lich hen thay doi | POST /api/design-patterns/observer/appointments/{appointmentCode}/status/pattern |
| 3 | Facade | Dieu phoi quy trinh bat dau kham qua nhieu subsystem | POST /api/examinations/start/pattern |
| 4 | Builder | Tao SOAP note theo cau truc chuan | POST /api/design-patterns/builder/soap-note/pattern |
| 5 | Proxy | Kiem soat truy cap va cache benh an | GET /api/medicalhistory/secure-summary/{patientCode}/pattern |
| 6 | Factory Method | Tao profile tai khoan theo role | POST /api/account/create/pattern |
| 7 | Singleton | Quan ly cau hinh he thong nhat quan | POST /api/design-patterns/singleton/config/pattern |
| 8 | Strategy | Chon chien luoc thanh toan theo method | POST /api/invoice/{invoiceId}/pay/pattern |
| 9 | Decorator | Cong/tru phi linh hoat tren hoa don | POST /api/invoice/pricing/preview/pattern |
| 10 | Template Method | Chuan hoa quy trinh tao phac do dieu tri | POST /api/examinations/treatment-plan/{planType}/pattern |
| 11 | Adapter | Chuyen doi payload gui cong bao hiem ben ngoai | POST /api/examinations/insurance-claim/pattern |
| 12 | Abstract Factory | Tao kenh reminder theo actor (doctor/patient) | POST /api/design-patterns/abstract-factory/reminders/{role}/pattern |

## 4) Demo Accounts (Verified)

| Vai tro | Email | Mat khau |
|---|---|---|
| Admin | admin@healthysystem.com | Admin@123 |
| Bac si | dr.an@clinic.local | Doctor@123 |
| Tiep tan | reception@clinic.local | Reception@123 |
| Ke toan | accounting@clinic.local | Accountant@123 |
| Benh nhan | nguyenvana@test.com | Password123! |

## 5) Clean Build Procedure (Recommended before demo)

```powershell
# 1) Stop backend/frontend runtime processes
Get-Process dotnet,iisexpress,node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2) Remove all backend build artifacts
Get-ChildItem Backend -Directory -Recurse | Where-Object { $_.Name -in @('bin','obj') } | Remove-Item -Recurse -Force

# 3) Rebuild clean
dotnet build Project.sln -v minimal
```

## 6) Notes

- Pattern endpoints da duoc chuan hoa theo hau to /pattern de phuc vu smoke test va thuyet trinh.
- Khong commit cac file generated trong bin/obj vao repository.
- Du an phuc vu muc dich hoc tap, trinh bay, va danh gia ky nang Software Engineering + AI-Enhanced Development.
