# 🔑 Hướng dẫn lấy Google Gemini API Key (MIỄN PHÍ)

## ✨ Ưu điểm của Gemini

- ✅ **Hoàn toàn MIỄN PHÍ** - Không cần thẻ tín dụng
- ✅ **60 requests/phút** - Đủ cho ứng dụng nhỏ
- ✅ **Tiếng Việt tốt** - Hiệu suất tương đương GPT-3.5
- ✅ **Không giới hạn tháng** - Miễn phí vĩnh viễn
- ✅ **Dễ dàng đăng ký** - Chỉ cần Google account

## 📝 Các bước lấy API Key

### Bước 1: Truy cập Google AI Studio

Mở trình duyệt và truy cập:
```
https://makersuite.google.com/app/apikey
```

Hoặc:
```
https://aistudio.google.com/app/apikey
```

### Bước 2: Đăng nhập Google

- Click **Sign in** ở góc trên bên phải
- Đăng nhập bằng tài khoản Google của bạn
- Chấp nhận Terms of Service

### Bước 3: Tạo API Key

1. Click nút **"Get API Key"** hoặc **"Create API Key"**
2. Chọn **"Create API key in new project"**
3. Đợi vài giây để Google tạo key
4. API key sẽ hiện ra (dạng: `AIzaSy...`)

### Bước 4: Copy API Key

- Click vào icon **Copy** bên cạnh API key
- Lưu key vào nơi an toàn

⚠️ **LƯU Ý**: Không chia sẻ API key với người khác!

## ⚙️ Cấu hình Backend

### Cách 1: Thêm vào appsettings.json (Đơn giản)

Mở file `Backend/HealthySystem.API/appsettings.json`:

```json
{
  "Gemini": {
    "ApiKey": "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX"
  }
}
```

### Cách 2: Biến môi trường (An toàn hơn)

**Windows PowerShell:**
```powershell
$env:GEMINI_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

**Windows CMD:**
```cmd
set GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Linux/Mac:**
```bash
export GEMINI_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

### Cách 3: .env file (Khuyến nghị cho production)

Tạo file `.env` trong thư mục Backend:
```
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## 🚀 Khởi động Backend

```bash
cd Backend/HealthySystem.API
dotnet run
```

Backend sẽ chạy tại: http://localhost:5000

## 🧪 Test API

### Dùng PowerShell:
```powershell
$body = @{
    message = "Tôi bị sốt cao, nên làm gì?"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/chatbot/message" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

### Dùng curl:
```bash
curl -X POST http://localhost:5000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Tôi bị sốt cao, nên làm gì?"}'
```

### Response mẫu:
```json
{
  "success": true,
  "data": {
    "reply": "🤒 Khi bị sốt cao, bạn nên:\n\n• Nghỉ ngơi đầy đủ...",
    "source": "gemini"
  }
}
```

## 📱 Test trên Mobile App

1. Mở app
2. Tap vào nút **AI** (góc dưới bên phải)
3. Gửi tin nhắn: "Tôi bị đau đầu"
4. Chatbot sẽ trả lời thông minh với AI

## 🔄 Fallback Mode

Nếu không có API key hoặc Gemini lỗi:
- ✅ Tự động chuyển sang **offline mode**
- ✅ Sử dụng câu trả lời được lập trình sẵn
- ✅ Vẫn trả lời tốt cho 7+ chủ đề y tế

## 📊 Giới hạn & Quota

### Free Tier (Miễn phí):
- **60 requests/phút**
- **1500 requests/ngày**
- **1 triệu tokens/ngày**

→ Đủ cho ~500 users/ngày

### Nếu vượt quota:
- API trả về lỗi 429 (Rate limit exceeded)
- Chatbot tự động fallback về offline mode
- Không ảnh hưởng UX

## 🆘 Troubleshooting

### ❌ Lỗi: "API key not valid"
**Nguyên nhân:** API key sai hoặc chưa được kích hoạt

**Giải pháp:**
1. Kiểm tra lại API key (copy đúng)
2. Đợi 5-10 phút sau khi tạo key mới
3. Tạo key mới nếu key cũ hết hạn

### ❌ Lỗi: "Quota exceeded"
**Nguyên nhân:** Vượt quá 60 requests/phút

**Giải pháp:**
1. Đợi 1 phút rồi thử lại
2. Implement rate limiting ở client
3. Tạo nhiều API keys và rotate

### ❌ Lỗi: "Service unavailable"
**Nguyên nhân:** Gemini service đang maintenance

**Giải pháp:**
1. Chatbot tự động fallback về offline
2. Thử lại sau 5-10 phút
3. Check status: https://status.cloud.google.com

### ❌ Backend log: "Gemini API key not configured"
**Nguyên nhân:** Chưa config API key

**Giải pháp:**
1. Thêm key vào `appsettings.json`
2. Hoặc set biến môi trường
3. Restart backend

## 🎯 Best Practices

### 1. Bảo mật API Key:
```csharp
// ✅ ĐÚNG - Dùng biến môi trường
var apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");

// ❌ SAI - Hard-code trong code
var apiKey = "AIzaSyXXXXXXXXXXXX";
```

### 2. Rate Limiting:
```typescript
// Mobile App - Giới hạn số lần gọi
let lastRequestTime = 0;
const MIN_INTERVAL = 2000; // 2 giây

if (Date.now() - lastRequestTime < MIN_INTERVAL) {
  return; // Skip request
}
```

### 3. Error Handling:
```csharp
try {
    var response = await CallGemini(message, apiKey);
} catch {
    // Fallback về offline mode
    return GetFallbackResponse(message);
}
```

## 🔗 Tài nguyên

- **Google AI Studio**: https://aistudio.google.com
- **Gemini API Docs**: https://ai.google.dev/docs
- **Pricing**: https://ai.google.dev/pricing
- **Quota & Limits**: https://ai.google.dev/gemini-api/docs/quota

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Check console log backend
2. Check network tab trong browser/app
3. Verify API key còn hoạt động
4. Test bằng curl command
5. Liên hệ nhóm phát triển

---

**✅ Setup xong!** Bây giờ chatbot đã có thể trả lời thông minh với AI!

**Phát triển bởi:** Nhóm 8 - CNPM Nâng Cao
**Cập nhật:** November 2025
