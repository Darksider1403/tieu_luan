using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcommerceFashionWebsite.Entity
{
    [Table("verify_emails")]
    public class VerifyEmail
    {
        [Key] [Column("id")] public int Id { get; set; }

        [Column("code")] public string Code { get; set; } = string.Empty;

        [Column("dateCreated")] public DateTime DateCreated { get; set; }

        [Column("dateExpired")] public DateTime DateExpired { get; set; }

        [Column("status")] public bool Status { get; set; }

        [Column("idAccount")] public int IdAccount { get; set; }

        // Navigation property
        [ForeignKey("IdAccount")] public virtual Account Account { get; set; } = null!;
    }
}