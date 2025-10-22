using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcommerceFashionWebsite.Entity
{
    [Table("carts")]
    public class Cart
    {
        [Column("idOrder")]
        public string IdOrder { get; set; } = string.Empty;

        [Column("idProduct")]
        public string IdProduct { get; set; } = string.Empty;

        [Column("quantity")]
        public int Quantity { get; set; }

        [Column("price")]
        public int Price { get; set; }
        
        [ForeignKey("IdProduct")]
        public Product? Product { get; set; }
        
        [ForeignKey("IdOrder")]
        public Order? Order { get; set; }

        public Cart()
        {
        }

        public Cart(string idOrder, string idProduct, int quantity, int price)
        {
            IdOrder = idOrder;
            IdProduct = idProduct;
            Quantity = quantity;
            Price = price;
        }
    }
}