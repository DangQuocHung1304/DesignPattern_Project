# QUẢN LÝ BẢNG GIÁ & TIN TỨC Y TẾ (Sprint 10)

## 📋 Tổng quan

**Sprint**: Sprint 10  
**Ngày hoàn thành**: 11/11/2025  
**Commit**: `3f7d27d`  
**Chức năng**: 2 modules quản lý cho Admin

---

## 🎯 Mục đích

Cho phép Admin quản lý:
1. **Bảng giá dịch vụ** - Hiển thị trên trang chủ cho bệnh nhân xem
2. **Tin tức y tế** - Cung cấp kiến thức sức khỏe cho cộng đồng

---

## 🗄️ Database Schema

### 1. Bảng SERVICE_PRICES

```sql
CREATE TABLE service_prices (
    id INT IDENTITY(1,1) PRIMARY KEY,
    service_name NVARCHAR(200) NOT NULL,
    category NVARCHAR(100) NOT NULL,       -- Khám bệnh, Xét nghiệm, Chẩn đoán hình ảnh
    price DECIMAL(18,2) NOT NULL CHECK (price >= 0),
    unit NVARCHAR(50) NOT NULL DEFAULT 'VNĐ',
    description NVARCHAR(500) NULL,
    is_active BIT NOT NULL DEFAULT 1,
    display_order INT NOT NULL DEFAULT 0,  -- Thứ tự hiển thị
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NULL,
    
    CONSTRAINT FK_service_prices_created_by FOREIGN KEY (created_by) 
        REFERENCES users(id)
);
```

**Indexes**:
- `IX_service_prices_category` - Tìm kiếm theo danh mục
- `IX_service_prices_is_active` - Lọc dịch vụ đang hoạt động
- `IX_service_prices_display_order` - Sắp xếp hiển thị

### 2. Bảng HEALTH_NEWS

```sql
CREATE TABLE health_news (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(300) NOT NULL,
    summary NVARCHAR(500) NOT NULL,        -- Tóm tắt
    content NVARCHAR(MAX) NOT NULL,        -- Nội dung đầy đủ (HTML)
    image_url NVARCHAR(500) NULL,
    category NVARCHAR(100) NOT NULL,       -- Sức khỏe, Dinh dưỡng, Bệnh lý, Phòng bệnh
    author NVARCHAR(200) NOT NULL,
    is_featured BIT NOT NULL DEFAULT 0,    -- Tin nổi bật
    is_published BIT NOT NULL DEFAULT 0,   -- Đã xuất bản
    view_count INT NOT NULL DEFAULT 0,
    published_date DATETIME NULL,
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NULL,
    
    CONSTRAINT FK_health_news_created_by FOREIGN KEY (created_by) 
        REFERENCES users(id)
);
```

**Indexes**:
- `IX_health_news_category` - Tìm kiếm theo danh mục
- `IX_health_news_is_published` - Lọc tin đã publish
- `IX_health_news_is_featured` - Tin nổi bật
- `IX_health_news_published_date` - Sắp xếp theo ngày
- `IX_health_news_view_count` - Tin xem nhiều nhất

---

## 🔧 Backend API Endpoints

### Module 1: Service Prices (Bảng giá dịch vụ)

#### 1.1. GET /api/admin/service-prices
**Mô tả**: Lấy danh sách bảng giá  
**Authorization**: Bearer Token (Admin)  
**Query Params**:
- `isActive` (optional): true/false

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "serviceName": "Khám bệnh tổng quát",
      "category": "Khám bệnh",
      "price": 200000,
      "unit": "VNĐ",
      "description": "Khám sức khỏe tổng quát",
      "isActive": true,
      "displayOrder": 1,
      "createdAt": "2025-11-11T10:00:00",
      "updatedAt": null
    }
  ]
}
```

#### 1.2. POST /api/admin/service-prices
**Mô tả**: Tạo bảng giá mới  
**Request Body**:
```json
{
  "serviceName": "Khám bệnh tổng quát",
  "category": "Khám bệnh",
  "price": 200000,
  "unit": "VNĐ",
  "description": "Khám sức khỏe tổng quát",
  "isActive": true,
  "displayOrder": 1
}
```

#### 1.3. PUT /api/admin/service-prices/{id}
**Mô tả**: Cập nhật bảng giá  
**Request Body**: Tương tự POST (tất cả fields optional)

#### 1.4. DELETE /api/admin/service-prices/{id}
**Mô tả**: Xóa bảng giá

---

### Module 2: Health News (Tin tức y tế)

#### 2.1. GET /api/admin/health-news
**Mô tả**: Lấy danh sách tin tức  
**Query Params**:
- `isPublished` (optional): true/false
- `isFeatured` (optional): true/false
- `category` (optional): string

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "10 Thói quen giúp tăng cường hệ miễn dịch",
      "summary": "Hệ miễn dịch khỏe mạnh là chìa khóa...",
      "content": "<h3>1. Ngủ đủ giấc</h3><p>...</p>",
      "imageUrl": null,
      "category": "Sức khỏe",
      "author": "BS. Nguyễn Văn A",
      "isFeatured": true,
      "isPublished": true,
      "viewCount": 150,
      "publishedDate": "2025-11-11T10:00:00",
      "createdAt": "2025-11-11T10:00:00",
      "updatedAt": null
    }
  ]
}
```

#### 2.2. GET /api/admin/health-news/{id}
**Mô tả**: Lấy chi tiết 1 tin tức

#### 2.3. POST /api/admin/health-news
**Mô tả**: Tạo tin tức mới  
**Request Body**:
```json
{
  "title": "10 Thói quen giúp tăng cường hệ miễn dịch",
  "summary": "Hệ miễn dịch khỏe mạnh...",
  "content": "<h3>1. Ngủ đủ giấc</h3><p>...</p>",
  "imageUrl": "https://example.com/image.jpg",
  "category": "Sức khỏe",
  "author": "BS. Nguyễn Văn A",
  "isFeatured": true,
  "isPublished": true
}
```

#### 2.4. PUT /api/admin/health-news/{id}
**Mô tả**: Cập nhật tin tức  
**Request Body**: Tương tự POST (tất cả fields optional)

**Logic đặc biệt**:
- Nếu chuyển `isPublished` từ `false` → `true`: tự động set `publishedDate = DateTime.Now`

#### 2.5. DELETE /api/admin/health-news/{id}
**Mô tả**: Xóa tin tức

---

## 📊 Dữ liệu mẫu

### Service Prices (23 dịch vụ)

**Khám bệnh** (7):
- Khám bệnh tổng quát: 200,000 VNĐ
- Khám chuyên khoa Nội: 300,000 VNĐ
- Khám chuyên khoa Ngoại: 300,000 VNĐ
- Khám Nhi: 250,000 VNĐ
- Khám Sản phụ khoa: 350,000 VNĐ
- Khám Da liễu: 280,000 VNĐ
- Khám Tai mũi họng: 280,000 VNĐ

**Xét nghiệm** (6):
- Xét nghiệm máu tổng quát (CBC): 150,000 VNĐ
- Xét nghiệm đường huyết: 80,000 VNĐ
- Xét nghiệm chức năng gan: 200,000 VNĐ
- Xét nghiệm chức năng thận: 180,000 VNĐ
- Xét nghiệm nước tiểu: 100,000 VNĐ
- Xét nghiệm HbA1c: 250,000 VNĐ

**Chẩn đoán hình ảnh** (7):
- Chụp X-Quang (1 phim): 200,000 VNĐ
- Siêu âm bụng tổng quát: 350,000 VNĐ
- Siêu âm thai: 400,000 VNĐ
- Điện tim (ECG): 150,000 VNĐ
- Chụp CT Scanner: 1,500,000 VNĐ
- Chụp MRI: 3,000,000 VNĐ

**Dịch vụ khác** (3):
- Tiêm thuốc/Truyền dịch: 50,000 VNĐ
- Băng vết thương: 80,000 VNĐ
- Khâu vết thương nhỏ: 300,000 VNĐ

### Health News (5 bài viết)

1. **10 Thói quen giúp tăng cường hệ miễn dịch**
   - Category: Sức khỏe
   - Featured: Yes
   - Views: 150

2. **Phòng ngừa đái tháo đường type 2**
   - Category: Bệnh lý
   - Featured: Yes
   - Views: 230

3. **Dinh dưỡng cho bà bầu: Những điều cần biết**
   - Category: Dinh dưỡng
   - Featured: No
   - Views: 180

4. **Chăm sóc sức khỏe người cao tuổi**
   - Category: Sức khỏe
   - Featured: No
   - Views: 95

5. **Cách phòng tránh bệnh cúm mùa**
   - Category: Phòng bệnh
   - Featured: No
   - Views: 120

---

## 🔐 Admin Password Management

### Scripts đã tạo:

1. **hash_admin_password.ps1** (PowerShell)
   - Hash password bằng BCrypt
   - Generate SQL UPDATE query

2. **HashPassword.cs** (C# Console App)
   - Hash multiple passwords
   - Xuất kết quả ra console

3. **Admin_Password_Hash.sql**
   - Hướng dẫn lấy thông tin admin
   - Template UPDATE password
   - Tạo admin mới nếu chưa có

### Cách sử dụng:

**Option 1: PowerShell Script**
```powershell
cd Docs/Sprint10
.\hash_admin_password.ps1
```

**Option 2: C# Console App**
```bash
cd Docs/Sprint10
csc /r:BCrypt.Net-Next.dll HashPassword.cs
.\HashPassword.exe
```

**Option 3: SQL Direct**
```sql
-- 1. Lấy thông tin admin
SELECT id, email, role FROM users WHERE role = 'admin';

-- 2. Update password (hash từ script)
UPDATE users
SET password_hash = '$2a$11$...'
WHERE role = 'admin';
```

### Mật khẩu mặc định
- **Username**: admin@healthysystem.com
- **Password**: admin123
- **Hash**: (Generate bằng BCrypt)

---

## 📈 Thống kê Code

| Metric | Value |
|--------|-------|
| **New Models** | 2 (ServicePrice, HealthNews) |
| **New Endpoints** | 10 |
| **Database Tables** | 2 |
| **SQL Scripts** | 2 |
| **Utility Scripts** | 2 (PowerShell + C#) |
| **Lines Added** | 965+ |
| **Files Changed** | 8 |
| **Sample Data** | 28 records (23 services + 5 news) |

---

## 🔄 Workflow

### Service Prices Management

```
┌──────────────┐
│ Admin Login  │
└──────┬───────┘
       │
       ▼
┌────────────────────────┐
│ Admin Dashboard        │
│ → Bảng giá dịch vụ     │
└──────┬─────────────────┘
       │
       ├─→ View All ──→ GET /api/admin/service-prices
       │
       ├─→ Create ────→ POST /api/admin/service-prices
       │                 ├─ Service Name
       │                 ├─ Category
       │                 ├─ Price
       │                 └─ Display Order
       │
       ├─→ Update ────→ PUT /api/admin/service-prices/{id}
       │
       └─→ Delete ────→ DELETE /api/admin/service-prices/{id}
```

### Health News Management

```
┌──────────────┐
│ Admin Login  │
└──────┬───────┘
       │
       ▼
┌────────────────────────┐
│ Admin Dashboard        │
│ → Tin tức y tế         │
└──────┬─────────────────┘
       │
       ├─→ View All ──→ GET /api/admin/health-news
       │                 Filter: Published, Featured, Category
       │
       ├─→ Create ────→ POST /api/admin/health-news
       │                 ├─ Title, Summary, Content
       │                 ├─ Image, Category, Author
       │                 └─ Featured? Published?
       │
       ├─→ Edit ──────→ PUT /api/admin/health-news/{id}
       │                 Auto set PublishedDate if publish
       │
       ├─→ View Detail → GET /api/admin/health-news/{id}
       │
       └─→ Delete ────→ DELETE /api/admin/health-news/{id}
```

---

## 🎨 Frontend Integration (TODO)

### Trang chủ - Service Prices Section

```html
<section id="bang-gia" class="service-prices">
    <h2>Bảng Giá Dịch Vụ</h2>
    
    <!-- Khám bệnh -->
    <div class="category">
        <h3>Khám bệnh</h3>
        <table>
            <tr>
                <td>Khám bệnh tổng quát</td>
                <td>200,000 VNĐ</td>
            </tr>
            <!-- ... -->
        </table>
    </div>
    
    <!-- Xét nghiệm -->
    <div class="category">
        <h3>Xét nghiệm</h3>
        <table>
            <!-- ... -->
        </table>
    </div>
</section>
```

**JavaScript**:
```javascript
async function loadServicePrices() {
    const response = await fetch('/api/admin/service-prices?isActive=true');
    const data = await response.json();
    
    // Group by category
    const grouped = data.data.reduce((acc, service) => {
        if (!acc[service.category]) acc[service.category] = [];
        acc[service.category].push(service);
        return acc;
    }, {});
    
    // Render HTML
    // ...
}
```

### Trang chủ - Health News Section

```html
<section id="tin-tuc" class="health-news">
    <h2>Tin Tức Y Tế</h2>
    
    <!-- Featured News -->
    <div class="featured-news">
        <img src="..." alt="...">
        <h3>10 Thói quen giúp tăng cường hệ miễn dịch</h3>
        <p>Hệ miễn dịch khỏe mạnh là chìa khóa...</p>
        <a href="/news/1">Đọc thêm →</a>
    </div>
    
    <!-- News List -->
    <div class="news-list">
        <!-- ... -->
    </div>
</section>
```

**JavaScript**:
```javascript
async function loadHealthNews() {
    const response = await fetch('/api/admin/health-news?isPublished=true');
    const data = await response.json();
    
    // Render featured news
    const featured = data.data.filter(n => n.isFeatured);
    
    // Render news list
    // ...
}
```

---

## ✅ Checklist

### Backend
- [x] ServicePrice model
- [x] HealthNews model
- [x] ApplicationDbContext update
- [x] AdminController - Service Prices CRUD (4 endpoints)
- [x] AdminController - Health News CRUD (5 endpoints)
- [x] Helper method GetCurrentUserId()
- [x] DTO classes (4 classes)

### Database
- [x] SQL script tạo bảng
- [x] Indexes cho performance
- [x] Foreign keys
- [x] Dữ liệu mẫu (28 records)

### Security
- [x] Admin password hash utilities
- [x] PowerShell script
- [x] C# console app
- [x] SQL script with instructions

### Documentation
- [x] API documentation
- [x] Database schema
- [x] Sample data
- [x] Workflow diagrams
- [x] Integration guidelines

### Frontend (Chưa làm - cần thêm)
- [ ] Admin dashboard tabs (Service Prices + Health News)
- [ ] CRUD forms
- [ ] Homepage integration
- [ ] Responsive design

---

## 📝 Next Steps

1. **Chạy SQL scripts**:
   ```sql
   -- Tạo bảng và insert dữ liệu mẫu
   Docs/Sprint10/Create_ServicePrices_HealthNews_Tables.sql
   
   -- Hash và update mật khẩu admin
   Docs/Sprint10/Admin_Password_Hash.sql
   ```

2. **Test API**:
   - Postman/Thunder Client
   - Test all 10 endpoints
   - Verify data integrity

3. **Frontend Integration**:
   - Add 2 tabs mới vào admin-dashboard.html
   - Create forms cho CRUD operations
   - Integrate vào homepage (index.html)

4. **Deploy**:
   - Update database schema
   - Deploy backend API
   - Deploy frontend

---

**Version**: 1.0  
**Last Updated**: 11/11/2025  
**Author**: Nhóm 8 - Healthy System  
**Commit**: 3f7d27d
