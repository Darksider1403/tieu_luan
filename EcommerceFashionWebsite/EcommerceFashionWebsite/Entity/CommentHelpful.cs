using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcommerceFashionWebsite.Entity
{
    [Table("comment_helpful")]
    public class CommentHelpful
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("comment_id")]
        [Required]
        public int CommentId { get; set; }

        [Column("user_id")]
        [Required]
        public int UserId { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Navigation properties
        [ForeignKey("CommentId")]
        public virtual ProductComment? Comment { get; set; }

        [ForeignKey("UserId")]
        public virtual Account? User { get; set; }
    }
}