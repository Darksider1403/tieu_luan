using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;

namespace EcommerceFashionWebsite.Services
{
    public class AddressService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<AddressService> _logger;
        private readonly IMemoryCache _cache;
        private const string PROVINCE_API_URL = "https://provinces.open-api.vn/api";

        public AddressService(HttpClient httpClient, ILogger<AddressService> logger, IMemoryCache cache)
        {
            _httpClient = httpClient;
            _logger = logger;
            _cache = cache;
        }

        public async Task<List<Province>> GetProvincesAsync()
        {
            var cacheKey = "provinces";
            
            if (_cache.TryGetValue(cacheKey, out List<Province>? cachedProvinces))
            {
                return cachedProvinces!;
            }

            try
            {
                var response = await _httpClient.GetStringAsync($"{PROVINCE_API_URL}/p/");
                var provinces = JsonSerializer.Deserialize<List<Province>>(response, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (provinces != null)
                {
                    _cache.Set(cacheKey, provinces, TimeSpan.FromHours(24));
                    return provinces;
                }

                return new List<Province>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching provinces");
                return new List<Province>();
            }
        }

        public async Task<List<District>> GetDistrictsAsync(int provinceCode)
        {
            var cacheKey = $"districts_{provinceCode}";
            
            if (_cache.TryGetValue(cacheKey, out List<District>? cachedDistricts))
            {
                return cachedDistricts!;
            }

            try
            {
                var response = await _httpClient.GetStringAsync($"{PROVINCE_API_URL}/p/{provinceCode}?depth=2");
                var provinceDetail = JsonSerializer.Deserialize<ProvinceDetail>(response, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (provinceDetail?.Districts != null)
                {
                    _cache.Set(cacheKey, provinceDetail.Districts, TimeSpan.FromHours(24));
                    return provinceDetail.Districts;
                }

                return new List<District>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching districts for province {ProvinceCode}", provinceCode);
                return new List<District>();
            }
        }

        public async Task<List<Ward>> GetWardsAsync(int districtCode)
        {
            var cacheKey = $"wards_{districtCode}";
            
            if (_cache.TryGetValue(cacheKey, out List<Ward>? cachedWards))
            {
                return cachedWards!;
            }

            try
            {
                var response = await _httpClient.GetStringAsync($"{PROVINCE_API_URL}/d/{districtCode}?depth=2");
                var districtDetail = JsonSerializer.Deserialize<DistrictDetail>(response, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (districtDetail?.Wards != null)
                {
                    _cache.Set(cacheKey, districtDetail.Wards, TimeSpan.FromHours(24));
                    return districtDetail.Wards;
                }

                return new List<Ward>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching wards for district {DistrictCode}", districtCode);
                return new List<Ward>();
            }
        }
    }

    // Models
    public class Province
    {
        public int Code { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class District
    {
        public int Code { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class Ward
    {
        public int Code { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class ProvinceDetail
    {
        public int Code { get; set; }
        public string Name { get; set; } = string.Empty;
        public List<District> Districts { get; set; } = new List<District>();
    }

    public class DistrictDetail
    {
        public int Code { get; set; }
        public string Name { get; set; } = string.Empty;
        public List<Ward> Wards { get; set; } = new List<Ward>();
    }
}