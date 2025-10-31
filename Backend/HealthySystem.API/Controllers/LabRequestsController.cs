using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthySystem.API.Data;
using HealthySystem.API.Models;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LabRequestsController : ControllerBase
    {
        private readonly HealthySystemDbContext _context;
        private readonly ILogger<LabRequestsController> _logger;

        public LabRequestsController(HealthySystemDbContext context, ILogger<LabRequestsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Tạo yêu cầu xét nghiệm (Doctor only)
        /// US-02: Yêu cầu thực hiện các xét nghiệm cho bệnh nhân
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "doctor")]
        public async Task<ActionResult> CreateLabRequest([FromBody] CreateLabRequestDto request)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out long doctorId))
                {
                    return Unauthorized(new { message = "Không tìm thấy thông tin bác sĩ" });
                }

                // Validate encounter exists and belongs to this doctor
                var encounter = await _context.Encounters
                    .Include(e => e.Patient)
                    .FirstOrDefaultAsync(e => e.Id == request.EncounterId);

                if (encounter == null)
                {
                    return NotFound(new { message = "Không tìm thấy phiên khám" });
                }

                if (encounter.DoctorId != doctorId)
                {
                    return Forbid(); // Not this doctor's encounter
                }

                // Validate test items
                if (request.TestItems == null || !request.TestItems.Any())
                {
                    return BadRequest(new { message = "Phải chọn ít nhất một xét nghiệm" });
                }

                // Create lab request
                var labRequest = new LabRequest
                {
                    EncounterId = request.EncounterId,
                    RequestedBy = doctorId,
                    RequestedAt = DateTimeOffset.UtcNow,
                    Status = "requested",
                    Note = request.Note
                };

                _context.LabRequests.Add(labRequest);
                await _context.SaveChangesAsync();

                // Create lab results (empty, to be filled by lab staff)
                foreach (var testItem in request.TestItems)
                {
                    var labResult = new LabResult
                    {
                        LabRequestId = labRequest.Id,
                        TestCode = testItem.TestCode,
                        ResultText = null, // Chưa có kết quả
                        ResultValue = null,
                        Units = testItem.Units,
                        NormalRange = testItem.NormalRange,
                        PerformedBy = null,
                        PerformedAt = null
                    };

                    _context.LabResults.Add(labResult);
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Tạo yêu cầu xét nghiệm thành công",
                    data = new
                    {
                        Id = labRequest.Id,
                        EncounterId = labRequest.EncounterId,
                        PatientName = encounter.Patient.FullName,
                        RequestedAt = labRequest.RequestedAt,
                        Status = labRequest.Status,
                        TestCount = request.TestItems.Count,
                        Note = labRequest.Note
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating lab request");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi tạo yêu cầu xét nghiệm" });
            }
        }

        /// <summary>
        /// Lấy danh sách yêu cầu xét nghiệm của một phiên khám
        /// </summary>
        [HttpGet("encounter/{encounterId}")]
        [Authorize(Roles = "doctor,lab,admin")]
        public async Task<ActionResult> GetLabRequestsByEncounter(long encounterId)
        {
            try
            {
                var labRequests = await _context.LabRequests
                    .Include(lr => lr.LabResults)
                    .Include(lr => lr.RequestedByUser)
                    .Where(lr => lr.EncounterId == encounterId)
                    .OrderByDescending(lr => lr.RequestedAt)
                    .Select(lr => new
                    {
                        Id = lr.Id,
                        EncounterId = lr.EncounterId,
                        RequestedBy = lr.RequestedByUser.FullName,
                        RequestedAt = lr.RequestedAt,
                        Status = lr.Status,
                        Note = lr.Note,
                        TestItems = lr.LabResults.Select(result => new
                        {
                            Id = result.Id,
                            TestCode = result.TestCode,
                            ResultValue = result.ResultValue,
                            ResultText = result.ResultText,
                            Units = result.Units,
                            NormalRange = result.NormalRange,
                            PerformedAt = result.PerformedAt,
                            Status = result.ResultValue != null || result.ResultText != null ? "completed" : "pending"
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(new { data = labRequests });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting lab requests for encounter {EncounterId}", encounterId);
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy danh sách yêu cầu xét nghiệm" });
            }
        }

        /// <summary>
        /// Lấy chi tiết một yêu cầu xét nghiệm
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Roles = "doctor,lab,admin")]
        public async Task<ActionResult> GetLabRequest(long id)
        {
            try
            {
                var labRequest = await _context.LabRequests
                    .Include(lr => lr.LabResults)
                    .Include(lr => lr.RequestedByUser)
                    .Include(lr => lr.Encounter)
                        .ThenInclude(e => e.Patient)
                    .FirstOrDefaultAsync(lr => lr.Id == id);

                if (labRequest == null)
                {
                    return NotFound(new { message = "Không tìm thấy yêu cầu xét nghiệm" });
                }

                var result = new
                {
                    Id = labRequest.Id,
                    EncounterId = labRequest.EncounterId,
                    PatientName = labRequest.Encounter.Patient.FullName,
                    PatientId = labRequest.Encounter.PatientId,
                    RequestedBy = labRequest.RequestedByUser.FullName,
                    RequestedAt = labRequest.RequestedAt,
                    Status = labRequest.Status,
                    Note = labRequest.Note,
                    TestItems = labRequest.LabResults.Select(r => new
                    {
                        Id = r.Id,
                        TestCode = r.TestCode,
                        ResultValue = r.ResultValue,
                        ResultText = r.ResultText,
                        Units = r.Units,
                        NormalRange = r.NormalRange,
                        PerformedBy = r.PerformedBy,
                        PerformedAt = r.PerformedAt,
                        Status = r.ResultValue != null || r.ResultText != null ? "completed" : "pending"
                    }).ToList()
                };

                return Ok(new { data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting lab request {Id}", id);
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy thông tin yêu cầu xét nghiệm" });
            }
        }

        /// <summary>
        /// Hủy yêu cầu xét nghiệm (chỉ được hủy nếu chưa có kết quả)
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "doctor")]
        public async Task<ActionResult> CancelLabRequest(long id)
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out long doctorId))
                {
                    return Unauthorized(new { message = "Không tìm thấy thông tin bác sĩ" });
                }

                var labRequest = await _context.LabRequests
                    .Include(lr => lr.LabResults)
                    .FirstOrDefaultAsync(lr => lr.Id == id);

                if (labRequest == null)
                {
                    return NotFound(new { message = "Không tìm thấy yêu cầu xét nghiệm" });
                }

                // Only the requesting doctor can cancel
                if (labRequest.RequestedBy != doctorId)
                {
                    return Forbid();
                }

                // Check if any results have been entered
                bool hasResults = labRequest.LabResults.Any(r => 
                    r.ResultValue != null || r.ResultText != null);

                if (hasResults)
                {
                    return BadRequest(new { message = "Không thể hủy yêu cầu đã có kết quả" });
                }

                labRequest.Status = "cancelled";
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã hủy yêu cầu xét nghiệm" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling lab request {Id}", id);
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi hủy yêu cầu xét nghiệm" });
            }
        }
    }

    // DTO Classes
    public class CreateLabRequestDto
    {
        public long EncounterId { get; set; }
        public string? Note { get; set; }
        public List<LabTestItemDto> TestItems { get; set; } = new();
    }

    public class LabTestItemDto
    {
        public string TestCode { get; set; } = string.Empty;
        public string? Units { get; set; }
        public string? NormalRange { get; set; }
    }
}
