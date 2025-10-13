using Microsoft.AspNetCore.Mvc;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GuidesController : ControllerBase
    {
        // GET: api/guides - Lấy danh sách hướng dẫn khám bệnh
        [HttpGet]
        public ActionResult<IEnumerable<object>> GetGuides([FromQuery] string? category = null)
        {
            try
            {
                var allGuides = GetMockGuides();

                // Filter by category if provided
                if (!string.IsNullOrEmpty(category))
                {
                    allGuides = allGuides.Where(g => g.Category == category).ToList();
                }

                return Ok(new
                {
                    success = true,
                    data = allGuides
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải danh sách hướng dẫn",
                    error = ex.Message
                });
            }
        }

        // GET: api/guides/{id} - Lấy chi tiết 1 hướng dẫn
        [HttpGet("{id}")]
        public ActionResult<object> GetGuideDetail(int id)
        {
            try
            {
                var allGuides = GetMockGuides();
                var guide = allGuides.FirstOrDefault(g => g.Id == id);

                if (guide == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Không tìm thấy hướng dẫn"
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = guide
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải thông tin hướng dẫn",
                    error = ex.Message
                });
            }
        }

        // GET: api/guides/categories - Lấy danh mục hướng dẫn
        [HttpGet("categories")]
        public ActionResult<IEnumerable<object>> GetCategories()
        {
            var categories = new List<object>
            {
                new { Code = "registration", Name = "Hướng dẫn đăng ký", Icon = "📝" },
                new { Code = "appointment", Name = "Hướng dẫn đặt lịch", Icon = "📅" },
                new { Code = "examination", Name = "Quy trình khám bệnh", Icon = "🏥" },
                new { Code = "payment", Name = "Thanh toán", Icon = "💳" },
                new { Code = "insurance", Name = "Bảo hiểm y tế", Icon = "🛡️" },
                new { Code = "faq", Name = "Câu hỏi thường gặp", Icon = "❓" }
            };

            return Ok(new
            {
                success = true,
                data = categories
            });
        }

        // Mock data for guides
        private List<GuideItem> GetMockGuides()
        {
            return new List<GuideItem>
            {
                new GuideItem
                {
                    Id = 1,
                    Title = "Hướng dẫn đăng ký tài khoản",
                    Category = "registration",
                    CategoryName = "Hướng dẫn đăng ký",
                    Icon = "📝",
                    Summary = "Hướng dẫn chi tiết cách đăng ký tài khoản để sử dụng dịch vụ khám bệnh online",
                    Steps = new List<string>
                    {
                        "Truy cập trang đăng ký tại mục 'Đăng ký' trên menu",
                        "Điền đầy đủ thông tin cá nhân: Họ tên, ngày sinh, giới tính",
                        "Nhập số điện thoại và email (email dùng để đăng nhập)",
                        "Tạo mật khẩu mạnh (ít nhất 8 ký tự, có chữ hoa, chữ thường và số)",
                        "Nhấn nút 'Đăng ký' và chờ xác nhận",
                        "Kiểm tra email để kích hoạt tài khoản (nếu có)"
                    },
                    Notes = new List<string>
                    {
                        "Thông tin cá nhân cần chính xác để phục vụ cho việc khám bệnh",
                        "Mật khẩu nên được bảo mật cẩn thận",
                        "Một số điện thoại chỉ đăng ký được một tài khoản"
                    }
                },
                new GuideItem
                {
                    Id = 2,
                    Title = "Hướng dẫn đặt lịch khám bệnh",
                    Category = "appointment",
                    CategoryName = "Hướng dẫn đặt lịch",
                    Icon = "📅",
                    Summary = "Các bước đặt lịch hẹn khám bệnh trực tuyến",
                    Steps = new List<string>
                    {
                        "Đăng nhập vào tài khoản của bạn",
                        "Chọn chuyên khoa cần khám hoặc tìm bác sĩ theo tên",
                        "Xem thông tin bác sĩ và đánh giá từ bệnh nhân khác",
                        "Chọn ngày và giờ khám phù hợp",
                        "Điền lý do khám và ghi chú (nếu có)",
                        "Xác nhận thông tin và hoàn tất đặt lịch",
                        "Nhận thông báo xác nhận qua email/SMS"
                    },
                    Notes = new List<string>
                    {
                        "Nên đặt lịch trước ít nhất 1 ngày",
                        "Có thể hủy hoặc đổi lịch trước 4 tiếng",
                        "Đến sớm 15 phút để làm thủ tục"
                    }
                },
                new GuideItem
                {
                    Id = 3,
                    Title = "Quy trình khám bệnh tại phòng khám",
                    Category = "examination",
                    CategoryName = "Quy trình khám bệnh",
                    Icon = "🏥",
                    Summary = "Quy trình khám bệnh từ khi đến phòng khám đến khi hoàn tất",
                    Steps = new List<string>
                    {
                        "Đến quầy lễ tân xuất trình xác nhận đặt lịch",
                        "Cung cấp CMND/CCCD và thẻ bảo hiểm y tế (nếu có)",
                        "Nhận số thứ tự và chờ được gọi",
                        "Vào phòng khám khi đến lượt",
                        "Bác sĩ thăm khám và chẩn đoán",
                        "Nhận đơn thuốc và hướng dẫn điều trị",
                        "Thanh toán tại quầy thu ngân",
                        "Nhận thuốc tại quầy phát thuốc"
                    },
                    Notes = new List<string>
                    {
                        "Mang theo kết quả xét nghiệm cũ (nếu có)",
                        "Nhớ hỏi rõ cách dùng thuốc",
                        "Giữ hóa đơn để tái khám"
                    }
                },
                new GuideItem
                {
                    Id = 4,
                    Title = "Hướng dẫn thanh toán",
                    Category = "payment",
                    CategoryName = "Thanh toán",
                    Icon = "💳",
                    Summary = "Các hình thức thanh toán và quy trình",
                    Steps = new List<string>
                    {
                        "Nhận hóa đơn từ quầy thu ngân",
                        "Kiểm tra kỹ thông tin và số tiền",
                        "Chọn hình thức thanh toán: Tiền mặt, thẻ, chuyển khoản",
                        "Thanh toán và nhận biên lai",
                        "Giữ biên lai để nhận thuốc hoặc làm thủ tục bảo hiểm"
                    },
                    Notes = new List<string>
                    {
                        "Chấp nhận thẻ: Visa, MasterCard, JCB, ATM nội địa",
                        "Hỗ trợ thanh toán qua ví điện tử: Momo, ZaloPay",
                        "Giá đã bao gồm thuế VAT"
                    }
                },
                new GuideItem
                {
                    Id = 5,
                    Title = "Hướng dẫn sử dụng bảo hiểm y tế",
                    Category = "insurance",
                    CategoryName = "Bảo hiểm y tế",
                    Icon = "🛡️",
                    Summary = "Cách sử dụng thẻ bảo hiểm y tế khi khám",
                    Steps = new List<string>
                    {
                        "Xuất trình thẻ BHYT còn hiệu lực tại quầy lễ tân",
                        "Cung cấp giấy tờ tùy thân (CMND/CCCD)",
                        "Khai báo đúng nơi đăng ký KCB ban đầu",
                        "Thanh toán phần không được BHYT chi trả (nếu có)",
                        "Nhận biên lai và giấy ra viện để hoàn tất hồ sơ"
                    },
                    Notes = new List<string>
                    {
                        "BHYT chi trả 100% tại nơi đăng ký, 40-100% tại nơi khác",
                        "Một số dịch vụ không được BHYT chi trả",
                        "Thẻ BHYT phải còn hiệu lực"
                    }
                },
                new GuideItem
                {
                    Id = 6,
                    Title = "Câu hỏi thường gặp (FAQ)",
                    Category = "faq",
                    CategoryName = "Câu hỏi thường gặp",
                    Icon = "❓",
                    Summary = "Giải đáp các thắc mắc phổ biến",
                    Steps = new List<string>
                    {
                        "Làm sao để đổi lịch khám? - Vào Hồ sơ > Lịch hẹn > Chọn lịch > Thay đổi",
                        "Có được hủy lịch không? - Có, hủy trước 4 tiếng sẽ được hoàn phí",
                        "Quên mật khẩu phải làm sao? - Chọn 'Quên mật khẩu' tại trang đăng nhập",
                        "Có thể đặt lịch cho người thân không? - Có, cần có thông tin người bệnh",
                        "Giờ làm việc của phòng khám? - Thứ 2-6: 7h-20h, Thứ 7-CN: 8h-17h"
                    },
                    Notes = new List<string>
                    {
                        "Liên hệ hotline: 1900-xxxx (24/7)",
                        "Email: support@healthysystem.vn",
                        "Chat online: Góc dưới bên phải màn hình"
                    }
                }
            };
        }
    }

    // Guide item model
    public class GuideItem
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string Category { get; set; } = "";
        public string CategoryName { get; set; } = "";
        public string Icon { get; set; } = "";
        public string Summary { get; set; } = "";
        public List<string> Steps { get; set; } = new();
        public List<string> Notes { get; set; } = new();
    }
}
