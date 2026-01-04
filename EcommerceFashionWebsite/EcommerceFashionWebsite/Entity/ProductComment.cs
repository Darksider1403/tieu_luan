using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcommerceFashionWebsite.Entity
{
    [Table("product_comments")]
    public class ProductComment
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("product_id")]
        [Required]
        [MaxLength(50)]
        public string ProductId { get; set; } = string.Empty;

        [Column("user_id")]
        [Required]
        public int UserId { get; set; }

        [Column("comment")]
        [Required]
        public string Comment { get; set; } = string.Empty;

        [Column("parent_id")]
        public int? ParentId { get; set; } // For replies

        [Column("is_verified_purchase")]
        public bool IsVerifiedPurchase { get; set; } = false;

        [Column("helpful_count")]
        public int HelpfulCount { get; set; } = 0;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        [Column("status")]
        public int Status { get; set; } = 1; // 0=deleted, 1=active, 2=pending

        // Navigation properties
        [ForeignKey("ProductId")]
        public virtual Product? Product { get; set; }

        [ForeignKey("UserId")]
        public virtual Account? User { get; set; }

        [ForeignKey("ParentId")]
        public virtual ProductComment? ParentComment { get; set; }

        public virtual ICollection<ProductComment> Replies { get; set; } = new List<ProductComment>();
    }
}