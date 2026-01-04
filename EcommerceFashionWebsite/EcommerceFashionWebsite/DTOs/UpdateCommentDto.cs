using System.ComponentModel.DataAnnotations;

namespace EcommerceFashionWebsite.DTOs;

public class UpdateCommentDto
{
    [Required]
    [StringLength(1000, MinimumLength = 5)]
    public string Comment { get; set; } = string.Empty;
}