using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using EcommerceFashionWebsite.DTOs;
using EcommerceFashionWebsite.Services.Interface;
using Microsoft.Extensions.Configuration;

namespace EcommerceFashionWebsite.Services
{
    public class VNPayService : IPaymentService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<VNPayService> _logger;

        public VNPayService(IConfiguration configuration, ILogger<VNPayService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<PaymentResponseDto> CreateVNPayPaymentAsync(PaymentRequestDto request)
        {
            try
            {
                var vnpayUrl = _configuration["VNPay:Url"];
                var vnpayTmnCode = _configuration["VNPay:TmnCode"];
                var vnpayHashSecret = _configuration["VNPay:HashSecret"];

                var vnpay = new VNPayLibrary();
                
                vnpay.AddRequestData("vnp_Version", "2.1.0");
                vnpay.AddRequestData("vnp_Command", "pay");
                vnpay.AddRequestData("vnp_TmnCode", vnpayTmnCode);
                vnpay.AddRequestData("vnp_Amount", ((long)(request.Amount * 100)).ToString());
                vnpay.AddRequestData("vnp_CreateDate", DateTime.Now.ToString("yyyyMMddHHmmss"));
                vnpay.AddRequestData("vnp_CurrCode", "VND");
                vnpay.AddRequestData("vnp_IpAddr", GetIpAddress());
                vnpay.AddRequestData("vnp_Locale", "vn");
                vnpay.AddRequestData("vnp_OrderInfo", $"Thanh toan don hang {request.OrderId}");
                vnpay.AddRequestData("vnp_OrderType", "other");
                vnpay.AddRequestData("vnp_ReturnUrl", request.ReturnUrl);
                vnpay.AddRequestData("vnp_TxnRef", request.OrderId);

                var paymentUrl = vnpay.CreateRequestUrl(vnpayUrl, vnpayHashSecret);

                return new PaymentResponseDto
                {
                    Success = true,
                    PaymentUrl = paymentUrl,
                    Message = "Payment URL created successfully"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating VNPay payment");
                return new PaymentResponseDto
                {
                    Success = false,
                    Message = "Failed to create payment URL"
                };
            }
        }

        public async Task<bool> ValidateVNPayCallbackAsync(Dictionary<string, string> queryParams)
        {
            try
            {
                var vnpayHashSecret = _configuration["VNPay:HashSecret"];
                var vnpay = new VNPayLibrary();

                foreach (var param in queryParams)
                {
                    if (!string.IsNullOrEmpty(param.Key) && param.Key.StartsWith("vnp_"))
                    {
                        vnpay.AddResponseData(param.Key, param.Value);
                    }
                }

                var vnpSecureHash = queryParams.ContainsKey("vnp_SecureHash") 
                    ? queryParams["vnp_SecureHash"] 
                    : string.Empty;
                var responseCode = queryParams.ContainsKey("vnp_ResponseCode") 
                    ? queryParams["vnp_ResponseCode"] 
                    : string.Empty;

                bool checkSignature = vnpay.ValidateSignature(vnpSecureHash, vnpayHashSecret);

                if (checkSignature && responseCode == "00")
                {
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating VNPay callback");
                return false;
            }
        }

        public Task<PaymentResponseDto> CreateMoMoPaymentAsync(PaymentRequestDto request)
        {
            throw new NotImplementedException("MoMo payment not implemented in VNPayService");
        }

        public Task<bool> ValidateMoMoCallbackAsync(Dictionary<string, string> queryParams)
        {
            throw new NotImplementedException("MoMo validation not implemented in VNPayService");
        }

        private string GetIpAddress()
        {
            try
            {
                var host = Dns.GetHostEntry(Dns.GetHostName());
                foreach (var ip in host.AddressList)
                {
                    if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                    {
                        return ip.ToString();
                    }
                }
                return "127.0.0.1";
            }
            catch
            {
                return "127.0.0.1";
            }
        }
    }

    // VNPay Helper Library
    public class VNPayLibrary
    {
        private readonly SortedList<string, string> _requestData = new SortedList<string, string>(new VnPayComparer());
        private readonly SortedList<string, string> _responseData = new SortedList<string, string>(new VnPayComparer());

        public void AddRequestData(string key, string value)
        {
            if (!string.IsNullOrEmpty(value))
            {
                _requestData.Add(key, value);
            }
        }

        public void AddResponseData(string key, string value)
        {
            if (!string.IsNullOrEmpty(value))
            {
                _responseData.Add(key, value);
            }
        }

        public string CreateRequestUrl(string baseUrl, string vnpHashSecret)
        {
            var data = new StringBuilder();

            foreach (var kv in _requestData)
            {
                if (!string.IsNullOrEmpty(kv.Value))
                {
                    data.Append(WebUtility.UrlEncode(kv.Key) + "=" + WebUtility.UrlEncode(kv.Value) + "&");
                }
            }

            string queryString = data.ToString();

            if (queryString.Length > 0)
            {
                queryString = queryString.Remove(queryString.Length - 1, 1);
            }

            string signData = queryString;
            string vnpSecureHash = HmacSHA512(vnpHashSecret, signData);
            
            return baseUrl + "?" + queryString + "&vnp_SecureHash=" + vnpSecureHash;
        }

        public bool ValidateSignature(string inputHash, string secretKey)
        {
            var rspRaw = GetResponseData();
            var myChecksum = HmacSHA512(secretKey, rspRaw);
            return myChecksum.Equals(inputHash, StringComparison.InvariantCultureIgnoreCase);
        }

        private string HmacSHA512(string key, string inputData)
        {
            var hash = new StringBuilder();
            var keyBytes = Encoding.UTF8.GetBytes(key);
            var inputBytes = Encoding.UTF8.GetBytes(inputData);
            
            using (var hmac = new HMACSHA512(keyBytes))
            {
                var hashValue = hmac.ComputeHash(inputBytes);
                foreach (var theByte in hashValue)
                {
                    hash.Append(theByte.ToString("x2"));
                }
            }

            return hash.ToString();
        }

        private string GetResponseData()
        {
            var data = new StringBuilder();
            if (_responseData.ContainsKey("vnp_SecureHashType"))
            {
                _responseData.Remove("vnp_SecureHashType");
            }

            if (_responseData.ContainsKey("vnp_SecureHash"))
            {
                _responseData.Remove("vnp_SecureHash");
            }

            foreach (var kv in _responseData)
            {
                if (!string.IsNullOrEmpty(kv.Value))
                {
                    data.Append(WebUtility.UrlEncode(kv.Key) + "=" + WebUtility.UrlEncode(kv.Value) + "&");
                }
            }

            if (data.Length > 0)
            {
                data.Remove(data.Length - 1, 1);
            }

            return data.ToString();
        }
    }

    public class VnPayComparer : IComparer<string>
    {
        public int Compare(string x, string y)
        {
            if (x == y) return 0;
            if (x == null) return -1;
            if (y == null) return 1;
            
            var vnpCompare = CompareInfo.GetCompareInfo("en-US");
            return vnpCompare.Compare(x, y, CompareOptions.Ordinal);
        }
    }
}