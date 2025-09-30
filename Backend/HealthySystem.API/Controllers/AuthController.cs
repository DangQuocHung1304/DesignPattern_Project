using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthySystem.API.Data;
using HealthySystem.API.Models;
using System.Security.Cryptography;
using System.Text;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly HealthySystemDbContext _context;

        public AuthController(HealthySystemDbContext context)
        {
            _context = context;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                // Validate input
                if (string.IsNullOrWhiteSpace(request.Email) || 
                    string.IsNullOrWhiteSpace(request.Password) ||
                    string.IsNullOrWhiteSpace(request.FirstName) ||
                    string.IsNullOrWhiteSpace(request.LastName) ||
                    string.IsNullOrWhiteSpace(request.Phone))
                {
                    return BadRequest(new { message = "Vui lòng điền đầy đủ thông tin bắt buộc" });
                }

                // Check if email already exists
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == request.Email);
                    
                if (existingUser != null)
                {
                    return BadRequest(new { message = "Email đã được sử dụng" });
                }

                // Check if phone already exists
                var existingPhone = await _context.Users
                    .FirstOrDefaultAsync(u => u.Phone == request.Phone);
                    
                if (existingPhone != null)
                {
                    return BadRequest(new { message = "Số điện thoại đã được sử dụng" });
                }

                // Hash password
                var hashedPassword = HashPassword(request.Password);

                // Create new user
                var newUser = new User
                {
                    PublicId = Guid.NewGuid(),
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    Email = request.Email,
                    Phone = request.Phone,
                    Gender = request.Gender,
                    DateOfBirth = new DateOnly(request.DateOfBirth.Year, request.DateOfBirth.Month, request.DateOfBirth.Day),
                    PasswordHash = hashedPassword,
                    Role = "patient", // Default role
                    Status = "active",
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                };

                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                // TODO: Create patient profile later
                // var patientProfile = new PatientProfile
                // {
                //     UserId = newUser.Id,
                //     Address = request.Address,
                //     EmergencyContactPhone = request.Phone,
                //     CreatedAt = DateTimeOffset.UtcNow
                // };
                // _context.PatientProfiles.Add(patientProfile);
                // await _context.SaveChangesAsync();

                return Ok(new { 
                    message = "Đăng ký thành công",
                    userId = newUser.Id,
                    email = newUser.Email
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Register error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Có lỗi xảy ra trong quá trình đăng ký", error = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == request.Email && u.Status == "active");
                    
                if (user == null)
                {
                    return Unauthorized(new { message = "Email hoặc mật khẩu không chính xác" });
                }

                // Verify password
                if (!VerifyPassword(request.Password, user.PasswordHash))
                {
                    return Unauthorized(new { message = "Email hoặc mật khẩu không chính xác" });
                }

                // Update last login
                user.UpdatedAt = DateTimeOffset.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { 
                    message = "Đăng nhập thành công",
                    user = new {
                        id = user.Id,
                        publicId = user.PublicId,
                        fullName = $"{user.FirstName} {user.LastName}",
                        email = user.Email,
                        role = user.Role
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Login error: {ex.Message}");
                return StatusCode(500, new { message = "Có lỗi xảy ra trong quá trình đăng nhập", error = ex.Message });
            }
        }

        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        private bool VerifyPassword(string password, string hashedPassword)
        {
            var hashOfInput = HashPassword(password);
            return hashOfInput == hashedPassword;
        }
    }

    public class RegisterRequest
    {
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public string Email { get; set; } = "";
        public string Phone { get; set; } = "";
        public string Gender { get; set; } = "";
        public DateTime DateOfBirth { get; set; }
        public string? Address { get; set; }
        public string Password { get; set; } = "";
    }

    public class LoginRequest
    {
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
    }
}