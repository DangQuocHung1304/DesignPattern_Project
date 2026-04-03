# Huong Dan Khoi Chay Project - New Ver

Tai lieu nay huong dan cach khoi chay phien ban hien tai cua he thong HealthySystem (ASP.NET Core API + static web trong wwwroot).

## 1. Yeu cau moi truong

- Windows 10/11
- .NET SDK 9.0+
- PowerShell
- SQL Server (neu ban can chay cac API co truy van database)

Kiem tra nhanh:

```powershell
dotnet --version
```

## 2. Chay project tu dau

### Buoc 1: Di chuyen vao thu muc goc project

```powershell
cd "D:\1.MTKPM_TT_Done\LyThuyet\Project"
```

### Buoc 2: Restore va build

```powershell
dotnet restore Project.sln
dotnet build Project.sln -v minimal
```

### Buoc 3: Chay API o cong 5000

```powershell
dotnet run --project "Backend/HealthySystem.API/HealthySystem.API.csproj" --urls "http://0.0.0.0:5000"
```

Neu chay thanh cong, ban se thay log dang:

- Now listening on: http://0.0.0.0:5000
- Application started. Press Ctrl+C to shut down.

## 3. Kiem tra he thong da len

Mo mot PowerShell moi va chay:

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/health" | ConvertTo-Json -Depth 5
```

Ky vong ket qua:

- status = Healthy
- environment = Development

Kiem tra Swagger:

```powershell
(Invoke-WebRequest -Uri "http://localhost:5000/swagger" -UseBasicParsing).StatusCode
```

Ky vong: 200

## 4. Truy cap he thong

- Web static: http://localhost:5000
- Swagger UI: http://localhost:5000/swagger
- Health check: http://localhost:5000/api/health

## 5. Chay bo test

```powershell
dotnet test Project.sln -v minimal
```

## 6. Loi thuong gap va cach xu ly

### 6.1 Port 5000 da bi chiem

```powershell
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
```

Lay PID dang chiem cong 5000 va dung tien trinh:

```powershell
$pid5000 = (Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue).OwningProcess
if ($pid5000) {
	Get-Process -Id $pid5000
	Stop-Process -Id $pid5000 -Force
}
```

Neu co process dang chiem cong, doi cong chay:

```powershell
dotnet run --project "Backend/HealthySystem.API/HealthySystem.API.csproj" --urls "http://0.0.0.0:5001"
```

### 6.2 Loi ket noi database

- Kiem tra chuoi ket noi trong Backend/HealthySystem.API/appsettings.json
- Dam bao SQL Server dang chay va database da duoc tao

### 6.3 Loi JWT SecretKey

- Kiem tra JwtSettings.SecretKey trong appsettings.json va appsettings.Development.json

## 7. Dung server

Tai cua so dang chay API, nhan:

- Ctrl + C

## 8. Danh sach trang giao dien (User + Admin)

Luu y quan trong:

- Port 5000 hien tai dang phuc vu trang static trong `Backend/HealthySystem.API/wwwroot`.
- De mo toan bo cac trang trong `Web/HealthySystem-Frontend`, hay chay static server rieng.
- Tren may cua ban, port 5500 dang bi process khac chiem. Nen dung port 5501 cho frontend.

Chay static server cho frontend:

```powershell
cd "D:\1.MTKPM_TT_Done\LyThuyet\Project\Web\HealthySystem-Frontend"
python -m http.server 5501
```

Neu may khong co Python, co the dung:

```powershell
cd "D:\1.MTKPM_TT_Done\LyThuyet\Project\Web\HealthySystem-Frontend"
npx serve . -l 5501
```

### 8.1 Trang User/Public (HealthySystem-Frontend)

- Trang chu: http://localhost:5501/index.html
- Dang nhap: http://localhost:5501/login.html
- Dang ky: http://localhost:5501/register.html
- Danh sach bac si: http://localhost:5501/doctors.html
- Chi tiet bac si: http://localhost:5501/doctor-detail.html
- Chi tiet chuyen khoa: http://localhost:5501/specialty-detail.html
- Dat lich kham: http://localhost:5501/book-appointment.html
- Lich hen cua benh nhan: http://localhost:5501/patient-appointments.html
- Ho so nguoi dung: http://localhost:5501/profile.html
- Lich su dieu tri: http://localhost:5501/treatment-history.html
- Danh gia phong kham: http://localhost:5501/clinic-rating.html
- Danh gia bac si: http://localhost:5501/doctor-rating.html
- Tin tuc: http://localhost:5501/news.html
- Chi tiet tin tuc: http://localhost:5501/news-detail.html
- Huong dan: http://localhost:5501/guides.html
- Bang gia dich vu: http://localhost:5501/pricing.html

### 8.2 Trang Admin/Staff (HealthySystem-Frontend)

- Admin dashboard: http://localhost:5501/admin-dashboard.html
- Accountant dashboard: http://localhost:5501/accountant-dashboard.html
- Reception dashboard: http://localhost:5501/reception-dashboard.html
- Reception appointments: http://localhost:5501/reception-appointments.html
- Doctor dashboard: http://localhost:5501/doctor-dashboard.html
- Doctor dashboard (modern): http://localhost:5501/doctor-dashboard-modern.html
- Doctor appointments: http://localhost:5501/doctor-appointments.html
- Doctor profile edit: http://localhost:5501/doctor-profile-edit.html
- Doctor schedule: http://localhost:5501/doctor-schedule.html
- Lab technician dashboard: http://localhost:5501/lab-technician-dashboard.html
- Lab request: http://localhost:5501/lab-request.html
- Patient lookup: http://localhost:5501/patient-lookup.html
- Patient detail: http://localhost:5501/patient-detail.html

### 8.3 Trang test/demo

- Design patterns demo: http://localhost:5501/design-patterns-demo.html

### 8.4 Trang dang duoc API serve truc tiep (port 5000)

- http://localhost:5000/
- http://localhost:5000/index.html

### 8.5 Trang bo sung trong project

- Web/HealthySystem-Web/index.html (mo bang static server hoac mo truc tiep file)

---

Cap nhat theo trang thai new ver:

- API da duoc xac nhan chay thanh cong tren http://localhost:5000
- Health endpoint tra ve trang thai Healthy
- Swagger endpoint tra ve HTTP 200