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

        public DoctorsController(HealthySystemDbContext context)
        {
            _context = context;
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
                .Select(u => new
                {
                    Id = u.Id,
                    PublicId = u.PublicId,
                    FullName = u.FullName,
                    Phone = u.Phone,
                    Email = u.Email,
                    Gender = u.Gender,
                    DateOfBirth = u.DateOfBirth,
                    Title = u.StaffProfile!.Title,
                    Department = u.StaffProfile.Department,
                    Description = u.StaffProfile.Description,
                    YearsOfExperience = u.StaffProfile.YearsOfExperience,
                    Specialties = u.DoctorSpecialties.Select(ds => new
                    {
                        Id = ds.Specialty.Id,
                        Name = ds.Specialty.Name,
                        Description = ds.Specialty.Description
                    }).ToList(),
                    AverageRating = u.DoctorRatings.Any() ? u.DoctorRatings.Average(r => r.RatingValue) : 0,
                    TotalRatings = u.DoctorRatings.Count(),
                    Ratings = u.DoctorRatings.OrderByDescending(r => r.CreatedDate).Take(10).Select(r => new
                    {
                        Id = r.Id,
                        RatingValue = r.RatingValue,
                        ReviewText = r.ReviewText,
                        CreatedDate = r.CreatedDate,
                        PatientName = r.Patient.FullName
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
            var doctor = await _context.Users
                .FirstOrDefaultAsync(u => u.PublicId.ToString() == publicId && u.Role == "doctor" && u.Status == "active" && u.DeletedAt == null);

            if (doctor == null)
            {
                return NotFound();
            }

            // Get existing appointments for the date
            var existingAppointments = await _context.Appointments
                .Where(a => a.DoctorId == doctor.Id && 
                           a.AppointmentStart.Date == date.Date &&
                           a.Status != "cancelled")
                .Select(a => new { a.AppointmentStart, a.AppointmentEnd })
                .ToListAsync();

            // Generate available time slots (8 AM to 5 PM, 30-minute slots)
            var availableSlots = new List<object>();
            var startTime = date.Date.AddHours(8); // 8 AM
            var endTime = date.Date.AddHours(17); // 5 PM

            while (startTime < endTime)
            {
                var slotEnd = startTime.AddMinutes(30);
                
                // Check if this slot conflicts with existing appointments
                var isAvailable = !existingAppointments.Any(a => 
                    (startTime >= a.AppointmentStart && startTime < a.AppointmentEnd) ||
                    (slotEnd > a.AppointmentStart && slotEnd <= a.AppointmentEnd) ||
                    (startTime <= a.AppointmentStart && slotEnd >= a.AppointmentEnd));

                if (isAvailable)
                {
                    availableSlots.Add(new
                    {
                        StartTime = startTime,
                        EndTime = slotEnd,
                        IsAvailable = true
                    });
                }

                startTime = startTime.AddMinutes(30);
            }

            return Ok(availableSlots);
        }
    }
}