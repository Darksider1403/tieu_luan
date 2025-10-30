namespace EcommerceFashionWebsite.DTOs;

public class PaymentRequestDto
{
    public string OrderId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty; // VNPAY or MOMO
    public string ReturnUrl { get; set; } = string.Empty;
}