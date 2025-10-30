using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EcommerceFashionWebsite.DTOs;

namespace EcommerceFashionWebsite.Services
{
    public class MoMoService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<MoMoService> _logger;
        private readonly HttpClient _httpClient;

        public MoMoService(IConfiguration configuration, ILogger<MoMoService> logger, HttpClient httpClient)
        {
            _configuration = configuration;
            _logger = logger;
            _httpClient = httpClient;
        }

        public async Task<PaymentResponseDto> CreateMoMoPaymentAsync(PaymentRequestDto request)
        {
            try
            {
                var endpoint = _configuration["MoMo:Endpoint"];
                var partnerCode = _configuration["MoMo:PartnerCode"];
                var accessKey = _configuration["MoMo:AccessKey"];
                var secretKey = _configuration["MoMo:SecretKey"];
                var returnUrl = _configuration["MoMo:ReturnUrl"];
                var ipnUrl = _configuration["MoMo:IpnUrl"];
                var requestType = _configuration["MoMo:RequestType"];

                var requestId = Guid.NewGuid().ToString();
                var orderId = request.OrderId;
                var orderInfo = $"Thanh toan don hang {request.OrderId}";
                var amount = ((long)request.Amount).ToString();
                var extraData = "";

                _logger.LogInformation("Creating MoMo payment for order {OrderId} with amount {Amount}", orderId, amount);

                // Create raw signature according to MoMo documentation
                var rawSignature = $"accessKey={accessKey}&amount={amount}&extraData={extraData}&ipnUrl={ipnUrl}" +
                                 $"&orderId={orderId}&orderInfo={orderInfo}&partnerCode={partnerCode}" +
                                 $"&redirectUrl={returnUrl}&requestId={requestId}&requestType={requestType}";

                _logger.LogInformation("Raw signature: {RawSignature}", rawSignature);

                var signature = ComputeHmacSha256(rawSignature, secretKey);

                var momoRequest = new
                {
                    partnerCode = partnerCode,
                    partnerName = "Test",
                    storeId = "MomoTestStore",
                    requestId = requestId,
                    amount = amount,
                    orderId = orderId,
                    orderInfo = orderInfo,
                    redirectUrl = returnUrl,
                    ipnUrl = ipnUrl,
                    lang = "vi",
                    extraData = extraData,
                    requestType = requestType,
                    signature = signature
                };

                var jsonRequest = JsonSerializer.Serialize(momoRequest);
                _logger.LogInformation("MoMo request: {Request}", jsonRequest);

                var content = new StringContent(jsonRequest, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(endpoint, content);
                var jsonResponse = await response.Content.ReadAsStringAsync();
                
                _logger.LogInformation("MoMo response: {Response}", jsonResponse);

                var momoResponse = JsonSerializer.Deserialize<MoMoResponse>(jsonResponse, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (momoResponse != null && momoResponse.resultCode == 0)
                {
                    return new PaymentResponseDto
                    {
                        Success = true,
                        PaymentUrl = momoResponse.payUrl,
                        Message = "Payment URL created successfully"
                    };
                }

                _logger.LogWarning("MoMo payment creation failed: {Message}", momoResponse?.message);

                return new PaymentResponseDto
                {
                    Success = false,
                    Message = momoResponse?.message ?? "Failed to create payment URL"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating MoMo payment");
                return new PaymentResponseDto
                {
                    Success = false,
                    Message = "Failed to create payment URL: " + ex.Message
                };
            }
        }

        public async Task<bool> ValidateMoMoCallbackAsync(Dictionary<string, string> queryParams)
        {
            try
            {
                var secretKey = _configuration["MoMo:SecretKey"];
                
                _logger.LogInformation("Validating MoMo callback with params: {Params}", 
                    string.Join(", ", queryParams.Select(kv => $"{kv.Key}={kv.Value}")));

                var partnerCode = queryParams.GetValueOrDefault("partnerCode", "");
                var accessKey = queryParams.GetValueOrDefault("accessKey", "");
                var requestId = queryParams.GetValueOrDefault("requestId", "");
                var amount = queryParams.GetValueOrDefault("amount", "");
                var orderId = queryParams.GetValueOrDefault("orderId", "");
                var orderInfo = queryParams.GetValueOrDefault("orderInfo", "");
                var orderType = queryParams.GetValueOrDefault("orderType", "");
                var transId = queryParams.GetValueOrDefault("transId", "");
                var resultCode = queryParams.GetValueOrDefault("resultCode", "");
                var message = queryParams.GetValueOrDefault("message", "");
                var payType = queryParams.GetValueOrDefault("payType", "");
                var responseTime = queryParams.GetValueOrDefault("responseTime", "");
                var extraData = queryParams.GetValueOrDefault("extraData", "");
                var signature = queryParams.GetValueOrDefault("signature", "");

                // Build raw signature for validation
                var rawSignature = $"accessKey={accessKey}&amount={amount}&extraData={extraData}" +
                                 $"&message={message}&orderId={orderId}&orderInfo={orderInfo}" +
                                 $"&orderType={orderType}&partnerCode={partnerCode}&payType={payType}" +
                                 $"&requestId={requestId}&responseTime={responseTime}" +
                                 $"&resultCode={resultCode}&transId={transId}";

                _logger.LogInformation("Raw signature for validation: {RawSignature}", rawSignature);

                var computedSignature = ComputeHmacSha256(rawSignature, secretKey);

                _logger.LogInformation("Computed signature: {Computed}, Received signature: {Received}", 
                    computedSignature, signature);

                var isValidSignature = signature.Equals(computedSignature, StringComparison.OrdinalIgnoreCase);
                var isSuccessfulPayment = resultCode == "0";

                _logger.LogInformation("Signature valid: {Valid}, Payment successful: {Success}", 
                    isValidSignature, isSuccessfulPayment);

                return isValidSignature && isSuccessfulPayment;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating MoMo callback");
                return false;
            }
        }

        private string ComputeHmacSha256(string message, string secretKey)
        {
            var keyBytes = Encoding.UTF8.GetBytes(secretKey);
            var messageBytes = Encoding.UTF8.GetBytes(message);

            using var hmac = new HMACSHA256(keyBytes);
            var hashBytes = hmac.ComputeHash(messageBytes);
            return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
        }
    }
}