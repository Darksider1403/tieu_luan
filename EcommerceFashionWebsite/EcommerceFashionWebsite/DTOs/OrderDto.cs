namespace EcommerceFashionWebsite.DTOs;

public class OrderDto
{
    public string Id { get; set; } = string.Empty;
    public string Fullname { get; set; } = string.Empty;
    public DateTime DateBuy { get; set; }
    public DateTime DateArrival { get; set; }
    public string Address { get; set; } = string.Empty;
    public string NumberPhone { get; set; } = string.Empty;
    public int Status { get; set; }
    public bool IsVerified { get; set; }
    public int TotalPrice { get; set; }
    public List<OrderDetailDto> OrderDetails { get; set; } = new();
}