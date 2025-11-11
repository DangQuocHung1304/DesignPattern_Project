using HealthySystem.WebAPI.Data;
using HealthySystem.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HealthySystem.WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "admin")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AdminController> _logger;

        public AdminController(ApplicationDbContext context, ILogger<AdminController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ============================================================
        // Sprint 9 - US-02: In ra lịch sử thông tin của bệnh nhân
        // ============================================================

        /// <summary>
        /// Lấy lịch sử khám bệnh đầy đủ của bệnh nhân để in
        /// </summary>
        [HttpGet("patient/{patientId}/medical-history")]
        public async Task<IActionResult> GetPatientMedicalHistoryForPrint(int patientId)
        {
            try
            {
                var patient = await _context.Patients
                    .Include(p => p.Encounters)
                        .ThenInclude(e => e.Doctor)
                    .Include(p => p.Encounters)
                        .ThenInclude(e => e.LabRequests)
                            .ThenInclude(lr => lr.LabResults)
                    .Include(p => p.Encounters)
                        .ThenInclude(e => e.ImagingRequests)
                            .ThenInclude(ir => ir.ImagingResults)
                    .Include(p => p.Encounters)
                        .ThenInclude(e => e.Prescriptions)
                            .ThenInclude(p => p.PrescriptionItems)
                    .Include(p => p.Encounters)
                        .ThenInclude(e => e.Treatments)
                            .ThenInclude(t => t.TreatmentItems)
                    .FirstOrDefaultAsync(p => p.Id == patientId);

                if (patient == null)
                {
                    return NotFound(new { success = false, error = "Không tìm thấy bệnh nhân" });
                }

                var history = new
                {
                    Patient = new
                    {
                        Id = patient.Id,
                        FullName = $"{patient.FirstName} {patient.LastName}",
                        DateOfBirth = patient.DateOfBirth,
                        Age = CalculateAge(patient.DateOfBirth),
                        Gender = patient.Gender,
                        Phone = patient.Phone,
                        Email = patient.Email,
                        Address = patient.Address,
                        BloodType = patient.BloodType,
                        Allergies = patient.Allergies,
                        CreatedAt = patient.CreatedAt
                    },

                    Statistics = new
                    {
                        TotalEncounters = patient.Encounters?.Count ?? 0,
                        TotalLabTests = patient.Encounters?
                            .SelectMany(e => e.LabRequests ?? new List<LabRequest>())
                            .SelectMany(lr => lr.LabResults ?? new List<LabResult>())
                            .Count() ?? 0,
                        TotalImagingTests = patient.Encounters?
                            .SelectMany(e => e.ImagingRequests ?? new List<ImagingRequest>())
                            .SelectMany(ir => ir.ImagingResults ?? new List<ImagingResult>())
                            .Count() ?? 0,
                        TotalPrescriptions = patient.Encounters?
                            .SelectMany(e => e.Prescriptions ?? new List<Prescription>())
                            .Count() ?? 0,
                        FirstVisit = patient.Encounters?.OrderBy(e => e.EncounterDate).FirstOrDefault()?.EncounterDate,
                        LastVisit = patient.Encounters?.OrderByDescending(e => e.EncounterDate).FirstOrDefault()?.EncounterDate
                    },

                    Encounters = patient.Encounters?
                        .OrderByDescending(e => e.EncounterDate)
                        .Select(e => new
                        {
                            Id = e.Id,
                            Date = e.EncounterDate,
                            DoctorName = $"{e.Doctor.FirstName} {e.Doctor.LastName}",
                            ChiefComplaint = e.ChiefComplaint,
                            Diagnosis = e.Diagnosis,
                            Status = e.Status,
                            VitalSigns = new
                            {
                                BloodPressure = e.BloodPressure,
                                HeartRate = e.HeartRate,
                                Temperature = e.Temperature,
                                Weight = e.Weight,
                                Height = e.Height
                            },
                            LabTests = e.LabRequests?
                                .SelectMany(lr => lr.LabResults ?? new List<LabResult>())
                                .Select(lr => new
                                {
                                    TestCode = lr.TestCode,
                                    ResultValue = lr.ResultValue,
                                    Units = lr.Units,
                                    NormalRange = lr.NormalRange,
                                    ResultText = lr.ResultText,
                                    PerformedAt = lr.PerformedAt
                                }).ToList(),
                            ImagingTests = e.ImagingRequests?
                                .SelectMany(ir => ir.ImagingResults ?? new List<ImagingResult>())
                                .Select(ir => new
                                {
                                    TestCode = ir.TestCode,
                                    ResultText = ir.ResultText,
                                    Findings = ir.Findings,
                                    Impressions = ir.Impressions,
                                    PerformedAt = ir.PerformedAt
                                }).ToList(),
                            Medications = e.Prescriptions?
                                .SelectMany(p => p.PrescriptionItems ?? new List<PrescriptionItem>())
                                .Select(pi => new
                                {
                                    MedicationName = pi.MedicationName,
                                    Dosage = pi.Dosage,
                                    Frequency = pi.Frequency,
                                    Duration = pi.Duration,
                                    Quantity = pi.Quantity,
                                    Instructions = pi.Instructions
                                }).ToList(),
                            Treatments = e.Treatments?
                                .SelectMany(t => t.TreatmentItems ?? new List<TreatmentItem>())
                                .Select(ti => new
                                {
                                    ProcedureName = ti.ProcedureName,
                                    Quantity = ti.Quantity,
                                    Notes = ti.Notes
                                }).ToList()
                        }).ToList(),

                    GeneratedAt = DateTime.Now,
                    GeneratedBy = User.Identity?.Name ?? "System"
                };

                return Ok(new { success = true, data = history });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting medical history for patient {PatientId}", patientId);
                return StatusCode(500, new { success = false, error = "Lỗi khi lấy lịch sử khám bệnh" });
            }
        }

        /// <summary>
        /// Tìm kiếm bệnh nhân để in lịch sử
        /// </summary>
        [HttpGet("patients/search")]
        public async Task<IActionResult> SearchPatients([FromQuery] string? query)
        {
            try {
                var patientsQuery = _context.Patients.AsQueryable();

                if (!string.IsNullOrEmpty(query))
                {
                    patientsQuery = patientsQuery.Where(p =>
                        (p.FirstName + " " + p.LastName).Contains(query) ||
                        p.Phone.Contains(query) ||
                        p.Email.Contains(query));
                }

                var patients = await patientsQuery
                    .OrderByDescending(p => p.CreatedAt)
                    .Take(50)
                    .Select(p => new
                    {
                        Id = p.Id,
                        FullName = p.FirstName + " " + p.LastName,
                        DateOfBirth = p.DateOfBirth,
                        Age = CalculateAge(p.DateOfBirth),
                        Gender = p.Gender,
                        Phone = p.Phone,
                        Email = p.Email
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = patients });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching patients");
                return StatusCode(500, new { success = false, error = "Lỗi khi tìm kiếm bệnh nhân" });
            }
        }

        // ============================================================
        // Sprint 10 - US-01: Nhắc lịch hẹn
        // ============================================================

        /// <summary>
        /// Lấy danh sách lịch hẹn cần nhắc nhở
        /// </summary>
        [HttpGet("appointment-reminders")]
        public async Task<IActionResult> GetAppointmentReminders(
            [FromQuery] DateTime? date,
            [FromQuery] int? hoursAhead)
        {
            try
            {
                var targetDate = date ?? DateTime.Today;
                var hours = hoursAhead ?? 24; // Default 24 hours

                var now = DateTime.Now;
                var futureTime = now.AddHours(hours);

                var appointments = await _context.Appointments
                    .Include(a => a.Patient)
                    .Include(a => a.Doctor)
                    .Where(a =>
                        a.AppointmentDate >= now &&
                        a.AppointmentDate <= futureTime &&
                        a.Status == "scheduled")
                    .OrderBy(a => a.AppointmentDate)
                    .Select(a => new
                    {
                        Id = a.Id,
                        AppointmentDate = a.AppointmentDate,
                        TimeSlot = a.TimeSlot,
                        PatientId = a.PatientId,
                        PatientName = a.Patient.FirstName + " " + a.Patient.LastName,
                        PatientPhone = a.Patient.Phone,
                        PatientEmail = a.Patient.Email,
                        DoctorName = a.Doctor.FirstName + " " + a.Doctor.LastName,
                        Reason = a.Reason,
                        Status = a.Status,
                        HoursUntil = CalculateHoursUntil(a.AppointmentDate),
                        ReminderSent = false, // TODO: Track reminder status in database
                        ReminderMessage = GenerateReminderMessage(
                            a.Patient.FirstName + " " + a.Patient.LastName,
                            a.Doctor.FirstName + " " + a.Doctor.LastName,
                            a.AppointmentDate,
                            a.TimeSlot
                        )
                    })
                    .ToListAsync();

                var summary = new
                {
                    TotalReminders = appointments.Count,
                    Within1Hour = appointments.Count(a => (double)a.GetType().GetProperty("HoursUntil")!.GetValue(a)! <= 1),
                    Within4Hours = appointments.Count(a => (double)a.GetType().GetProperty("HoursUntil")!.GetValue(a)! <= 4),
                    Within24Hours = appointments.Count,
                    SearchRange = new
                    {
                        From = now,
                        To = futureTime,
                        HoursAhead = hours
                    }
                };

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        Summary = summary,
                        Reminders = appointments
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting appointment reminders");
                return StatusCode(500, new { success = false, error = "Lỗi khi lấy danh sách nhắc lịch hẹn" });
            }
        }

        /// <summary>
        /// Gửi nhắc nhở lịch hẹn
        /// </summary>
        [HttpPost("appointment-reminders/send")]
        public async Task<IActionResult> SendAppointmentReminders([FromBody] SendRemindersRequest request)
        {
            try
            {
                if (request.AppointmentIds == null || !request.AppointmentIds.Any())
                {
                    return BadRequest(new { success = false, error = "Vui lòng chọn lịch hẹn cần nhắc" });
                }

                var appointments = await _context.Appointments
                    .Include(a => a.Patient)
                    .Include(a => a.Doctor)
                    .Where(a => request.AppointmentIds.Contains(a.Id))
                    .ToListAsync();

                var results = new List<object>();

                foreach (var appointment in appointments)
                {
                    // TODO: Implement actual SMS/Email sending
                    // For now, just simulate success
                    var patientName = $"{appointment.Patient.FirstName} {appointment.Patient.LastName}";
                    var doctorName = $"{appointment.Doctor.FirstName} {appointment.Doctor.LastName}";
                    var message = GenerateReminderMessage(
                        patientName,
                        doctorName,
                        appointment.AppointmentDate,
                        appointment.TimeSlot
                    );

                    results.Add(new
                    {
                        AppointmentId = appointment.Id,
                        PatientName = patientName,
                        Phone = appointment.Patient.Phone,
                        Email = appointment.Patient.Email,
                        Message = message,
                        SentAt = DateTime.Now,
                        Success = true
                    });

                    _logger.LogInformation(
                        "Reminder sent for appointment {AppointmentId} to patient {PatientName}",
                        appointment.Id,
                        patientName
                    );
                }

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        TotalSent = results.Count,
                        Results = results
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending appointment reminders");
                return StatusCode(500, new { success = false, error = "Lỗi khi gửi nhắc nhở" });
            }
        }

        /// <summary>
        /// Dashboard cho admin
        /// </summary>
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetAdminDashboard()
        {
            try
            {
                var today = DateTime.Today;
                var tomorrow = today.AddDays(1);
                var thisMonth = new DateTime(today.Year, today.Month, 1);

                // User statistics
                var totalUsers = await _context.Users.CountAsync(u => u.IsActive);
                var doctorCount = await _context.Users.CountAsync(u => u.IsActive && u.Role == "doctor");
                var patientCount = await _context.Patients.CountAsync();

                // Appointment statistics
                var todayAppointments = await _context.Appointments
                    .CountAsync(a => a.AppointmentDate.Date == today && a.Status == "scheduled");
                
                var tomorrowAppointments = await _context.Appointments
                    .CountAsync(a => a.AppointmentDate.Date == tomorrow && a.Status == "scheduled");

                var pendingReminders = await _context.Appointments
                    .CountAsync(a =>
                        a.AppointmentDate >= DateTime.Now &&
                        a.AppointmentDate <= DateTime.Now.AddHours(24) &&
                        a.Status == "scheduled");

                // Encounter statistics
                var todayEncounters = await _context.Encounters
                    .CountAsync(e => e.EncounterDate.Date == today);

                var thisMonthEncounters = await _context.Encounters
                    .CountAsync(e => e.EncounterDate >= thisMonth);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        Users = new
                        {
                            Total = totalUsers,
                            Doctors = doctorCount,
                            Patients = patientCount
                        },
                        Appointments = new
                        {
                            Today = todayAppointments,
                            Tomorrow = tomorrowAppointments,
                            PendingReminders = pendingReminders
                        },
                        Encounters = new
                        {
                            Today = todayEncounters,
                            ThisMonth = thisMonthEncounters
                        },
                        GeneratedAt = DateTime.Now
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading admin dashboard");
                return StatusCode(500, new { success = false, error = "Lỗi khi tải dashboard" });
            }
        }

        /// <summary>
        /// Quản lý người dùng - danh sách
        /// </summary>
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] string? role, [FromQuery] bool? isActive)
        {
            try
            {
                var query = _context.Users.AsQueryable();

                if (!string.IsNullOrEmpty(role))
                {
                    query = query.Where(u => u.Role == role);
                }

                if (isActive.HasValue)
                {
                    query = query.Where(u => u.IsActive == isActive.Value);
                }

                var users = await query
                    .OrderByDescending(u => u.CreatedAt)
                    .Select(u => new
                    {
                        Id = u.Id,
                        FullName = u.FirstName + " " + u.LastName,
                        Email = u.Email,
                        Phone = u.Phone,
                        Role = u.Role,
                        IsActive = u.IsActive,
                        CreatedAt = u.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = users });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users");
                return StatusCode(500, new { success = false, error = "Lỗi khi lấy danh sách người dùng" });
            }
        }

        /// <summary>
        /// Cập nhật trạng thái người dùng
        /// </summary>
        [HttpPut("users/{userId}/status")]
        public async Task<IActionResult> UpdateUserStatus(int userId, [FromBody] UpdateUserStatusRequest request)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                
                if (user == null)
                {
                    return NotFound(new { success = false, error = "Không tìm thấy người dùng" });
                }

                user.IsActive = request.IsActive;
                await _context.SaveChangesAsync();

                _logger.LogInformation("User {UserId} status updated to {IsActive}", userId, request.IsActive);

                return Ok(new
                {
                    success = true,
                    message = request.IsActive ? "Đã kích hoạt người dùng" : "Đã vô hiệu hóa người dùng"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user status for user {UserId}", userId);
                return StatusCode(500, new { success = false, error = "Lỗi khi cập nhật trạng thái" });
            }
        }

        /// <summary>
        /// Tạo tài khoản mới cho nhân viên (Bác sĩ hoặc Tiếp tân) - Sprint 10
        /// </summary>
        [HttpPost("users/create-staff")]
        public async Task<IActionResult> CreateStaffAccount([FromBody] CreateStaffAccountRequest request)
        {
            try
            {
                // Validate input
                if (string.IsNullOrWhiteSpace(request.Email))
                {
                    return BadRequest(new { success = false, error = "Email không được để trống" });
                }

                if (string.IsNullOrWhiteSpace(request.Password))
                {
                    return BadRequest(new { success = false, error = "Mật khẩu không được để trống" });
                }

                if (request.Password.Length < 6)
                {
                    return BadRequest(new { success = false, error = "Mật khẩu phải có ít nhất 6 ký tự" });
                }

                if (request.Role != "doctor" && request.Role != "reception")
                {
                    return BadRequest(new { success = false, error = "Role phải là 'doctor' hoặc 'reception'" });
                }

                // Check if email already exists
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

                if (existingUser != null)
                {
                    return BadRequest(new { success = false, error = "Email đã tồn tại trong hệ thống" });
                }

                // Check if phone already exists (if provided)
                if (!string.IsNullOrWhiteSpace(request.Phone))
                {
                    var existingPhone = await _context.Users
                        .FirstOrDefaultAsync(u => u.Phone == request.Phone);

                    if (existingPhone != null)
                    {
                        return BadRequest(new { success = false, error = "Số điện thoại đã được sử dụng" });
                    }
                }

                using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    // Create User account
                    var newUser = new User
                    {
                        FirstName = request.FirstName,
                        LastName = request.LastName,
                        Email = request.Email,
                        Phone = request.Phone,
                        Gender = request.Gender,
                        DateOfBirth = request.DateOfBirth != null ? DateOnly.FromDateTime(request.DateOfBirth.Value) : null,
                        Role = request.Role,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                        Status = "active",
                        CreatedAt = DateTimeOffset.UtcNow
                    };

                    _context.Users.Add(newUser);
                    await _context.SaveChangesAsync();

                    // Create StaffProfile for both doctor and reception
                    var staffProfile = new StaffProfile
                    {
                        UserId = newUser.Id,
                        StaffCode = $"{(request.Role == "doctor" ? "BS" : "TT")}{newUser.Id:D6}",
                        Department = request.Role == "doctor" ? request.Specialization ?? "Tổng quát" : "Tiếp tân",
                        Position = request.Role == "doctor" ? "Bác sĩ" : "Tiếp tân",
                        Qualifications = request.Qualifications,
                        LicenseNumber = request.LicenseNumber,
                        WorkStartDate = DateOnly.FromDateTime(DateTime.Now),
                        ProfileImageUrl = request.ProfileImageUrl,
                        CreatedAt = DateTimeOffset.UtcNow
                    };

                    _context.StaffProfiles.Add(staffProfile);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("{Role} account created: {Email}, UserId: {UserId}", 
                        request.Role == "doctor" ? "Doctor" : "Reception", newUser.Email, newUser.Id);

                    await transaction.CommitAsync();

                    return Ok(new
                    {
                        success = true,
                        message = $"Tạo tài khoản {(request.Role == "doctor" ? "bác sĩ" : "tiếp tân")} thành công",
                        data = new
                        {
                            userId = newUser.Id,
                            email = newUser.Email,
                            fullName = $"{newUser.FirstName} {newUser.LastName}",
                            role = newUser.Role,
                            profileImageUrl = staffProfile.ProfileImageUrl
                        }
                    });
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Error in transaction while creating staff account");
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating staff account");
                return StatusCode(500, new { success = false, error = "Lỗi khi tạo tài khoản: " + ex.Message });
            }
        }

        /// <summary>
        /// Upload ảnh đại diện cho bác sĩ/nhân viên (Admin)
        /// Sprint 11 - Quản lý ảnh đại diện
        /// </summary>
        [HttpPost("users/{userId}/profile-image")]
        public async Task<IActionResult> UploadStaffProfileImage(long userId, [FromForm] IFormFile image)
        {
            try
            {
                if (image == null || image.Length == 0)
                {
                    return BadRequest(new { success = false, error = "Vui lòng chọn file ảnh" });
                }

                // Validate file type
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
                var extension = Path.GetExtension(image.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(extension))
                {
                    return BadRequest(new { success = false, error = "Chỉ chấp nhận file ảnh định dạng JPG, PNG, GIF" });
                }

                // Validate file size (max 5MB)
                if (image.Length > 5 * 1024 * 1024)
                {
                    return BadRequest(new { success = false, error = "Kích thước file không được vượt quá 5MB" });
                }

                var user = await _context.Users
                    .Include(u => u.StaffProfile)
                    .FirstOrDefaultAsync(u => u.Id == userId && (u.Role == "doctor" || u.Role == "reception"));

                if (user == null)
                {
                    return NotFound(new { success = false, error = "Không tìm thấy nhân viên" });
                }

                // Create uploads directory if not exists
                var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "doctors");
                if (!Directory.Exists(uploadsPath))
                {
                    Directory.CreateDirectory(uploadsPath);
                }

                // Generate unique filename
                var fileName = $"{userId}_{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(uploadsPath, fileName);

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await image.CopyToAsync(stream);
                }

                // Delete old image if exists
                if (!string.IsNullOrEmpty(user.StaffProfile?.ProfileImageUrl))
                {
                    var oldImagePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot",
                        user.StaffProfile.ProfileImageUrl.TrimStart('/'));
                    if (System.IO.File.Exists(oldImagePath))
                    {
                        System.IO.File.Delete(oldImagePath);
                    }
                }

                // Update database
                if (user.StaffProfile == null)
                {
                    user.StaffProfile = new StaffProfile
                    {
                        UserId = userId,
                        CreatedAt = DateTimeOffset.UtcNow
                    };
                    _context.StaffProfiles.Add(user.StaffProfile);
                }

                user.StaffProfile.ProfileImageUrl = $"/uploads/doctors/{fileName}";
                user.UpdatedAt = DateTimeOffset.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Upload ảnh đại diện thành công",
                    imageUrl = user.StaffProfile.ProfileImageUrl
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading profile image");
                return StatusCode(500, new { success = false, error = "Lỗi khi upload ảnh: " + ex.Message });
            }
        }

        // ============================================================
        // Sprint 10 - Quản lý Bảng giá dịch vụ (Service Prices)
        // ============================================================

        /// <summary>
        /// Lấy danh sách bảng giá dịch vụ
        /// </summary>
        [HttpGet("service-prices")]
        public async Task<IActionResult> GetServicePrices([FromQuery] bool? isActive)
        {
            try
            {
                var query = _context.ServicePrices.AsQueryable();

                if (isActive.HasValue)
                {
                    query = query.Where(sp => sp.IsActive == isActive.Value);
                }

                var servicePrices = await query
                    .OrderBy(sp => sp.DisplayOrder)
                    .ThenBy(sp => sp.Category)
                    .Select(sp => new
                    {
                        sp.Id,
                        sp.ServiceName,
                        sp.Category,
                        sp.Price,
                        sp.Unit,
                        sp.Description,
                        sp.IsActive,
                        sp.DisplayOrder,
                        sp.CreatedAt,
                        sp.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = servicePrices });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting service prices");
                return StatusCode(500, new { success = false, error = "Lỗi khi lấy bảng giá" });
            }
        }

        /// <summary>
        /// Tạo bảng giá dịch vụ mới
        /// </summary>
        [HttpPost("service-prices")]
        public async Task<IActionResult> CreateServicePrice([FromBody] CreateServicePriceRequest request)
        {
            try
            {
                var servicePrice = new ServicePrice
                {
                    ServiceName = request.ServiceName,
                    Category = request.Category,
                    Price = request.Price,
                    Unit = request.Unit ?? "VNĐ",
                    Description = request.Description,
                    IsActive = request.IsActive,
                    DisplayOrder = request.DisplayOrder,
                    CreatedBy = GetCurrentUserId(),
                    CreatedAt = DateTime.Now
                };

                _context.ServicePrices.Add(servicePrice);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Service price created: {ServiceName}", servicePrice.ServiceName);

                return Ok(new
                {
                    success = true,
                    message = "Tạo bảng giá thành công",
                    data = new
                    {
                        servicePrice.Id,
                        servicePrice.ServiceName,
                        servicePrice.Category,
                        servicePrice.Price
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating service price");
                return StatusCode(500, new { success = false, error = "Lỗi khi tạo bảng giá" });
            }
        }

        /// <summary>
        /// Cập nhật bảng giá dịch vụ
        /// </summary>
        [HttpPut("service-prices/{id}")]
        public async Task<IActionResult> UpdateServicePrice(int id, [FromBody] UpdateServicePriceRequest request)
        {
            try
            {
                var servicePrice = await _context.ServicePrices.FindAsync(id);

                if (servicePrice == null)
                {
                    return NotFound(new { success = false, error = "Không tìm thấy bảng giá" });
                }

                servicePrice.ServiceName = request.ServiceName ?? servicePrice.ServiceName;
                servicePrice.Category = request.Category ?? servicePrice.Category;
                servicePrice.Price = request.Price ?? servicePrice.Price;
                servicePrice.Unit = request.Unit ?? servicePrice.Unit;
                servicePrice.Description = request.Description ?? servicePrice.Description;
                servicePrice.IsActive = request.IsActive ?? servicePrice.IsActive;
                servicePrice.DisplayOrder = request.DisplayOrder ?? servicePrice.DisplayOrder;
                servicePrice.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Service price updated: {Id}", id);

                return Ok(new { success = true, message = "Cập nhật bảng giá thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating service price {Id}", id);
                return StatusCode(500, new { success = false, error = "Lỗi khi cập nhật bảng giá" });
            }
        }

        /// <summary>
        /// Xóa bảng giá dịch vụ
        /// </summary>
        [HttpDelete("service-prices/{id}")]
        public async Task<IActionResult> DeleteServicePrice(int id)
        {
            try
            {
                var servicePrice = await _context.ServicePrices.FindAsync(id);

                if (servicePrice == null)
                {
                    return NotFound(new { success = false, error = "Không tìm thấy bảng giá" });
                }

                _context.ServicePrices.Remove(servicePrice);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Service price deleted: {Id}", id);

                return Ok(new { success = true, message = "Xóa bảng giá thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting service price {Id}", id);
                return StatusCode(500, new { success = false, error = "Lỗi khi xóa bảng giá" });
            }
        }

        // ============================================================
        // Sprint 10 - Quản lý Tin tức y tế (Health News)
        // ============================================================

        /// <summary>
        /// Lấy danh sách tin tức y tế
        /// </summary>
        [HttpGet("health-news")]
        public async Task<IActionResult> GetHealthNews(
            [FromQuery] bool? isPublished,
            [FromQuery] bool? isFeatured,
            [FromQuery] string? category)
        {
            try
            {
                var query = _context.HealthNews.AsQueryable();

                if (isPublished.HasValue)
                {
                    query = query.Where(hn => hn.IsPublished == isPublished.Value);
                }

                if (isFeatured.HasValue)
                {
                    query = query.Where(hn => hn.IsFeatured == isFeatured.Value);
                }

                if (!string.IsNullOrWhiteSpace(category))
                {
                    query = query.Where(hn => hn.Category == category);
                }

                var healthNews = await query
                    .OrderByDescending(hn => hn.PublishedDate ?? hn.CreatedAt)
                    .Select(hn => new
                    {
                        hn.Id,
                        hn.Title,
                        hn.Summary,
                        hn.Content,
                        hn.ImageUrl,
                        hn.Category,
                        hn.Author,
                        hn.IsFeatured,
                        hn.IsPublished,
                        hn.ViewCount,
                        hn.PublishedDate,
                        hn.CreatedAt,
                        hn.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = healthNews });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting health news");
                return StatusCode(500, new { success = false, error = "Lỗi khi lấy tin tức" });
            }
        }

        /// <summary>
        /// Lấy chi tiết tin tức y tế
        /// </summary>
        [HttpGet("health-news/{id}")]
        public async Task<IActionResult> GetHealthNewsById(int id)
        {
            try
            {
                var news = await _context.HealthNews.FindAsync(id);

                if (news == null)
                {
                    return NotFound(new { success = false, error = "Không tìm thấy tin tức" });
                }

                return Ok(new { success = true, data = news });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting health news {Id}", id);
                return StatusCode(500, new { success = false, error = "Lỗi khi lấy tin tức" });
            }
        }

        /// <summary>
        /// Tạo tin tức y tế mới
        /// </summary>
        [HttpPost("health-news")]
        public async Task<IActionResult> CreateHealthNews([FromBody] CreateHealthNewsRequest request)
        {
            try
            {
                var healthNews = new HealthNews
                {
                    Title = request.Title,
                    Summary = request.Summary,
                    Content = request.Content,
                    ImageUrl = request.ImageUrl,
                    Category = request.Category,
                    Author = request.Author,
                    IsFeatured = request.IsFeatured,
                    IsPublished = request.IsPublished,
                    PublishedDate = request.IsPublished ? DateTime.Now : null,
                    CreatedBy = GetCurrentUserId(),
                    CreatedAt = DateTime.Now
                };

                _context.HealthNews.Add(healthNews);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Health news created: {Title}", healthNews.Title);

                return Ok(new
                {
                    success = true,
                    message = "Tạo tin tức thành công",
                    data = new
                    {
                        healthNews.Id,
                        healthNews.Title,
                        healthNews.Category,
                        healthNews.IsPublished
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating health news");
                return StatusCode(500, new { success = false, error = "Lỗi khi tạo tin tức" });
            }
        }

        /// <summary>
        /// Cập nhật tin tức y tế
        /// </summary>
        [HttpPut("health-news/{id}")]
        public async Task<IActionResult> UpdateHealthNews(int id, [FromBody] UpdateHealthNewsRequest request)
        {
            try
            {
                var healthNews = await _context.HealthNews.FindAsync(id);

                if (healthNews == null)
                {
                    return NotFound(new { success = false, error = "Không tìm thấy tin tức" });
                }

                healthNews.Title = request.Title ?? healthNews.Title;
                healthNews.Summary = request.Summary ?? healthNews.Summary;
                healthNews.Content = request.Content ?? healthNews.Content;
                healthNews.ImageUrl = request.ImageUrl ?? healthNews.ImageUrl;
                healthNews.Category = request.Category ?? healthNews.Category;
                healthNews.Author = request.Author ?? healthNews.Author;
                healthNews.IsFeatured = request.IsFeatured ?? healthNews.IsFeatured;
                
                // Nếu chuyển từ chưa publish sang publish, set PublishedDate
                if (request.IsPublished.HasValue && request.IsPublished.Value && !healthNews.IsPublished)
                {
                    healthNews.PublishedDate = DateTime.Now;
                }
                
                healthNews.IsPublished = request.IsPublished ?? healthNews.IsPublished;
                healthNews.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Health news updated: {Id}", id);

                return Ok(new { success = true, message = "Cập nhật tin tức thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating health news {Id}", id);
                return StatusCode(500, new { success = false, error = "Lỗi khi cập nhật tin tức" });
            }
        }

        /// <summary>
        /// Xóa tin tức y tế
        /// </summary>
        [HttpDelete("health-news/{id}")]
        public async Task<IActionResult> DeleteHealthNews(int id)
        {
            try
            {
                var healthNews = await _context.HealthNews.FindAsync(id);

                if (healthNews == null)
                {
                    return NotFound(new { success = false, error = "Không tìm thấy tin tức" });
                }

                _context.HealthNews.Remove(healthNews);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Health news deleted: {Id}", id);

                return Ok(new { success = true, message = "Xóa tin tức thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting health news {Id}", id);
                return StatusCode(500, new { success = false, error = "Lỗi khi xóa tin tức" });
            }
        }

        // ============================================================
        // Quản lý lịch làm việc bác sĩ (Doctor Schedule Management)
        // ============================================================

        /// <summary>
        /// Lấy tất cả lịch làm việc của các bác sĩ
        /// </summary>
        [HttpGet("schedules/all")]
        public async Task<IActionResult> GetAllDoctorSchedules()
        {
            try
            {
                var schedules = await _context.DoctorSchedules
                    .Include(ds => ds.Doctor)
                    .OrderBy(ds => ds.DoctorId)
                    .ThenBy(ds => ds.DayOfWeek)
                    .ThenBy(ds => ds.StartTime)
                    .Select(ds => new
                    {
                        Id = ds.Id,
                        DoctorId = ds.DoctorId,
                        DoctorName = $"{ds.Doctor!.FirstName} {ds.Doctor.LastName}",
                        DayOfWeek = ds.DayOfWeek,
                        DayName = GetDayName(ds.DayOfWeek),
                        StartTime = ds.StartTime.ToString("HH:mm"),
                        EndTime = ds.EndTime.ToString("HH:mm"),
                        IsAvailable = ds.IsAvailable,
                        MaxAppointmentsPerSlot = ds.MaxAppointmentsPerSlot,
                        CreatedAt = ds.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = schedules });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all doctor schedules");
                return StatusCode(500, new { success = false, error = "Lỗi khi lấy danh sách lịch làm việc" });
            }
        }

        /// <summary>
        /// Lấy lịch làm việc của một bác sĩ cụ thể
        /// </summary>
        [HttpGet("doctors/{doctorId}/schedules")]
        public async Task<IActionResult> GetDoctorSchedules(long doctorId)
        {
            try
            {
                var doctor = await _context.Users.FindAsync(doctorId);
                if (doctor == null || doctor.Role != "doctor")
                {
                    return NotFound(new { success = false, error = "Không tìm thấy bác sĩ" });
                }

                var schedules = await _context.DoctorSchedules
                    .Where(ds => ds.DoctorId == doctorId)
                    .OrderBy(ds => ds.DayOfWeek)
                    .ThenBy(ds => ds.StartTime)
                    .Select(ds => new
                    {
                        Id = ds.Id,
                        DayOfWeek = ds.DayOfWeek,
                        DayName = GetDayName(ds.DayOfWeek),
                        StartTime = ds.StartTime.ToString("HH:mm"),
                        EndTime = ds.EndTime.ToString("HH:mm"),
                        IsAvailable = ds.IsAvailable,
                        MaxAppointmentsPerSlot = ds.MaxAppointmentsPerSlot,
                        CreatedAt = ds.CreatedAt,
                        UpdatedAt = ds.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        DoctorId = doctor.Id,
                        DoctorName = $"{doctor.FirstName} {doctor.LastName}",
                        Schedules = schedules
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting doctor schedules for doctor {DoctorId}", doctorId);
                return StatusCode(500, new { success = false, error = "Lỗi khi lấy lịch làm việc của bác sĩ" });
            }
        }

        /// <summary>
        /// Tạo lịch làm việc mới cho bác sĩ
        /// </summary>
        [HttpPost("doctors/{doctorId}/schedules")]
        public async Task<IActionResult> CreateDoctorSchedule(long doctorId, [FromBody] CreateDoctorScheduleRequest request)
        {
            try
            {
                // Kiểm tra bác sĩ có tồn tại không
                var doctor = await _context.Users.FindAsync(doctorId);
                if (doctor == null || doctor.Role != "doctor")
                {
                    return NotFound(new { success = false, error = "Không tìm thấy bác sĩ" });
                }

                // Validate time
                if (request.StartTime >= request.EndTime)
                {
                    return BadRequest(new { success = false, error = "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc" });
                }

                // Kiểm tra trùng lặp lịch
                var existingSchedule = await _context.DoctorSchedules
                    .Where(ds => ds.DoctorId == doctorId
                        && ds.DayOfWeek == request.DayOfWeek
                        && ((request.StartTime >= ds.StartTime && request.StartTime < ds.EndTime) ||
                            (request.EndTime > ds.StartTime && request.EndTime <= ds.EndTime) ||
                            (request.StartTime <= ds.StartTime && request.EndTime >= ds.EndTime)))
                    .FirstOrDefaultAsync();

                if (existingSchedule != null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        error = "Lịch làm việc bị trùng với lịch đã có. Vui lòng kiểm tra lại thời gian."
                    });
                }

                var schedule = new DoctorSchedule
                {
                    DoctorId = doctorId,
                    DayOfWeek = request.DayOfWeek,
                    StartTime = TimeOnly.Parse(request.StartTime),
                    EndTime = TimeOnly.Parse(request.EndTime),
                    IsAvailable = request.IsAvailable,
                    MaxAppointmentsPerSlot = request.MaxAppointmentsPerSlot,
                    CreatedAt = DateTime.Now
                };

                _context.DoctorSchedules.Add(schedule);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Tạo lịch làm việc thành công",
                    data = new
                    {
                        Id = schedule.Id,
                        DayOfWeek = schedule.DayOfWeek,
                        DayName = GetDayName(schedule.DayOfWeek),
                        StartTime = schedule.StartTime.ToString("HH:mm"),
                        EndTime = schedule.EndTime.ToString("HH:mm"),
                        IsAvailable = schedule.IsAvailable,
                        MaxAppointmentsPerSlot = schedule.MaxAppointmentsPerSlot
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating doctor schedule");
                return StatusCode(500, new { success = false, error = "Lỗi khi tạo lịch làm việc" });
            }
        }

        /// <summary>
        /// Cập nhật lịch làm việc
        /// </summary>
        [HttpPut("schedules/{scheduleId}")]
        public async Task<IActionResult> UpdateDoctorSchedule(int scheduleId, [FromBody] UpdateDoctorScheduleRequest request)
        {
            try
            {
                var schedule = await _context.DoctorSchedules
                    .Include(ds => ds.Doctor)
                    .FirstOrDefaultAsync(ds => ds.Id == scheduleId);

                if (schedule == null)
                {
                    return NotFound(new { success = false, error = "Không tìm thấy lịch làm việc" });
                }

                // Validate time if provided
                if (!string.IsNullOrEmpty(request.StartTime) && !string.IsNullOrEmpty(request.EndTime))
                {
                    var startTime = TimeOnly.Parse(request.StartTime);
                    var endTime = TimeOnly.Parse(request.EndTime);

                    if (startTime >= endTime)
                    {
                        return BadRequest(new { success = false, error = "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc" });
                    }

                    // Kiểm tra trùng lặp (không tính bản thân)
                    var existingSchedule = await _context.DoctorSchedules
                        .Where(ds => ds.Id != scheduleId
                            && ds.DoctorId == schedule.DoctorId
                            && ds.DayOfWeek == schedule.DayOfWeek
                            && ((startTime >= ds.StartTime && startTime < ds.EndTime) ||
                                (endTime > ds.StartTime && endTime <= ds.EndTime) ||
                                (startTime <= ds.StartTime && endTime >= ds.EndTime)))
                        .FirstOrDefaultAsync();

                    if (existingSchedule != null)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            error = "Lịch làm việc bị trùng với lịch đã có. Vui lòng kiểm tra lại thời gian."
                        });
                    }

                    schedule.StartTime = startTime;
                    schedule.EndTime = endTime;
                }

                if (request.IsAvailable.HasValue)
                {
                    schedule.IsAvailable = request.IsAvailable.Value;
                }

                if (request.MaxAppointmentsPerSlot.HasValue)
                {
                    schedule.MaxAppointmentsPerSlot = request.MaxAppointmentsPerSlot.Value;
                }

                schedule.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Cập nhật lịch làm việc thành công",
                    data = new
                    {
                        Id = schedule.Id,
                        DoctorId = schedule.DoctorId,
                        DoctorName = $"{schedule.Doctor!.FirstName} {schedule.Doctor.LastName}",
                        DayOfWeek = schedule.DayOfWeek,
                        DayName = GetDayName(schedule.DayOfWeek),
                        StartTime = schedule.StartTime.ToString("HH:mm"),
                        EndTime = schedule.EndTime.ToString("HH:mm"),
                        IsAvailable = schedule.IsAvailable,
                        MaxAppointmentsPerSlot = schedule.MaxAppointmentsPerSlot,
                        UpdatedAt = schedule.UpdatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating doctor schedule");
                return StatusCode(500, new { success = false, error = "Lỗi khi cập nhật lịch làm việc" });
            }
        }

        /// <summary>
        /// Xóa lịch làm việc
        /// </summary>
        [HttpDelete("schedules/{scheduleId}")]
        public async Task<IActionResult> DeleteDoctorSchedule(int scheduleId)
        {
            try
            {
                var schedule = await _context.DoctorSchedules.FindAsync(scheduleId);

                if (schedule == null)
                {
                    return NotFound(new { success = false, error = "Không tìm thấy lịch làm việc" });
                }

                _context.DoctorSchedules.Remove(schedule);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Xóa lịch làm việc thành công"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting doctor schedule");
                return StatusCode(500, new { success = false, error = "Lỗi khi xóa lịch làm việc" });
            }
        }

        /// <summary>
        /// Lấy danh sách tất cả bác sĩ (để hiển thị trong dropdown)
        /// </summary>
        [HttpGet("doctors")]
        public async Task<IActionResult> GetAllDoctors()
        {
            try
            {
                var doctors = await _context.Users
                    .Where(u => u.Role == "doctor" && u.Status == "active")
                    .OrderBy(u => u.FirstName)
                    .Select(u => new
                    {
                        Id = u.Id,
                        FullName = $"{u.FirstName} {u.LastName}",
                        Email = u.Email,
                        Phone = u.Phone
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = doctors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting doctors list");
                return StatusCode(500, new { success = false, error = "Lỗi khi lấy danh sách bác sĩ" });
            }
        }

        /// <summary>
        /// Lấy các time slots có sẵn của bác sĩ cho một ngày cụ thể (Public API cho booking)
        /// </summary>
        [HttpGet("doctors/{doctorId}/available-slots")]
        [AllowAnonymous] // Allow public access for patient booking
        public async Task<IActionResult> GetAvailableTimeSlots(long doctorId, [FromQuery] string date)
        {
            try
            {
                if (!DateTime.TryParse(date, out DateTime appointmentDate))
                {
                    return BadRequest(new { success = false, error = "Ngày không hợp lệ" });
                }

                // Get day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
                int dayOfWeek = (int)appointmentDate.DayOfWeek;

                // Get doctor's schedules for this day
                var schedules = await _context.DoctorSchedules
                    .Where(ds => ds.DoctorId == doctorId 
                        && ds.DayOfWeek == dayOfWeek 
                        && ds.IsAvailable)
                    .ToListAsync();

                if (schedules.Count == 0)
                {
                    return Ok(new 
                    { 
                        success = true, 
                        data = new
                        {
                            Date = appointmentDate.ToString("yyyy-MM-dd"),
                            DayOfWeek = dayOfWeek,
                            DayName = GetDayName(dayOfWeek),
                            AvailableSlots = new List<object>(),
                            Message = "Bác sĩ không làm việc vào ngày này"
                        }
                    });
                }

                // Get existing appointments for this date
                var existingAppointments = await _context.Appointments
                    .Where(a => a.DoctorId == doctorId 
                        && a.AppointmentStart.Date == appointmentDate.Date
                        && a.Status != "cancelled")
                    .ToListAsync();

                var availableSlots = new List<object>();

                foreach (var schedule in schedules)
                {
                    // Count appointments in this time slot
                    var appointmentsInSlot = existingAppointments
                        .Count(a => a.AppointmentStart.TimeOfDay >= schedule.StartTime.ToTimeSpan()
                            && a.AppointmentStart.TimeOfDay < schedule.EndTime.ToTimeSpan());

                    var isAvailable = appointmentsInSlot < schedule.MaxAppointmentsPerSlot;

                    availableSlots.Add(new
                    {
                        StartTime = schedule.StartTime.ToString("HH:mm"),
                        EndTime = schedule.EndTime.ToString("HH:mm"),
                        MaxSlots = schedule.MaxAppointmentsPerSlot,
                        BookedSlots = appointmentsInSlot,
                        RemainingSlots = schedule.MaxAppointmentsPerSlot - appointmentsInSlot,
                        IsAvailable = isAvailable
                    });
                }

                return Ok(new 
                { 
                    success = true, 
                    data = new
                    {
                        DoctorId = doctorId,
                        Date = appointmentDate.ToString("yyyy-MM-dd"),
                        DayOfWeek = dayOfWeek,
                        DayName = GetDayName(dayOfWeek),
                        AvailableSlots = availableSlots.Where(s => ((dynamic)s).IsAvailable).ToList(),
                        AllSlots = availableSlots
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available time slots");
                return StatusCode(500, new { success = false, error = "Lỗi khi lấy danh sách giờ khám" });
            }
        }

        // ============================================================
        // Helper Methods
        // ============================================================

        private int CalculateAge(DateTime dateOfBirth)
        {
            var today = DateTime.Today;
            var age = today.Year - dateOfBirth.Year;
            if (dateOfBirth.Date > today.AddYears(-age)) age--;
            return age;
        }

        private double CalculateHoursUntil(DateTime appointmentDate)
        {
            var timeSpan = appointmentDate - DateTime.Now;
            return timeSpan.TotalHours;
        }

        private string GenerateReminderMessage(string patientName, string doctorName, DateTime appointmentDate, string timeSlot)
        {
            return $"Kính chào {patientName},\n\n" +
                   $"Đây là lời nhắc lịch hẹn khám bệnh của bạn:\n" +
                   $"- Thời gian: {appointmentDate:dd/MM/yyyy} lúc {timeSlot}\n" +
                   $"- Bác sĩ: {doctorName}\n" +
                   $"- Địa điểm: Phòng khám Healthy System\n\n" +
                   $"Vui lòng đến đúng giờ. Nếu không thể đến, vui lòng liên hệ để hủy lịch hẹn.\n\n" +
                   $"Trân trọng,\n" +
                   $"Healthy System";
        }

        private string GetDayName(int dayOfWeek)
        {
            return dayOfWeek switch
            {
                0 => "Chủ nhật",
                1 => "Thứ hai",
                2 => "Thứ ba",
                3 => "Thứ tư",
                4 => "Thứ năm",
                5 => "Thứ sáu",
                6 => "Thứ bảy",
                _ => "Không xác định"
            };
        }

        // Helper method to get current user ID from JWT token
        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("userId") ?? User.FindFirst("sub");
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            {
                return userId;
            }
            return 0; // Default if not found
        }
    }

    // DTO Classes
    public class SendRemindersRequest
    {
        public List<int> AppointmentIds { get; set; } = new();
    }

    public class UpdateUserStatusRequest
    {
        public bool IsActive { get; set; }
    }

    public class CreateStaffAccountRequest
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty; // "doctor" or "reception"
        
        // Doctor-specific fields
        public string? Specialization { get; set; }
        public string? LicenseNumber { get; set; }
        public string? Qualifications { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? Address { get; set; }
        public string? ProfileImageUrl { get; set; }
    }

    public class CreateDoctorScheduleRequest
    {
        public int DayOfWeek { get; set; } // 0=Sunday to 6=Saturday
        public string StartTime { get; set; } = string.Empty; // Format: "HH:mm"
        public string EndTime { get; set; } = string.Empty; // Format: "HH:mm"
        public bool IsAvailable { get; set; } = true;
        public int MaxAppointmentsPerSlot { get; set; } = 4;
    }

    public class UpdateDoctorScheduleRequest
    {
        public string? StartTime { get; set; } // Format: "HH:mm"
        public string? EndTime { get; set; } // Format: "HH:mm"
        public bool? IsAvailable { get; set; }
        public int? MaxAppointmentsPerSlot { get; set; }
    }

    // Sprint 10 - Service Price DTOs
    public class CreateServicePriceRequest
    {
        public string ServiceName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? Unit { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public int DisplayOrder { get; set; } = 0;
    }

    public class UpdateServicePriceRequest
    {
        public string? ServiceName { get; set; }
        public string? Category { get; set; }
        public decimal? Price { get; set; }
        public string? Unit { get; set; }
        public string? Description { get; set; }
        public bool? IsActive { get; set; }
        public int? DisplayOrder { get; set; }
    }

    // Sprint 10 - Health News DTOs
    public class CreateHealthNewsRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public bool IsFeatured { get; set; } = false;
        public bool IsPublished { get; set; } = false;
    }

    public class UpdateHealthNewsRequest
    {
        public string? Title { get; set; }
        public string? Summary { get; set; }
        public string? Content { get; set; }
        public string? ImageUrl { get; set; }
        public string? Category { get; set; }
        public string? Author { get; set; }
        public bool? IsFeatured { get; set; }
        public bool? IsPublished { get; set; }
    }
}
