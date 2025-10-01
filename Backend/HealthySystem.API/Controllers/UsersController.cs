using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using HealthySystem.API.Models;
using System.Security.Claims;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly ILogger<UsersController> _logger;

        public UsersController(ILogger<UsersController> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Get user profile
        /// </summary>
        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                // For demo purposes, return mock data
                var user = GetMockUserProfile(userId.Value);
                
                return Ok(new
                {
                    success = true,
                    data = user
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user profile");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải thông tin hồ sơ"
                });
            }
        }

        /// <summary>
        /// Update user profile
        /// </summary>
        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                // Validate input
                if (string.IsNullOrEmpty(request.FirstName) || 
                    string.IsNullOrEmpty(request.LastName) || 
                    string.IsNullOrEmpty(request.Phone))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Họ, tên và số điện thoại không được để trống"
                    });
                }

                // For demo purposes, simulate successful update
                await Task.Delay(100);

                return Ok(new
                {
                    success = true,
                    message = "Cập nhật hồ sơ thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user profile");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể cập nhật hồ sơ"
                });
            }
        }

        /// <summary>
        /// Get user statistics
        /// </summary>
        [HttpGet("statistics")]
        [Authorize]
        public async Task<IActionResult> GetUserStatistics()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                // For demo purposes, return mock statistics
                var stats = new
                {
                    totalAppointments = 8,
                    completedAppointments = 6,
                    cancelledAppointments = 1,
                    upcomingAppointments = 1,
                    activeTreatments = 2,
                    completedTreatments = 3
                };

                return Ok(new
                {
                    success = true,
                    data = stats
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user statistics");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải thống kê"
                });
            }
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out int userId))
            {
                return userId;
            }
            return null;
        }

        private object GetMockUserProfile(int userId)
        {
            return new
            {
                id = userId,
                firstName = "Nguyễn Văn",
                lastName = "An",
                email = "nguyenvanan@email.com",
                phone = "0123456789",
                gender = "male",
                dateOfBirth = "1990-05-15",
                address = "123 Đường ABC, Quận 1, TP.HCM",
                avatar = (string?)null,
                memberSince = "2024-01-15",
                insurance = "BHYT123456789",
                emergencyContact = "0987654321",
                bloodType = "O+"
            };
        }
    }

    public class UpdateProfileRequest
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Gender { get; set; } = string.Empty;
        public string DateOfBirth { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
    }
}