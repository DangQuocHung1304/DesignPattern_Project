using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using HealthySystem.API.Models;
using System.Security.Claims;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TreatmentsController : ControllerBase
    {
        private readonly ILogger<TreatmentsController> _logger;

        public TreatmentsController(ILogger<TreatmentsController> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Get current treatments for a user
        /// </summary>
        [HttpGet("current/{userId}")]
        [Authorize]
        public async Task<IActionResult> GetCurrentTreatments(int userId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null || currentUserId != userId)
                {
                    return Unauthorized();
                }

                // For demo purposes, return mock treatments
                var treatments = GetMockCurrentTreatments();
                
                return Ok(new
                {
                    success = true,
                    data = treatments
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current treatments");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải thông tin liệu trình điều trị"
                });
            }
        }

        /// <summary>
        /// Get treatment history for a user
        /// </summary>
        [HttpGet("history/{userId}")]
        [Authorize]
        public async Task<IActionResult> GetTreatmentHistory(int userId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null || currentUserId != userId)
                {
                    return Unauthorized();
                }

                // For demo purposes, return mock treatment history
                var treatmentHistory = GetMockTreatmentHistory();
                
                return Ok(new
                {
                    success = true,
                    data = treatmentHistory
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting treatment history");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải lịch sử liệu trình điều trị"
                });
            }
        }

        /// <summary>
        /// Get treatment details
        /// </summary>
        [HttpGet("{treatmentId}")]
        [Authorize]
        public async Task<IActionResult> GetTreatmentDetails(int treatmentId)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                // For demo purposes, return mock treatment details
                var treatment = GetMockTreatmentDetails(treatmentId);
                
                if (treatment == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Không tìm thấy liệu trình điều trị"
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = treatment
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting treatment details");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải chi tiết liệu trình điều trị"
                });
            }
        }

        /// <summary>
        /// Update treatment progress
        /// </summary>
        [HttpPut("{treatmentId}/progress")]
        [Authorize]
        public async Task<IActionResult> UpdateTreatmentProgress(int treatmentId, [FromBody] UpdateProgressRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                // Validate progress
                if (request.Progress < 0 || request.Progress > 100)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Tiến độ phải từ 0 đến 100%"
                    });
                }

                // For demo purposes, simulate successful update
                await Task.Delay(100);

                return Ok(new
                {
                    success = true,
                    message = "Cập nhật tiến độ liệu trình thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating treatment progress");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể cập nhật tiến độ liệu trình"
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

        private List<object> GetMockCurrentTreatments()
        {
            return new List<object>
            {
                new
                {
                    id = 1,
                    name = "Điều trị cao huyết áp",
                    doctor = "BS. Nguyễn Thị Lan",
                    specialization = "Tim mạch",
                    startDate = "2024-11-01",
                    endDate = "2025-02-01",
                    status = "active",
                    progress = 65,
                    description = "Liệu trình điều trị cao huyết áp bằng thuốc và thay đổi lối sống",
                    medications = new[]
                    {
                        new { name = "Amlodipine 5mg", dosage = "1 viên/ngày, sau ăn sáng", duration = "3 tháng" },
                        new { name = "Losartan 50mg", dosage = "1 viên/ngày, trước ăn tối", duration = "3 tháng" }
                    },
                    nextAppointment = "2024-12-30",
                    notes = "Theo dõi huyết áp hàng ngày, tập thể dục nhẹ"
                },
                new
                {
                    id = 2,
                    name = "Vật lý trị liệu cột sống",
                    doctor = "BS. Trần Văn Dũng",
                    specialization = "Cơ xương khớp",
                    startDate = "2024-12-01",
                    endDate = "2025-01-15",
                    status = "active",
                    progress = 30,
                    description = "Liệu trình vật lý trị liệu cho đau lưng mãn tính",
                    medications = new[]
                    {
                        new { name = "Diclofenac gel", dosage = "Thoa 2-3 lần/ngày", duration = "2 tuần" }
                    },
                    nextAppointment = "2024-12-28",
                    notes = "Tập các bài tập được hướng dẫn 3 lần/tuần"
                }
            };
        }

        private List<object> GetMockTreatmentHistory()
        {
            return new List<object>
            {
                new
                {
                    id = 3,
                    name = "Điều trị viêm dạ dày",
                    doctor = "BS. Trần Văn Minh",
                    specialization = "Tiêu hóa",
                    startDate = "2024-08-01",
                    endDate = "2024-10-01",
                    status = "completed",
                    progress = 100,
                    description = "Liệu trình điều trị viêm dạ dày mãn tính",
                    completedDate = "2024-10-01",
                    outcome = "Khỏi hoàn toàn, không còn triệu chứng"
                },
                new
                {
                    id = 4,
                    name = "Điều trị dị ứng da",
                    doctor = "BS. Lê Thị Hương",
                    specialization = "Da liễu",
                    startDate = "2024-06-15",
                    endDate = "2024-08-15",
                    status = "completed",
                    progress = 100,
                    description = "Liệu trình điều trị dị ứng da và viêm da cơ địa",
                    completedDate = "2024-08-10",
                    outcome = "Cải thiện 90%, da không còn ngứa và đỏ"
                }
            };
        }

        private object? GetMockTreatmentDetails(int treatmentId)
        {
            var allTreatments = GetMockCurrentTreatments().Concat(GetMockTreatmentHistory()).ToList();
            
            return allTreatments.FirstOrDefault(t => 
            {
                var treatment = t as dynamic;
                return treatment?.id == treatmentId;
            });
        }
    }

    public class UpdateProgressRequest
    {
        public int Progress { get; set; }
        public string? Notes { get; set; }
    }
}