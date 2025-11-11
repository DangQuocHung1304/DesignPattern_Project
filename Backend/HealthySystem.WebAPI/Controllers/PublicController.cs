using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthySystem.WebAPI.Data;

namespace HealthySystem.WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PublicController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PublicController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Lấy danh sách bảng giá dịch vụ (public - không cần authentication)
        /// </summary>
        [HttpGet("service-prices")]
        public async Task<IActionResult> GetServicePrices([FromQuery] string? category = null)
        {
            try
            {
                var query = _context.ServicePrices
                    .Where(sp => sp.is_active)
                    .AsQueryable();

                // Lọc theo category nếu có
                if (!string.IsNullOrEmpty(category))
                {
                    query = query.Where(sp => sp.category == category);
                }

                var servicePrices = await query
                    .OrderBy(sp => sp.display_order)
                    .ThenBy(sp => sp.service_name)
                    .Select(sp => new
                    {
                        sp.service_price_id,
                        sp.service_name,
                        sp.category,
                        sp.price,
                        sp.unit,
                        sp.description,
                        sp.notes,
                        sp.display_order
                    })
                    .ToListAsync();

                // Nhóm theo category
                var groupedByCategory = servicePrices
                    .GroupBy(sp => sp.category)
                    .Select(g => new
                    {
                        category = g.Key,
                        services = g.ToList()
                    })
                    .OrderBy(g => g.category)
                    .ToList();

                return Ok(new
                {
                    success = true,
                    totalServices = servicePrices.Count,
                    categories = groupedByCategory
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Lỗi khi lấy danh sách bảng giá dịch vụ",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy danh sách tin tức y tế (public - không cần authentication)
        /// Hỗ trợ phân trang
        /// </summary>
        [HttpGet("health-news")]
        public async Task<IActionResult> GetHealthNews(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? category = null,
            [FromQuery] bool? isFeatured = null)
        {
            try
            {
                var query = _context.HealthNews
                    .Where(hn => hn.is_published)
                    .AsQueryable();

                // Lọc theo category nếu có
                if (!string.IsNullOrEmpty(category))
                {
                    query = query.Where(hn => hn.category == category);
                }

                // Lọc theo featured nếu có
                if (isFeatured.HasValue)
                {
                    query = query.Where(hn => hn.is_featured == isFeatured.Value);
                }

                // Đếm tổng số bài viết
                var totalItems = await query.CountAsync();

                // Lấy danh sách bài viết với phân trang
                var healthNews = await query
                    .OrderByDescending(hn => hn.is_featured)
                    .ThenByDescending(hn => hn.published_date)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(hn => new
                    {
                        hn.health_news_id,
                        hn.title,
                        hn.summary,
                        hn.image_url,
                        hn.category,
                        hn.author,
                        hn.is_featured,
                        hn.view_count,
                        hn.published_date,
                        hn.tags
                    })
                    .ToListAsync();

                // Tính tổng số trang
                var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

                return Ok(new
                {
                    success = true,
                    data = healthNews,
                    pagination = new
                    {
                        currentPage = page,
                        pageSize = pageSize,
                        totalItems = totalItems,
                        totalPages = totalPages,
                        hasNextPage = page < totalPages,
                        hasPreviousPage = page > 1
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Lỗi khi lấy danh sách tin tức y tế",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy chi tiết một bài viết tin tức y tế (public)
        /// Tự động tăng view count
        /// </summary>
        [HttpGet("health-news/{id}")]
        public async Task<IActionResult> GetHealthNewsById(int id)
        {
            try
            {
                var healthNews = await _context.HealthNews
                    .Where(hn => hn.health_news_id == id && hn.is_published)
                    .FirstOrDefaultAsync();

                if (healthNews == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Không tìm thấy bài viết hoặc bài viết chưa được xuất bản"
                    });
                }

                // Tăng view count
                healthNews.view_count++;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        healthNews.health_news_id,
                        healthNews.title,
                        healthNews.summary,
                        healthNews.content,
                        healthNews.image_url,
                        healthNews.category,
                        healthNews.author,
                        healthNews.is_featured,
                        healthNews.view_count,
                        healthNews.published_date,
                        healthNews.tags,
                        healthNews.created_at
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Lỗi khi lấy chi tiết bài viết",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy danh sách bài viết nổi bật (featured)
        /// </summary>
        [HttpGet("health-news/featured")]
        public async Task<IActionResult> GetFeaturedHealthNews([FromQuery] int limit = 5)
        {
            try
            {
                var featuredNews = await _context.HealthNews
                    .Where(hn => hn.is_published && hn.is_featured)
                    .OrderByDescending(hn => hn.published_date)
                    .Take(limit)
                    .Select(hn => new
                    {
                        hn.health_news_id,
                        hn.title,
                        hn.summary,
                        hn.image_url,
                        hn.category,
                        hn.author,
                        hn.view_count,
                        hn.published_date
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
                    message = "Lỗi khi lấy danh sách bài viết nổi bật",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy các bài viết liên quan (cùng category)
        /// </summary>
        [HttpGet("health-news/{id}/related")]
        public async Task<IActionResult> GetRelatedHealthNews(int id, [FromQuery] int limit = 4)
        {
            try
            {
                // Lấy thông tin bài viết hiện tại để biết category
                var currentNews = await _context.HealthNews
                    .Where(hn => hn.health_news_id == id)
                    .Select(hn => new { hn.category })
                    .FirstOrDefaultAsync();

                if (currentNews == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Không tìm thấy bài viết"
                    });
                }

                // Lấy các bài viết cùng category, trừ bài viết hiện tại
                var relatedNews = await _context.HealthNews
                    .Where(hn => hn.is_published 
                        && hn.category == currentNews.category 
                        && hn.health_news_id != id)
                    .OrderByDescending(hn => hn.published_date)
                    .Take(limit)
                    .Select(hn => new
                    {
                        hn.health_news_id,
                        hn.title,
                        hn.summary,
                        hn.image_url,
                        hn.category,
                        hn.view_count,
                        hn.published_date
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    data = relatedNews
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Lỗi khi lấy danh sách bài viết liên quan",
                    error = ex.Message
                });
            }
        }
    }
}
