using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcommerceFashionWebsite.Entity
{
    [Table("order_items")]  // Change to match your actual table name
    public class OrderItem
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("orderId")]  // Change column name to match your database
        public int OrderId { get; set; }

        [Column("productId")]  // Change column name to match your database
        public int ProductId { get; set; }

        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Column("price")]
        public double Price { get; set; }

        [Column("state")]
        public string State { get; set; } = string.Empty;

        [Column("quantity")]
        public int Quantity { get; set; }

        public OrderItem()
        {
        }

        public OrderItem(int id, int orderId, int productId, string name, double price, string state, int quantity)
        {
            Id = id;
            OrderId = orderId;
            ProductId = productId;
            Name = name;
            Price = price;
            State = state;
            Quantity = quantity;
        }

        public override string ToString()
        {
            return $"OrderItem{{id={Id}, orderId={OrderId}, productId={ProductId}, " +
                   $"name='{Name}', price={Price}, state='{State}', quantity={Quantity}}}";
        }

        public override bool Equals(object? obj)
        {
            if (this == obj) return true;
            if (obj == null || GetType() != obj.GetType()) return false;
            OrderItem orderItem = (OrderItem)obj;
            return Id == orderItem.Id;
        }

        public override int GetHashCode()
        {
            return Id.GetHashCode();
        }
    }
}