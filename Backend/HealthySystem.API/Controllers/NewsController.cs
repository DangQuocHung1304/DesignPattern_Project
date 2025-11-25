using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthySystem.API.Data;
using HealthySystem.API.Models;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NewsController : ControllerBase
    {
        private readonly HealthySystemDbContext _context;

        public NewsController(HealthySystemDbContext context)
        {
            _context = context;
        }

        // GET: api/news - Lấy danh sách tin tức
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetNews([FromQuery] int page = 1, [FromQuery] int limit = 10, [FromQuery] string? category = null)
        {
            try
            {
                var query = _context.HealthNews
                    .Where(n => n.IsPublished)
                    .AsQueryable();

                // Filter by category if provided
                if (!string.IsNullOrEmpty(category))
                {
                    query = query.Where(n => n.Category == category);
                }

                // Total items for pagination
                var totalItems = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalItems / (double)limit);

                // Get paginated results
                var newsPage = await query
                    .OrderByDescending(n => n.PublishedDate)
                    .Skip((page - 1) * limit)
                    .Take(limit)
                    .Select(n => new
                    {
                        n.Id,
                        n.Title,
                        n.Summary,
                        Image = n.ImageUrl,
                        n.Category,
                        CategoryName = n.Category,
                        n.Author,
                        PublishedDate = n.PublishedDate ?? n.CreatedAt,
                        Views = n.ViewCount,
                        Tags = new List<string>(),
                        IsFeatured = n.IsFeatured
                    })
                    .ToListAsync();

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
        public async Task<ActionResult<object>> GetNewsDetail(int id)
        {
            try
            {
                var newsItem = await _context.HealthNews
                    .Where(n => n.Id == id && n.IsPublished)
                    .FirstOrDefaultAsync();

                if (newsItem == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Không tìm thấy bài viết"
                    });
                }

                // Increment view count
                newsItem.ViewCount++;
                await _context.SaveChangesAsync();

                // Get related news from same category
                var relatedNews = await _context.HealthNews
                    .Where(n => n.Category == newsItem.Category && n.Id != id && n.IsPublished)
                    .Take(4)
                    .Select(n => new
                    {
                        id = n.Id,
                        title = n.Title,
                        image = n.ImageUrl,
                        category = n.Category
                    })
                    .ToListAsync();

                // Return detailed news
                var detailedNews = new
                {
                    id = newsItem.Id,
                    title = newsItem.Title,
                    summary = newsItem.Summary,
                    content = newsItem.Content, // Full HTML content
                    category = newsItem.Category,
                    categoryName = newsItem.Category,
                    author = newsItem.Author,
                    image = newsItem.ImageUrl,
                    publishedDate = newsItem.PublishedDate ?? newsItem.CreatedAt,
                    views = newsItem.ViewCount,
                    tags = new List<string>(),
                    relatedNews = relatedNews
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
        public async Task<ActionResult<IEnumerable<object>>> GetCategories()
        {
            try
            {
                var categories = await _context.HealthNews
                    .Where(n => n.IsPublished)
                    .Select(n => n.Category)
                    .Distinct()
                    .ToListAsync();

                var categoryList = categories.Select(c => new
                {
                    Code = c.ToLower().Replace(" ", "-"),
                    Name = c
                }).ToList();

                return Ok(new
                {
                    success = true,
                    data = categoryList
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải danh mục",
                    error = ex.Message
                });
            }
        }

        // GET: api/news/featured - Lấy tin nổi bật cho trang chủ
        [HttpGet("featured")]
        public async Task<ActionResult<IEnumerable<object>>> GetFeaturedNews([FromQuery] int limit = 5)
        {
            try
            {
                var featuredNews = await _context.HealthNews
                    .Where(n => n.IsPublished && n.IsFeatured)
                    .OrderByDescending(n => n.PublishedDate)
                    .Take(limit)
                    .Select(n => new
                    {
                        n.Id,
                        n.Title,
                        n.Summary,
                        Image = n.ImageUrl,
                        n.Category,
                        PublishedDate = n.PublishedDate ?? n.CreatedAt
                    })
                    .ToListAsync();

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
    }
}
