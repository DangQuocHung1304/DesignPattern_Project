using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthySystem.API.Data;
using HealthySystem.API.Models;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthNewsController : ControllerBase
    {
        private readonly HealthySystemDbContext _context;
        private readonly ILogger<HealthNewsController> _logger;

        public HealthNewsController(HealthySystemDbContext context, ILogger<HealthNewsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/healthnews - Lấy danh sách tin tức (công khai)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetHealthNews(
            [FromQuery] string? category = null,
            [FromQuery] bool? isFeatured = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var query = _context.Set<HealthNews>()
                .Where(n => n.IsPublished);

            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(n => n.Category == category);
            }

            if (isFeatured.HasValue)
            {
                query = query.Where(n => n.IsFeatured == isFeatured.Value);
            }

            var total = await query.CountAsync();
            var news = await query
                .OrderByDescending(n => n.PublishedDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(n => new
                {
                    n.Id,
                    n.Title,
                    n.Summary,
                    n.ImageUrl,
                    n.Category,
                    n.Author,
                    n.IsFeatured,
                    n.ViewCount,
                    n.PublishedDate
                })
                .ToListAsync();

            return Ok(new { total, page, pageSize, data = news });
        }

        // GET: api/healthnews/{id} - Lấy chi tiết tin tức
        [HttpGet("{id}")]
        public async Task<ActionResult<HealthNews>> GetHealthNewsById(int id)
        {
            var news = await _context.Set<HealthNews>()
                .FirstOrDefaultAsync(n => n.Id == id && n.IsPublished);

            if (news == null)
            {
                return NotFound(new { error = "Không tìm thấy tin tức" });
            }

            // Tăng lượt xem
            news.ViewCount++;
            await _context.SaveChangesAsync();

            return Ok(news);
        }

        // POST: api/healthnews - Tạo tin tức mới (Admin only)
        [HttpPost]
        public async Task<ActionResult<HealthNews>> CreateHealthNews([FromBody] HealthNews news)
        {
            try
            {
                _logger.LogInformation("Creating health news: {Title}", news?.Title);
                
                if (news == null)
                {
                    return BadRequest(new { error = "Dữ liệu tin tức không hợp lệ" });
                }

                // Validate required fields
                if (string.IsNullOrWhiteSpace(news.Title))
                {
                    return BadRequest(new { error = "Tiêu đề không được để trống" });
                }
                if (string.IsNullOrWhiteSpace(news.Summary))
                {
                    return BadRequest(new { error = "Tóm tắt không được để trống" });
                }
                if (string.IsNullOrWhiteSpace(news.Content))
                {
                    return BadRequest(new { error = "Nội dung không được để trống" });
                }
                if (string.IsNullOrWhiteSpace(news.Category))
                {
                    return BadRequest(new { error = "Danh mục không được để trống" });
                }
                if (string.IsNullOrWhiteSpace(news.Author))
                {
                    return BadRequest(new { error = "Tác giả không được để trống" });
                }

                news.CreatedAt = DateTime.Now;
                news.UpdatedAt = DateTime.Now;
                
                // Set PublishedDate if published
                if (news.IsPublished && news.PublishedDate == null)
                {
                    news.PublishedDate = DateTime.Now;
                }
                
                _context.Set<HealthNews>().Add(news);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Health news created successfully with ID: {Id}", news.Id);
                return CreatedAtAction(nameof(GetHealthNewsById), new { id = news.Id }, news);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating health news: {Message}", ex.Message);
                return StatusCode(500, new { error = $"Lỗi khi tạo tin tức: {ex.Message}" });
            }
        }

        // PUT: api/healthnews/{id} - Cập nhật tin tức (Admin only)
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateHealthNews(int id, [FromBody] HealthNews news)
        {
            if (id != news.Id)
            {
                return BadRequest(new { error = "ID không khớp" });
            }

            var existingNews = await _context.Set<HealthNews>().FindAsync(id);
            if (existingNews == null)
            {
                return NotFound(new { error = "Không tìm thấy tin tức" });
            }

            try
            {
                existingNews.Title = news.Title;
                existingNews.Summary = news.Summary;
                existingNews.Content = news.Content;
                existingNews.ImageUrl = news.ImageUrl;
                existingNews.Category = news.Category;
                existingNews.Author = news.Author;
                existingNews.IsFeatured = news.IsFeatured;
                existingNews.IsPublished = news.IsPublished;
                existingNews.UpdatedAt = DateTime.Now;

                if (news.IsPublished && existingNews.PublishedDate == null)
                {
                    existingNews.PublishedDate = DateTime.Now;
                }

                await _context.SaveChangesAsync();
                return Ok(existingNews);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating health news");
                return StatusCode(500, new { error = "Lỗi khi cập nhật tin tức" });
            }
        }

        // DELETE: api/healthnews/{id} - Xóa tin tức (Admin only)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteHealthNews(int id)
        {
            var news = await _context.Set<HealthNews>().FindAsync(id);
            if (news == null)
            {
                return NotFound(new { error = "Không tìm thấy tin tức" });
            }

            try
            {
                _context.Set<HealthNews>().Remove(news);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Xóa tin tức thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting health news");
                return StatusCode(500, new { error = "Lỗi khi xóa tin tức" });
            }
        }

        // GET: api/healthnews/categories - Lấy danh sách categories
        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<string>>> GetCategories()
        {
            var categories = await _context.Set<HealthNews>()
                .Where(n => n.IsPublished)
                .Select(n => n.Category)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();

            return Ok(categories);
        }
    }
}
