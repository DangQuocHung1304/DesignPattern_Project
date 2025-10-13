using Microsoft.AspNetCore.Mvc;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NewsController : ControllerBase
    {
        // GET: api/news - Lấy danh sách tin tức
        [HttpGet]
        public ActionResult<IEnumerable<object>> GetNews([FromQuery] int page = 1, [FromQuery] int limit = 10, [FromQuery] string? category = null)
        {
            try
            {
                var allNews = GetMockNews();

                // Filter by category if provided
                if (!string.IsNullOrEmpty(category))
                {
                    allNews = allNews.Where(n => n.Category == category).ToList();
                }

                // Pagination
                var totalItems = allNews.Count;
                var totalPages = (int)Math.Ceiling(totalItems / (double)limit);
                var newsPage = allNews
                    .Skip((page - 1) * limit)
                    .Take(limit)
                    .ToList();

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        news = newsPage,
                        pagination = new
                        {
                            page,
                            limit,
                            totalItems,
                            totalPages
                        }
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải danh sách tin tức",
                    error = ex.Message
                });
            }
        }

        // GET: api/news/{id} - Lấy chi tiết 1 bài viết
        [HttpGet("{id}")]
        public ActionResult<object> GetNewsDetail(int id)
        {
            try
            {
                var allNews = GetMockNews();
                var newsItem = allNews.FirstOrDefault(n => n.Id == id);

                if (newsItem == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Không tìm thấy bài viết"
                    });
                }

                // Get full content for detail view
                var detailedNews = new
                {
                    newsItem.Id,
                    newsItem.Title,
                    newsItem.Summary,
                    Content = GetFullContent(id), // Full HTML content
                    newsItem.Category,
                    newsItem.CategoryName,
                    newsItem.Author,
                    newsItem.Image,
                    newsItem.PublishedDate,
                    newsItem.Views,
                    newsItem.Tags,
                    RelatedNews = GetRelatedNews(newsItem.Category, id)
                };

                return Ok(new
                {
                    success = true,
                    data = detailedNews
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải thông tin bài viết",
                    error = ex.Message
                });
            }
        }

        // GET: api/news/categories - Lấy danh sách categories
        [HttpGet("categories")]
        public ActionResult<IEnumerable<object>> GetCategories()
        {
            var categories = new List<object>
            {
                new { Code = "health-tips", Name = "Mẹo sức khỏe", Icon = "💡" },
                new { Code = "nutrition", Name = "Dinh dưỡng", Icon = "🥗" },
                new { Code = "disease", Name = "Bệnh lý", Icon = "🏥" },
                new { Code = "prevention", Name = "Phòng bệnh", Icon = "🛡️" },
                new { Code = "exercise", Name = "Thể dục", Icon = "🏃" },
                new { Code = "mental-health", Name = "Sức khỏe tinh thần", Icon = "🧠" }
            };

            return Ok(new
            {
                success = true,
                data = categories
            });
        }

        // GET: api/news/featured - Lấy tin nổi bật cho trang chủ
        [HttpGet("featured")]
        public ActionResult<IEnumerable<object>> GetFeaturedNews([FromQuery] int limit = 4)
        {
            try
            {
                var featuredNews = GetMockNews()
                    .Where(n => n.IsFeatured)
                    .Take(limit)
                    .ToList();

                return Ok(new
                {
                    success = true,
                    data = featuredNews
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải tin nổi bật",
                    error = ex.Message
                });
            }
        }

        // Mock data for news
        private List<NewsArticle> GetMockNews()
        {
            return new List<NewsArticle>
            {
                new NewsArticle
                {
                    Id = 1,
                    Title = "10 thói quen giúp tăng cường hệ miễn dịch",
                    Summary = "Khám phá những thói quen đơn giản nhưng hiệu quả giúp cơ thể bạn khỏe mạnh hơn mỗi ngày.",
                    Category = "health-tips",
                    CategoryName = "Mẹo sức khỏe",
                    Author = "BS. Nguyễn Thị Lan",
                    Image = "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=800",
                    PublishedDate = DateTime.Now.AddDays(-2),
                    Views = 1523,
                    Tags = new List<string> { "miễn dịch", "sức khỏe", "phòng bệnh" },
                    IsFeatured = true
                },
                new NewsArticle
                {
                    Id = 2,
                    Title = "Chế độ ăn uống lành mạnh cho người bận rộn",
                    Summary = "Hướng dẫn xây dựng thực đơn dinh dưỡng cân bằng dành cho những người có lịch trình bận rộn.",
                    Category = "nutrition",
                    CategoryName = "Dinh dưỡng",
                    Author = "BS. Trần Văn Minh",
                    Image = "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800",
                    PublishedDate = DateTime.Now.AddDays(-5),
                    Views = 2134,
                    Tags = new List<string> { "dinh dưỡng", "ăn uống", "sức khỏe" },
                    IsFeatured = true
                },
                new NewsArticle
                {
                    Id = 3,
                    Title = "Hiểu về bệnh tiểu đường: Nguyên nhân và cách phòng tránh",
                    Summary = "Tìm hiểu về bệnh tiểu đường, các yếu tố nguy cơ và biện pháp phòng ngừa hiệu quả.",
                    Category = "disease",
                    CategoryName = "Bệnh lý",
                    Author = "BS. Lê Thị Hương",
                    Image = "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800",
                    PublishedDate = DateTime.Now.AddDays(-7),
                    Views = 3421,
                    Tags = new List<string> { "tiểu đường", "bệnh mãn tính", "phòng bệnh" },
                    IsFeatured = true
                },
                new NewsArticle
                {
                    Id = 4,
                    Title = "5 bài tập thể dục đơn giản tại nhà",
                    Summary = "Tập luyện tại nhà với 5 bài tập đơn giản giúp cơ thể luôn khỏe mạnh và dẻo dai.",
                    Category = "exercise",
                    CategoryName = "Thể dục",
                    Author = "HLV. Phạm Quang",
                    Image = "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800",
                    PublishedDate = DateTime.Now.AddDays(-10),
                    Views = 1876,
                    Tags = new List<string> { "thể dục", "tập luyện", "tại nhà" },
                    IsFeatured = true
                },
                new NewsArticle
                {
                    Id = 5,
                    Title = "Cách giảm stress trong cuộc sống hiện đại",
                    Summary = "Những phương pháp hiệu quả giúp bạn giảm căng thẳng và cải thiện sức khỏe tinh thần.",
                    Category = "mental-health",
                    CategoryName = "Sức khỏe tinh thần",
                    Author = "TS. Vũ Minh Anh",
                    Image = "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
                    PublishedDate = DateTime.Now.AddDays(-12),
                    Views = 2987,
                    Tags = new List<string> { "stress", "tinh thần", "thư giãn" },
                    IsFeatured = false
                },
                new NewsArticle
                {
                    Id = 6,
                    Title = "Tầm quan trọng của giấc ngủ đối với sức khỏe",
                    Summary = "Khám phá vai trò của giấc ngủ và cách cải thiện chất lượng giấc ngủ của bạn.",
                    Category = "health-tips",
                    CategoryName = "Mẹo sức khỏe",
                    Author = "BS. Đỗ Thu Hà",
                    Image = "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800",
                    PublishedDate = DateTime.Now.AddDays(-15),
                    Views = 1654,
                    Tags = new List<string> { "giấc ngủ", "nghỉ ngơi", "sức khỏe" },
                    IsFeatured = false
                }
            };
        }

        // Get full content for a news article
        private string GetFullContent(int newsId)
        {
            // In real app, this would be from database
            return newsId switch
            {
                1 => @"<h2>Hệ miễn dịch là gì?</h2>
                      <p>Hệ miễn dịch là hệ thống phòng vệ tự nhiên của cơ thể chống lại các tác nhân gây bệnh như vi khuẩn, virus, và ký sinh trùng.</p>
                      <h2>10 thói quen tăng cường miễn dịch</h2>
                      <ol>
                        <li><strong>Ngủ đủ giấc:</strong> 7-9 tiếng mỗi đêm</li>
                        <li><strong>Ăn nhiều rau xanh và trái cây:</strong> Giàu vitamin và chất chống oxy hóa</li>
                        <li><strong>Tập thể dục thường xuyên:</strong> Ít nhất 30 phút mỗi ngày</li>
                        <li><strong>Uống đủ nước:</strong> 2-3 lít nước mỗi ngày</li>
                        <li><strong>Giảm stress:</strong> Thiền, yoga, hoặc các hoạt động thư giãn</li>
                        <li><strong>Hạn chế đường và thực phẩm chế biến sẵn</strong></li>
                        <li><strong>Bổ sung men vi sinh:</strong> Tốt cho hệ tiêu hóa</li>
                        <li><strong>Rửa tay thường xuyên:</strong> Phòng ngừa nhiễm trùng</li>
                        <li><strong>Tránh hút thuốc và rượu bia:</strong> Làm suy yếu miễn dịch</li>
                        <li><strong>Tiêm phòng đầy đủ:</strong> Bảo vệ khỏi các bệnh nguy hiểm</li>
                      </ol>",
                2 => @"<h2>Nguyên tắc dinh dưỡng cân bằng</h2>
                      <p>Chế độ ăn lành mạnh không có nghĩa là bạn phải dành nhiều thời gian nấu nướng phức tạp...</p>",
                _ => "<p>Nội dung đang được cập nhật...</p>"
            };
        }

        // Get related news articles
        private List<object> GetRelatedNews(string category, int excludeId)
        {
            return GetMockNews()
                .Where(n => n.Category == category && n.Id != excludeId)
                .Take(3)
                .Select(n => new
                {
                    n.Id,
                    n.Title,
                    n.Image,
                    n.PublishedDate
                })
                .ToList<object>();
        }
    }

    // News article model
    public class NewsArticle
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string Summary { get; set; } = "";
        public string Category { get; set; } = "";
        public string CategoryName { get; set; } = "";
        public string Author { get; set; } = "";
        public string Image { get; set; } = "";
        public DateTime PublishedDate { get; set; }
        public int Views { get; set; }
        public List<string> Tags { get; set; } = new();
        public bool IsFeatured { get; set; }
    }
}
