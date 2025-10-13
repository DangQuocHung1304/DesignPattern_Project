using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthySystem.API.Data;
using HealthySystem.API.Models;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServicesController : ControllerBase
    {
        private readonly HealthySystemDbContext _context;

        public ServicesController(HealthySystemDbContext context)
        {
            _context = context;
        }

        // GET: api/services - Lấy danh sách dịch vụ và giá
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetServices([FromQuery] string? category = null)
        {
            try
            {
                IQueryable<Service> query = _context.Services;

                // Filter by category if provided
                if (!string.IsNullOrEmpty(category))
                {
                    query = query.Where(s => s.Category == category);
                }

                var services = await query
                    .OrderBy(s => s.Category)
                    .ThenBy(s => s.Name)
                    .Select(s => new
                    {
                        Id = s.Id,
                        Code = s.Code,
                        Name = s.Name,
                        Category = s.Category,
                        Description = (string?)null, // Not in database
                        DefaultPrice = s.DefaultPrice,
                        Unit = "Lần", // Default unit
                        Duration = (int?)null, // Not in database
                        Taxable = s.Taxable,
                        CreatedAt = s.CreatedAt
                    })
                    .ToListAsync();

                // Group by category
                var groupedServices = services
                    .GroupBy(s => s.Category)
                    .Select(g => new
                    {
                        Category = g.Key,
                        CategoryName = GetCategoryName(g.Key),
                        Services = g.ToList()
                    })
                    .ToList();

                return Ok(new
                {
                    success = true,
                    data = groupedServices
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải danh sách dịch vụ",
                    error = ex.Message
                });
            }
        }

        // GET: api/services/{id} - Lấy thông tin chi tiết 1 dịch vụ
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetService(int id)
        {
            try
            {
                var service = await _context.Services
                    .Where(s => s.Id == id)
                    .Select(s => new
                    {
                        Id = s.Id,
                        Code = s.Code,
                        Name = s.Name,
                        Category = s.Category,
                        CategoryName = GetCategoryName(s.Category),
                        Description = (string?)null, // Not in database
                        DefaultPrice = s.DefaultPrice,
                        Unit = "Lần", // Default unit
                        Duration = (int?)null, // Not in database
                        Taxable = s.Taxable,
                        Notes = (string?)null, // Not in database
                        CreatedAt = s.CreatedAt
                    })
                    .FirstOrDefaultAsync();

                if (service == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Không tìm thấy dịch vụ"
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = service
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải thông tin dịch vụ",
                    error = ex.Message
                });
            }
        }

        // GET: api/services/categories - Lấy danh sách categories
        [HttpGet("categories")]
        public ActionResult<IEnumerable<object>> GetCategories()
        {
            var categories = new List<object>
            {
                new { Code = "consultation", Name = "Khám bệnh", Icon = "👨‍⚕️" },
                new { Code = "lab", Name = "Xét nghiệm", Icon = "🔬" },
                new { Code = "imaging", Name = "Chẩn đoán hình ảnh", Icon = "📷" },
                new { Code = "procedure", Name = "Thủ thuật", Icon = "⚕️" },
                new { Code = "medication", Name = "Thuốc", Icon = "💊" },
                new { Code = "other", Name = "Dịch vụ khác", Icon = "📋" }
            };

            return Ok(new
            {
                success = true,
                data = categories
            });
        }

        // Helper method to get category name in Vietnamese
        private string GetCategoryName(string? category)
        {
            return category switch
            {
                "consultation" => "Khám bệnh",
                "lab" => "Xét nghiệm",
                "imaging" => "Chẩn đoán hình ảnh",
                "procedure" => "Thủ thuật",
                "medication" => "Thuốc",
                "vaccination" => "Tiêm chủng",
                "therapy" => "Vật lý trị liệu",
                "other" => "Dịch vụ khác",
                _ => category ?? "Chưa phân loại"
            };
        }
    }
}
