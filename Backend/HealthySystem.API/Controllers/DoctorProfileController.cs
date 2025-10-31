using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthySystem.API.Data;
using HealthySystem.API.Models;
using System.Security.Cryptography;
using System.Text;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "doctor")]
    public class DoctorProfileController : ControllerBase
    {
        private readonly HealthySystemDbContext _context;
        private readonly ILogger<DoctorProfileController> _logger;

        public DoctorProfileController(HealthySystemDbContext context, ILogger<DoctorProfileController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get doctor profile for editing
        /// US-01: Cập nhật thông tin cá nhân
        /// </summary>
        [HttpGet]
        public async Task<ActionResult> GetDoctorProfile()
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out long userId))
                {
                    return Unauthorized(new { message = "Không tìm thấy thông tin người dùng" });
                }

                var doctor = await _context.Users
                    .Include(u => u.StaffProfile)
                    .Where(u => u.Id == userId && u.Role == "doctor")
                    .FirstOrDefaultAsync();

                if (doctor == null)
                {
                    return NotFound(new { message = "Không tìm thấy thông tin bác sĩ" });
                }

                var result = new
                {
                    // Basic Information (Editable)
                    Id = doctor.Id,
                    PublicId = doctor.PublicId,
                    Email = doctor.Email,
                    Phone = doctor.Phone,
                    FirstName = doctor.FirstName,
                    LastName = doctor.LastName,
                    DateOfBirth = doctor.DateOfBirth,
                    Gender = doctor.Gender,

                    // Staff Profile Information (Editable)
                    Profile = doctor.StaffProfile != null ? new
                    {
                        Department = doctor.StaffProfile.Department,
                        Position = doctor.StaffProfile.Position,
                        Qualifications = doctor.StaffProfile.Qualifications,
                        LicenseNumber = doctor.StaffProfile.LicenseNumber,
                        WorkStartDate = doctor.StaffProfile.WorkStartDate,
                        WorkEndDate = doctor.StaffProfile.WorkEndDate,
                        StaffCode = doctor.StaffProfile.StaffCode
                    } : null
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting doctor profile");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy thông tin" });
            }
        }

        /// <summary>
        /// Update doctor profile
        /// US-01: Cập nhật thông tin cá nhân
        /// Fields editable by doctor according to US01_Doctor.txt
        /// </summary>
        [HttpPut]
        public async Task<ActionResult> UpdateDoctorProfile([FromBody] UpdateDoctorProfileRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out long userId))
                {
                    return Unauthorized(new { message = "Không tìm thấy thông tin người dùng" });
                }

                var doctor = await _context.Users
                    .Include(u => u.StaffProfile)
                    .Where(u => u.Id == userId && u.Role == "doctor")
                    .FirstOrDefaultAsync();

                if (doctor == null)
                {
                    return NotFound(new { message = "Không tìm thấy thông tin bác sĩ" });
                }

                // Update Basic Information
                if (!string.IsNullOrWhiteSpace(request.Phone))
                {
                    doctor.Phone = request.Phone.Trim();
                }

                if (!string.IsNullOrWhiteSpace(request.Email))
                {
                    // Check if email is already used by another user
                    var emailExists = await _context.Users
                        .AnyAsync(u => u.Id != userId && u.Email == request.Email.Trim());
                    
                    if (emailExists)
                    {
                        return BadRequest(new { message = "Email đã được sử dụng bởi người dùng khác" });
                    }
                    
                    doctor.Email = request.Email.Trim();
                }

                // Update Staff Profile (Professional Information)
                if (doctor.StaffProfile == null)
                {
                    doctor.StaffProfile = new StaffProfile
                    {
                        UserId = userId,
                        CreatedAt = DateTimeOffset.UtcNow
                    };
                    _context.StaffProfiles.Add(doctor.StaffProfile);
                }

                // Update professional fields
                if (!string.IsNullOrEmpty(request.Department))
                {
                    doctor.StaffProfile.Department = request.Department.Trim();
                }

                if (!string.IsNullOrEmpty(request.Position))
                {
                    doctor.StaffProfile.Position = request.Position.Trim();
                }

                if (!string.IsNullOrEmpty(request.Qualifications))
                {
                    doctor.StaffProfile.Qualifications = request.Qualifications.Trim();
                }

                if (!string.IsNullOrEmpty(request.LicenseNumber))
                {
                    doctor.StaffProfile.LicenseNumber = request.LicenseNumber.Trim();
                }

                // Update timestamp
                doctor.UpdatedAt = DateTimeOffset.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Cập nhật thông tin thành công",
                    data = new
                    {
                        Id = doctor.Id,
                        Phone = doctor.Phone,
                        Email = doctor.Email,
                        Department = doctor.StaffProfile?.Department,
                        Position = doctor.StaffProfile?.Position,
                        Qualifications = doctor.StaffProfile?.Qualifications,
                        LicenseNumber = doctor.StaffProfile?.LicenseNumber
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating doctor profile");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi cập nhật thông tin" });
            }
        }

        /// <summary>
        /// Update doctor password
        /// US-01: Cập nhật mật khẩu
        /// </summary>
        [HttpPut("password")]
        public async Task<ActionResult> UpdatePassword([FromBody] UpdatePasswordRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out long userId))
                {
                    return Unauthorized(new { message = "Không tìm thấy thông tin người dùng" });
                }

                if (string.IsNullOrWhiteSpace(request.CurrentPassword) || 
                    string.IsNullOrWhiteSpace(request.NewPassword))
                {
                    return BadRequest(new { message = "Mật khẩu hiện tại và mật khẩu mới không được để trống" });
                }

                if (request.NewPassword.Length < 6)
                {
                    return BadRequest(new { message = "Mật khẩu mới phải có ít nhất 6 ký tự" });
                }

                var doctor = await _context.Users
                    .Where(u => u.Id == userId && u.Role == "doctor")
                    .FirstOrDefaultAsync();

                if (doctor == null)
                {
                    return NotFound(new { message = "Không tìm thấy thông tin bác sĩ" });
                }

                // Verify current password
                bool isCurrentPasswordValid = VerifyPassword(request.CurrentPassword, doctor.PasswordHash);
                
                if (!isCurrentPasswordValid)
                {
                    return BadRequest(new { message = "Mật khẩu hiện tại không đúng" });
                }

                // Hash and update new password
                doctor.PasswordHash = HashPassword(request.NewPassword);
                doctor.UpdatedAt = DateTimeOffset.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Cập nhật mật khẩu thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating password");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi cập nhật mật khẩu" });
            }
        }

        /// <summary>
        /// Hash password using SHA256
        /// </summary>
        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        /// <summary>
        /// Verify password against stored hash
        /// </summary>
        private bool VerifyPassword(string password, string storedHash)
        {
            var hash = HashPassword(password);
            return hash == storedHash;
        }
    }

    /// <summary>
    /// Request model for updating doctor profile
    /// Based on US01_Doctor.txt requirements
    /// </summary>
    public class UpdateDoctorProfileRequest
    {
        // Basic Information (Thông tin cá nhân cơ bản)
        public string? Phone { get; set; }
        public string? Email { get; set; }

        // Professional Information (Thông tin nghiệp vụ chuyên môn)
        public string? Department { get; set; }  // Chuyên khoa
        public string? Position { get; set; }  // Học vị/Chức danh
        public string? Qualifications { get; set; }  // Bằng cấp/Kinh nghiệm
        public string? LicenseNumber { get; set; }  // Giấy phép hành nghề
    }

    public class UpdatePasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
