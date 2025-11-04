using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthySystem.API.Data;
using HealthySystem.API.Models;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "lab,admin")]
    public class LabTechnicianController : ControllerBase
    {
        private readonly HealthySystemDbContext _context;
        private readonly ILogger<LabTechnicianController> _logger;

        public LabTechnicianController(HealthySystemDbContext context, ILogger<LabTechnicianController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Sprint 8 US-01: Lấy danh sách yêu cầu xét nghiệm chờ xử lý
        /// </summary>
        [HttpGet("pending-requests")]
        public async Task<ActionResult> GetPendingRequests([FromQuery] string? status = null)
        {
            try
            {
                var query = _context.LabRequests
                    .Include(lr => lr.Encounter)
                        .ThenInclude(e => e.Patient)
                    .Include(lr => lr.RequestedByUser)
                    .Include(lr => lr.LabResults)
                    .AsQueryable();

                // Filter by status
                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(lr => lr.Status == status);
                }
                else
                {
                    // Default: show requested and in_progress only
                    query = query.Where(lr => lr.Status == "requested" || lr.Status == "in_progress");
                }

                var requests = await query
                    .OrderByDescending(lr => lr.RequestedAt)
                    .Select(lr => new
                    {
                        Id = lr.Id,
                        EncounterId = lr.EncounterId,
                        PatientId = lr.Encounter.PatientId,
                        PatientName = lr.Encounter.Patient.FullName,
                        PatientGender = lr.Encounter.Patient.Gender,
                        PatientDateOfBirth = lr.Encounter.Patient.DateOfBirth,
                        DoctorName = lr.RequestedByUser.FullName,
                        RequestedAt = lr.RequestedAt,
                        Status = lr.Status,
                        Note = lr.Note,
                        TestCount = lr.LabResults.Count,
                        CompletedTestCount = lr.LabResults.Count(r => r.PerformedAt != null),
                        EncounterDate = lr.Encounter.VisitDateTime,
                        ChiefComplaint = lr.Encounter.ChiefComplaint
                    })
                    .ToListAsync();

                return Ok(new
                {
                    message = "Lấy danh sách yêu cầu xét nghiệm thành công",
                    data = requests,
                    count = requests.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pending lab requests");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy danh sách yêu cầu" });
            }
        }

        /// <summary>
        /// Sprint 8 US-01: Lấy chi tiết yêu cầu xét nghiệm
        /// </summary>
        [HttpGet("requests/{id}")]
        public async Task<ActionResult> GetLabRequestDetail(long id)
        {
            try
            {
                var labRequest = await _context.LabRequests
                    .Include(lr => lr.Encounter)
                        .ThenInclude(e => e.Patient)
                    .Include(lr => lr.RequestedByUser)
                    .Include(lr => lr.LabResults)
                    .FirstOrDefaultAsync(lr => lr.Id == id);

                if (labRequest == null)
                {
                    return NotFound(new { message = "Không tìm thấy yêu cầu xét nghiệm" });
                }

                var result = new
                {
                    Id = labRequest.Id,
                    EncounterId = labRequest.EncounterId,
                    
                    // Patient info
                    Patient = new
                    {
                        Id = labRequest.Encounter.Patient.Id,
                        FullName = labRequest.Encounter.Patient.FullName,
                        Gender = labRequest.Encounter.Patient.Gender,
                        DateOfBirth = labRequest.Encounter.Patient.DateOfBirth,
                        Phone = labRequest.Encounter.Patient.Phone,
                        Email = labRequest.Encounter.Patient.Email
                    },
                    
                    // Doctor info
                    DoctorName = labRequest.RequestedByUser.FullName,
                    
                    // Request info
                    RequestedAt = labRequest.RequestedAt,
                    Status = labRequest.Status,
                    Note = labRequest.Note,
                    
                    // Encounter info
                    EncounterDate = labRequest.Encounter.VisitDateTime,
                    ChiefComplaint = labRequest.Encounter.ChiefComplaint,
                    Diagnosis = labRequest.Encounter.Diagnosis,
                    
                    // Lab tests
                    LabTests = labRequest.LabResults.Select(lr => new
                    {
                        Id = lr.Id,
                        TestCode = lr.TestCode,
                        ResultText = lr.ResultText,
                        ResultValue = lr.ResultValue,
                        Units = lr.Units,
                        NormalRange = lr.NormalRange,
                        PerformedBy = lr.PerformedBy,
                        PerformedAt = lr.PerformedAt,
                        IsCompleted = lr.PerformedAt != null
                    }).ToList()
                };

                return Ok(new
                {
                    message = "Lấy chi tiết yêu cầu xét nghiệm thành công",
                    data = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting lab request detail {RequestId}", id);
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy chi tiết yêu cầu" });
            }
        }

        /// <summary>
        /// Sprint 8 US-02: Cập nhật trạng thái yêu cầu xét nghiệm
        /// </summary>
        [HttpPut("requests/{id}/status")]
        public async Task<ActionResult> UpdateRequestStatus(long id, [FromBody] UpdateLabRequestStatusDto request)
        {
            try
            {
                var labRequest = await _context.LabRequests.FindAsync(id);
                if (labRequest == null)
                {
                    return NotFound(new { message = "Không tìm thấy yêu cầu xét nghiệm" });
                }

                labRequest.Status = request.Status;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Cập nhật trạng thái thành công",
                    data = new
                    {
                        Id = labRequest.Id,
                        Status = labRequest.Status
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating lab request status {RequestId}", id);
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi cập nhật trạng thái" });
            }
        }

        /// <summary>
        /// Sprint 8 US-02: Nhập kết quả xét nghiệm
        /// </summary>
        [HttpPut("results/{resultId}")]
        public async Task<ActionResult> UpdateLabResult(long resultId, [FromBody] UpdateLabResultDto request)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out long labTechId))
                {
                    return Unauthorized(new { message = "Không tìm thấy thông tin người dùng" });
                }

                var labResult = await _context.LabResults
                    .Include(lr => lr.LabRequest)
                    .FirstOrDefaultAsync(lr => lr.Id == resultId);

                if (labResult == null)
                {
                    return NotFound(new { message = "Không tìm thấy kết quả xét nghiệm" });
                }

                // Update result
                labResult.ResultText = request.ResultText;
                labResult.ResultValue = request.ResultValue;
                labResult.Units = request.Units;
                labResult.NormalRange = request.NormalRange;
                labResult.PerformedBy = labTechId;
                labResult.PerformedAt = DateTimeOffset.UtcNow;

                await _context.SaveChangesAsync();

                // Check if all tests in this request are completed
                var allResults = await _context.LabResults
                    .Where(lr => lr.LabRequestId == labResult.LabRequestId)
                    .ToListAsync();

                var allCompleted = allResults.All(r => r.PerformedAt != null);
                if (allCompleted)
                {
                    labResult.LabRequest.Status = "completed";
                    await _context.SaveChangesAsync();
                }

                return Ok(new
                {
                    message = "Cập nhật kết quả xét nghiệm thành công",
                    data = new
                    {
                        Id = labResult.Id,
                        TestCode = labResult.TestCode,
                        ResultValue = labResult.ResultValue,
                        ResultText = labResult.ResultText,
                        PerformedAt = labResult.PerformedAt,
                        RequestStatus = labResult.LabRequest.Status
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating lab result {ResultId}", resultId);
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi cập nhật kết quả" });
            }
        }

        /// <summary>
        /// Lấy thống kê cho lab technician dashboard
        /// </summary>
        [HttpGet("statistics")]
        public async Task<ActionResult> GetLabStatistics([FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var query = _context.LabRequests.AsQueryable();

                // Filter by date range
                if (fromDate.HasValue)
                {
                    query = query.Where(lr => lr.RequestedAt >= fromDate.Value);
                }
                if (toDate.HasValue)
                {
                    query = query.Where(lr => lr.RequestedAt <= toDate.Value.AddDays(1));
                }

                var stats = new
                {
                    TotalRequests = await query.CountAsync(),
                    PendingRequests = await query.CountAsync(lr => lr.Status == "requested"),
                    InProgressRequests = await query.CountAsync(lr => lr.Status == "in_progress"),
                    CompletedRequests = await query.CountAsync(lr => lr.Status == "completed"),
                    CancelledRequests = await query.CountAsync(lr => lr.Status == "cancelled"),
                    
                    TodayRequests = await _context.LabRequests
                        .CountAsync(lr => lr.RequestedAt.Date == DateTimeOffset.UtcNow.Date),
                    
                    TodayCompletedTests = await _context.LabResults
                        .CountAsync(lr => lr.PerformedAt != null && lr.PerformedAt.Value.Date == DateTimeOffset.UtcNow.Date)
                };

                return Ok(new
                {
                    message = "Lấy thống kê thành công",
                    data = stats
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting lab statistics");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy thống kê" });
            }
        }

        /// <summary>
        /// Tìm kiếm yêu cầu xét nghiệm
        /// </summary>
        [HttpGet("search")]
        public async Task<ActionResult> SearchLabRequests(
            [FromQuery] string? patientName = null,
            [FromQuery] string? doctorName = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] string? status = null)
        {
            try
            {
                var query = _context.LabRequests
                    .Include(lr => lr.Encounter)
                        .ThenInclude(e => e.Patient)
                    .Include(lr => lr.RequestedByUser)
                    .Include(lr => lr.LabResults)
                    .AsQueryable();

                // Search by patient name
                if (!string.IsNullOrEmpty(patientName))
                {
                    query = query.Where(lr => 
                        lr.Encounter.Patient.FirstName.Contains(patientName) ||
                        lr.Encounter.Patient.LastName.Contains(patientName) ||
                        lr.Encounter.Patient.FullName.Contains(patientName));
                }

                // Search by doctor name
                if (!string.IsNullOrEmpty(doctorName))
                {
                    query = query.Where(lr => 
                        lr.RequestedByUser.FirstName.Contains(doctorName) ||
                        lr.RequestedByUser.LastName.Contains(doctorName) ||
                        lr.RequestedByUser.FullName.Contains(doctorName));
                }

                // Filter by date range
                if (fromDate.HasValue)
                {
                    query = query.Where(lr => lr.RequestedAt.Date >= fromDate.Value.Date);
                }
                if (toDate.HasValue)
                {
                    query = query.Where(lr => lr.RequestedAt.Date <= toDate.Value.Date);
                }

                // Filter by status
                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(lr => lr.Status == status);
                }

                var results = await query
                    .OrderByDescending(lr => lr.RequestedAt)
                    .Select(lr => new
                    {
                        Id = lr.Id,
                        EncounterId = lr.EncounterId,
                        PatientName = lr.Encounter.Patient.FullName,
                        DoctorName = lr.RequestedByUser.FullName,
                        RequestedAt = lr.RequestedAt,
                        Status = lr.Status,
                        TestCount = lr.LabResults.Count,
                        CompletedTestCount = lr.LabResults.Count(r => r.PerformedAt != null)
                    })
                    .ToListAsync();

                return Ok(new
                {
                    message = "Tìm kiếm thành công",
                    data = results,
                    count = results.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching lab requests");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi tìm kiếm" });
            }
        }
    }

    // DTOs
    public class UpdateLabRequestStatusDto
    {
        public string Status { get; set; } = string.Empty; // requested|in_progress|completed|cancelled
    }

    public class UpdateLabResultDto
    {
        public string? ResultText { get; set; }
        public string? ResultValue { get; set; }
        public string? Units { get; set; }
        public string? NormalRange { get; set; }
    }
}
