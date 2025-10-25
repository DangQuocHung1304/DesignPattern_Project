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
                .Select(ds => new
                {
                    Id = ds.Doctor.Id,
                    PublicId = ds.Doctor.PublicId,
                    FullName = ds.Doctor.FullName,
                    Phone = ds.Doctor.Phone,
                    Email = ds.Doctor.Email,
                    Gender = ds.Doctor.Gender,
                    DateOfBirth = ds.Doctor.DateOfBirth,
                    Title = ds.Doctor.StaffProfile!.Title,
                    Department = ds.Doctor.StaffProfile.Department,
                    Description = ds.Doctor.StaffProfile.Description,
                    YearsOfExperience = ds.Doctor.StaffProfile.YearsOfExperience,
                    IsAvailable = ds.Doctor.Status == "active" && ds.Doctor.DeletedAt == null
                })
                .Where(d => d.IsAvailable)
                .ToListAsync();

            return Ok(doctors);
        }
    }
}