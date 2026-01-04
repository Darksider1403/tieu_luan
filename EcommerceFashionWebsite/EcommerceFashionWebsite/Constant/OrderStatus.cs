namespace EcommerceFashionWebsite.Constant;

public enum OrderStatus
{
    Pending = 0,           // Đang chờ xử lý
    Confirmed = 1,         // Đã xác nhận
    Processing = 2,        // Đang xử lý
    Shipped = 3,           // Đang giao hàng
    Delivered = 4,         // Đã giao hàng (USER CAN RATE)
    Cancelled = 5,         // Đã hủy
    Refunded = 6          // Đã hoàn tiền
}