namespace EcommerceFashionWebsite.DTOs;

public class CreateOrderDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string NumberPhone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string? District { get; set; }
    public string? Ward { get; set; }
    public string? Notes { get; set; }
    public string PaymentMethod { get; set; } = "COD"; // COD, VNPAY, MOMO
    public List<OrderItemDto> Items { get; set; } = new List<OrderItemDto>();
    public decimal TotalAmount { get; set; }
    public decimal ShippingFee { get; set; }
}