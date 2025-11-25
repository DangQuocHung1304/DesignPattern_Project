using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthySystem.API.Data;
using HealthySystem.API.Models;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SpecialtiesController : ControllerBase
    {
        private readonly HealthySystemDbContext _context;

        public SpecialtiesController(HealthySystemDbContext context)
        {
            _context = context;
        }

        // GET: api/specialties
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Specialty>>> GetSpecialties()
        {
            return await _context.Specialties
                .OrderBy(s => s.Name)
                .ToListAsync();
        }

        // GET: api/specialties/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Specialty>> GetSpecialty(long id)
        {
            var specialty = await _context.Specialties
                .FirstOrDefaultAsync(s => s.Id == id);

            if (specialty == null)
            {
                return NotFound();
            }

            return specialty;
        }

        // GET: api/specialties/{id}/doctors
        [HttpGet("{id}/doctors")]
        public async Task<ActionResult<IEnumerable<object>>> GetDoctorsBySpecialty(long id)
        {
            var doctors = await _context.DoctorSpecialties
                .Where(ds => ds.SpecialtyId == id)
                .Include(ds => ds.Doctor)
                .ThenInclude(d => d.StaffProfile)
                .Where(ds => ds.Doctor.Status == "active" && ds.Doctor.DeletedAt == null)
                .Select(ds => new
                {
                    Id = ds.Doctor.Id,
                    PublicId = ds.Doctor.PublicId.ToString(),
                    FullName = (ds.Doctor.FirstName + " " + ds.Doctor.LastName).Trim(),
                    Phone = ds.Doctor.Phone,
                    Email = ds.Doctor.Email,
                    Title = ds.Doctor.StaffProfile != null ? ds.Doctor.StaffProfile.Position : "Bác sĩ",
                    Department = ds.Doctor.StaffProfile != null ? ds.Doctor.StaffProfile.Department : "Không xác định",
                    Description = ds.Doctor.StaffProfile != null ? ds.Doctor.StaffProfile.Description : "",
                    YearsOfExperience = ds.Doctor.StaffProfile != null ? ds.Doctor.StaffProfile.YearsOfExperience : 0,
                    IsAvailable = true
                })
                .ToListAsync();

            return Ok(doctors);
        }
    }
}