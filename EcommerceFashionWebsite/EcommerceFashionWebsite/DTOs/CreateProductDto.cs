namespace EcommerceFashionWebsite.DTOs;

public class CreateProductDto
{
    public string Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Price { get; set; }
    public int Quantity { get; set; }
    public string Material { get; set; } = string.Empty;
    public string Size { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public int IdCategory { get; set; }
}