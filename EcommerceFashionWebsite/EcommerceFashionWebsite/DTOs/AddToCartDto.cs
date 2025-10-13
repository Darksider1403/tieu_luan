namespace EcommerceFashionWebsite.DTOs;

public class AddToCartDto
{
    public string ProductId { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
}