using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using HealthySystem.API.Data;
using HealthySystem.API.Models;
using System.Security.Claims;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TreatmentsController : ControllerBase
    {
        private readonly HealthySystemDbContext _context;
        private readonly ILogger<TreatmentsController> _logger;

        public TreatmentsController(HealthySystemDbContext context, ILogger<TreatmentsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get current treatments for a user (active treatments)
        /// US-01 Sprint 5: Xem quá trình điều trị bệnh
        /// </summary>
        [HttpGet("current/{userId}")]
        [Authorize]
        public async Task<IActionResult> GetCurrentTreatments(long userId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                {
                    return Unauthorized(new { success = false, message = "Unauthorized access" });
                }

                // Allow patients to view their own treatments
                // Allow doctors to view any patient's treatments
                var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;
                if (currentUserId != userId && currentUserRole != "doctor" && currentUserRole != "admin")
                {
                    return Unauthorized(new { success = false, message = "Bạn không có quyền xem thông tin này" });
                }

                var treatments = await _context.Treatments
                    .Include(t => t.Doctor)
                        .ThenInclude(d => d.StaffProfile)
                    .Include(t => t.Doctor.DoctorSpecialties)
                        .ThenInclude(ds => ds.Specialty)
                    .Include(t => t.TreatmentItems)
                    .Where(t => t.PatientId == userId && t.Status == "active")
                    .OrderByDescending(t => t.StartDate)
                    .Select(t => new
                    {
                        id = t.Id,
                        name = t.Name,
                        doctor = t.Doctor.FirstName + " " + t.Doctor.LastName,
                        specialization = t.Doctor.DoctorSpecialties.FirstOrDefault() != null 
                            ? t.Doctor.DoctorSpecialties.FirstOrDefault()!.Specialty.Name 
                            : "Chưa có chuyên khoa",
                        startDate = t.StartDate.ToString("yyyy-MM-dd"),
                        endDate = t.EndDate.HasValue ? t.EndDate.Value.ToString("yyyy-MM-dd") : null,
                        status = t.Status,
                        progress = t.Progress,
                        description = t.Description,
                        diagnosis = t.Diagnosis,
                        notes = t.Notes,
                        medications = t.TreatmentItems
                            .Where(ti => ti.ItemType == "medication")
                            .Select(ti => new
                            {
                                name = ti.ItemName,
                                dosage = ti.Dosage,
                                frequency = ti.Frequency,
                                instructions = ti.Instructions
                            }).ToList()
                    })
                    .ToListAsync();
                
                return Ok(new
                {
                    success = true,
                    data = treatments
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current treatments for user {UserId}", userId);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải thông tin liệu trình điều trị"
                });
            }
        }

        /// <summary>
        /// Get treatment history for a user (completed treatments)
        /// US-01 Sprint 5: Xem lịch sử điều trị
        /// </summary>
        [HttpGet("history/{userId}")]
        [Authorize]
        public async Task<IActionResult> GetTreatmentHistory(long userId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                {
                    return Unauthorized(new { success = false, message = "Unauthorized access" });
                }

                // Allow patients to view their own treatments
                // Allow doctors to view any patient's treatments
                var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;
                if (currentUserId != userId && currentUserRole != "doctor" && currentUserRole != "admin")
                {
                    return Unauthorized(new { success = false, message = "Bạn không có quyền xem thông tin này" });
                }

                var treatmentHistory = await _context.Treatments
                    .Include(t => t.Doctor)
                        .ThenInclude(d => d.StaffProfile)
                    .Include(t => t.Doctor.DoctorSpecialties)
                        .ThenInclude(ds => ds.Specialty)
                    .Where(t => t.PatientId == userId && t.Status == "completed")
                    .OrderByDescending(t => t.CompletedAt)
                    .Select(t => new
                    {
                        id = t.Id,
                        name = t.Name,
                        doctor = t.Doctor.FirstName + " " + t.Doctor.LastName,
                        specialization = t.Doctor.DoctorSpecialties.FirstOrDefault() != null 
                            ? t.Doctor.DoctorSpecialties.FirstOrDefault()!.Specialty.Name 
                            : "Chưa có chuyên khoa",
                        startDate = t.StartDate.ToString("yyyy-MM-dd"),
                        endDate = t.EndDate.HasValue ? t.EndDate.Value.ToString("yyyy-MM-dd") : null,
                        completedDate = t.CompletedAt.HasValue ? t.CompletedAt.Value.ToString("yyyy-MM-dd") : null,
                        status = t.Status,
                        progress = t.Progress,
                        description = t.Description,
                        outcome = t.Outcome
                    })
                    .ToListAsync();
                
                return Ok(new
                {
                    success = true,
                    data = treatmentHistory
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting treatment history for user {UserId}", userId);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải lịch sử liệu trình điều trị"
                });
            }
        }

        /// <summary>
        /// Get treatment details by ID
        /// US-01 Sprint 5: Xem chi tiết liệu trình điều trị
        /// </summary>
        [HttpGet("{treatmentId}")]
        [Authorize]
        public async Task<IActionResult> GetTreatmentDetails(long treatmentId)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized(new { success = false, message = "Unauthorized access" });
                }

                var treatment = await _context.Treatments
                    .Include(t => t.Doctor)
                        .ThenInclude(d => d.StaffProfile)
                    .Include(t => t.Doctor.DoctorSpecialties)
                        .ThenInclude(ds => ds.Specialty)
                    .Include(t => t.TreatmentItems)
                    .Where(t => t.Id == treatmentId)
                    .FirstOrDefaultAsync();
                
                if (treatment == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Không tìm thấy liệu trình điều trị"
                    });
                }

                // Check if user is authorized to view this treatment
                if (treatment.PatientId != userId)
                {
                    // TODO: Allow doctors to view their patients' treatments
                    return Forbid();
                }

                var result = new
                {
                    id = treatment.Id,
                    name = treatment.Name,
                    description = treatment.Description,
                    diagnosis = treatment.Diagnosis,
                    doctor = new
                    {
                        id = treatment.Doctor.Id,
                        name = treatment.Doctor.FirstName + " " + treatment.Doctor.LastName,
                        title = treatment.Doctor.StaffProfile?.Title,
                        department = treatment.Doctor.StaffProfile?.Department,
                        specialization = treatment.Doctor.DoctorSpecialties.FirstOrDefault() != null 
                            ? treatment.Doctor.DoctorSpecialties.FirstOrDefault()!.Specialty.Name 
                            : "Chưa có chuyên khoa"
                    },
                    startDate = treatment.StartDate.ToString("yyyy-MM-dd"),
                    endDate = treatment.EndDate.HasValue ? treatment.EndDate.Value.ToString("yyyy-MM-dd") : null,
                    completedDate = treatment.CompletedAt.HasValue ? treatment.CompletedAt.Value.ToString("yyyy-MM-dd") : null,
                    status = treatment.Status,
                    progress = treatment.Progress,
                    outcome = treatment.Outcome,
                    notes = treatment.Notes,
                    items = treatment.TreatmentItems.Select(ti => new
                    {
                        id = ti.Id,
                        type = ti.ItemType,
                        name = ti.ItemName,
                        dosage = ti.Dosage,
                        frequency = ti.Frequency,
                        duration = ti.Duration,
                        instructions = ti.Instructions,
                        scheduleDate = ti.ScheduleDate.HasValue ? ti.ScheduleDate.Value.ToString("yyyy-MM-dd") : null,
                        completed = ti.Completed,
                        completedAt = ti.CompletedAt.HasValue ? ti.CompletedAt.Value.ToString("yyyy-MM-dd HH:mm") : null,
                        notes = ti.Notes
                    }).ToList()
                };

                return Ok(new
                {
                    success = true,
                    data = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting treatment details for treatment {TreatmentId}", treatmentId);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải chi tiết liệu trình điều trị"
                });
            }
        }

        /// <summary>
        /// Update treatment progress (Doctor only)
        /// </summary>
        [HttpPut("{treatmentId}/progress")]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> UpdateTreatmentProgress(long treatmentId, [FromBody] UpdateProgressRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                {
                    return Unauthorized();
                }

                var treatment = await _context.Treatments.FindAsync(treatmentId);
                
                if (treatment == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Không tìm thấy liệu trình điều trị"
                    });
                }

                // Only the treating doctor can update progress
                if (treatment.DoctorId != userId)
                {
                    return Forbid();
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

                treatment.Progress = request.Progress;
                treatment.Notes = request.Notes ?? treatment.Notes;
                treatment.UpdatedAt = DateTimeOffset.UtcNow;

                // Auto-complete if progress reaches 100%
                if (request.Progress >= 100 && treatment.Status == "active")
                {
                    treatment.Status = "completed";
                    treatment.CompletedAt = DateTimeOffset.UtcNow;
                    treatment.Outcome = request.Notes;
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Cập nhật tiến độ điều trị thành công",
                    data = new
                    {
                        id = treatment.Id,
                        progress = treatment.Progress,
                        status = treatment.Status
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating treatment progress");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể cập nhật tiến độ điều trị"
                });
            }
        }

        private long? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out long userId))
            {
                return null;
            }
            return userId;
        }
    }

    public class UpdateProgressRequest
    {
        public int Progress { get; set; }
        public string? Notes { get; set; }
    }
}