using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthySystem.API.Data;
using HealthySystem.API.Models;

namespace HealthySystem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "admin")]
    public class AdminController : ControllerBase
    {
        private readonly HealthySystemDbContext _context;
        private readonly ILogger<AdminController> _logger;

        public AdminController(HealthySystemDbContext context, ILogger<AdminController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetAdminDashboard()
        {
            try
            {
                var totalUsers = await _context.Users.CountAsync();
                var totalDoctors = await _context.Users.Where(u => u.Role == "doctor").CountAsync();
                var totalPatients = await _context.Users.Where(u => u.Role == "patient").CountAsync();
                var totalAppointments = await _context.Appointments.CountAsync();
                var pendingAppointments = await _context.Appointments.Where(a => a.Status == "pending").CountAsync();
                var confirmedAppointments = await _context.Appointments.Where(a => a.Status == "confirmed").CountAsync();
                var completedAppointments = await _context.Appointments.Where(a => a.Status == "completed").CountAsync();
                var today = DateTimeOffset.UtcNow.Date;
                var tomorrow = today.AddDays(1);
                var todayAppointments = await _context.Appointments.Where(a => a.AppointmentStart >= today && a.AppointmentStart < tomorrow).CountAsync();
                var startOfWeek = today.AddDays(-(int)today.DayOfWeek);
                var endOfWeek = startOfWeek.AddDays(7);
                var weekAppointments = await _context.Appointments.Where(a => a.AppointmentStart >= startOfWeek && a.AppointmentStart < endOfWeek).CountAsync();
                var totalEncounters = await _context.Encounters.CountAsync();

                var dashboardData = new
                {
                    users = new { total = totalUsers, doctors = totalDoctors, patients = totalPatients },
                    appointments = new { total = totalAppointments, pending = pendingAppointments, confirmed = confirmedAppointments, completed = completedAppointments, today = todayAppointments, thisWeek = weekAppointments },
                    encounters = new { total = totalEncounters }
                };

                return Ok(new { success = true, data = dashboardData });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading admin dashboard");
                return StatusCode(500, new { success = false, error = "Failed to load dashboard data" });
            }
        }

        [HttpGet("doctors")]
        public async Task<IActionResult> GetAllDoctors()
        {
            try
            {
                var doctors = await _context.Users.Where(u => u.Role == "doctor").Join(_context.StaffProfiles, u => u.Id, s => s.UserId, (u, s) => new { userId = u.Id, fullName = u.FullName, email = u.Email, phoneNumber = u.Phone, position = s.Position, department = s.Department, isActive = u.Status == "active" }).ToListAsync();
                return Ok(new { success = true, data = doctors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading doctors list");
                return StatusCode(500, new { success = false, error = "Failed to load doctors" });
            }
        }

        [HttpGet("doctors/{doctorId}/schedules")]
        public async Task<IActionResult> GetDoctorSchedules(long doctorId)
        {
            try
            {
                _logger.LogInformation("Getting schedules for doctor {DoctorId}", doctorId);
                
                // Get schedules from today onwards, grouped by date
                var schedules = await _context.DoctorSchedules
                    .Where(ds => ds.DoctorId == doctorId && ds.ScheduleDate >= DateTime.Today)
                    .OrderBy(ds => ds.ScheduleDate)
                    .ThenBy(ds => ds.StartTime)
                    .Select(ds => new { 
                        id = ds.Id, 
                        doctorId = ds.DoctorId, 
                        scheduleDate = ds.ScheduleDate.ToString("yyyy-MM-dd"),
                        dayOfWeek = (int)ds.ScheduleDate.DayOfWeek,
                        startTime = ds.StartTime.ToString("HH:mm"), 
                        endTime = ds.EndTime.ToString("HH:mm"), 
                        isAvailable = ds.IsAvailable,
                        slotLengthMinutes = ds.SlotLengthMinutes
                    })
                    .ToListAsync();
                    
                _logger.LogInformation("Found {Count} schedules", schedules.Count);
                return Ok(new { success = true, data = schedules });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading doctor schedules for doctor {DoctorId}", doctorId);
                return StatusCode(500, new { success = false, error = "Failed to load schedules", details = ex.Message });
            }
        }

        [HttpPost("doctors/{doctorId}/schedules")]
        public async Task<IActionResult> CreateDoctorSchedule(long doctorId, [FromBody] CreateScheduleDto dto)
        {
            try
            {
                _logger.LogInformation("=== CREATE SCHEDULE REQUEST ===");
                _logger.LogInformation("DoctorId: {DoctorId}", doctorId);
                _logger.LogInformation("DTO received: {@Dto}", dto);
                
                var doctor = await _context.Users.FirstOrDefaultAsync(u => u.Id == doctorId && u.Role == "doctor");
                if (doctor == null)
                {
                    _logger.LogWarning("Doctor not found: {DoctorId}", doctorId);
                    return NotFound(new { success = false, error = "Doctor not found" });
                }
                _logger.LogInformation("Doctor found: {DoctorName}", doctor.FullName);

                // Parse schedule date
                DateTime scheduleDate;
                if (string.IsNullOrEmpty(dto.ScheduleDate) || !DateTime.TryParse(dto.ScheduleDate, out scheduleDate))
                {
                    _logger.LogError("Invalid ScheduleDate format: {ScheduleDate}", dto.ScheduleDate);
                    return BadRequest(new { success = false, error = "Invalid ScheduleDate format. Use yyyy-MM-dd" });
                }

                TimeOnly startTime, endTime;
                if (!TimeOnly.TryParse(dto.StartTime, out startTime))
                {
                    _logger.LogError("Invalid StartTime format: {StartTime}", dto.StartTime);
                    return BadRequest(new { success = false, error = "Invalid StartTime format. Use HH:mm" });
                }
                if (!TimeOnly.TryParse(dto.EndTime, out endTime))
                {
                    _logger.LogError("Invalid EndTime format: {EndTime}", dto.EndTime);
                    return BadRequest(new { success = false, error = "Invalid EndTime format. Use HH:mm" });
                }

                // Create schedules for multiple weeks (default 1 week)
                int weeksToCreate = dto.WeeksToRepeat ?? 1;
                List<DoctorSchedule> schedules = new List<DoctorSchedule>();
                
                // Create schedule for each week
                for (int week = 0; week < weeksToCreate; week++)
                {
                    DateTime weekScheduleDate = scheduleDate.AddDays(week * 7);
                    
                    // Check if schedule already exists for this date and time
                    bool exists = await _context.DoctorSchedules.AnyAsync(ds => 
                        ds.DoctorId == doctorId && 
                        ds.ScheduleDate == weekScheduleDate && 
                        ds.StartTime == startTime);
                    
                    if (!exists)
                    {
                        schedules.Add(new DoctorSchedule
                        {
                            DoctorId = doctorId,
                            ScheduleDate = weekScheduleDate,
                            StartTime = startTime,
                            EndTime = endTime,
                            IsAvailable = dto.IsAvailable ?? true,
                            SlotLengthMinutes = dto.SlotLengthMinutes ?? 30
                        });
                    }
                }
                
                if (schedules.Count == 0)
                {
                    return Ok(new { success = true, message = "All schedules already exist", createdCount = 0 });
                }
                
                _logger.LogInformation("Adding {Count} schedules to context...", schedules.Count);
                _context.DoctorSchedules.AddRange(schedules);
                
                _logger.LogInformation("Saving changes to database...");
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Created {Count} schedules successfully", schedules.Count);
                
                var createdData = schedules.Select(s => new { 
                    id = s.Id, 
                    doctorId = s.DoctorId, 
                    scheduleDate = s.ScheduleDate.ToString("yyyy-MM-dd"), 
                    dayOfWeek = s.DayOfWeek, 
                    startTime = s.StartTime.ToString("HH:mm"), 
                    endTime = s.EndTime.ToString("HH:mm"), 
                    isAvailable = s.IsAvailable, 
                    slotLengthMinutes = s.SlotLengthMinutes 
                }).ToList();
                
                return Ok(new { success = true, created = schedules.Count, data = createdData });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "=== ERROR CREATING SCHEDULE ===");
                _logger.LogError("Exception Type: {Type}", ex.GetType().Name);
                _logger.LogError("Message: {Message}", ex.Message);
                _logger.LogError("StackTrace: {Stack}", ex.StackTrace);
                if (ex.InnerException != null)
                {
                    _logger.LogError("Inner Exception: {InnerMsg}", ex.InnerException.Message);
                }
                return StatusCode(500, new { success = false, error = "Failed to create schedule", details = ex.Message, innerError = ex.InnerException?.Message });
            }
        }

        [HttpPut("doctors/schedules/{scheduleId}")]
        public async Task<IActionResult> UpdateDoctorSchedule(long scheduleId, [FromBody] UpdateScheduleDto dto)
        {
            try
            {
                var schedule = await _context.DoctorSchedules.FindAsync(scheduleId);
                if (schedule == null) return NotFound(new { success = false, error = "Schedule not found" });

                if (!string.IsNullOrEmpty(dto.StartTime)) schedule.StartTime = TimeOnly.Parse(dto.StartTime);
                if (!string.IsNullOrEmpty(dto.EndTime)) schedule.EndTime = TimeOnly.Parse(dto.EndTime);
                if (dto.IsAvailable.HasValue) schedule.IsAvailable = dto.IsAvailable.Value;
                if (dto.MaxAppointmentsPerSlot.HasValue) schedule.SlotLengthMinutes = dto.MaxAppointmentsPerSlot.Value;  // Map to slot length
                // Note: updated_at column doesn't exist in DB

                await _context.SaveChangesAsync();
                return Ok(new { success = true, data = new { id = schedule.Id, doctorId = schedule.DoctorId, scheduleDate = schedule.ScheduleDate.ToString("yyyy-MM-dd"), dayOfWeek = schedule.DayOfWeek, startTime = schedule.StartTime.ToString("HH:mm"), endTime = schedule.EndTime.ToString("HH:mm"), isAvailable = schedule.IsAvailable, slotLengthMinutes = schedule.SlotLengthMinutes } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating schedule");
                return StatusCode(500, new { success = false, error = "Failed to update schedule" });
            }
        }

        [HttpDelete("doctors/schedules/{scheduleId}")]
        public async Task<IActionResult> DeleteDoctorSchedule(long scheduleId)
        {
            try
            {
                var schedule = await _context.DoctorSchedules.FindAsync(scheduleId);
                if (schedule == null) return NotFound(new { success = false, error = "Schedule not found" });

                _context.DoctorSchedules.Remove(schedule);
                await _context.SaveChangesAsync();
                return Ok(new { success = true, message = "Schedule deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting schedule");
                return StatusCode(500, new { success = false, error = "Failed to delete schedule" });
            }
        }
    }

    public class CreateScheduleDto
    {
        public string? ScheduleDate { get; set; }  // Date string from frontend (yyyy-MM-dd)
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public bool? IsAvailable { get; set; }
        public int? SlotLengthMinutes { get; set; }  // Changed from MaxAppointmentsPerSlot
        public int? WeeksToRepeat { get; set; }  // Number of weeks to create recurring schedule (default 4)
    }

    public class UpdateScheduleDto
    {
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
        public bool? IsAvailable { get; set; }
        public int? MaxAppointmentsPerSlot { get; set; }
    }
}
