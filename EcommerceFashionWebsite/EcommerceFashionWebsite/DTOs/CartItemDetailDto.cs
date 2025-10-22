namespace EcommerceFashionWebsite.DTOs;

public class CartItemDetailDto
{
    public string ProductId { get; set; }
    public string Name { get; set; }
    public int Price { get; set; }
    public int Quantity { get; set; }
    public string ThumbnailImage { get; set; }
    public string Material { get; set; }
    public string Size { get; set; }
    public string Color { get; set; }
}