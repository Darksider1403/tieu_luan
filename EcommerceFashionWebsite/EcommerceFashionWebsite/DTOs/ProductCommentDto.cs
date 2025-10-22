namespace EcommerceFashionWebsite.DTOs;

public class ProductCommentDto
{
    public string Username { get; set; }
    public string Content { get; set; }
    public int Rating { get; set; }
    public DateTime DateComment { get; set; }
    public string Avatar { get; set; }
}