using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcommerceFashionWebsite.Entity
{
    [Table("products")]
    public class Product
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Column("price")]
        public int Price { get; set; }

        [Column("quantity")]
        public int Quantity { get; set; }

        [Column("material")]
        public string Material { get; set; } = string.Empty;

        [Column("size")]
        public string Size { get; set; } = string.Empty;

        [Column("color")]
        public string Color { get; set; } = string.Empty;

        [Column("gender")]
        public string Gender { get; set; } = string.Empty;

        [Column("status")]
        public int Status { get; set; }

        [Column("idCategory")]  
        public int IdCategory { get; set; }

        public Product()
        {
        }

        public Product(string id, string name, int price, int quantity, string material, string size, string color, string gender, int status, int idCategory)
        {
            Id = id;
            Name = name;
            Price = price;
            Quantity = quantity;
            Material = material;
            Size = size;
            Color = color;
            Gender = gender;
            Status = status;
            IdCategory = idCategory;
        }
    }
}