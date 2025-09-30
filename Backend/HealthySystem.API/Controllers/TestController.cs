using Microsoft.AspNetCore.Mvc;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        [HttpGet("ping")]
        public IActionResult Ping()
        {
            return Ok(new { message = "API is working!", timestamp = DateTime.UtcNow });
        }

        [HttpPost("echo")]
        public IActionResult Echo([FromBody] object data)
        {
            return Ok(new { received = data, timestamp = DateTime.UtcNow });
        }
    }
}