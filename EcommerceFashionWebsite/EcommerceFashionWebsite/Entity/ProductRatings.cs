using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcommerceFashionWebsite.Entity
{
    [Table("product_ratings")]
    public class ProductRating
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("productId")]
        [StringLength(10)]
        [Required]
        public string ProductId { get; set; } = string.Empty;

        [Column("accountId")]
        [Required]
        public int AccountId { get; set; }

        [Column("rating")]
        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        [Column("dateRating")]
        public DateTime DateRating { get; set; } = DateTime.Now;

        // Navigation properties
        [ForeignKey("ProductId")]
        public virtual Product? Product { get; set; }

        [ForeignKey("AccountId")]
        public virtual Account? Account { get; set; }
    }
}