namespace EcommerceFashionWebsite.DTOs;

public class ProductDto
{
    public string Id { get; set; } = string.Empty;  // Make sure this exists!
    public string Name { get; set; } = string.Empty;
    public int Price { get; set; }
    public int Quantity { get; set; }
    public string Material { get; set; } = string.Empty;
    public string Size { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public int IdCategory { get; set; }
    public int Status { get; set; }
    public string ThumbnailImage { get; set; } = string.Empty;
    
    public string? CategoryName { get; set; }
    public int? CategoryId { get; set; }
    public string? Description { get; set; }
    
    public double AverageRating { get; set; }
    public int TotalRatings { get; set; }
    public bool HasUserRated { get; set; }
    public int? UserRating { get; set; }
    public bool CanUserRate { get; set; } 
}