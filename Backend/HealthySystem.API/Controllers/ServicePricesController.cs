using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthySystem.API.Data;
using HealthySystem.API.Models;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServicePricesController : ControllerBase
    {
        private readonly HealthySystemDbContext _context;
        private readonly ILogger<ServicePricesController> _logger;

        public ServicePricesController(HealthySystemDbContext context, ILogger<ServicePricesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/serviceprices - Lấy bảng giá (công khai)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetServicePrices([FromQuery] string? category = null)
        {
            var query = _context.Set<ServicePrice>()
                .Where(s => s.IsActive);

            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(s => s.Category == category);
            }

            var prices = await query
                .OrderBy(s => s.Category)
                .ThenBy(s => s.DisplayOrder)
                .ThenBy(s => s.ServiceName)
                .Select(s => new
                {
                    s.Id,
                    s.ServiceName,
                    s.Category,
                    s.Price,
                    s.Unit,
                    s.Description,
                    s.DisplayOrder
                })
                .ToListAsync();

            // Group by category
            var grouped = prices
                .GroupBy(p => p.Category)
                .Select(g => new
                {
                    category = g.Key,
                    services = g.ToList()
                })
                .ToList();

            return Ok(grouped);
        }

        // GET: api/serviceprices/{id} - Lấy chi tiết giá dịch vụ
        [HttpGet("{id}")]
        public async Task<ActionResult<ServicePrice>> GetServicePriceById(int id)
        {
            var price = await _context.Set<ServicePrice>().FindAsync(id);

            if (price == null)
            {
                return NotFound(new { error = "Không tìm thấy dịch vụ" });
            }

            return Ok(price);
        }

        // POST: api/serviceprices - Tạo giá dịch vụ mới (Admin only)
        [HttpPost]
        public async Task<ActionResult<ServicePrice>> CreateServicePrice([FromBody] ServicePrice price)
        {
            try
            {
                price.CreatedAt = DateTime.Now;
                price.UpdatedAt = DateTime.Now;
                
                _context.Set<ServicePrice>().Add(price);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetServicePriceById), new { id = price.Id }, price);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating service price");
                return StatusCode(500, new { error = "Lỗi khi tạo giá dịch vụ" });
            }
        }

        // PUT: api/serviceprices/{id} - Cập nhật giá dịch vụ (Admin only)
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateServicePrice(int id, [FromBody] ServicePrice price)
        {
            if (id != price.Id)
            {
                return BadRequest(new { error = "ID không khớp" });
            }

            var existingPrice = await _context.Set<ServicePrice>().FindAsync(id);
            if (existingPrice == null)
            {
                return NotFound(new { error = "Không tìm thấy dịch vụ" });
            }

            try
            {
                existingPrice.ServiceName = price.ServiceName;
                existingPrice.Category = price.Category;
                existingPrice.Price = price.Price;
                existingPrice.Unit = price.Unit;
                existingPrice.Description = price.Description;
                existingPrice.IsActive = price.IsActive;
                existingPrice.DisplayOrder = price.DisplayOrder;
                existingPrice.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();
                return Ok(existingPrice);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating service price");
                return StatusCode(500, new { error = "Lỗi khi cập nhật giá dịch vụ" });
            }
        }

        // DELETE: api/serviceprices/{id} - Xóa giá dịch vụ (Admin only)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteServicePrice(int id)
        {
            var price = await _context.Set<ServicePrice>().FindAsync(id);
            if (price == null)
            {
                return NotFound(new { error = "Không tìm thấy dịch vụ" });
            }

            try
            {
                _context.Set<ServicePrice>().Remove(price);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Xóa dịch vụ thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting service price");
                return StatusCode(500, new { error = "Lỗi khi xóa dịch vụ" });
            }
        }

        // GET: api/serviceprices/categories - Lấy danh sách categories
        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<string>>> GetCategories()
        {
            var categories = await _context.Set<ServicePrice>()
                .Where(s => s.IsActive)
                .Select(s => s.Category)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();

            return Ok(categories);
        }
    }
}
