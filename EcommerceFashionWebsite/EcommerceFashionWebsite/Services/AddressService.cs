using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;

namespace EcommerceFashionWebsite.Services
{
    public class AddressService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<AddressService> _logger;
        private readonly IMemoryCache _cache;
        private const string PROVINCE_API_URL = "https://open.oapi.vn/location";

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
                _logger.LogInformation("Returning cached provinces");
                return cachedProvinces!;
            }

            try
            {
                _logger.LogInformation("Fetching provinces from API");
                var response = await _httpClient.GetStringAsync($"{PROVINCE_API_URL}/provinces?page=0&size=100");
                
                _logger.LogDebug("API Response: {Response}", response);
                
                var apiResponse = JsonSerializer.Deserialize<OApiResponse<Province>>(response, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    NumberHandling = JsonNumberHandling.AllowReadingFromString
                });

                if (apiResponse?.Data != null)
                {
                    _cache.Set(cacheKey, apiResponse.Data, TimeSpan.FromHours(24));
                    _logger.LogInformation("Successfully fetched {Count} provinces", apiResponse.Data.Count);
                    return apiResponse.Data;
                }

                _logger.LogWarning("No provinces data returned from API");
                return new List<Province>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching provinces");
                return new List<Province>();
            }
        }

        public async Task<List<District>> GetDistrictsAsync(string provinceId)
        {
            var cacheKey = $"districts_{provinceId}";
            
            if (_cache.TryGetValue(cacheKey, out List<District>? cachedDistricts))
            {
                _logger.LogInformation("Returning cached districts for province {ProvinceId}", provinceId);
                return cachedDistricts!;
            }

            try
            {
                _logger.LogInformation("Fetching districts for province {ProvinceId}", provinceId);
                var response = await _httpClient.GetStringAsync($"{PROVINCE_API_URL}/districts/{provinceId}?page=0&size=100");
                
                var apiResponse = JsonSerializer.Deserialize<OApiResponse<District>>(response, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    NumberHandling = JsonNumberHandling.AllowReadingFromString
                });

                if (apiResponse?.Data != null)
                {
                    _cache.Set(cacheKey, apiResponse.Data, TimeSpan.FromHours(24));
                    _logger.LogInformation("Successfully fetched {Count} districts", apiResponse.Data.Count);
                    return apiResponse.Data;
                }

                _logger.LogWarning("No districts data returned for province {ProvinceId}", provinceId);
                return new List<District>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching districts for province {ProvinceId}", provinceId);
                return new List<District>();
            }
        }

        public async Task<List<Ward>> GetWardsAsync(string districtId)
        {
            var cacheKey = $"wards_{districtId}";
            
            if (_cache.TryGetValue(cacheKey, out List<Ward>? cachedWards))
            {
                _logger.LogInformation("Returning cached wards for district {DistrictId}", districtId);
                return cachedWards!;
            }

            try
            {
                _logger.LogInformation("Fetching wards for district {DistrictId}", districtId);
                var response = await _httpClient.GetStringAsync($"{PROVINCE_API_URL}/wards/{districtId}?page=0&size=500");
                
                var apiResponse = JsonSerializer.Deserialize<OApiResponse<Ward>>(response, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    NumberHandling = JsonNumberHandling.AllowReadingFromString
                });

                if (apiResponse?.Data != null)
                {
                    _cache.Set(cacheKey, apiResponse.Data, TimeSpan.FromHours(24));
                    _logger.LogInformation("Successfully fetched {Count} wards", apiResponse.Data.Count);
                    return apiResponse.Data;
                }

                _logger.LogWarning("No wards data returned for district {DistrictId}", districtId);
                return new List<Ward>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching wards for district {DistrictId}", districtId);
                return new List<Ward>();
            }
        }
    }

    // Models for the OApi response format
    public class OApiResponse<T>
    {
        public List<T> Data { get; set; } = new List<T>();
        public int Total { get; set; }
        public int Page { get; set; }
        public int Size { get; set; }
    }

    public class Province
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        
        [JsonPropertyName("division_type")]
        public string DivisionType { get; set; } = string.Empty;
        
        [JsonPropertyName("phone_code")]
        public string? PhoneCode { get; set; }
    }

    public class District
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        
        [JsonPropertyName("division_type")]
        public string DivisionType { get; set; } = string.Empty;
        
        [JsonPropertyName("short_codename")]
        public string? ShortCodename { get; set; }
        
        [JsonPropertyName("province_id")]
        public string ProvinceId { get; set; } = string.Empty;
    }

    public class Ward
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        
        [JsonPropertyName("division_type")]
        public string DivisionType { get; set; } = string.Empty;
        
        [JsonPropertyName("short_codename")]
        public string? ShortCodename { get; set; }
        
        [JsonPropertyName("district_id")]
        public string DistrictId { get; set; } = string.Empty;
    }
}