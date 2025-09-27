using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcommerceFashionWebsite.Entity
{
    [Table("purchases")]
    public class Purchases
    {
        [Key]
        [Column("purchaseID")]
        public int PurchaseID { get; set; }

        [Column("userID")]
        public int UserID { get; set; }

        [Column("productID")]
        public int ProductID { get; set; }

        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Column("quantity")]
        public int Quantity { get; set; }

        [Column("price")]
        public int Price { get; set; }

        [Column("status")]
        public int Status { get; set; }

        [Column("orderDate")]
        public DateTime? OrderDate { get; set; }

        [Column("receivedDate")]
        public DateTime? ReceivedDate { get; set; }

        [Column("starNumber")]
        public int StarNumber { get; set; }

        [Column("content")]
        public string Content { get; set; } = string.Empty;

        [Column("dateRated")]
        public DateTime? DateRated { get; set; }

        public Purchases()
        {
        }

        public string GetStatusString()
        {
            return Status switch
            {
                -1 => "Hủy đơn hàng",
                0 => "Chờ xác nhận", 
                1 => "Đang giao",
                2 => "Giao thành công",
                _ => "Không xác định"
            };
        }
    }
}