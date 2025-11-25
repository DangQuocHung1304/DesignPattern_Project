using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatbotController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ChatbotController> _logger;

        public ChatbotController(
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            ILogger<ChatbotController> logger)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpPost("message")]
        public async Task<ActionResult<object>> SendMessage([FromBody] ChatRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Message))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Tin nhắn không được để trống"
                    });
                }

                // Get API key from configuration
                var apiKey = _configuration["Gemini:ApiKey"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");
                
                if (string.IsNullOrEmpty(apiKey))
                {
                    _logger.LogWarning("Gemini API key not configured, using fallback responses");
                    return Ok(new
                    {
                        success = true,
                        data = new
                        {
                            reply = GetFallbackResponse(request.Message),
                            source = "fallback"
                        }
                    });
                }

                // Call Gemini API
                var response = await CallGemini(request.Message, apiKey);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        reply = response,
                        source = "gemini"
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing chatbot message");
                
                // Return fallback response on error
                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        reply = GetFallbackResponse(request.Message),
                        source = "fallback"
                    }
                });
            }
        }

        private async Task<string> CallGemini(string message, string apiKey)
        {
            var httpClient = _httpClientFactory.CreateClient();

            var systemPrompt = @"Bạn là trợ lý AI chuyên về tư vấn sức khỏe tại phòng khám. 

Nhiệm vụ của bạn:
- Tư vấn về các triệu chứng bệnh thường gặp
- Đưa ra lời khuyên về chế độ ăn uống, dinh dưỡng
- Hướng dẫn về vận động thể chất phù hợp
- Tư vấn về sức khỏe tinh thần
- Giải đáp thắc mắc về thuốc và cách sử dụng

Lưu ý:
- Trả lời ngắn gọn, dễ hiểu (200-300 từ)
- Sử dụng bullet points khi cần thiết
- Luôn khuyến khích đến gặp bác sĩ nếu triệu chứng nghiêm trọng
- Không chẩn đoán bệnh chính xác, chỉ đưa ra hướng dẫn sơ bộ
- Sử dụng tiếng Việt thân thiện, dễ hiểu
- Sử dụng emoji phù hợp để dễ đọc";

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = $"{systemPrompt}\n\nCâu hỏi: {message}" }
                        }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.7,
                    maxOutputTokens = 500,
                    topP = 0.95
                }
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json"
            );

            var response = await httpClient.PostAsync(
                $"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={apiKey}",
                content
            );

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning($"Gemini API returned status code: {response.StatusCode}, Error: {errorContent}");
                throw new Exception("Gemini API call failed");
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var jsonDoc = JsonDocument.Parse(responseContent);
            
            var reply = jsonDoc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            return reply ?? "Xin lỗi, tôi không thể xử lý câu hỏi này lúc này.";
        }

        private string GetFallbackResponse(string query)
        {
            var lowerQuery = query.ToLower();

            if (lowerQuery.Contains("sốt") || lowerQuery.Contains("nóng"))
            {
                return @"🤒 **Về triệu chứng sốt:**

• Nghỉ ngơi đầy đủ trong môi trường mát mẻ
• Uống nhiều nước, nước hoa quả
• Chườm ấm hoặc lạnh tùy cảm giác
• Dùng thuốc hạ sốt (Paracetamol) theo liều dặn
• Theo dõi nhiệt độ định kỳ

⚠️ **Khi nào cần gặp bác sĩ:**
- Sốt trên 39°C
- Sốt kéo dài trên 3 ngày
- Kèm theo buồn nôn, đau đầu dữ dội
- Xuất hiện phát ban

Vui lòng đến khám để được bác sĩ thăm khám và điều trị phù hợp.";
            }

            if (lowerQuery.Contains("đau đầu") || lowerQuery.Contains("nhức đầu") || lowerQuery.Contains("đau nửa đầu"))
            {
                return @"🤕 **Về triệu chứng đau đầu:**

**Các biện pháp giảm đau:**
• Nghỉ ngơi trong phòng tối, yên tĩnh
• Chườm lạnh hoặc ấm vùng trán, gáy
• Massage nhẹ nhàng vùng thái dương
• Uống đủ nước (mất nước gây đau đầu)
• Tránh ánh sáng chói, tiếng ồn

**Phòng ngừa:**
• Ngủ đủ giấc 7-8 tiếng/đêm
• Ăn uống đều đặn, không bỏ bữa
• Giảm stress, căng thẳng
• Hạn chế caffeine, rượu bia

⚠️ Nếu đau đầu dữ dội đột ngột, kèm buồn nôn, mờ mắt - hãy đến cấp cứu ngay!";
            }

            if (lowerQuery.Contains("ăn") || lowerQuery.Contains("dinh dưỡng") || lowerQuery.Contains("thực đơn"))
            {
                return @"🥗 **Tư vấn dinh dưỡng cân bằng:**

**Nguyên tắc vàng:**
• Ăn đủ 3 bữa chính, không bỏ bữa
• Đa dạng thực phẩm (rau, củ, quả, protein, tinh bột)
• Tăng rau xanh và trái cây tươi
• Protein từ: thịt nạc, cá, trứng, đậu, sữa
• Tinh bột nguyên hạt: gạo lứt, yến mạch

**Nên tránh:**
• Đồ chiên rán, nhiều dầu mỡ
• Thức ăn nhanh, đồ chế biến sẵn
• Đồ ngọt, nước có ga
• Muối, MSG dư thừa

💧 **Uống nước:** 2-2.5 lít/ngày

📋 Nếu cần chế độ ăn đặc biệt (tiểu đường, tim mạch, giảm cân), vui lòng đặt lịch gặp bác sĩ dinh dưỡng.";
            }

            if (lowerQuery.Contains("tập") || lowerQuery.Contains("vận động") || lowerQuery.Contains("thể dục") || lowerQuery.Contains("gym"))
            {
                return @"🏃 **Hướng dẫn vận động thể chất:**

**Tần suất khuyến nghị:**
• Ít nhất 150 phút/tuần (30 phút x 5 ngày)
• Hoặc 75 phút vận động mạnh/tuần

**Các hoạt động phù hợp:**
• Đi bộ nhanh, chạy bộ
• Bơi lội
• Đạp xe
• Yoga, Pilates
• Nhảy aerobic, Zumba

**Lưu ý quan trọng:**
✓ Khởi động 5-10 phút trước khi tập
✓ Tăng cường độ dần dần
✓ Nghỉ ngơi hợp lý giữa các buổi
✓ Uống nước đầy đủ
✓ Nghe cơ thể, dừng nếu có dấu hiệu bất thường

⚠️ Nếu có bệnh nền (tim mạch, xương khớp), tham khảo bác sĩ trước khi tập!";
            }

            if (lowerQuery.Contains("ngủ") || lowerQuery.Contains("mất ngủ") || lowerQuery.Contains("khó ngủ"))
            {
                return @"😴 **Cải thiện giấc ngủ chất lượng:**

**Thói quen ngủ tốt:**
• Ngủ đủ 7-8 tiếng mỗi đêm
• Đi ngủ và thức dậy cùng giờ (kể cả cuối tuần)
• Tránh ngủ trưa quá lâu (< 30 phút)

**Trước khi ngủ 1-2 tiếng:**
• Tắt điện thoại, TV, máy tính
• Đọc sách, nghe nhạc nhẹ nhàng
• Tắm nước ấm
• Không ăn quá no hoặc quá đói

**Môi trường ngủ:**
• Phòng tối, mát mẻ (20-22°C)
• Giường thoải mái, gối vừa phải
• Yên tĩnh, tránh tiếng ồn

❌ **Tránh:**
• Caffeine sau 2 giờ chiều
• Rượu, bia trước khi ngủ
• Xem phim hành động, làm việc căng thẳng

Nếu mất ngủ kéo dài > 2 tuần, hãy gặp bác sĩ để tìm nguyên nhân!";
            }

            if (lowerQuery.Contains("stress") || lowerQuery.Contains("lo âu") || lowerQuery.Contains("trầm cảm") || lowerQuery.Contains("tâm lý"))
            {
                return @"🧘 **Chăm sóc sức khỏe tinh thần:**

**Kỹ thuật giảm stress:**
• **Hít thở sâu:** 4 giây hít vào - 4 giây giữ - 4 giây thở ra
• **Thiền định:** 10-15 phút mỗi ngày
• **Yoga, thái cực quyền**
• **Viết nhật ký** cảm xúc

**Hoạt động thư giãn:**
• Nghe nhạc yêu thích
• Đi dạo ngoài trời, tiếp xúc thiên nhiên
• Gặp gỡ bạn bè, người thân
• Làm việc yêu thích (vẽ, nấu ăn, làm vườn)

**Lối sống lành mạnh:**
✓ Ngủ đủ giấc
✓ Ăn uống cân bằng
✓ Vận động thường xuyên
✓ Hạn chế caffeine, rượu
✓ Tránh làm việc quá sức

⚠️ **Dấu hiệu cần gặp chuyên gia tâm lý:**
- Lo âu, buồn bã kéo dài > 2 tuần
- Mất hứng thú với mọi thứ
- Thay đổi cân nặng đột ngột
- Có ý nghĩ tiêu cực về bản thân

Đừng ngại tìm kiếm sự hỗ trợ chuyên nghiệp!";
            }

            if (lowerQuery.Contains("thuốc") || lowerQuery.Contains("kháng sinh") || lowerQuery.Contains("vitamin"))
            {
                return @"💊 **Hướng dẫn sử dụng thuốc an toàn:**

**Nguyên tắc chung:**
• Dùng đúng liều lượng theo toa
• Uống đúng giờ, đầy đủ liệu trình
• Không tự ý ngừng thuốc khi thấy khỏi
• Đọc kỹ hướng dẫn sử dụng

**Kháng sinh:**
⚠️ KHÔNG tự ý mua kháng sinh
• Chỉ dùng khi bác sĩ kê đơn
• Uống đủ liệu trình (5-7 ngày)
• Dừng giữa chừng → vi khuẩn kháng thuốc

**Thuốc giảm đau/hạ sốt:**
• Paracetamol: 500-1000mg, 4-6h/lần
• KHÔNG quá 4000mg/ngày
• Uống sau khi ăn

**Vitamin/Thực phẩm chức năng:**
• Không thay thế bữa ăn chính
• Tham khảo bác sĩ nếu đang dùng thuốc khác
• Không lạm dụng

📋 Nếu xuất hiện phản ứng phụ (ngứa, phát ban, chóng mặt), NGỪNG NGAY và liên hệ bác sĩ!";
            }

            // Default response
            return @"🤖 **Xin chào! Tôi là trợ lý AI sức khỏe.**

Tôi có thể giúp bạn về:

• 🤒 Triệu chứng bệnh (sốt, đau đầu, ho, đau bụng...)
• 💊 Hướng dẫn sử dụng thuốc
• 🥗 Dinh dưỡng và chế độ ăn
• 🏃 Vận động thể chất
• 😴 Cải thiện giấc ngủ
• 🧘 Sức khỏe tinh thần

Vui lòng đặt câu hỏi cụ thể để tôi có thể tư vấn tốt nhất!

💡 **Ví dụ:**
- ""Tôi bị sốt cao, nên làm gì?""
- ""Chế độ ăn cho người tiểu đường?""
- ""Bài tập giảm cân hiệu quả?""

⚠️ **Lưu ý:** Thông tin chỉ mang tính tham khảo. Với triệu chứng nghiêm trọng, vui lòng đến khám bác sĩ!";
        }
    }

    public class ChatRequest
    {
        public string Message { get; set; } = string.Empty;
    }
}
