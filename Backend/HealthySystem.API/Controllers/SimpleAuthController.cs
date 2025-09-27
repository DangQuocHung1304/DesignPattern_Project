using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthySystem.API.Data;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SimpleAuthController : ControllerBase
    {
        private readonly HealthySystemDbContext _context;

        public SimpleAuthController(HealthySystemDbContext context)
        {
            _context = context;
        }

        // POST: api/simpleauth/login
        [HttpPost("login")]
        public async Task<ActionResult<object>> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest("Email and password are required.");
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email && u.Status == "active" && u.DeletedAt == null);

            if (user == null)
            {
                return Unauthorized("Invalid email or password.");
            }

            // Simple password check (in production, use proper hashing)
            if (request.Password != "123456") // Temporary fixed password for testing
            {
                return Unauthorized("Invalid email or password.");
            }

            var response = new
            {
                Success = true,
                Data = new
                {
                    Token = "fake-jwt-token-for-testing", // Temporary token for testing
                    User = new
                    {
                        Id = user.Id,
                        PublicId = user.PublicId,
                        Email = user.Email,
                        FullName = (user.FirstName + " " + user.LastName).Trim(),
                        Phone = user.Phone,
                        Role = user.Role,
                        Gender = user.Gender,
                        DateOfBirth = user.DateOfBirth
                    }
                }
            };

            return Ok(response);
        }
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}