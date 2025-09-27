using Microsoft.AspNetCore.Mvc;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        // GET: api/health
        [HttpGet]
        public ActionResult<object> GetHealth()
        {
            return Ok(new
            {
                Status = "Healthy",
                Timestamp = DateTime.UtcNow,
                Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development",
                Version = "1.0.0"
            });
        }

        // GET: api/health/database
        [HttpGet("database")]
        public ActionResult<object> GetDatabaseHealth()
        {
            // In a real application, you would test database connectivity here
            return Ok(new
            {
                Database = "SQL Server",
                Status = "Ready",
                Message = "Database connection configured (connection test not implemented yet)"
            });
        }

        // GET: api/health/features
        [HttpGet("features")]
        public ActionResult<object> GetAvailableFeatures()
        {
            return Ok(new
            {
                AvailableEndpoints = new[]
                {
                    "GET /api/health - API health check",
                    "GET /api/specialties - List all medical specialties",
                    "GET /api/doctors - List all doctors",
                    "GET /api/doctors/{publicId} - Get doctor details",
                    "GET /api/doctors/{publicId}/schedule - Get doctor schedule",
                    "GET /api/doctors/{publicId}/available-slots - Get available appointment slots",
                    "POST /api/auth/login - User authentication",
                    "POST /api/auth/register - User registration (patients)",
                    "GET /api/appointments - List appointments (authenticated)",
                    "POST /api/appointments - Create appointment (authenticated)",
                    "PUT /api/appointments/{id}/status - Update appointment status (authenticated)",
                    "DELETE /api/appointments/{id} - Cancel appointment (authenticated)"
                },
                Authentication = "JWT Bearer Token",
                UserRoles = new[] { "patient", "doctor", "reception", "lab", "radiology", "accountant", "admin" }
            });
        }
    }
}