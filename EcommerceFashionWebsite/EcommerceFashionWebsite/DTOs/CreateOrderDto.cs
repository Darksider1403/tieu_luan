namespace EcommerceFashionWebsite.DTOs;

public class CreateOrderDto
{
    public string Address { get; set; } = string.Empty;
    public string NumberPhone { get; set; } = string.Empty;
    public List<OrderItemDto> Items { get; set; } = new();
}