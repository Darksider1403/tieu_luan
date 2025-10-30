using Microsoft.AspNetCore.Mvc;
using EcommerceFashionWebsite.Services;

namespace EcommerceFashionWebsite.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class AddressController : ControllerBase
    {
        private readonly AddressService _addressService;
        private readonly ILogger<AddressController> _logger;

        public AddressController(AddressService addressService, ILogger<AddressController> logger)
        {
            _addressService = addressService;
            _logger = logger;
        }

        [HttpGet("provinces")]
        public async Task<ActionResult> GetProvinces()
        {
            try
            {
                var provinces = await _addressService.GetProvincesAsync();
                return Ok(provinces);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting provinces");
                return StatusCode(500, new { error = "Failed to get provinces" });
            }
        }

        [HttpGet("districts/{provinceCode}")]
        public async Task<ActionResult> GetDistricts(int provinceCode)
        {
            try
            {
                var districts = await _addressService.GetDistrictsAsync(provinceCode);
                return Ok(districts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting districts");
                return StatusCode(500, new { error = "Failed to get districts" });
            }
        }

        [HttpGet("wards/{districtCode}")]
        public async Task<ActionResult> GetWards(int districtCode)
        {
            try
            {
                var wards = await _addressService.GetWardsAsync(districtCode);
                return Ok(wards);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting wards");
                return StatusCode(500, new { error = "Failed to get wards" });
            }
        }
    }
}