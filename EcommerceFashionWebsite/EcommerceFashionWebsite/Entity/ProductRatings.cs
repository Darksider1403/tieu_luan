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

        [Column("idProduct")]
        [StringLength(50)]
        public string ProductId { get; set; }

        [Column("rating")]
        public int Rating { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        // Navigation properties
        [ForeignKey("ProductId")]
        public virtual Product Product { get; set; } = null!;
    }
}