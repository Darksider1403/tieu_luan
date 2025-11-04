namespace EcommerceFashionWebsite.DTOs;

public class CartItemDetailDto
{
    public string ProductId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Price { get; set; }
    public int Quantity { get; set; }
    public string ThumbnailImage { get; set; } = string.Empty;
    public string Material { get; set; } = string.Empty;
    public string Size { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int TotalPrice { get; set; }
}