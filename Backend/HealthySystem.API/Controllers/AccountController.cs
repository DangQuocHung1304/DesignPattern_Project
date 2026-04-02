using System.Security.Cryptography;
using System.Text;
using HealthySystem.API.Data;
using HealthySystem.API.DesignPatterns.FactoryMethod;
using HealthySystem.API.DesignPatterns.Singleton;
using HealthySystem.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "admin")]
    public class AccountController : ControllerBase
    {
        private readonly HealthySystemDbContext _context;
        private readonly IActorFactoryMethodService _actorFactoryMethodService;
        private readonly ISystemConfigurationProvider _systemConfigurationProvider;

        public AccountController(
            HealthySystemDbContext context,
            IActorFactoryMethodService actorFactoryMethodService,
            ISystemConfigurationProvider systemConfigurationProvider)
        {
            _context = context;
            _actorFactoryMethodService = actorFactoryMethodService;
            _systemConfigurationProvider = systemConfigurationProvider;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateAccount([FromBody] CreateAccountRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.FirstName) ||
                string.IsNullOrWhiteSpace(request.LastName) ||
                string.IsNullOrWhiteSpace(request.Role))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Email, FirstName, LastName, Role are required."
                });
            }

            var role = request.Role.Trim().ToLowerInvariant();
            var email = request.Email.Trim().ToLowerInvariant();

            if (await _context.Users.AnyAsync(x => x.Email == email))
            {
                return Conflict(new { success = false, message = "Email already exists." });
            }

            ActorProfile actorProfile;
            try
            {
                actorProfile = _actorFactoryMethodService.CreateActor(
                    role,
                    new ActorCreationCommand(
                        Email: email,
                        FirstName: request.FirstName.Trim(),
                        LastName: request.LastName.Trim(),
                        DateOfBirth: request.DateOfBirth.HasValue ? DateOnly.FromDateTime(request.DateOfBirth.Value) : null));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }

            var rawPassword = string.IsNullOrWhiteSpace(request.Password)
                ? _systemConfigurationProvider.GetValue("Auth:DefaultPassword", "ChangeMe@123")
                : request.Password;

            var user = new User
            {
                PublicId = Guid.NewGuid(),
                Email = email,
                Phone = request.Phone,
                PasswordHash = ComputeSha256(rawPassword),
                Role = actorProfile.Role,
                Status = "active",
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                DateOfBirth = request.DateOfBirth.HasValue ? DateOnly.FromDateTime(request.DateOfBirth.Value) : null,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(actorProfile.StaffCode))
            {
                _context.StaffProfiles.Add(new StaffProfile
                {
                    UserId = user.Id,
                    StaffCode = actorProfile.StaffCode,
                    Department = request.Department,
                    Position = request.Position ?? role,
                    Qualifications = request.Qualifications,
                    CreatedAt = DateTimeOffset.UtcNow
                });
            }

            if (!string.IsNullOrWhiteSpace(actorProfile.MedicalRecordNumber))
            {
                _context.PatientProfiles.Add(new PatientProfile
                {
                    UserId = user.Id,
                    MedicalRecordNumber = actorProfile.MedicalRecordNumber,
                    InsuranceNumber = request.InsuranceNumber,
                    Address = request.Address,
                    EmergencyContactName = request.EmergencyContactName,
                    EmergencyContactPhone = request.EmergencyContactPhone,
                    CreatedAt = DateTimeOffset.UtcNow
                });
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Account created with Factory Method workflow.",
                processingState = new
                {
                    phase = "ready",
                    isLoading = false,
                    skeletonHint = "account-creation-result"
                },
                data = new
                {
                    userId = user.Id,
                    publicId = user.PublicId,
                    user.Email,
                    user.Role,
                    actorProfile.DisplayName,
                    actorProfile.StaffCode,
                    actorProfile.MedicalRecordNumber,
                    onboardingMessage = actorProfile.OnboardingMessage
                }
            });
        }

        private static string ComputeSha256(string value)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(value));
            return Convert.ToBase64String(bytes);
        }
    }

    public class CreateAccountRequest
    {
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Role { get; set; } = "patient";
        public string? Phone { get; set; }
        public string? Password { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Department { get; set; }
        public string? Position { get; set; }
        public string? Qualifications { get; set; }
        public string? InsuranceNumber { get; set; }
        public string? Address { get; set; }
        public string? EmergencyContactName { get; set; }
        public string? EmergencyContactPhone { get; set; }
    }
}
