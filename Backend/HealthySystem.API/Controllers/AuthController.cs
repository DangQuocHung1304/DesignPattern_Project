using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthySystem.API.Data;
using HealthySystem.API.Models;
using System.Security.Cryptography;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly HealthySystemDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        public AuthController(HealthySystemDbContext context, IConfiguration configuration, ILogger<AuthController> logger)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpGet("test")]
        public IActionResult Test()
        {
            try
            {
                _logger.LogInformation("Test endpoint called");
                return Ok(new { message = "Backend is running", timestamp = DateTime.Now });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Test endpoint error");
                return StatusCode(500, new { error = ex.Message });
            }
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
                _logger.LogInformation("=== LOGIN ATTEMPT ===");
                _logger.LogInformation("Email: {Email}", request.Email);
                _logger.LogInformation("Querying database...");
                
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == request.Email && u.Status == "active");
                
                _logger.LogInformation("User found: {Found}", user != null);
                    
                if (user == null)
                {
                    _logger.LogWarning("User not found or inactive");
                    return Unauthorized(new { message = "Email hoặc mật khẩu không chính xác" });
                }

                _logger.LogInformation("Verifying password...");
                // Verify password
                if (!VerifyPassword(request.Password, user.PasswordHash))
                {
                    _logger.LogWarning("Password verification failed");
                    return Unauthorized(new { message = "Email hoặc mật khẩu không chính xác" });
                }

                _logger.LogInformation("Password verified, generating token...");
                // Generate JWT token
                var token = GenerateJwtToken(user);

                _logger.LogInformation("Token generated, updating last login...");
                // Update last login
                user.UpdatedAt = DateTimeOffset.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Login successful for user: {Email}", user.Email);
                return Ok(new { 
                    message = "Đăng nhập thành công",
                    token = token,
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
                _logger.LogError(ex, "=== LOGIN ERROR ===");
                _logger.LogError("Exception: {Type}", ex.GetType().Name);
                _logger.LogError("Message: {Message}", ex.Message);
                if (ex.InnerException != null)
                {
                    _logger.LogError("Inner Exception: {InnerMsg}", ex.InnerException.Message);
                }
                return StatusCode(500, new { message = "Có lỗi xảy ra trong quá trình đăng nhập", error = ex.Message, details = ex.InnerException?.Message });
            }
        }

        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey is not configured.");
            var key = Encoding.UTF8.GetBytes(secretKey);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("publicId", user.PublicId.ToString()),
                new Claim("fullName", $"{user.FirstName} {user.LastName}")
            };

            var credentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(Convert.ToDouble(jwtSettings["ExpirationHours"] ?? "24")),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
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