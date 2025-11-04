using EcommerceFashionWebsite.DTOs;

namespace EcommerceFashionWebsite.Services.Interface
{
    public interface IOrderService
    {
        Task<int> GetTotalOrdersAsync();
        Task<OrderDto?> GetOrderByIdAsync(string orderId);
        Task<List<OrderDto>> GetOrdersByAccountIdAsync(int accountId);
        Task<string> CreateOrderAsync(int userId, CreateOrderDto dto);
        Task<bool> UpdateOrderStatusAsync(string orderId, int status);
        Task<List<OrderDto>> GetAllOrdersAsync();
        Task<int> GetTotalProductSoldByCategoryAsync(int categoryId, DateTime fromDate);
        Task<int> GetRevenueByCategoryAsync(int categoryId, DateTime fromDate);
    }
}