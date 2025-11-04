using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcommerceFashionWebsite.Entity
{
    [Table("carts")]
    public class Cart
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("idProduct")]
        [StringLength(50)]
        [Required]
        public string IdProduct { get; set; } = string.Empty;

        [Column("quantity")]
        [Required]
        public int Quantity { get; set; }

        [Column("idAccount")]
        public int? IdAccount { get; set; }

        [Column("idOrder")]
        [StringLength(50)]
        public string? IdOrder { get; set; }

        [Column("price")]
        [Required]
        public int Price { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.Now;
        
        public virtual Product? Product { get; set; }
        public virtual Account? Account { get; set; }
        public virtual Order? Order { get; set; }

        public Cart()
        {
        }

        public Cart(string idProduct, int quantity, int? idAccount, string? idOrder, int price)
        {
            IdProduct = idProduct;
            Quantity = quantity;
            IdAccount = idAccount;
            IdOrder = idOrder;
            Price = price;
        }

        public override string ToString()
        {
            return $"Cart{{Id={Id}, IdProduct='{IdProduct}', Quantity={Quantity}, " +
                   $"IdAccount={IdAccount}, IdOrder='{IdOrder}', Price={Price}}}";
        }
    }
}