using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcommerceFashionWebsite.Entity;

[Table("product_comments")]
public class ProductComment
{
    [Key] [Column("id")] public int Id { get; set; }

    [Column("productId")] public string ProductId { get; set; } = string.Empty;

    [Column("accountId")] public int AccountId { get; set; }

    [Column("content")] public string Content { get; set; } = string.Empty;

    [Column("rating")] public int Rating { get; set; }

    [Column("dateComment")] public DateTime DateComment { get; set; } = DateTime.Now;

    [Column("status")] public int Status { get; set; } = 1; // 1 = approved, 0 = pending

    // Navigation properties
    [NotMapped] public Product? Product { get; set; }

    [NotMapped] public Account? Account { get; set; }
}