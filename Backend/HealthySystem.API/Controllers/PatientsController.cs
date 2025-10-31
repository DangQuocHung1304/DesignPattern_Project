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
    public class PatientsController : ControllerBase
    {
        private readonly HealthySystemDbContext _context;
        private readonly ILogger<PatientsController> _logger;

        public PatientsController(HealthySystemDbContext context, ILogger<PatientsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get patient detail by ID (For doctors to view patient information)
        /// US-03: Xem thông tin cá nhân của bệnh nhân
        /// </summary>
        /// <param name="patientId">Patient User ID</param>
        /// <returns>Patient detail information</returns>
        [HttpGet("{patientId}")]
        [Authorize(Roles = "doctor,admin")]
        public async Task<ActionResult> GetPatientDetail(long patientId)
        {
            try
            {
                var patient = await _context.Users
                    .Include(u => u.PatientProfile)
                    .Where(u => u.Id == patientId && u.Role == "patient")
                    .FirstOrDefaultAsync();

                if (patient == null)
                {
                    return NotFound(new { message = "Không tìm thấy thông tin bệnh nhân" });
                }

                // Get appointment history for this patient
                var appointmentHistory = await _context.Appointments
                    .Include(a => a.Doctor)
                    .Where(a => a.PatientId == patientId && a.Status == "completed")
                    .OrderByDescending(a => a.AppointmentStart)
                    .Take(10) // Get last 10 completed appointments
                    .Select(a => new
                    {
                        Id = a.Id,
                        AppointmentDate = a.AppointmentStart,
                        DoctorName = a.Doctor != null ? a.Doctor.FullName : "N/A",
                        Reason = a.Reason,
                        Status = a.Status
                    })
                    .ToListAsync();

                var result = new
                {
                    // Basic Information
                    Id = patient.Id,
                    PublicId = patient.PublicId,
                    FullName = patient.FullName,
                    FirstName = patient.FirstName,
                    LastName = patient.LastName,
                    Email = patient.Email,
                    Phone = patient.Phone,
                    DateOfBirth = patient.DateOfBirth,
                    Gender = patient.Gender,
                    Status = patient.Status,
                    CreatedAt = patient.CreatedAt,

                    // Patient Profile Information
                    Profile = patient.PatientProfile != null ? new
                    {
                        MedicalRecordNumber = patient.PatientProfile.MedicalRecordNumber,
                        InsuranceProvider = patient.PatientProfile.InsuranceProvider,
                        InsuranceNumber = patient.PatientProfile.InsuranceNumber,
                        Address = patient.PatientProfile.Address,
                        EmergencyContactName = patient.PatientProfile.EmergencyContactName,
                        EmergencyContactPhone = patient.PatientProfile.EmergencyContactPhone,
                        Allergies = patient.PatientProfile.Allergies,
                        ChronicConditions = patient.PatientProfile.ChronicConditions
                    } : null,

                    // Appointment History
                    AppointmentHistory = appointmentHistory,
                    TotalCompletedAppointments = appointmentHistory.Count
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting patient detail for patient ID: {PatientId}", patientId);
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy thông tin bệnh nhân" });
            }
        }

        /// <summary>
        /// Search patients by name or phone (For doctors/reception)
        /// </summary>
        /// <param name="searchTerm">Search term (name or phone)</param>
        /// <returns>List of matching patients</returns>
        [HttpGet("search")]
        [Authorize(Roles = "doctor,reception,admin")]
        public async Task<ActionResult> SearchPatients([FromQuery] string searchTerm)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(searchTerm))
                {
                    return BadRequest(new { message = "Vui lòng nhập từ khóa tìm kiếm" });
                }

                var patients = await _context.Users
                    .Where(u => u.Role == "patient" &&
                                (u.FirstName != null && u.FirstName.Contains(searchTerm) ||
                                 u.LastName != null && u.LastName.Contains(searchTerm) ||
                                 u.Email.Contains(searchTerm) ||
                                 u.Phone != null && u.Phone.Contains(searchTerm)))
                    .Select(u => new
                    {
                        Id = u.Id,
                        PublicId = u.PublicId,
                        FullName = u.FullName,
                        Email = u.Email,
                        Phone = u.Phone,
                        DateOfBirth = u.DateOfBirth,
                        Gender = u.Gender
                    })
                    .Take(20) // Limit results
                    .ToListAsync();

                return Ok(new
                {
                    count = patients.Count,
                    patients = patients
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching patients with term: {SearchTerm}", searchTerm);
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi tìm kiếm bệnh nhân" });
            }
        }

        /// <summary>
        /// Get list of patients for a specific doctor (patients who had appointments with this doctor)
        /// </summary>
        [HttpGet("my-patients")]
        [Authorize(Roles = "doctor")]
        public async Task<ActionResult> GetMyPatients()
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out long doctorId))
                {
                    return Unauthorized(new { message = "Không tìm thấy thông tin người dùng" });
                }

                // Get unique patients who had appointments with this doctor
                var myPatients = await _context.Appointments
                    .Include(a => a.Patient)
                    .Where(a => a.DoctorId == doctorId && a.PatientId != null)
                    .Select(a => a.Patient)
                    .Distinct()
                    .Select(p => new
                    {
                        Id = p!.Id,
                        PublicId = p.PublicId,
                        FullName = p.FullName,
                        Email = p.Email,
                        Phone = p.Phone,
                        DateOfBirth = p.DateOfBirth,
                        Gender = p.Gender,
                        LastAppointment = _context.Appointments
                            .Where(a => a.DoctorId == doctorId && a.PatientId == p.Id)
                            .OrderByDescending(a => a.AppointmentStart)
                            .Select(a => a.AppointmentStart)
                            .FirstOrDefault()
                    })
                    .OrderByDescending(p => p.LastAppointment)
                    .ToListAsync();

                return Ok(new
                {
                    count = myPatients.Count,
                    patients = myPatients
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting doctor's patients");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy danh sách bệnh nhân" });
            }
        }
    }
}
