using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcommerceFashionWebsite.Entity
{
    [Table("chat_messages")]
    public class ChatMessage
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("userId")]
        [Required]
        public int UserId { get; set; }

        [Column("userMessage")]
        [Required]
        public string UserMessage { get; set; } = string.Empty;

        [Column("botResponse")]
        [Required]
        public string BotResponse { get; set; } = string.Empty;

        [Column("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.Now;

        [ForeignKey("UserId")]
        public virtual Account? User { get; set; }
    }
}