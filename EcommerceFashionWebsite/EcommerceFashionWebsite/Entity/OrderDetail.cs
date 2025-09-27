using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcommerceFashionWebsite.Entity
{
    [Table("order_details")]
    public class OrderDetail
    {
        [Column("idOrder")]
        public string IdOrder { get; set; } = string.Empty;

        [Column("idProduct")]
        public string IdProduct { get; set; } = string.Empty;

        [Column("quantity")]
        public int Quantity { get; set; }

        [Column("price")]
        public int Price { get; set; }
        
        [NotMapped]
        public Product? Product { get; set; }

        public OrderDetail()
        {
        }

        public OrderDetail(string idOrder, string idProduct, int quantity, int price)
        {
            IdOrder = idOrder;
            IdProduct = idProduct;
            Quantity = quantity;
            Price = price;
        }
    }
}