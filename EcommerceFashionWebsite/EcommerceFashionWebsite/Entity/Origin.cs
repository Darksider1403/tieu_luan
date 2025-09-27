using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcommerceFashionWebsite.Entity
{
    [Table("origins")]  // Change to match your actual table name
    public class Origin
    {
        [Key]
        [Column("originID")]
        public int OriginID { get; set; }

        [Column("name")]
        public string Name { get; set; } = string.Empty;

        public Origin()
        {
        }

        public override string ToString()
        {
            return $"Origin{{originID={OriginID}, name='{Name}'}}";
        }
    }
}