namespace EcommerceFashionWebsite.DTOs;

public class CartItemDto
{
    public int Id { get; set; }
    public string ProductId { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public int Price { get; set; }
    public int Quantity { get; set; }
    public int TotalPrice { get; set; }
    public string? ThumbnailImage { get; set; }
}