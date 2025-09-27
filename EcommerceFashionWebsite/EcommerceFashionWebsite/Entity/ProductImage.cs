using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcommerceFashionWebsite.Entity
{
    [Table("images")]
    public class ProductImage
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("idProduct")]
        [StringLength(50)]
        public string ProductId { get; set; }

        [Column("source")]
        [StringLength(500)]
        public string Source { get; set; } = string.Empty;

        [Column("is_thumbnail_image")]
        public bool IsThumbnailImage { get; set; }

        // Navigation property
        [ForeignKey("ProductId")]
        public virtual Product Product { get; set; } = null!;
    }
}