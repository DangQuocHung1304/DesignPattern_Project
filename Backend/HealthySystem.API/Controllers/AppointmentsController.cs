using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using HealthySystem.API.Data;
using HealthySystem.API.DesignPatterns.AbstractFactory;
using HealthySystem.API.DesignPatterns.Observer;
using HealthySystem.API.DesignPatterns.State;
using HealthySystem.API.DesignPatterns.Singleton;
using HealthySystem.API.Models;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AppointmentsController : ControllerBase
    {
        private readonly HealthySystemDbContext _context;
        private readonly IAppointmentStateMachineService _appointmentStateMachineService;
        private readonly IAppointmentStatusCoordinator _appointmentStatusCoordinator;
        private readonly IAppointmentCommunicationService _appointmentCommunicationService;
        private readonly ISystemConfigurationProvider _systemConfigurationProvider;

        public AppointmentsController(
            HealthySystemDbContext context,
            IAppointmentStateMachineService appointmentStateMachineService,
            IAppointmentStatusCoordinator appointmentStatusCoordinator,
            IAppointmentCommunicationService appointmentCommunicationService,
            ISystemConfigurationProvider systemConfigurationProvider)
        {
            _context = context;
            _appointmentStateMachineService = appointmentStateMachineService;
            _appointmentStatusCoordinator = appointmentStatusCoordinator;
            _appointmentCommunicationService = appointmentCommunicationService;
            _systemConfigurationProvider = systemConfigurationProvider;
        }

        // GET: api/appointments (for authenticated users)
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<object>>> GetAppointments()
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            IQueryable<Appointment> query = _context.Appointments;

            // Filter based on user role
            if (userRole == "patient")
            {
                query = query.Where(a => a.PatientId == userId);
            }
            else if (userRole == "doctor")
            {
                query = query.Where(a => a.DoctorId == userId);
            }
            // Staff members can see all appointments

            var appointments = await query
                .Include(a => a.Patient)
                .Include(a => a.WalkInPatient)  // NEW: Include walk-in patients
                .Include(a => a.Doctor)
                .ThenInclude(d => d.StaffProfile)
                .Include(a => a.Doctor)
                .ThenInclude(d => d.DoctorSpecialties)
                .ThenInclude(ds => ds.Specialty)
                .OrderByDescending(a => a.AppointmentStart)
                .Select(a => new
                {
                    Id = a.Id,
                    AppointmentStart = a.AppointmentStart,
                    AppointmentEnd = a.AppointmentEnd,
                    Status = a.Status,
                    Notes = a.Reason,
                    IsEmergency = a.Source == "emergency",
                    // Support both registered patients and walk-in patients
                    Patient = a.Patient != null ? new
                    {
                        Id = a.Patient.Id,
                        PublicId = a.Patient.PublicId,
                        FullName = a.Patient.FullName,
                        Phone = a.Patient.Phone ?? "",
                        Email = a.Patient.Email ?? "",
                        IsWalkIn = false
                    } : a.WalkInPatient != null ? new
                    {
                        Id = a.WalkInPatient.Id,
                        PublicId = a.WalkInPatient.PublicId,
                        FullName = a.WalkInPatient.FullName,
                        Phone = a.WalkInPatient.Phone ?? "",
                        Email = a.WalkInPatient.Email ?? "",
                        IsWalkIn = true
                    } : null,
                    Doctor = new
                    {
                        Id = a.Doctor.Id,
                        PublicId = a.Doctor.PublicId,
                        FullName = a.Doctor.FullName,
                        Title = a.Doctor.StaffProfile!.Title,
                        Department = a.Doctor.StaffProfile.Department,
                        Specialties = a.Doctor.DoctorSpecialties.Select(ds => new
                        {
                            Id = ds.Specialty.Id,
                            Name = ds.Specialty.Name
                        }).ToList()
                    },
                    CreatedDate = a.CreatedAt,
                    UpdatedDate = a.UpdatedAt
                })
                .ToListAsync();

            return Ok(appointments);
        }

        // GET: api/appointments/{id}
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<object>> GetAppointment(long id)
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var appointment = await _context.Appointments
                .Include(a => a.Patient)
                .ThenInclude(p => p!.PatientProfile)  // FIX: Nullable
                .Include(a => a.WalkInPatient)  // NEW: Walk-in patients
                .Include(a => a.Doctor)
                .ThenInclude(d => d.StaffProfile)
                .Include(a => a.Doctor)
                .ThenInclude(d => d.DoctorSpecialties)
                .ThenInclude(ds => ds.Specialty)
                .Where(a => a.Id == id)
                .FirstOrDefaultAsync();

            if (appointment == null)
            {
                return NotFound();
            }

            // Check authorization
            if (userRole == "patient" && appointment.PatientId != userId)
            {
                return Forbid();
            }
            else if (userRole == "doctor" && appointment.DoctorId != userId)
            {
                return Forbid();
            }

            var result = new
            {
                Id = appointment.Id,
                AppointmentStart = appointment.AppointmentStart,
                AppointmentEnd = appointment.AppointmentEnd,
                Status = appointment.Status,
                Notes = appointment.Reason,
                IsEmergency = appointment.Source == "emergency",
                Patient = appointment.Patient != null ? new
                {
                    Id = appointment.Patient.Id,
                    PublicId = appointment.Patient.PublicId,
                    FullName = appointment.Patient.FullName,
                    Phone = appointment.Patient.Phone ?? "",
                    Email = appointment.Patient.Email ?? "",
                    Gender = appointment.Patient.Gender,
                    DateOfBirth = appointment.Patient.DateOfBirth,
                    MedicalRecordNumber = appointment.Patient.PatientProfile?.MedicalRecordNumber,
                    IsWalkIn = false
                } : appointment.WalkInPatient != null ? new
                {
                    Id = appointment.WalkInPatient.Id,
                    PublicId = appointment.WalkInPatient.PublicId,
                    FullName = appointment.WalkInPatient.FullName,
                    Phone = appointment.WalkInPatient.Phone ?? "",
                    Email = appointment.WalkInPatient.Email ?? "",
                    Gender = appointment.WalkInPatient.Gender,
                    DateOfBirth = appointment.WalkInPatient.DateOfBirth,
                    MedicalRecordNumber = appointment.WalkInPatient.MedicalRecordNumber,
                    IsWalkIn = true
                } : null,
                Doctor = new
                {
                    Id = appointment.Doctor.Id,
                    PublicId = appointment.Doctor.PublicId,
                    FullName = appointment.Doctor.FullName,
                    Title = appointment.Doctor.StaffProfile!.Title,
                    Department = appointment.Doctor.StaffProfile.Department,
                    Phone = appointment.Doctor.Phone,
                    Email = appointment.Doctor.Email,
                    Specialties = appointment.Doctor.DoctorSpecialties.Select(ds => new
                    {
                        Id = ds.Specialty.Id,
                        Name = ds.Specialty.Name,
                        Description = ds.Specialty.Description
                    }).ToList()
                },
                CreatedDate = appointment.CreatedAt,
                UpdatedDate = appointment.UpdatedAt
            };

            return Ok(result);
        }

        // POST: api/appointments
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<object>> CreateAppointment([FromBody] CreateAppointmentRequest request)
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            // Validate patient
            var patient = await _context.Users
                .FirstOrDefaultAsync(u => u.PublicId.ToString() == request.PatientPublicId && u.Role == "patient");
            
            if (patient == null)
            {
                return BadRequest("Patient not found.");
            }

            // For patient role, they can only create appointments for themselves
            if (userRole == "patient" && patient.Id != userId)
            {
                return Forbid("Patients can only create appointments for themselves.");
            }

            // Validate doctor
            var doctor = await _context.Users
                .FirstOrDefaultAsync(u => u.PublicId.ToString() == request.DoctorPublicId && u.Role == "doctor" && u.Status == "active" && u.DeletedAt == null);
            
            if (doctor == null)
            {
                return BadRequest("Doctor not found or not available.");
            }

            // Check for time slot conflicts
            var hasConflict = await _context.Appointments
                .AnyAsync(a => a.DoctorId == doctor.Id &&
                              a.Status != "cancelled" &&
                              ((request.AppointmentStart >= a.AppointmentStart && request.AppointmentStart < a.AppointmentEnd) ||
                               (request.AppointmentEnd > a.AppointmentStart && request.AppointmentEnd <= a.AppointmentEnd) ||
                               (request.AppointmentStart <= a.AppointmentStart && request.AppointmentEnd >= a.AppointmentEnd)));

            if (hasConflict)
            {
                return BadRequest("The selected time slot is not available.");
            }

            var appointment = new Appointment
            {
                PatientId = patient.Id,
                DoctorId = doctor.Id,
                AppointmentStart = new DateTimeOffset(request.AppointmentStart),
                AppointmentEnd = new DateTimeOffset(request.AppointmentEnd),
                Status = "scheduled",
                Reason = request.Notes ?? "",
                Source = request.IsEmergency == true ? "emergency" : "online",
                CreatedBy = userId,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            // Return the created appointment with related data
            var createdAppointment = await _context.Appointments
                .Include(a => a.Patient)
                .Include(a => a.WalkInPatient)  // NEW
                .Include(a => a.Doctor)
                .ThenInclude(d => d.StaffProfile)
                .Where(a => a.Id == appointment.Id)
                .Select(a => new
                {
                    Id = a.Id,
                    AppointmentStart = a.AppointmentStart,
                    AppointmentEnd = a.AppointmentEnd,
                    Status = a.Status,
                    Notes = a.Reason,
                    IsEmergency = a.Source == "emergency",
                    Patient = a.Patient != null ? new
                    {
                        Id = a.Patient.Id,
                        PublicId = a.Patient.PublicId,
                        FullName = a.Patient.FullName,
                        IsWalkIn = false
                    } : a.WalkInPatient != null ? new
                    {
                        Id = a.WalkInPatient.Id,
                        PublicId = a.WalkInPatient.PublicId,
                        FullName = a.WalkInPatient.FullName,
                        IsWalkIn = true
                    } : null,
                    Doctor = new
                    {
                        Id = a.Doctor.Id,
                        PublicId = a.Doctor.PublicId,
                        FullName = a.Doctor.FullName,
                        Title = a.Doctor.StaffProfile!.Title
                    },
                    CreatedDate = a.CreatedAt
                })
                .FirstOrDefaultAsync();

            return CreatedAtAction(nameof(GetAppointment), new { id = appointment.Id }, createdAppointment);
        }

        // PUT: api/appointments/{id}/status
        [HttpPut("{id}/status")]
        [Authorize]
        public async Task<IActionResult> UpdateAppointmentStatus(long id, [FromBody] UpdateAppointmentStatusRequest request)
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var appointment = await _context.Appointments.FindAsync(id);
            
            if (appointment == null)
            {
                return NotFound();
            }

            // Check authorization
            if (userRole == "patient" && appointment.PatientId != userId)
            {
                return Forbid();
            }
            else if (userRole == "doctor" && appointment.DoctorId != userId)
            {
                return Forbid();
            }

            appointment.Status = request.Status;
            appointment.Reason = request.Notes ?? appointment.Reason;
            appointment.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/appointments/{id}/status/pattern
        // Pattern endpoint: State + Observer + AbstractFactory + Singleton-backed ui payload
        [HttpPut("{id}/status/pattern")]
        [Authorize]
        public async Task<IActionResult> UpdateAppointmentStatusWithPatterns(long id, [FromBody] PatternStatusUpdateRequest request)
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var appointment = await _context.Appointments
                .Include(a => a.Patient)
                .Include(a => a.WalkInPatient)
                .Include(a => a.Doctor)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (appointment == null)
            {
                return NotFound(new { success = false, message = "Appointment not found." });
            }

            // Keep existing authorization behavior
            if (userRole == "patient" && appointment.PatientId != userId)
            {
                return Forbid();
            }
            else if (userRole == "doctor" && appointment.DoctorId != userId)
            {
                return Forbid();
            }

            var previousStatus = appointment.Status;
            var currentState = (appointment.Status ?? string.Empty).Trim().ToLowerInvariant();
            var targetState = (request.TargetStatus ?? string.Empty).Trim().ToLowerInvariant();

            string nextStatus;
            if (TryMapStateAction(currentState, targetState, out var action))
            {
                var transition = _appointmentStateMachineService.Transit(currentState, action);
                nextStatus = transition.CurrentState;
            }
            else
            {
                // Keep compatibility for non-state-machine statuses such as confirmed/rescheduled/no_show
                nextStatus = targetState;
            }

            appointment.Status = nextStatus;
            appointment.Reason = request.Notes ?? appointment.Reason;
            appointment.UpdatedAt = DateTimeOffset.UtcNow;
            await _context.SaveChangesAsync();

            // Observer: notify status change events
            await _appointmentStatusCoordinator.ChangeStatusAsync(
                appointmentCode: $"APT-{appointment.Id}",
                currentStatus: previousStatus,
                newStatus: appointment.Status);

            // Abstract Factory: dispatch reminders when appointment becomes confirmed/rescheduled
            DeliveryReceipt? doctorReceipt = null;
            DeliveryReceipt? patientReceipt = null;

            if (appointment.Status is "confirmed" or "rescheduled")
            {
                var snapshot = new AppointmentSnapshot(
                    AppointmentCode: $"APT-{appointment.Id}",
                    DoctorName: appointment.Doctor.FullName,
                    PatientName: appointment.Patient?.FullName ?? appointment.WalkInPatient?.FullName ?? "Walk-in patient",
                    StartAt: appointment.AppointmentStart.UtcDateTime,
                    Room: _systemConfigurationProvider.GetValue("Clinic:DefaultRoom", "General"));

                doctorReceipt = await _appointmentCommunicationService.SendReminderAsync("doctor", snapshot);
                patientReceipt = await _appointmentCommunicationService.SendReminderAsync("patient", snapshot);
            }

            return Ok(new
            {
                success = true,
                message = "Appointment status updated with pattern workflow.",
                processingState = new
                {
                    phase = "ready",
                    isLoading = false,
                    skeletonHint = "appointment-status-card"
                },
                data = new
                {
                    appointmentId = appointment.Id,
                    previousStatus,
                    currentStatus = appointment.Status,
                    reminders = new { doctor = doctorReceipt, patient = patientReceipt }
                }
            });
        }

        // DELETE: api/appointments/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> CancelAppointment(long id)
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var appointment = await _context.Appointments.FindAsync(id);
            
            if (appointment == null)
            {
                return NotFound();
            }

            // Check authorization
            if (userRole == "patient" && appointment.PatientId != userId)
            {
                return Forbid();
            }
            else if (userRole == "doctor" && appointment.DoctorId != userId)
            {
                return Forbid();
            }

            appointment.Status = "cancelled";
            appointment.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : 0;
        }

        /// <summary>
        /// Get appointment history for a user
        /// </summary>
        [HttpGet("history/{userId}")]
        [Authorize]
        public IActionResult GetAppointmentHistory(int userId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var currentUserRole = GetCurrentUserRole();
                
                // Check authorization - only allow users to see their own history or staff to see any
                if (currentUserRole == "patient" && currentUserId != userId)
                {
                    return Unauthorized();
                }

                // For demo purposes, return mock appointment history
                var appointments = GetMockAppointmentHistory(userId);
                
                return Ok(new
                {
                    success = true,
                    data = appointments
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetAppointmentHistory: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Không thể tải lịch sử khám bệnh"
                });
            }
        }

        private List<object> GetMockAppointmentHistory(int userId)
        {
            return new List<object>
            {
                new
                {
                    id = 1,
                    date = "2024-12-15",
                    time = "14:30",
                    doctor = new
                    {
                        name = "BS. Nguyễn Thị Lan",
                        specialization = "Tim mạch",
                        avatar = (string?)null
                    },
                    status = "completed",
                    diagnosis = "Khám tổng quát",
                    symptoms = "Đau ngực, khó thở",
                    prescription = "Thuốc hạ huyết áp, nghỉ ngơi",
                    notes = "Bệnh nhân cần theo dõi huyết áp định kỳ",
                    cost = 500000
                },
                new
                {
                    id = 2,
                    date = "2024-11-20",
                    time = "10:00",
                    doctor = new
                    {
                        name = "BS. Trần Văn Minh",
                        specialization = "Nội tổng quát",
                        avatar = (string?)null
                    },
                    status = "completed",
                    diagnosis = "Viêm dạ dày",
                    symptoms = "Đau bụng, buồn nôn",
                    prescription = "Thuốc kháng acid, chế độ ăn nhẹ",
                    notes = "Tái khám sau 2 tuần",
                    cost = 300000
                },
                new
                {
                    id = 3,
                    date = "2024-12-25",
                    time = "09:00",
                    doctor = new
                    {
                        name = "BS. Lê Thị Hương",
                        specialization = "Da liễu",
                        avatar = (string?)null
                    },
                    status = "scheduled",
                    diagnosis = (string?)null,
                    symptoms = "Khám da định kỳ",
                    prescription = (string?)null,
                    notes = "Lịch khám sắp tới",
                    cost = 400000
                }
            };
        }

        // PUT: api/appointments/{id}/doctor-reschedule (Doctor reschedules appointment)
        [HttpPut("{id}/doctor-reschedule")]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> DoctorRescheduleAppointment(long id, [FromBody] RescheduleAppointmentRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var appointment = await _context.Appointments
                    .Include(a => a.Patient)
                    .Include(a => a.Doctor)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (appointment == null)
                {
                    return NotFound(new { message = "Không tìm thấy lịch hẹn" });
                }

                // Verify doctor owns this appointment
                if (appointment.DoctorId != userId)
                {
                    return Forbid();
                }

                // Validate appointment can be rescheduled
                if (appointment.Status == "completed" || appointment.Status == "cancelled")
                {
                    return BadRequest(new { message = "Không thể thay đổi lịch hẹn đã hoàn thành hoặc đã hủy" });
                }

                // Validate new time
                if (request.NewAppointmentStart >= request.NewAppointmentEnd)
                {
                    return BadRequest(new { message = "Thời gian kết thúc phải sau thời gian bắt đầu" });
                }

                if (request.NewAppointmentStart < DateTime.UtcNow)
                {
                    return BadRequest(new { message = "Không thể đặt lịch trong quá khứ" });
                }

                // Update appointment
                var oldStart = appointment.AppointmentStart;
                var oldEnd = appointment.AppointmentEnd;
                appointment.AppointmentStart = request.NewAppointmentStart;
                appointment.AppointmentEnd = request.NewAppointmentEnd;
                appointment.Status = "rescheduled";
                appointment.UpdatedAt = DateTimeOffset.UtcNow;

                // Create history record
                var history = new AppointmentHistory
                {
                    AppointmentId = id,
                    ChangedBy = userId,
                    OldStatus = appointment.Status,
                    NewStatus = "rescheduled",
                    OldStart = oldStart,
                    NewStart = request.NewAppointmentStart,
                    OldEnd = oldEnd,
                    NewEnd = request.NewAppointmentEnd,
                    Comment = request.Reason ?? "Bác sĩ thay đổi lịch hẹn",
                    ChangedAt = DateTimeOffset.UtcNow
                };
                _context.AppointmentHistory.Add(history);

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Đã thay đổi lịch hẹn thành công",
                    appointment = new
                    {
                        id = appointment.Id,
                        oldStart = oldStart,
                        newStart = request.NewAppointmentStart,
                        oldEnd = oldEnd,
                        newEnd = request.NewAppointmentEnd,
                        status = appointment.Status
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi thay đổi lịch hẹn", error = ex.Message });
            }
        }

        // PUT: api/appointments/{id}/reschedule (Reception/Staff reschedules appointment)
        [HttpPut("{id}/reschedule")]
        [Authorize(Roles = "reception,admin")]
        public async Task<IActionResult> RescheduleAppointment(long id, [FromBody] RescheduleAppointmentRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var appointment = await _context.Appointments
                    .Include(a => a.Patient)
                    .Include(a => a.WalkInPatient)
                    .Include(a => a.Doctor)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (appointment == null)
                {
                    return NotFound(new { message = "Không tìm thấy lịch hẹn" });
                }

                // Validate appointment can be rescheduled
                if (appointment.Status == "completed" || appointment.Status == "cancelled")
                {
                    return BadRequest(new { message = "Không thể thay đổi lịch hẹn đã hoàn thành hoặc đã hủy" });
                }

                // Validate new time
                if (request.NewAppointmentStart >= request.NewAppointmentEnd)
                {
                    return BadRequest(new { message = "Thời gian kết thúc phải sau thời gian bắt đầu" });
                }

                if (request.NewAppointmentStart < DateTime.UtcNow)
                {
                    return BadRequest(new { message = "Không thể đặt lịch trong quá khứ" });
                }

                // Check for doctor availability at new time
                var hasConflict = await _context.Appointments
                    .AnyAsync(a => 
                        a.Id != id &&
                        a.DoctorId == appointment.DoctorId &&
                        a.Status != "cancelled" &&
                        a.AppointmentStart < request.NewAppointmentEnd &&
                        request.NewAppointmentStart < a.AppointmentEnd
                    );

                if (hasConflict)
                {
                    return BadRequest(new { message = "Bác sĩ đã có lịch hẹn trùng vào thời gian này" });
                }

                // Update appointment
                var oldStart = appointment.AppointmentStart;
                var oldEnd = appointment.AppointmentEnd;
                var oldStatus = appointment.Status;
                
                appointment.AppointmentStart = request.NewAppointmentStart;
                appointment.AppointmentEnd = request.NewAppointmentEnd;
                appointment.Status = "confirmed"; // Reception confirms the new schedule
                appointment.UpdatedAt = DateTimeOffset.UtcNow;

                // Create history record
                var history = new AppointmentHistory
                {
                    AppointmentId = id,
                    ChangedBy = userId,
                    OldStatus = oldStatus,
                    NewStatus = appointment.Status,
                    OldStart = oldStart,
                    NewStart = request.NewAppointmentStart,
                    OldEnd = oldEnd,
                    NewEnd = request.NewAppointmentEnd,
                    Comment = request.Reason ?? "Tiếp tân thay đổi lịch hẹn",
                    ChangedAt = DateTimeOffset.UtcNow
                };
                _context.AppointmentHistory.Add(history);

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Đã thay đổi lịch hẹn thành công",
                    appointment = new
                    {
                        id = appointment.Id,
                        oldStart = oldStart,
                        newStart = request.NewAppointmentStart,
                        oldEnd = oldEnd,
                        newEnd = request.NewAppointmentEnd,
                        status = appointment.Status
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi thay đổi lịch hẹn", error = ex.Message });
            }
        }

        // DELETE: api/appointments/{id}/doctor-cancel (Doctor cancels appointment)
        [HttpDelete("{id}/doctor-cancel")]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> DoctorCancelAppointment(long id, [FromBody] DoctorCancelRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var appointment = await _context.Appointments
                    .Include(a => a.Patient)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (appointment == null)
                {
                    return NotFound(new { message = "Không tìm thấy lịch hẹn" });
                }

                // Verify doctor owns this appointment
                if (appointment.DoctorId != userId)
                {
                    return Forbid();
                }

                // Validate appointment can be cancelled
                if (appointment.Status == "completed")
                {
                    return BadRequest(new { message = "Không thể hủy lịch hẹn đã hoàn thành" });
                }

                if (appointment.Status == "cancelled")
                {
                    return BadRequest(new { message = "Lịch hẹn đã được hủy trước đó" });
                }

                if (string.IsNullOrWhiteSpace(request.Reason))
                {
                    return BadRequest(new { message = "Vui lòng cung cấp lý do hủy lịch" });
                }

                // Update appointment status
                var oldStatus = appointment.Status;
                appointment.Status = "cancelled";
                appointment.CancellationReason = $"Bác sĩ hủy: {request.Reason}";
                appointment.UpdatedAt = DateTimeOffset.UtcNow;

                // Create history record
                var history = new AppointmentHistory
                {
                    AppointmentId = id,
                    ChangedBy = userId,
                    OldStatus = oldStatus,
                    NewStatus = "cancelled",
                    Comment = $"Bác sĩ hủy lịch: {request.Reason}",
                    ChangedAt = DateTimeOffset.UtcNow
                };
                _context.AppointmentHistory.Add(history);

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Đã hủy lịch hẹn thành công",
                    appointment = new
                    {
                        id = appointment.Id,
                        status = appointment.Status,
                        cancellationReason = appointment.CancellationReason
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi hủy lịch hẹn", error = ex.Message });
            }
        }

        private string GetCurrentUserRole()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value ?? "";
        }

        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        // POST: api/appointments/with-new-patient (Create walk-in patient and appointment)
        [HttpPost("with-new-patient")]
        [Authorize(Roles = "reception,admin")]
        public async Task<ActionResult<object>> CreateAppointmentWithNewPatient([FromBody] CreateWalkInAppointmentRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();

                // Note: We now ALLOW duplicate phone numbers for walk-in patients
                // Multiple family members can share one phone number

                // Validate doctor exists if provided
                User? doctor = null;
                if (!string.IsNullOrEmpty(request.DoctorPublicId))
                {
                    doctor = await _context.Users
                        .Where(u => u.Role == "doctor" && u.PublicId.ToString() == request.DoctorPublicId)
                        .FirstOrDefaultAsync();

                    if (doctor == null)
                    {
                        return NotFound(new { message = "Không tìm thấy bác sĩ với mã này" });
                    }
                }

                // Validate appointment time
                if (request.AppointmentStart >= request.AppointmentEnd)
                {
                    return BadRequest(new { message = "Thời gian kết thúc phải sau thời gian bắt đầu" });
                }

                // If no doctor specified, find first available doctor
                if (doctor == null)
                {
                    doctor = await _context.Users
                        .Where(u => u.Role == "doctor" && u.Status == "active")
                        .FirstOrDefaultAsync();
                    
                    if (doctor == null)
                    {
                        return BadRequest(new { message = "Không có bác sĩ nào trong hệ thống. Vui lòng thêm bác sĩ trước." });
                    }
                }

                // Create new walk-in patient (NOT a registered user)
                var walkInPatient = new WalkInPatient
                {
                    PublicId = Guid.NewGuid(),
                    FullName = request.PatientName,
                    Phone = request.PatientPhone, // ALLOWED to be duplicate!
                    Email = !string.IsNullOrWhiteSpace(request.PatientEmail) ? request.PatientEmail : null,
                    DateOfBirth = request.PatientDateOfBirth.HasValue ? DateOnly.FromDateTime(request.PatientDateOfBirth.Value) : null,
                    Gender = request.PatientGender switch
                    {
                        "male" => "M",
                        "female" => "F",
                        _ => "O"
                    },
                    Address = request.PatientAddress,
                    InsuranceNumber = request.PatientInsuranceNumber,
                    MedicalRecordNumber = $"WI-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper()}",
                    CreatedBy = userId,
                    CreatedAt = DateTimeOffset.UtcNow,
                    Notes = request.Notes
                };

                _context.WalkInPatients.Add(walkInPatient);
                await _context.SaveChangesAsync(); // Save walk-in patient
                
                // Get the ID back (needed because appointments table has triggers)
                // When table has triggers, EF doesn't use OUTPUT clause so ID might not be populated
                var savedWalkInPatient = await _context.WalkInPatients
                    .Where(w => w.PublicId == walkInPatient.PublicId)
                    .FirstOrDefaultAsync();
                
                if (savedWalkInPatient == null)
                {
                    return StatusCode(500, new { message = "Không thể tạo bệnh nhân walk-in" });
                }
                
                walkInPatient = savedWalkInPatient;

                // Create appointment linked to walk-in patient
                var appointmentStart = new DateTimeOffset(request.AppointmentStart, TimeSpan.Zero);
                var appointmentEnd = new DateTimeOffset(request.AppointmentEnd, TimeSpan.Zero);
                
                var appointment = new Appointment
                {
                    WalkInPatientId = walkInPatient.Id, // Link to walk-in patient, NOT patient_id
                    PatientId = null, // NULL for walk-in patients
                    DoctorId = doctor.Id,
                    CreatedBy = userId,
                    AppointmentStart = appointmentStart,
                    AppointmentEnd = appointmentEnd,
                    Status = "scheduled",
                    Source = "walk_in",
                    Reason = request.Notes,
                    CreatedAt = DateTimeOffset.UtcNow
                };

                _context.Appointments.Add(appointment);
                await _context.SaveChangesAsync();
                
                // Query back to get generated ID (trigger prevents OUTPUT clause)
                var savedAppointment = await _context.Appointments
                    .Where(a => a.WalkInPatientId == walkInPatient.Id 
                             && a.DoctorId == doctor.Id
                             && a.AppointmentStart == appointmentStart
                             && a.AppointmentEnd == appointmentEnd)
                    .OrderByDescending(a => a.Id)
                    .FirstOrDefaultAsync();
                
                if (savedAppointment == null)
                {
                    return StatusCode(500, new { message = "Không thể tạo lịch hẹn" });
                }
                
                appointment = savedAppointment;

                return Ok(new
                {
                    message = "Đã tạo hồ sơ bệnh nhân walk-in và đặt lịch hẹn thành công",
                    walkInPatient = new
                    {
                        id = walkInPatient.Id,
                        publicId = walkInPatient.PublicId,
                        fullName = walkInPatient.FullName,
                        phone = walkInPatient.Phone,
                        email = walkInPatient.Email,
                        medicalRecordNumber = walkInPatient.MedicalRecordNumber
                    },
                    appointment = new
                    {
                        id = appointment.Id,
                        appointmentStart = appointment.AppointmentStart,
                        appointmentEnd = appointment.AppointmentEnd,
                        status = appointment.Status,
                        doctorName = $"{doctor.FirstName} {doctor.LastName}"
                    }
                });
            }
            catch (Exception ex)
            {
                var innerMessage = ex.InnerException?.Message ?? "";
                var fullError = $"{ex.Message} | Inner: {innerMessage}";
                return StatusCode(500, new { message = "Lỗi khi tạo lịch hẹn cho bệnh nhân walk-in", error = fullError, stackTrace = ex.StackTrace });
            }
        }

        private static bool TryMapStateAction(string currentState, string targetState, out string action)
        {
            action = string.Empty;

            if (currentState == "scheduled" && targetState == "checked-in")
            {
                action = "check-in";
                return true;
            }

            if ((currentState == "scheduled" || currentState == "checked-in") && targetState == "in-progress")
            {
                action = "start-visit";
                return true;
            }

            if (currentState == "in-progress" && targetState == "completed")
            {
                action = "complete";
                return true;
            }

            if (targetState == "cancelled")
            {
                action = "cancel";
                return true;
            }

            return false;
        }
    }

    // DTOs for request bodies
    public class CreateAppointmentRequest
    {
        public string PatientPublicId { get; set; } = "";
        public string DoctorPublicId { get; set; } = "";
        public DateTime AppointmentStart { get; set; }
        public DateTime AppointmentEnd { get; set; }
        public string? Notes { get; set; }
        public bool? IsEmergency { get; set; }
    }

    public class CreateWalkInAppointmentRequest
    {
        // Patient info
        public string PatientName { get; set; } = "";
        public string PatientPhone { get; set; } = "";
        public string? PatientEmail { get; set; }
        public DateTime? PatientDateOfBirth { get; set; }
        public string PatientGender { get; set; } = ""; // male/female/other
        public string PatientAddress { get; set; } = "";
        public string? PatientInsuranceNumber { get; set; }

        // Appointment info
        public string? DoctorPublicId { get; set; }
        public DateTime AppointmentStart { get; set; }
        public DateTime AppointmentEnd { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateAppointmentStatusRequest
    {
        public string Status { get; set; } = "";
        public string? Notes { get; set; }
    }

    public class PatternStatusUpdateRequest
    {
        public string TargetStatus { get; set; } = "";
        public string? Notes { get; set; }
    }

    public class RescheduleAppointmentRequest
    {
        public DateTime NewAppointmentStart { get; set; }
        public DateTime NewAppointmentEnd { get; set; }
        public string Reason { get; set; } = "";
    }

    public class DoctorCancelRequest
    {
        public string Reason { get; set; } = "";
    }
}