# 🤖 Chatbot AI - Hướng dẫn Cấu hình

## 📋 Tổng quan

Chatbot AI tích hợp OpenAI GPT-3.5 Turbo để cung cấp tư vấn sức khỏe thông minh, có khả năng:

- ✅ Trả lời đa dạng về mọi vấn đề sức khỏe
- ✅ Hiểu ngữ cảnh và đưa ra lời khuyên phù hợp
- ✅ Cá nhân hóa câu trả lời theo từng người dùng
- ✅ Tự động fallback về câu trả lời offline nếu API lỗi

## 🔑 Cách lấy OpenAI API Key (Miễn phí)

### Cách 1: Sử dụng OpenAI (Tốn phí nhỏ)

1. Truy cập: https://platform.openai.com/signup
2. Đăng ký tài khoản OpenAI
3. Vào **API Keys**: https://platform.openai.com/api-keys
4. Click **Create new secret key**
5. Copy key (dạng: `sk-...`)
6. Nạp tiền tối thiểu $5 vào tài khoản

**Chi phí:**
- GPT-3.5-Turbo: ~$0.002/1K tokens
- 1 cuộc hội thoại trung bình: ~500 tokens = $0.001
- $5 ≈ 5000 cuộc hội thoại

### Cách 2: Sử dụng Gemini API (MIỄN PHÍ) ⭐ Khuyến nghị

1. Truy cập: https://makersuite.google.com/app/apikey
2. Đăng nhập Google
3. Click **Get API Key** → **Create API Key**
4. Copy API key
5. Thay đổi code trong `ChatbotController.cs`:

```csharp
// Thay vì gọi OpenAI
var response = await httpClient.PostAsync(
    "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=" + apiKey,
    content
);
```

**Ưu điểm Gemini:**
- ✅ Hoàn toàn MIỄN PHÍ
- ✅ 60 requests/phút
- ✅ Hiệu suất tương đương GPT-3.5
- ✅ Không cần thẻ tín dụng

## ⚙️ Cấu hình Backend

### 1. Thêm OpenAI API Key

Mở file `appsettings.json`:

```json
{
  "OpenAI": {
    "ApiKey": "sk-your-openai-api-key-here"
  }
}
```

**Hoặc** set biến môi trường (an toàn hơn):

```bash
# Windows PowerShell
$env:OPENAI_API_KEY="sk-your-api-key"

# Linux/Mac
export OPENAI_API_KEY="sk-your-api-key"
```

### 2. Restart Backend

```bash
cd Backend/HealthySystem.API
dotnet run
```

## 📱 Sử dụng Chatbot

### Trên Web App:

1. Mở app
2. Thấy nút tròn **AI** ở góc dưới bên phải
3. **Tap** để mở chat
4. **Kéo thả** nút AI để di chuyển vị trí

### Các câu hỏi mẫu:

```
- Tôi bị sốt cao 39 độ, nên làm gì?
- Chế độ ăn kiêng cho người tiểu đường
- Bài tập giảm mỡ bụng hiệu quả
- Cách điều trị mất ngủ tự nhiên
- Triệu chứng viêm họng cấp
- Vitamin nào tốt cho người lớn tuổi?
```

## 🔧 Chế độ Fallback

Nếu không có OpenAI API key hoặc API lỗi, chatbot tự động chuyển sang **chế độ offline** với:

- ✅ Kiến thức y tế cơ bản được lập trình sẵn
- ✅ Trả lời về: sốt, đau đầu, dinh dưỡng, vận động, giấc ngủ, stress
- ✅ Không cần internet
- ✅ Phản hồi tức thì

## 🎨 Tính năng nâng cao

### Floating Button (Nút nổi):
- Cố định vị trí dù scroll
- Có thể kéo thả di chuyển
- Animation pulse thu hút
- Badge online status

### Chat Interface:
- Giao diện Messenger
- Tin nhắn có timestamp
- Loading indicator
- Quick replies (câu hỏi gợi ý)
- Keyboard avoiding

### AI Response:
- Markdown formatting
- Bullet points
- Emoji icons
- Warning alerts (⚠️)
- Medical disclaimers

## 🚀 Cải tiến trong tương lai

- [ ] Lưu lịch sử chat
- [ ] Gửi ảnh triệu chứng (Image recognition)
- [ ] Voice input (Nói để chat)
- [ ] Đa ngôn ngữ
- [ ] Đặt lịch khám trực tiếp từ chat
- [ ] Tích hợp hồ sơ bệnh án cá nhân

## 📊 So sánh OpenAI vs Gemini

| Tiêu chí | OpenAI GPT-3.5 | Google Gemini |
|----------|----------------|---------------|
| **Giá** | $0.002/1K tokens | MIỄN PHÍ |
| **Rate Limit** | 3500 req/phút | 60 req/phút |
| **Chất lượng** | Rất tốt | Tốt |
| **Setup** | Cần thẻ tín dụng | Chỉ cần Google account |
| **Tiếng Việt** | Xuất sắc | Tốt |

## ⚠️ Lưu ý

- Thông tin chatbot chỉ mang tính tham khảo
- Không thay thế chẩn đoán y khoa chính thức
- Triệu chứng nghiêm trọng → Đến bệnh viện ngay
- Không tự ý dùng thuốc theo lời khuyên AI

## 🆘 Troubleshooting

### Lỗi 404 - API not found
→ Backend chưa chạy hoặc URL sai. Check: http://localhost:5000/api/chatbot/message

### Lỗi 401 - Unauthorized
→ OpenAI API key sai hoặc hết hạn

### Lỗi 429 - Rate limit
→ Quá nhiều requests, chờ 1 phút

### Chatbot không trả lời
→ Check console log để xem lỗi, sẽ tự động fallback về offline mode

---

**Phát triển bởi:** Nhóm 8 - CNPM Nâng Cao
**Cập nhật:** November 2025

