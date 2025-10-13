namespace EcommerceFashionWebsite.DTOs;

public class OrderDetailDto
{
    public string IdOrder { get; set; } = string.Empty;
    public string IdProduct { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int Price { get; set; }
}