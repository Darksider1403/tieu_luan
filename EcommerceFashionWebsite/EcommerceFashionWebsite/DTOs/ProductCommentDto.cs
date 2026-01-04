namespace EcommerceFashionWebsite.DTOs;

public class ProductCommentDto
{
    public int Id { get; set; }
    public string ProductId { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserAvatar { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public int? ParentId { get; set; }
    public bool IsVerifiedPurchase { get; set; }
    public int HelpfulCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsHelpfulByCurrentUser { get; set; } = false;
    public bool CanEdit { get; set; } = false;
    public bool CanDelete { get; set; } = false;
    public List<ProductCommentDto> Replies { get; set; } = new();
}