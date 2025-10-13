using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthySystem.API.Data;
using HealthySystem.API.Models;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RatingsController : ControllerBase
    {
        private readonly HealthySystemDbContext _context;
        private readonly ILogger<RatingsController> _logger;

        public RatingsController(HealthySystemDbContext context, ILogger<RatingsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Rate a doctor (Patient only)
        /// POST: api/ratings/doctor
        /// </summary>
        [HttpPost("doctor")]
        [Authorize(Roles = "patient")]
        public async Task<IActionResult> RateDoctor([FromBody] RateDoctorRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                // Parse and validate doctor public ID
                if (!Guid.TryParse(request.DoctorPublicId, out Guid doctorGuid))
                {
                    return BadRequest(new { message = "Mã bác sĩ không hợp lệ" });
                }
                
                // Validate doctor exists
                var doctor = await _context.Users
                    .FirstOrDefaultAsync(u => u.PublicId == doctorGuid && u.Role == "doctor");

                if (doctor == null)
                {
                    return NotFound(new { message = "Không tìm thấy bác sĩ" });
                }

                // Check if patient has had appointment with this doctor
                var hasAppointment = await _context.Appointments
                    .AnyAsync(a => a.PatientId == userId && 
                                 a.DoctorId == doctor.Id && 
                                 a.Status == "completed");

                if (!hasAppointment)
                {
                    return BadRequest(new { message = "Bạn chỉ có thể đánh giá bác sĩ sau khi hoàn thành lịch khám" });
                }

                // Check if already rated
                var existingRating = await _context.Ratings
                    .FirstOrDefaultAsync(r => r.PatientId == userId && r.DoctorId == doctor.Id);

                if (existingRating != null)
                {
                    // Update existing rating
                    existingRating.RatingValue = request.Rating;
                    existingRating.Comment = request.Comment;
                    existingRating.CreatedAt = DateTimeOffset.UtcNow;
                }
                else
                {
                    // Create new rating
                    var rating = new Rating
                    {
                        PatientId = userId,
                        DoctorId = doctor.Id,
                        RatingValue = request.Rating,
                        Comment = request.Comment,
                        CreatedAt = DateTimeOffset.UtcNow
                    };
                    _context.Ratings.Add(rating);
                }

                await _context.SaveChangesAsync();

                // Calculate new average rating
                var avgRating = await _context.Ratings
                    .Where(r => r.DoctorId == doctor.Id)
                    .AverageAsync(r => (double)r.RatingValue);

                var totalRatings = await _context.Ratings
                    .CountAsync(r => r.DoctorId == doctor.Id);

                return Ok(new
                {
                    message = existingRating != null ? "Đã cập nhật đánh giá thành công" : "Đã gửi đánh giá thành công",
                    rating = new
                    {
                        doctorPublicId = doctor.PublicId,
                        doctorName = $"{doctor.FirstName} {doctor.LastName}",
                        rating = request.Rating,
                        comment = request.Comment,
                        averageRating = Math.Round(avgRating, 1),
                        totalRatings = totalRatings
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rating doctor");
                return StatusCode(500, new { message = "Lỗi khi gửi đánh giá", error = ex.Message });
            }
        }

        /// <summary>
        /// Rate clinic/facility (Patient only)
        /// POST: api/ratings/clinic
        /// </summary>
        [HttpPost("clinic")]
        [Authorize(Roles = "patient")]
        public async Task<IActionResult> RateClinic([FromBody] RateClinicRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();

                // Check if patient has had any completed appointment
                var hasAppointment = await _context.Appointments
                    .AnyAsync(a => a.PatientId == userId && a.Status == "completed");

                if (!hasAppointment)
                {
                    return BadRequest(new { message = "Bạn chỉ có thể đánh giá phòng khám sau khi hoàn thành ít nhất một lịch khám" });
                }

                // Check if already rated clinic
                var existingRating = await _context.Ratings
                    .FirstOrDefaultAsync(r => r.PatientId == userId && 
                                           r.DoctorId == null && 
                                           r.ServiceId == null);

                if (existingRating != null)
                {
                    // Update existing clinic rating
                    existingRating.RatingValue = request.Rating;
                    existingRating.Comment = request.Comment;
                    existingRating.CreatedAt = DateTimeOffset.UtcNow;
                }
                else
                {
                    // Create new clinic rating (no doctor, no service)
                    var rating = new Rating
                    {
                        PatientId = userId,
                        DoctorId = null,
                        ServiceId = null,
                        RatingValue = request.Rating,
                        Comment = request.Comment,
                        CreatedAt = DateTimeOffset.UtcNow
                    };
                    _context.Ratings.Add(rating);
                }

                await _context.SaveChangesAsync();

                // Calculate clinic average rating (ratings with no doctor and no service)
                var avgRating = await _context.Ratings
                    .Where(r => r.DoctorId == null && r.ServiceId == null)
                    .AverageAsync(r => (double?)r.RatingValue) ?? 0;

                var totalRatings = await _context.Ratings
                    .CountAsync(r => r.DoctorId == null && r.ServiceId == null);

                return Ok(new
                {
                    message = existingRating != null ? "Đã cập nhật đánh giá thành công" : "Đã gửi đánh giá thành công",
                    rating = new
                    {
                        rating = request.Rating,
                        comment = request.Comment,
                        averageRating = Math.Round(avgRating, 1),
                        totalRatings = totalRatings
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rating clinic");
                return StatusCode(500, new { message = "Lỗi khi gửi đánh giá", error = ex.Message });
            }
        }

        /// <summary>
        /// Get doctor ratings
        /// GET: api/ratings/doctor/{publicId}
        /// </summary>
        [HttpGet("doctor/{publicId}")]
        public async Task<IActionResult> GetDoctorRatings(string publicId)
        {
            try
            {
                // Parse and validate doctor public ID
                if (!Guid.TryParse(publicId, out Guid doctorGuid))
                {
                    return BadRequest(new { message = "Mã bác sĩ không hợp lệ" });
                }

                var doctor = await _context.Users
                    .FirstOrDefaultAsync(u => u.PublicId == doctorGuid && u.Role == "doctor");

                if (doctor == null)
                {
                    return NotFound(new { message = "Không tìm thấy bác sĩ" });
                }

                var ratings = await _context.Ratings
                    .Where(r => r.DoctorId == doctor.Id)
                    .Include(r => r.Patient)
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new
                    {
                        id = r.Id,
                        patientName = $"{r.Patient.FirstName} {r.Patient.LastName}",
                        rating = r.RatingValue,
                        comment = r.Comment,
                        createdAt = r.CreatedAt
                    })
                    .ToListAsync();

                var avgRating = ratings.Any() 
                    ? ratings.Average(r => (double)r.rating) 
                    : 0;

                return Ok(new
                {
                    doctorPublicId = doctor.PublicId,
                    doctorName = $"{doctor.FirstName} {doctor.LastName}",
                    averageRating = Math.Round(avgRating, 1),
                    totalRatings = ratings.Count,
                    ratings = ratings
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting doctor ratings");
                return StatusCode(500, new { message = "Lỗi khi lấy đánh giá", error = ex.Message });
            }
        }

        /// <summary>
        /// Get clinic ratings
        /// GET: api/ratings/clinic
        /// </summary>
        [HttpGet("clinic")]
        public async Task<IActionResult> GetClinicRatings()
        {
            try
            {
                var ratings = await _context.Ratings
                    .Where(r => r.DoctorId == null && r.ServiceId == null)
                    .Include(r => r.Patient)
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new
                    {
                        id = r.Id,
                        patientName = $"{r.Patient.FirstName} {r.Patient.LastName}",
                        rating = r.RatingValue,
                        comment = r.Comment,
                        createdAt = r.CreatedAt
                    })
                    .ToListAsync();

                var avgRating = ratings.Any() 
                    ? ratings.Average(r => (double)r.rating) 
                    : 0;

                return Ok(new
                {
                    averageRating = Math.Round(avgRating, 1),
                    totalRatings = ratings.Count,
                    ratings = ratings
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting clinic ratings");
                return StatusCode(500, new { message = "Lỗi khi lấy đánh giá", error = ex.Message });
            }
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : 0;
        }
    }

    // DTOs for request bodies
    public class RateDoctorRequest
    {
        public string DoctorPublicId { get; set; } = "";
        
        [Range(1, 5, ErrorMessage = "Đánh giá phải từ 1 đến 5 sao")]
        public int Rating { get; set; }
        
        public string? Comment { get; set; }
    }

    public class RateClinicRequest
    {
        [Range(1, 5, ErrorMessage = "Đánh giá phải từ 1 đến 5 sao")]
        public int Rating { get; set; }
        
        public string? Comment { get; set; }
    }
}
