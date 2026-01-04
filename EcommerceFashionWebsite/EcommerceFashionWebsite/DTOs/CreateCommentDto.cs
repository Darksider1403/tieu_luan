using System.ComponentModel.DataAnnotations;

namespace EcommerceFashionWebsite.DTOs;

public class CreateCommentDto
{
    [Required(ErrorMessage = "Product ID is required")]
    public string ProductId { get; set; } = string.Empty;

    [Required(ErrorMessage = "Comment is required")]
    [StringLength(1000, MinimumLength = 5, ErrorMessage = "Comment must be between 5 and 1000 characters")]
    public string Comment { get; set; } = string.Empty;

    public int? ParentId { get; set; } // For replies
}