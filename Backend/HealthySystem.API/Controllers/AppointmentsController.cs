using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using HealthySystem.API.Data;
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

        public AppointmentsController(HealthySystemDbContext context)
        {
            _context = context;
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
                    Notes = a.Notes,
                    IsEmergency = a.IsEmergency,
                    Patient = new
                    {
                        Id = a.Patient.Id,
                        PublicId = a.Patient.PublicId,
                        FullName = a.Patient.FullName,
                        Phone = a.Patient.Phone,
                        Email = a.Patient.Email
                    },
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
                    CreatedDate = a.CreatedDate,
                    UpdatedDate = a.UpdatedDate
                })
                .ToListAsync();

            return Ok(appointments);
        }

        // GET: api/appointments/{id}
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<object>> GetAppointment(int id)
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var appointment = await _context.Appointments
                .Include(a => a.Patient)
                .ThenInclude(p => p.PatientProfile)
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
                Notes = appointment.Notes,
                IsEmergency = appointment.IsEmergency,
                Patient = new
                {
                    Id = appointment.Patient.Id,
                    PublicId = appointment.Patient.PublicId,
                    FullName = appointment.Patient.FullName,
                    Phone = appointment.Patient.Phone,
                    Email = appointment.Patient.Email,
                    Gender = appointment.Patient.Gender,
                    DateOfBirth = appointment.Patient.DateOfBirth,
                    MedicalRecordNumber = appointment.Patient.PatientProfile?.MedicalRecordNumber
                },
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
                CreatedDate = appointment.CreatedDate,
                UpdatedDate = appointment.UpdatedDate
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
                .FirstOrDefaultAsync(u => u.PublicId.ToString() == request.DoctorPublicId && u.Role == "doctor" && u.IsActive);
            
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
                Reason = request.Notes,
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
                .Include(a => a.Doctor)
                .ThenInclude(d => d.StaffProfile)
                .Where(a => a.Id == appointment.Id)
                .Select(a => new
                {
                    Id = a.Id,
                    AppointmentStart = a.AppointmentStart,
                    AppointmentEnd = a.AppointmentEnd,
                    Status = a.Status,
                    Notes = a.Notes,
                    IsEmergency = a.IsEmergency,
                    Patient = new
                    {
                        Id = a.Patient.Id,
                        PublicId = a.Patient.PublicId,
                        FullName = a.Patient.FullName
                    },
                    Doctor = new
                    {
                        Id = a.Doctor.Id,
                        PublicId = a.Doctor.PublicId,
                        FullName = a.Doctor.FullName,
                        Title = a.Doctor.StaffProfile!.Title
                    },
                    CreatedDate = a.CreatedDate
                })
                .FirstOrDefaultAsync();

            return CreatedAtAction(nameof(GetAppointment), new { id = appointment.Id }, createdAppointment);
        }

        // PUT: api/appointments/{id}/status
        [HttpPut("{id}/status")]
        [Authorize]
        public async Task<IActionResult> UpdateAppointmentStatus(int id, [FromBody] UpdateAppointmentStatusRequest request)
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

        // DELETE: api/appointments/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> CancelAppointment(int id)
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

                // Validate doctor exists
                var doctor = await _context.Users
                    .Where(u => u.Role == "doctor" && u.PublicId.ToString() == request.DoctorPublicId)
                    .FirstOrDefaultAsync();

                if (doctor == null && !string.IsNullOrEmpty(request.DoctorPublicId))
                {
                    return NotFound(new { message = "Không tìm thấy bác sĩ với mã này" });
                }

                // Validate appointment time
                if (request.AppointmentStart >= request.AppointmentEnd)
                {
                    return BadRequest(new { message = "Thời gian kết thúc phải sau thời gian bắt đầu" });
                }

                // Create new patient user (walk-in patient)
                var newPatient = new User
                {
                    PublicId = Guid.NewGuid(),
                    Email = $"{request.PatientPhone}@walkin.local", // Use phone as unique identifier
                    Phone = request.PatientPhone,
                    PasswordHash = HashPassword(Guid.NewGuid().ToString()), // Random password
                    Role = "patient",
                    Status = "active",
                    FirstName = request.PatientName.Split(' ').First(),
                    LastName = string.Join(" ", request.PatientName.Split(' ').Skip(1)),
                    DateOfBirth = request.PatientDateOfBirth.HasValue ? DateOnly.FromDateTime(request.PatientDateOfBirth.Value) : null,
                    Gender = request.PatientGender switch
                    {
                        "male" => "M",
                        "female" => "F",
                        _ => "O"
                    },
                    CreatedAt = DateTimeOffset.UtcNow
                };

                _context.Users.Add(newPatient);
                await _context.SaveChangesAsync(); // Save to get user ID

                // Create patient profile
                var patientProfile = new PatientProfile
                {
                    UserId = newPatient.Id,
                    Address = request.PatientAddress,
                    InsuranceNumber = request.PatientInsuranceNumber,
                    MedicalRecordNumber = $"MR-{DateTime.Now:yyyyMMdd}-{newPatient.Id:D6}",
                    CreatedAt = DateTimeOffset.UtcNow
                };

                _context.PatientProfiles.Add(patientProfile);

                // Create appointment
                var appointment = new Appointment
                {
                    PatientId = newPatient.Id,
                    DoctorId = doctor?.Id ?? 0, // 0 if no specific doctor
                    CreatedBy = userId,
                    AppointmentStart = new DateTimeOffset(request.AppointmentStart, TimeSpan.Zero),
                    AppointmentEnd = new DateTimeOffset(request.AppointmentEnd, TimeSpan.Zero),
                    Status = "scheduled",
                    Source = "walk_in",
                    Reason = request.Notes,
                    CreatedAt = DateTimeOffset.UtcNow
                };

                _context.Appointments.Add(appointment);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Đã tạo hồ sơ bệnh nhân và đặt lịch hẹn thành công",
                    patient = new
                    {
                        id = newPatient.Id,
                        publicId = newPatient.PublicId,
                        fullName = newPatient.FullName,
                        phone = newPatient.Phone,
                        email = newPatient.Email,
                        medicalRecordNumber = patientProfile.MedicalRecordNumber
                    },
                    appointment = new
                    {
                        id = appointment.Id,
                        appointmentStart = appointment.AppointmentStart,
                        appointmentEnd = appointment.AppointmentEnd,
                        status = appointment.Status
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi tạo lịch hẹn cho bệnh nhân mới", error = ex.Message });
            }
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