namespace EcommerceFashionWebsite.DTOs;

public class CreateOrderDto
{
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string PaymentMethod { get; set; } = "COD"; // COD, VNPAY, MOMO
    public decimal TotalAmount { get; set; }
    public decimal ShippingFee { get; set; }
}