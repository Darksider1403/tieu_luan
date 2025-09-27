using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceFashionWebsite.Data;

namespace EcommerceFashionWebsite.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TestController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("database-connection")]
        public async Task<IActionResult> TestDatabaseConnection()
        {
            try
            {
                // Simple test to check if database connection works
                await _context.Database.CanConnectAsync();
                return Ok("Database connection successful!");
            }
            catch (Exception ex)
            {
                return BadRequest($"Database connection failed: {ex.Message}");
            }
        }
    }
}