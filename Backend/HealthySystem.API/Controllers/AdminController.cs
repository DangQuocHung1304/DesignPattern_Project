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
                var schedules = await _context.DoctorSchedules.Where(ds => ds.DoctorId == doctorId).OrderBy(ds => ds.DayOfWeek).ThenBy(ds => ds.StartTime).Select(ds => new { id = ds.Id, doctorId = ds.DoctorId, dayOfWeek = ds.DayOfWeek, startTime = ds.StartTime.ToString("HH:mm"), endTime = ds.EndTime.ToString("HH:mm"), isAvailable = ds.IsAvailable }).ToListAsync();
                return Ok(new { success = true, data = schedules });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading doctor schedules");
                return StatusCode(500, new { success = false, error = "Failed to load schedules" });
            }
        }

        [HttpPost("doctors/{doctorId}/schedules")]
        public async Task<IActionResult> CreateDoctorSchedule(long doctorId, [FromBody] CreateScheduleDto dto)
        {
            try
            {
                var doctor = await _context.Users.FirstOrDefaultAsync(u => u.Id == doctorId && u.Role == "doctor");
                if (doctor == null) return NotFound(new { success = false, error = "Doctor not found" });

                var schedule = new DoctorSchedule { DoctorId = doctorId, DayOfWeek = dto.DayOfWeek, StartTime = TimeOnly.Parse(dto.StartTime), EndTime = TimeOnly.Parse(dto.EndTime), IsAvailable = dto.IsAvailable ?? true };
                _context.DoctorSchedules.Add(schedule);
                await _context.SaveChangesAsync();
                return Ok(new { success = true, data = new { id = schedule.Id, doctorId = schedule.DoctorId, dayOfWeek = schedule.DayOfWeek, startTime = schedule.StartTime.ToString("HH:mm"), endTime = schedule.EndTime.ToString("HH:mm"), isAvailable = schedule.IsAvailable } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating schedule");
                return StatusCode(500, new { success = false, error = "Failed to create schedule" });
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

                await _context.SaveChangesAsync();
                return Ok(new { success = true, data = new { id = schedule.Id, doctorId = schedule.DoctorId, dayOfWeek = schedule.DayOfWeek, startTime = schedule.StartTime.ToString("HH:mm"), endTime = schedule.EndTime.ToString("HH:mm"), isAvailable = schedule.IsAvailable } });
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
        public int DayOfWeek { get; set; }
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public bool? IsAvailable { get; set; }
    }

    public class UpdateScheduleDto
    {
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
        public bool? IsAvailable { get; set; }
    }
}
