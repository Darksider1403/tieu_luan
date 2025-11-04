namespace EcommerceFashionWebsite.DTOs;

public class ProductRatingInfoDto
{
    public double AverageRating { get; set; }
    public int TotalRatings { get; set; }
    public Dictionary<int, int> RatingDistribution { get; set; } = new(); 
    public bool CanUserRate { get; set; }
    public bool HasUserRated { get; set; }
    public int? UserRating { get; set; }
}