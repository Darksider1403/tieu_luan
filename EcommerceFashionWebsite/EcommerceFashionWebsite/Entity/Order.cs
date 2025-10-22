using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcommerceFashionWebsite.Entity
{
    [Table("orders")]
    public class Order
    {
        [Key] 
        [Column("id")] 
        public string Id { get; set; } = string.Empty;

        [Column("address")] 
        public string Address { get; set; } = string.Empty;

        [Column("numberPhone")] 
        public string NumberPhone { get; set; } = string.Empty;

        [Column("status")] 
        public int Status { get; set; }

        [Column("dateBuy")] 
        public DateTime? DateBuy { get; set; }

        [Column("dateArrival")] 
        public DateTime? DateArrival { get; set; }

        [Column("idAccount")] 
        public int? IdAccount { get; set; }

        [Column("is_verified")] 
        public bool IsVerified { get; set; }

        // Navigation properties - REMOVED [NotMapped]
        [ForeignKey("IdAccount")]
        public virtual Account? Account { get; set; }
        
        public virtual ICollection<Cart> OrderDetail { get; set; } = new List<Cart>();

        public Order()
        {
        }

        public Order(string id, string address, string numberPhone, int status, DateTime? dateBuy,
            DateTime? dateArrival, int? idAccount, bool isVerified)
        {
            Id = id;
            Address = address;
            NumberPhone = numberPhone;
            Status = status;
            DateBuy = dateBuy;
            DateArrival = dateArrival;
            IdAccount = idAccount;
            IsVerified = isVerified;
        }

        public override bool Equals(object? obj)
        {
            if (this == obj) return true;
            if (obj == null || GetType() != obj.GetType()) return false;
            Order order = (Order)obj;
            return Id == order.Id;
        }

        public override int GetHashCode()
        {
            return Id.GetHashCode();
        }
    }
}