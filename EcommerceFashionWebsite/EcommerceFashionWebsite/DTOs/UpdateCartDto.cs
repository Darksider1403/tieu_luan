namespace EcommerceFashionWebsite.DTOs;

public class UpdateCartDto
{
    public string ProductId { get; set; } = string.Empty;
    public int Quantity { get; set; }
}