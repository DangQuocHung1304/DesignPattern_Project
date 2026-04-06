using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthySystem.API.Data;
using HealthySystem.API.DesignPatterns.Proxy;
using HealthySystem.API.Models;
using System.Security.Claims;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MedicalHistoryController : ControllerBase
    {
        private readonly HealthySystemDbContext _context;
        private readonly ILogger<MedicalHistoryController> _logger;
        private readonly IMedicalRecordProxyService _medicalRecordProxyService;

        public MedicalHistoryController(
            HealthySystemDbContext context,
            ILogger<MedicalHistoryController> logger,
            IMedicalRecordProxyService medicalRecordProxyService)
        {
            _context = context;
            _logger = logger;
            _medicalRecordProxyService = medicalRecordProxyService;
        }

        [HttpGet("secure-summary/{patientCode}")]
        [HttpGet("secure-summary/{patientCode}/pattern")]
        [HttpGet("/api/medicalhistory/secure-summary/{patientCode}/pattern")]
        [Authorize(Roles = "doctor,admin,patient")]
        public async Task<IActionResult> GetSecureMedicalSummary(string patientCode)
        {
            var requesterRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "guest";
            var requesterCode = User.FindFirst("publicId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "unknown";

            var result = await _medicalRecordProxyService.GetMedicalRecordAsync(new MedicalRecordAccessContext(
                RequesterCode: requesterCode,
                RequesterRole: requesterRole,
                RequestedPatientCode: patientCode));

            return Ok(new
            {
                success = true,
                processingState = new
                {
                    phase = "ready",
                    isLoading = false,
                    skeletonHint = "medical-record-secure-summary"
                },
                data = result
            });
        }

        /// <summary>
        /// Get comprehensive medical history for a patient
        /// US-01 Sprint 6: Xem lịch sử bệnh của bệnh nhân
        /// </summary>
        [HttpGet("{patientId}")]
        [Authorize(Roles = "doctor,admin")]
        public async Task<ActionResult> GetMedicalHistory(long patientId)
        {
            try
            {
                // Verify patient exists
                var patient = await _context.Users.FindAsync(patientId);
                if (patient == null)
                {
                    return NotFound(new { message = "Không tìm thấy bệnh nhân" });
                }

                // Get all encounters with related data
                var encounters = await _context.Encounters
                    .Include(e => e.Doctor)
                    .Include(e => e.LabRequests)
                        .ThenInclude(lr => lr.LabResults)
                    .Include(e => e.ImagingRequests)
                        .ThenInclude(ir => ir.ImagingResults)
                    .Include(e => e.Prescriptions)
                    .Where(e => e.PatientId == patientId)
                    .OrderByDescending(e => e.VisitDateTime)
                    .Select(e => new
                    {
                        Id = e.Id,
                        VisitDate = e.VisitDateTime,
                        DoctorName = e.Doctor != null ? e.Doctor.FullName : "N/A",
                        ChiefComplaint = e.ChiefComplaint,
                        Diagnosis = e.Diagnosis,
                        Notes = e.Notes,
                        Status = e.Status,
                        
                        // Lab requests and results
                        LabRequests = e.LabRequests.Select(lr => new
                        {
                            Id = lr.Id,
                            RequestedAt = lr.RequestedAt,
                            Status = lr.Status,
                            Note = lr.Note,
                            Results = lr.LabResults.Select(result => new
                            {
                                Id = result.Id,
                                TestCode = result.TestCode,
                                ResultValue = result.ResultValue,
                                ResultText = result.ResultText,
                                Units = result.Units,
                                NormalRange = result.NormalRange,
                                PerformedAt = result.PerformedAt,
                                IsAbnormal = result.ResultValue != null && !string.IsNullOrEmpty(result.NormalRange)
                            }).ToList()
                        }).ToList(),

                        // Imaging requests and results
                        ImagingRequests = e.ImagingRequests.Select(ir => new
                        {
                            Id = ir.Id,
                            RequestedAt = ir.RequestedAt,
                            Status = ir.Status,
                            Note = ir.Note,
                            Results = ir.ImagingResults.Select(result => new
                            {
                                Id = result.Id,
                                ReportText = result.ReportText,
                                PerformedAt = result.PerformedAt
                            }).ToList()
                        }).ToList(),

                        // Prescriptions count
                        PrescriptionsCount = e.Prescriptions.Count
                    })
                    .ToListAsync();

                // Get all treatments for this patient
                var treatments = await _context.Treatments
                    .Include(t => t.Doctor)
                    .Include(t => t.TreatmentItems)
                    .Where(t => t.PatientId == patientId)
                    .OrderByDescending(t => t.StartDate)
                    .Select(t => new
                    {
                        Id = t.Id,
                        Name = t.Name,
                        DoctorName = t.Doctor != null ? t.Doctor.FullName : "N/A",
                        Diagnosis = t.Diagnosis,
                        Description = t.Description,
                        StartDate = t.StartDate,
                        EndDate = t.EndDate,
                        Status = t.Status,
                        Progress = t.Progress,
                        Outcome = t.Outcome,
                        CompletedAt = t.CompletedAt,
                        ItemsCount = t.TreatmentItems.Count
                    })
                    .ToListAsync();

                // Get summary statistics
                var stats = new
                {
                    TotalEncounters = encounters.Count,
                    TotalLabTests = encounters.Sum(e => e.LabRequests.Sum(lr => lr.Results.Count)),
                    TotalImagingTests = encounters.Sum(e => e.ImagingRequests.Sum(ir => ir.Results.Count)),
                    TotalTreatments = treatments.Count,
                    ActiveTreatments = treatments.Count(t => t.Status == "active"),
                    CompletedTreatments = treatments.Count(t => t.Status == "completed")
                };

                return Ok(new
                {
                    message = "Lấy lịch sử bệnh thành công",
                    data = new
                    {
                        PatientId = patientId,
                        PatientName = patient.FullName,
                        Statistics = stats,
                        Encounters = encounters,
                        Treatments = treatments
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting medical history for patient {PatientId}", patientId);
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy lịch sử bệnh" });
            }
        }

        /// <summary>
        /// Get lab results summary for a patient
        /// </summary>
        [HttpGet("{patientId}/lab-results")]
        [Authorize(Roles = "doctor,lab,admin")]
        public async Task<ActionResult> GetLabResultsSummary(long patientId)
        {
            try
            {
                var labResults = await _context.LabResults
                    .Include(lr => lr.LabRequest)
                        .ThenInclude(req => req.Encounter)
                    .Where(lr => lr.LabRequest.Encounter.PatientId == patientId)
                    .OrderByDescending(lr => lr.PerformedAt)
                    .Select(lr => new
                    {
                        Id = lr.Id,
                        TestCode = lr.TestCode,
                        ResultValue = lr.ResultValue,
                        ResultText = lr.ResultText,
                        Units = lr.Units,
                        NormalRange = lr.NormalRange,
                        PerformedAt = lr.PerformedAt,
                        EncounterDate = lr.LabRequest.Encounter.VisitDateTime,
                        RequestNote = lr.LabRequest.Note
                    })
                    .ToListAsync();

                return Ok(new { data = labResults });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting lab results for patient {PatientId}", patientId);
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy kết quả xét nghiệm" });
            }
        }

        /// <summary>
        /// Get imaging results summary for a patient
        /// </summary>
        [HttpGet("{patientId}/imaging-results")]
        [Authorize(Roles = "doctor,imaging,admin")]
        public async Task<ActionResult> GetImagingResultsSummary(long patientId)
        {
            try
            {
                var imagingResults = await _context.ImagingResults
                    .Include(ir => ir.ImagingRequest)
                        .ThenInclude(req => req.Encounter)
                    .Where(ir => ir.ImagingRequest.Encounter.PatientId == patientId)
                    .OrderByDescending(ir => ir.PerformedAt)
                    .Select(ir => new
                    {
                        Id = ir.Id,
                        ReportText = ir.ReportText,
                        PerformedAt = ir.PerformedAt,
                        EncounterDate = ir.ImagingRequest.Encounter.VisitDateTime,
                        RequestNote = ir.ImagingRequest.Note
                    })
                    .ToListAsync();

                return Ok(new { data = imagingResults });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting imaging results for patient {PatientId}", patientId);
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy kết quả chẩn đoán hình ảnh" });
            }
        }

        /// <summary>
        /// Get encounter detail with all related information
        /// </summary>
        [HttpGet("encounter/{encounterId}")]
        [Authorize(Roles = "doctor,admin")]
        public async Task<ActionResult> GetEncounterDetail(long encounterId)
        {
            try
            {
                var encounter = await _context.Encounters
                    .Include(e => e.Patient)
                    .Include(e => e.Doctor)
                    .Include(e => e.LabRequests)
                        .ThenInclude(lr => lr.LabResults)
                    .Include(e => e.ImagingRequests)
                        .ThenInclude(ir => ir.ImagingResults)
                    .Include(e => e.Prescriptions)
                        .ThenInclude(p => p.PrescriptionItems)
                    .FirstOrDefaultAsync(e => e.Id == encounterId);

                if (encounter == null)
                {
                    return NotFound(new { message = "Không tìm thấy phiên khám" });
                }

                var result = new
                {
                    Id = encounter.Id,
                    VisitDate = encounter.VisitDateTime,
                    Patient = new
                    {
                        Id = encounter.Patient.Id,
                        FullName = encounter.Patient.FullName,
                        DateOfBirth = encounter.Patient.DateOfBirth,
                        Gender = encounter.Patient.Gender
                    },
                    Doctor = encounter.Doctor != null ? new
                    {
                        Id = encounter.Doctor.Id,
                        FullName = encounter.Doctor.FullName
                    } : null,
                    ChiefComplaint = encounter.ChiefComplaint,
                    Diagnosis = encounter.Diagnosis,
                    Notes = encounter.Notes,
                    Status = encounter.Status,
                    LabRequests = encounter.LabRequests.Select(lr => new
                    {
                        Id = lr.Id,
                        RequestedAt = lr.RequestedAt,
                        Status = lr.Status,
                        Note = lr.Note,
                        Results = lr.LabResults.Select(r => new
                        {
                            TestCode = r.TestCode,
                            ResultValue = r.ResultValue,
                            ResultText = r.ResultText,
                            Units = r.Units,
                            NormalRange = r.NormalRange,
                            PerformedAt = r.PerformedAt
                        }).ToList()
                    }).ToList(),
                    ImagingRequests = encounter.ImagingRequests.Select(ir => new
                    {
                        Id = ir.Id,
                        RequestedAt = ir.RequestedAt,
                        Status = ir.Status,
                        Note = ir.Note,
                        Results = ir.ImagingResults.Select(r => new
                        {
                            ReportText = r.ReportText,
                            PerformedAt = r.PerformedAt
                        }).ToList()
                    }).ToList(),
                    Prescriptions = encounter.Prescriptions.Select(p => new
                    {
                        Id = p.Id,
                        PrescribedAt = p.PrescribedAt,
                        Items = p.PrescriptionItems.Select(pi => new
                        {
                            MedicineName = pi.MedicineName,
                            Dosage = pi.Dosage,
                            Frequency = pi.Frequency,
                            DurationDays = pi.DurationDays,
                            Instructions = pi.Instructions
                        }).ToList()
                    }).ToList()
                };

                return Ok(new { data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting encounter detail {EncounterId}", encounterId);
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy thông tin phiên khám" });
            }
        }
    }
}
