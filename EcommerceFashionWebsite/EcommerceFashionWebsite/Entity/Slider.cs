using System.ComponentModel.DataAnnotations.Schema;

namespace EcommerceFashionWebsite.Entity
{
    [Table("slider_imgs")]
    public class Slider
    {
        [Column("id")]
        public int Id { get; set; }
        
        [Column("source")]
        public string Source { get; set; } = string.Empty;

        public Slider()
        {
        }

        public Slider(int id, string source)
        {
            Id = id;
            Source = source;
        }
    }
}