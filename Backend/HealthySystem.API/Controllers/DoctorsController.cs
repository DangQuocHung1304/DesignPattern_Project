using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthySystem.API.Data;
using HealthySystem.API.Models;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DoctorsController : ControllerBase
    {
        private readonly HealthySystemDbContext _context;
        private readonly ILogger<DoctorsController> _logger;

        public DoctorsController(HealthySystemDbContext context, ILogger<DoctorsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/doctors
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetDoctors()
        {
            var doctors = await _context.Users
                .Where(u => u.Role == "doctor" && u.Status == "active" && u.DeletedAt == null)
                .Include(u => u.StaffProfile)
                .Include(u => u.DoctorSpecialties)
                .ThenInclude(ds => ds.Specialty)
                .Select(u => new
                {
                    Id = u.Id,
                    PublicId = u.PublicId.ToString(),
                    FullName = (u.FirstName + " " + u.LastName).Trim(),
                    Phone = u.Phone,
                    Email = u.Email,
                    Gender = u.Gender,
                    DateOfBirth = u.DateOfBirth,
                    Title = u.StaffProfile != null ? u.StaffProfile.Position : "Bác sĩ",
                    Department = u.StaffProfile != null ? u.StaffProfile.Department : "Không xác định",
                    YearsOfExperience = u.StaffProfile != null ? u.StaffProfile.YearsOfExperience : 0,
                    Specialties = u.DoctorSpecialties.Select(ds => new
                    {
                        Id = ds.Specialty.Id,
                        Name = ds.Specialty.Name,
                        Description = ds.Specialty.Description
                    }).ToList(),
                    AverageRating = u.DoctorRatings.Any() ? u.DoctorRatings.Average(r => r.RatingValue) : 0,
                    TotalRatings = u.DoctorRatings.Count()
                })
                .OrderBy(d => d.FullName)
                .ToListAsync();

            return Ok(doctors);
        }

        // GET: api/doctors/{publicId}
        [HttpGet("{publicId}")]
        public async Task<ActionResult<object>> GetDoctor(string publicId)
        {
            var doctor = await _context.Users
                .Where(u => u.PublicId.ToString() == publicId && u.Role == "doctor" && u.Status == "active" && u.DeletedAt == null)
                .Include(u => u.StaffProfile)
                .Include(u => u.DoctorSpecialties)
                .ThenInclude(ds => ds.Specialty)
                .Include(u => u.DoctorRatings)
                .ThenInclude(r => r.Patient)
                .Select(u => new
                {
                    Id = u.Id,
                    PublicId = u.PublicId.ToString(),
                    FullName = (u.FirstName + " " + u.LastName).Trim(),
                    Phone = u.Phone,
                    Email = u.Email,
                    Gender = u.Gender,
                    DateOfBirth = u.DateOfBirth,
                    Title = u.StaffProfile != null ? u.StaffProfile.Position : "Bác sĩ",
                    Department = u.StaffProfile != null ? u.StaffProfile.Department : "Không xác định",
                    Description = u.StaffProfile != null ? u.StaffProfile.Description : "",
                    YearsOfExperience = u.StaffProfile != null ? u.StaffProfile.YearsOfExperience : 0,
                    Specialties = u.DoctorSpecialties.Select(ds => new
                    {
                        Id = ds.Specialty.Id,
                        Name = ds.Specialty.Name,
                        Description = ds.Specialty.Description
                    }).ToList(),
                    AverageRating = u.DoctorRatings.Any() ? u.DoctorRatings.Average(r => r.RatingValue) : 0,
                    TotalRatings = u.DoctorRatings.Count(),
                    Ratings = u.DoctorRatings.OrderByDescending(r => r.CreatedAt).Take(10).Select(r => new
                    {
                        Id = r.Id,
                        RatingValue = r.RatingValue,
                        ReviewText = r.Comment ?? "",
                        CreatedAt = r.CreatedAt,
                        PatientName = r.Patient != null ? (r.Patient.FullName ?? "Ẩn danh") : "Ẩn danh"
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            if (doctor == null)
            {
                return NotFound();
            }

            return Ok(doctor);
        }

        // GET: api/doctors/{publicId}/schedule
        [HttpGet("{publicId}/schedule")]
        public async Task<ActionResult<IEnumerable<object>>> GetDoctorSchedule(string publicId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var doctor = await _context.Users
                .FirstOrDefaultAsync(u => u.PublicId.ToString() == publicId && u.Role == "doctor" && u.Status == "active" && u.DeletedAt == null);

            if (doctor == null)
            {
                return NotFound();
            }

            var start = startDate ?? DateTime.Today;
            var end = endDate ?? DateTime.Today.AddDays(7);

            var appointments = await _context.Appointments
                .Where(a => a.DoctorId == doctor.Id && 
                           a.AppointmentStart.Date >= start.Date && 
                           a.AppointmentStart.Date <= end.Date)
                .OrderBy(a => a.AppointmentStart)
                .Select(a => new
                {
                    Id = a.Id,
                    AppointmentStart = a.AppointmentStart,
                    AppointmentEnd = a.AppointmentEnd,
                    Status = a.Status,
                    PatientName = a.Patient.FullName,
                    Notes = a.Notes
                })
                .ToListAsync();

            return Ok(appointments);
        }

        // GET: api/doctors/{publicId}/available-slots
        [HttpGet("{publicId}/available-slots")]
        public async Task<ActionResult<IEnumerable<object>>> GetAvailableSlots(string publicId, [FromQuery] DateTime date)
        {
            _logger.LogInformation("GetAvailableSlots called - publicId: {PublicId}, date: {Date}, date.Date: {DateOnly}", 
                publicId, date, date.Date);
            
            // Try to find doctor by PublicId (GUID) or StaffCode
            var doctor = await _context.Users
                .Include(u => u.StaffProfile)
                .FirstOrDefaultAsync(u => 
                    (u.PublicId.ToString() == publicId || 
                     (u.StaffProfile != null && u.StaffProfile.StaffCode == publicId)) &&
                    u.Role == "doctor" && 
                    u.Status == "active" && 
                    u.DeletedAt == null);

            if (doctor == null)
            {
                return NotFound(new { success = false, error = "Doctor not found" });
            }

            // Get doctor's schedule for the specified date
            var scheduleDateOnly = DateOnly.FromDateTime(date.Date);
            _logger.LogInformation("Searching for schedule - DoctorId: {DoctorId}, ScheduleDate: {ScheduleDate}", 
                doctor.Id, scheduleDateOnly);
            
            var daySchedule = await _context.DoctorSchedules
                .Where(ds => ds.DoctorId == doctor.Id && 
                           ds.ScheduleDate == scheduleDateOnly && 
                           ds.IsAvailable)
                .FirstOrDefaultAsync();

            _logger.LogInformation("Schedule found: {Found}, Schedule: {@Schedule}", 
                daySchedule != null, daySchedule);

            if (daySchedule == null)
            {
                // No schedule found for this date - return empty slots
                return Ok(new List<object>());
            }

            // Get existing appointments for the date
            var dateStart = new DateTimeOffset(date.Date, TimeSpan.Zero);
            var dateEnd = dateStart.AddDays(1);
            var existingAppointments = await _context.Appointments
                .Where(a => a.DoctorId == doctor.Id && 
                           a.AppointmentStart >= dateStart &&
                           a.AppointmentStart < dateEnd &&
                           a.Status != "cancelled")
                .Select(a => new { a.AppointmentStart, a.AppointmentEnd })
                .ToListAsync();

            // Generate 30-minute time slots from work schedule
            var availableSlots = new List<object>();
            var workStart = daySchedule.StartTime.ToTimeSpan();
            var workEnd = daySchedule.EndTime.ToTimeSpan();
            
            // Generate slots in 30-minute intervals
            var slotDuration = TimeSpan.FromMinutes(30);
            var currentTime = workStart;
            
            while (currentTime < workEnd)
            {
                var nextTime = currentTime.Add(slotDuration);
                if (nextTime > workEnd)
                {
                    // Don't create partial slots beyond work hours
                    break;
                }
                
                var startTime = date.Date.Add(currentTime);
                var endTime = date.Date.Add(nextTime);
                var slotStartOffset = new DateTimeOffset(startTime, TimeSpan.Zero);
                var slotEndOffset = new DateTimeOffset(endTime, TimeSpan.Zero);
                
                // Check if this 30-minute slot conflicts with existing appointments
                var isAvailable = !existingAppointments.Any(a => 
                    (slotStartOffset >= a.AppointmentStart && slotStartOffset < a.AppointmentEnd) ||
                    (slotEndOffset > a.AppointmentStart && slotEndOffset <= a.AppointmentEnd) ||
                    (slotStartOffset <= a.AppointmentStart && slotEndOffset >= a.AppointmentEnd));

                availableSlots.Add(new
                {
                    time = $"{currentTime:hh\\:mm} - {nextTime:hh\\:mm}",
                    available = isAvailable,
                    StartTime = startTime,
                    EndTime = endTime,
                    IsAvailable = isAvailable
                });
                
                currentTime = nextTime;
            }
            
            // If no slots were generated (shouldn't happen), return empty list
            if (availableSlots.Count == 0)
            {
                var startTime = date.Date.Add(workStart);
                var endTime = date.Date.Add(workEnd);
                var slotStartOffset = new DateTimeOffset(startTime, TimeSpan.Zero);
                var slotEndOffset = new DateTimeOffset(endTime, TimeSpan.Zero);
                
                var isAvailable = !existingAppointments.Any(a => 
                    (slotStartOffset >= a.AppointmentStart && slotStartOffset < a.AppointmentEnd) ||
                    (slotEndOffset > a.AppointmentStart && slotEndOffset <= a.AppointmentEnd) ||
                    (slotStartOffset <= a.AppointmentStart && slotEndOffset >= a.AppointmentEnd));

                availableSlots.Add(new
                {
                    time = $"{startTime:HH:mm} - {endTime:HH:mm}",
                    available = isAvailable,
                    StartTime = startTime,
                    EndTime = endTime,
                    IsAvailable = isAvailable
                });
            }

            return Ok(availableSlots);
        }
    }
}