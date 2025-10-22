using EcommerceFashionWebsite.Entity;

namespace EcommerceFashionWebsite.Repository
{
    public interface IOrderRepository
    {
        Task<int> GetTotalOrdersAsync();
        Task<int> GetTotalOrdersBySearchAsync(string search);
        Task<Order?> GetOrderByIdAsync(string orderId);
        Task<List<Order>> GetOrdersByAccountIdAsync(int accountId);
        Task<List<Cart>> GetOrderDetailsAsync(string orderId);
        Task<int> GetTotalPriceOrderDetailAsync(string orderId);
        Task<string> CreateOrderAsync(Order order);
        Task<bool> AddOrderDetailAsync(Cart cart);
        Task<bool> UpdateOrderStatusAsync(string orderId, int status);
        Task<List<Order>> GetAllOrdersAsync();
        Task<int> GetTotalProductSoldByCategoryAsync(int categoryId, DateTime fromDate);
        Task<int> GetRevenueByCategoryAsync(int categoryId, DateTime fromDate);
        Task<bool> OrderExistsAsync(string orderId);
    }
}