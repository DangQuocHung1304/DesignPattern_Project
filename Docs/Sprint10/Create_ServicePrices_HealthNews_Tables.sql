-- ============================================================
-- Sprint 10: Tạo bảng Service Prices và Health News
-- Database: HealthySystemDB
-- ============================================================

USE HealthySystemDB;
GO

-- ============================================================
-- 1. Tạo bảng SERVICE_PRICES (Bảng giá dịch vụ)
-- ============================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'service_prices')
BEGIN
    CREATE TABLE service_prices (
        id INT IDENTITY(1,1) PRIMARY KEY,
        service_name NVARCHAR(200) NOT NULL,
        category NVARCHAR(100) NOT NULL,
        price DECIMAL(18,2) NOT NULL CHECK (price >= 0),
        unit NVARCHAR(50) NOT NULL DEFAULT N'VNĐ',
        description NVARCHAR(500) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        display_order INT NOT NULL DEFAULT 0,
        created_by INT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NULL,
        
        CONSTRAINT FK_service_prices_created_by FOREIGN KEY (created_by) 
            REFERENCES users(id)
    );

    -- Index cho performance
    CREATE INDEX IX_service_prices_category ON service_prices(category);
    CREATE INDEX IX_service_prices_is_active ON service_prices(is_active);
    CREATE INDEX IX_service_prices_display_order ON service_prices(display_order);

    PRINT 'Bảng service_prices đã được tạo thành công';
END
ELSE
BEGIN
    PRINT 'Bảng service_prices đã tồn tại';
END
GO

-- ============================================================
-- 2. Tạo bảng HEALTH_NEWS (Tin tức y tế)
-- ============================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'health_news')
BEGIN
    CREATE TABLE health_news (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(300) NOT NULL,
        summary NVARCHAR(500) NOT NULL,
        content NVARCHAR(MAX) NOT NULL,
        image_url NVARCHAR(500) NULL,
        category NVARCHAR(100) NOT NULL,
        author NVARCHAR(200) NOT NULL,
        is_featured BIT NOT NULL DEFAULT 0,
        is_published BIT NOT NULL DEFAULT 0,
        view_count INT NOT NULL DEFAULT 0,
        published_date DATETIME NULL,
        created_by INT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NULL,
        
        CONSTRAINT FK_health_news_created_by FOREIGN KEY (created_by) 
            REFERENCES users(id)
    );

    -- Index cho performance
    CREATE INDEX IX_health_news_category ON health_news(category);
    CREATE INDEX IX_health_news_is_published ON health_news(is_published);
    CREATE INDEX IX_health_news_is_featured ON health_news(is_featured);
    CREATE INDEX IX_health_news_published_date ON health_news(published_date DESC);
    CREATE INDEX IX_health_news_view_count ON health_news(view_count DESC);

    PRINT 'Bảng health_news đã được tạo thành công';
END
ELSE
BEGIN
    PRINT 'Bảng health_news đã tồn tại';
END
GO

-- ============================================================
-- 3. Insert dữ liệu mẫu cho SERVICE_PRICES
-- ============================================================

-- Lấy admin ID (giả sử admin ID = 1, cần điều chỉnh)
DECLARE @AdminId INT = (SELECT TOP 1 id FROM users WHERE role = 'admin');

IF @AdminId IS NULL
BEGIN
    PRINT 'Cảnh báo: Không tìm thấy tài khoản admin. Vui lòng tạo admin trước.';
END
ELSE
BEGIN
    -- Xóa dữ liệu cũ nếu có
    DELETE FROM service_prices;
    
    -- Insert dữ liệu mẫu
    INSERT INTO service_prices (service_name, category, price, unit, description, is_active, display_order, created_by, created_at)
    VALUES
    -- Khám bệnh
    (N'Khám bệnh tổng quát', N'Khám bệnh', 200000, N'VNĐ', N'Khám sức khỏe tổng quát, tư vấn bác sĩ', 1, 1, @AdminId, GETDATE()),
    (N'Khám chuyên khoa Nội', N'Khám bệnh', 300000, N'VNĐ', N'Khám các bệnh nội khoa: tiêu hóa, tim mạch, hô hấp', 1, 2, @AdminId, GETDATE()),
    (N'Khám chuyên khoa Ngoại', N'Khám bệnh', 300000, N'VNĐ', N'Khám các bệnh ngoại khoa', 1, 3, @AdminId, GETDATE()),
    (N'Khám Nhi', N'Khám bệnh', 250000, N'VNĐ', N'Khám cho trẻ em dưới 15 tuổi', 1, 4, @AdminId, GETDATE()),
    (N'Khám Sản phụ khoa', N'Khám bệnh', 350000, N'VNĐ', N'Khám sức khỏe phụ nữ, thai sản', 1, 5, @AdminId, GETDATE()),
    (N'Khám Da liễu', N'Khám bệnh', 280000, N'VNĐ', N'Khám các bệnh về da, mụn, nấm', 1, 6, @AdminId, GETDATE()),
    (N'Khám Tai mũi họng', N'Khám bệnh', 280000, N'VNĐ', N'Khám viêm tai, viêm họng, viêm xoang', 1, 7, @AdminId, GETDATE()),
    
    -- Xét nghiệm
    (N'Xét nghiệm máu tổng quát (CBC)', N'Xét nghiệm', 150000, N'VNĐ', N'Đếm số lượng hồng cầu, bạch cầu, tiểu cầu', 1, 10, @AdminId, GETDATE()),
    (N'Xét nghiệm đường huyết', N'Xét nghiệm', 80000, N'VNĐ', N'Đo nồng độ glucose trong máu', 1, 11, @AdminId, GETDATE()),
    (N'Xét nghiệm chức năng gan', N'Xét nghiệm', 200000, N'VNĐ', N'AST, ALT, Bilirubin', 1, 12, @AdminId, GETDATE()),
    (N'Xét nghiệm chức năng thận', N'Xét nghiệm', 180000, N'VNĐ', N'Urea, Creatinin', 1, 13, @AdminId, GETDATE()),
    (N'Xét nghiệm nước tiểu', N'Xét nghiệm', 100000, N'VNĐ', N'Phát hiện nhiễm trùng đường tiết niệu', 1, 14, @AdminId, GETDATE()),
    (N'Xét nghiệm HbA1c', N'Xét nghiệm', 250000, N'VNĐ', N'Chỉ số đường huyết trung bình 3 tháng', 1, 15, @AdminId, GETDATE()),
    
    -- Chẩn đoán hình ảnh
    (N'Chụp X-Quang (1 phim)', N'Chẩn đoán hình ảnh', 200000, N'VNĐ', N'Chụp X-quang phổi, xương khớp', 1, 20, @AdminId, GETDATE()),
    (N'Siêu âm bụng tổng quát', N'Chẩn đoán hình ảnh', 350000, N'VNĐ', N'Siêu âm gan, mật, tụy, lách, thận', 1, 21, @AdminId, GETDATE()),
    (N'Siêu âm thai', N'Chẩn đoán hình ảnh', 400000, N'VNĐ', N'Theo dõi sức khỏe thai nhi', 1, 22, @AdminId, GETDATE()),
    (N'Điện tim (ECG)', N'Chẩn đoán hình ảnh', 150000, N'VNĐ', N'Đo nhịp tim, phát hiện bệnh tim mạch', 1, 23, @AdminId, GETDATE()),
    (N'Chụp CT Scanner', N'Chẩn đoán hình ảnh', 1500000, N'VNĐ', N'Chụp cắt lớp vi tính', 1, 24, @AdminId, GETDATE()),
    (N'Chụp MRI', N'Chẩn đoán hình ảnh', 3000000, N'VNĐ', N'Chụp cộng hưởng từ', 1, 25, @AdminId, GETDATE()),
    
    -- Dịch vụ khác
    (N'Tiêm thuốc/Truyền dịch', N'Dịch vụ khác', 50000, N'VNĐ', N'Phí dịch vụ tiêm, truyền (chưa bao gồm thuốc)', 1, 30, @AdminId, GETDATE()),
    (N'Băng vết thương', N'Dịch vụ khác', 80000, N'VNĐ', N'Vệ sinh và băng vết thương', 1, 31, @AdminId, GETDATE()),
    (N'Khâu vết thương nhỏ', N'Dịch vụ khác', 300000, N'VNĐ', N'Khâu vết thương nhỏ (dưới 5cm)', 1, 32, @AdminId, GETDATE());

    PRINT CAST(@@ROWCOUNT AS VARCHAR) + ' dịch vụ đã được thêm vào bảng giá';
END
GO

-- ============================================================
-- 4. Insert dữ liệu mẫu cho HEALTH_NEWS
-- ============================================================

DECLARE @AdminId INT = (SELECT TOP 1 id FROM users WHERE role = 'admin');

IF @AdminId IS NOT NULL
BEGIN
    -- Xóa dữ liệu cũ nếu có
    DELETE FROM health_news;
    
    -- Insert dữ liệu mẫu
    INSERT INTO health_news (title, summary, content, image_url, category, author, is_featured, is_published, view_count, published_date, created_by, created_at)
    VALUES
    (
        N'10 Thói quen giúp tăng cường hệ miễn dịch',
        N'Hệ miễn dịch khỏe mạnh là chìa khóa để phòng tránh bệnh tật. Hãy cùng tìm hiểu 10 thói quen đơn giản giúp tăng cường sức đề kháng.',
        N'<h3>1. Ngủ đủ giấc</h3><p>Mỗi ngày nên ngủ 7-8 tiếng để cơ thể phục hồi và tái tạo tế bào miễn dịch.</p><h3>2. Ăn uống cân bằng</h3><p>Chế độ ăn giàu vitamin C, D, kẽm và chất chống oxy hóa giúp tăng cường miễn dịch.</p><h3>3. Tập thể dục đều đặn</h3><p>Vận động 30 phút mỗi ngày giúp lưu thông máu, tăng sức đề kháng.</p><h3>4. Giảm stress</h3><p>Stress kéo dài làm suy giảm hệ miễn dịch. Hãy thư giãn bằng yoga, thiền hoặc đọc sách.</p><h3>5. Uống đủ nước</h3><p>2-2.5 lít nước mỗi ngày giúp đào thải độc tố, duy trì chức năng cơ thể.</p>',
        NULL,
        N'Sức khỏe',
        N'BS. Nguyễn Văn A',
        1,
        1,
        150,
        GETDATE(),
        @AdminId,
        GETDATE()
    ),
    (
        N'Phòng ngừa đái tháo đường type 2',
        N'Đái tháo đường type 2 đang gia tăng ở Việt Nam. Làm thế nào để phòng ngừa căn bệnh này?',
        N'<h3>Nguyên nhân</h3><p>Đái tháo đường type 2 xảy ra khi cơ thể không sử dụng insulin hiệu quả. Nguyên nhân chủ yếu từ lối sống không lành mạnh.</p><h3>Các yếu tố nguy cơ</h3><ul><li>Thừa cân, béo phì</li><li>Ít vận động</li><li>Ăn nhiều đường, tinh bột</li><li>Tuổi trên 45</li><li>Tiền sử gia đình</li></ul><h3>Cách phòng ngừa</h3><p>1. Duy trì cân nặng hợp lý<br>2. Tập thể dục thường xuyên<br>3. Ăn nhiều rau xanh, hạn chế đường<br>4. Kiểm tra sức khỏe định kỳ</p>',
        NULL,
        N'Bệnh lý',
        N'BS. Trần Thị B',
        1,
        1,
        230,
        DATEADD(DAY, -2, GETDATE()),
        @AdminId,
        DATEADD(DAY, -2, GETDATE())
    ),
    (
        N'Dinh dưỡng cho bà bầu: Những điều cần biết',
        N'Chế độ dinh dưỡng hợp lý trong thai kỳ ảnh hưởng lớn đến sức khỏe mẹ và bé. Hãy cùng tìm hiểu.',
        N'<h3>Chất dinh dưỡng quan trọng</h3><ul><li><strong>Axit folic:</strong> Phòng dị tật ống thần kinh</li><li><strong>Sắt:</strong> Phòng thiếu máu</li><li><strong>Canxi:</strong> Phát triển xương thai nhi</li><li><strong>Protein:</strong> Xây dựng tế bào</li><li><strong>DHA:</strong> Phát triển não bộ</li></ul><h3>Thực phẩm nên ăn</h3><p>Rau xanh, trái cây, thịt nạc, cá, trứng, sữa, ngũ cốc nguyên hạt.</p><h3>Thực phẩm nên tránh</h3><p>Đồ sống, rượu bia, caffeine quá nhiều, thức ăn nhanh.</p>',
        NULL,
        N'Dinh dưỡng',
        N'BS. Lê Thị C',
        0,
        1,
        180,
        DATEADD(DAY, -5, GETDATE()),
        @AdminId,
        DATEADD(DAY, -5, GETDATE())
    ),
    (
        N'Chăm sóc sức khỏe người cao tuổi',
        N'Người cao tuổi cần được chăm sóc đặc biệt. Những lưu ý quan trọng về sức khỏe người già.',
        N'<h3>Khám sức khỏe định kỳ</h3><p>Nên khám 3-6 tháng/lần để phát hiện bệnh sớm.</p><h3>Chế độ ăn</h3><p>Ăn mềm, dễ tiêu, giàu chất xơ. Hạn chế muối, đường, mỡ.</p><h3>Vận động</h3><p>Đi bộ nhẹ nhàng, tập yoga cho người già.</p><h3>Thuốc men</h3><p>Uống thuốc đúng giờ, đúng liều lượng. Tránh tự ý ngừng thuốc.</p>',
        NULL,
        N'Sức khỏe',
        N'BS. Phạm Văn D',
        0,
        1,
        95,
        DATEADD(DAY, -7, GETDATE()),
        @AdminId,
        DATEADD(DAY, -7, GETDATE())
    ),
    (
        N'Cách phòng tránh bệnh cúm mùa',
        N'Mùa đông đến, cúm mùa dễ bùng phát. Làm sao để phòng tránh hiệu quả?',
        N'<h3>Triệu chứng cúm mùa</h3><p>Sốt cao, ho, sổ mũi, đau đầu, mệt mỏi, đau cơ.</p><h3>Cách lây nhiễm</h3><p>Qua đường hô hấp khi tiếp xúc với người bệnh.</p><h3>Phòng ngừa</h3><ol><li>Tiêm vắc xin cúm hàng năm</li><li>Rửa tay thường xuyên</li><li>Đeo khẩu trang nơi đông người</li><li>Tăng cường sức đề kháng</li><li>Tránh tiếp xúc người bệnh</li></ol>',
        NULL,
        N'Phòng bệnh',
        N'BS. Nguyễn Văn A',
        0,
        1,
        120,
        DATEADD(DAY, -10, GETDATE()),
        @AdminId,
        DATEADD(DAY, -10, GETDATE())
    );

    PRINT CAST(@@ROWCOUNT AS VARCHAR) + ' tin tức y tế đã được thêm';
END
GO

-- ============================================================
-- 5. Verify dữ liệu
-- ============================================================

PRINT '';
PRINT '===========================================';
PRINT 'KIỂM TRA DỮ LIỆU';
PRINT '===========================================';

PRINT '';
PRINT 'SERVICE PRICES:';
SELECT COUNT(*) AS TotalServices, 
       COUNT(CASE WHEN is_active = 1 THEN 1 END) AS ActiveServices
FROM service_prices;

PRINT '';
PRINT 'HEALTH NEWS:';
SELECT COUNT(*) AS TotalNews,
       COUNT(CASE WHEN is_published = 1 THEN 1 END) AS PublishedNews,
       COUNT(CASE WHEN is_featured = 1 THEN 1 END) AS FeaturedNews
FROM health_news;

PRINT '';
PRINT '===========================================';
PRINT 'HOÀN TẤT!';
PRINT '===========================================';
GO
