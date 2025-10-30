namespace EcommerceFashionWebsite.DTOs;

public class PaymentResponseDto
{
    public bool Success { get; set; }
    public string PaymentUrl { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}