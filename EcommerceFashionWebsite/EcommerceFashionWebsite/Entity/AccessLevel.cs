using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcommerceFashionWebsite.Entity;

[Table("access_levels")]
public class AccessLevel
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("role")]
    public int Role { get; set; }

    [Column("idAccount")]
    public int IdAccount { get; set; }
    
    [ForeignKey("IdAccount")]
    public virtual Account Account { get; set; } = null!;
}