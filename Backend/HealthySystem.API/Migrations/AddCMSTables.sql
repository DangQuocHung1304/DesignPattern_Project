-- Add CMS tables for Health News and Service Prices
-- Run this script manually on your database

USE [HealthySystemDB];
GO

-- Create health_news table if not exists
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[health_news]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[health_news](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [title] [nvarchar](300) NOT NULL,
        [summary] [nvarchar](500) NOT NULL,
        [content] [nvarchar](max) NOT NULL,
        [image_url] [nvarchar](max) NULL,
        [category] [nvarchar](100) NOT NULL,
        [author] [nvarchar](200) NOT NULL,
        [is_featured] [bit] NOT NULL DEFAULT 0,
        [is_published] [bit] NOT NULL DEFAULT 0,
        [view_count] [int] NOT NULL DEFAULT 0,
        [published_date] [datetime2](7) NULL,
        [created_by] [int] NOT NULL DEFAULT 0,
        [created_at] [datetime2](7) NOT NULL DEFAULT GETDATE(),
        [updated_at] [datetime2](7) NULL,
        CONSTRAINT [PK_health_news] PRIMARY KEY CLUSTERED ([id] ASC)
    );
    
    PRINT 'Table health_news created successfully';
END
ELSE
BEGIN
    PRINT 'Table health_news already exists';
END
GO

-- Create service_prices table if not exists
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[service_prices]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[service_prices](
        [id] [int] IDENTITY(1,1) NOT NULL,
        [service_name] [nvarchar](200) NOT NULL,
        [category] [nvarchar](100) NOT NULL,
        [price] [decimal](18, 2) NOT NULL,
        [unit] [nvarchar](50) NOT NULL DEFAULT N'VNĐ',
        [description] [nvarchar](500) NULL,
        [is_active] [bit] NOT NULL DEFAULT 1,
        [display_order] [int] NOT NULL DEFAULT 0,
        [created_by] [int] NOT NULL DEFAULT 0,
        [created_at] [datetime2](7) NOT NULL DEFAULT GETDATE(),
        [updated_at] [datetime2](7) NULL,
        CONSTRAINT [PK_service_prices] PRIMARY KEY CLUSTERED ([id] ASC)
    );
    
    PRINT 'Table service_prices created successfully';
END
ELSE
BEGIN
    PRINT 'Table service_prices already exists';
END
GO

-- Insert sample health news data
IF NOT EXISTS (SELECT * FROM [dbo].[health_news])
BEGIN
    INSERT INTO [dbo].[health_news] 
        ([title], [summary], [content], [image_url], [category], [author], [is_featured], [is_published], [view_count], [published_date], [created_by], [created_at])
    VALUES
        (N'5 Thói quen tốt cho sức khỏe tim mạch', 
         N'Khám phá những thói quen đơn giản giúp bảo vệ trái tim khỏe mạnh',
         N'Tim mạch là một trong những hệ thống quan trọng nhất của cơ thể. Để duy trì sức khỏe tim mạch, bạn nên: 1. Tập thể dục đều đặn ít nhất 30 phút mỗi ngày. 2. Ăn nhiều rau xanh và trái cây. 3. Giảm lượng muối trong khẩu phần ăn. 4. Kiểm tra huyết áp thường xuyên. 5. Ngủ đủ 7-8 tiếng mỗi đêm.',
         NULL,
         N'Sức khỏe tổng quát',
         N'BS. Nguyễn Văn A',
         1, 1, 0, GETDATE(), 1, GETDATE()),
        
        (N'Dinh dưỡng cho người tiểu đường', 
         N'Chế độ ăn uống khoa học giúp kiểm soát đường huyết hiệu quả',
         N'Người bệnh tiểu đường cần chú ý: 1. Ăn đủ 3 bữa chính, tránh bỏ bữa. 2. Tăng cường rau xanh, hạn chế tinh bột. 3. Chọn carbohydrate phức tạp như yến mạch, gạo lứt. 4. Ăn protein nạc như cá, ức gà. 5. Uống đủ nước, tránh đồ uống có đường.',
         NULL,
         N'Dinh dưỡng',
         N'Bác sĩ dinh dưỡng Trần Thị B',
         1, 1, 0, GETDATE(), 1, GETDATE()),
        
        (N'Phòng ngừa cúm mùa hiệu quả', 
         N'Cách bảo vệ bản thân và gia đình khỏi bệnh cúm',
         N'Để phòng ngừa cúm mùa: 1. Tiêm vắc xin phòng cúm hàng năm. 2. Rửa tay thường xuyên với xà phòng. 3. Tránh tiếp xúc gần với người bị ốm. 4. Tăng cường hệ miễn dịch bằng ăn uống khoa học và tập luyện. 5. Đeo khẩu trang khi đến nơi đông người.',
         NULL,
         N'Phòng ngừa',
         N'BS. Lê Văn C',
         0, 1, 0, GETDATE(), 1, GETDATE());
    
    PRINT 'Sample health news data inserted';
END
GO

-- Insert sample service prices data
IF NOT EXISTS (SELECT * FROM [dbo].[service_prices])
BEGIN
    INSERT INTO [dbo].[service_prices] 
        ([service_name], [category], [price], [unit], [description], [is_active], [display_order], [created_by], [created_at])
    VALUES
        -- Khám bệnh
        (N'Khám bệnh tổng quát', N'Khám bệnh', 150000, N'VNĐ', N'Khám sức khỏe tổng quát, tư vấn bệnh lý', 1, 1, 1, GETDATE()),
        (N'Khám chuyên khoa tim mạch', N'Khám bệnh', 200000, N'VNĐ', N'Khám và tư vấn các bệnh lý tim mạch', 1, 2, 1, GETDATE()),
        (N'Khám chuyên khoa tiêu hóa', N'Khám bệnh', 200000, N'VNĐ', N'Khám và tư vấn các bệnh lý tiêu hóa', 1, 3, 1, GETDATE()),
        
        -- Xét nghiệm
        (N'Xét nghiệm máu tổng quát', N'Xét nghiệm', 100000, N'VNĐ', N'Công thức máu, hồng cầu, bạch cầu', 1, 1, 1, GETDATE()),
        (N'Xét nghiệm đường huyết', N'Xét nghiệm', 50000, N'VNĐ', N'Đo nồng độ đường trong máu', 1, 2, 1, GETDATE()),
        (N'Xét nghiệm chức năng gan', N'Xét nghiệm', 150000, N'VNĐ', N'SGOT, SGPT, Bilirubin', 1, 3, 1, GETDATE()),
        (N'Xét nghiệm chức năng thận', N'Xét nghiệm', 150000, N'VNĐ', N'Urê, Creatinin', 1, 4, 1, GETDATE()),
        
        -- Chẩn đoán hình ảnh
        (N'Chụp X-quang phổi', N'Chẩn đoán hình ảnh', 120000, N'VNĐ', N'Chụp X-quang tim phổi thẳng', 1, 1, 1, GETDATE()),
        (N'Siêu âm ổ bụng', N'Chẩn đoán hình ảnh', 200000, N'VNĐ', N'Siêu âm gan, mật, tụy, lách, thận', 1, 2, 1, GETDATE()),
        (N'Siêu âm tim', N'Chẩn đoán hình ảnh', 300000, N'VNĐ', N'Đánh giá chức năng tim, van tim', 1, 3, 1, GETDATE()),
        
        -- Thủ thuật
        (N'Truyền dịch', N'Thủ thuật', 50000, N'VNĐ/lần', N'Truyền dịch điều trị (chưa bao gồm thuốc)', 1, 1, 1, GETDATE()),
        (N'Tiêm tĩnh mạch', N'Thủ thuật', 20000, N'VNĐ/lần', N'Tiêm thuốc tĩnh mạch (chưa bao gồm thuốc)', 1, 2, 1, GETDATE()),
        (N'Băng bó vết thương', N'Thủ thuật', 30000, N'VNĐ/lần', N'Vệ sinh và băng bó vết thương', 1, 3, 1, GETDATE());
    
    PRINT 'Sample service prices data inserted';
END
GO

PRINT 'CMS tables setup completed successfully!';
