using EcommerceFashionWebsite.DTOs;

namespace EcommerceFashionWebsite.Services.Interface;

public interface IPaymentService
{
    Task<PaymentResponseDto> CreateVNPayPaymentAsync(PaymentRequestDto request);
    Task<PaymentResponseDto> CreateMoMoPaymentAsync(PaymentRequestDto request);
    Task<bool> ValidateVNPayCallbackAsync(Dictionary<string, string> queryParams);
    Task<bool> ValidateMoMoCallbackAsync(Dictionary<string, string> queryParams);
}