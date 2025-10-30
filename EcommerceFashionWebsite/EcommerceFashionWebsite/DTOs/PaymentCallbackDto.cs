namespace EcommerceFashionWebsite.DTOs;

public class PaymentCallbackDto
{
    public string OrderId { get; set; } = string.Empty;
    public string TransactionId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string ResponseCode { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}