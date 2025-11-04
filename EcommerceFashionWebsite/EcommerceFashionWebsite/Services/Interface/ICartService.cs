namespace EcommerceFashionWebsite.Services.Interface;

using EcommerceFashionWebsite.DTOs;

public interface ICartService
{
    // User cart operations (shopping cart)
    Task AddToUserCartAsync(int userId, string productId, int quantity);
    Task<List<CartItemDetailDto>> GetUserCartItemsAsync(int userId);
    Task UpdateUserCartQuantityAsync(int userId, string productId, int quantity);
    Task RemoveFromUserCartAsync(int userId, string productId);
    Task ClearUserCartAsync(int userId);
    Task<int> GetUserCartCountAsync(int userId);
    
    // Order operations (after checkout)
    Task<List<CartItemDetailDto>> GetOrderItemsAsync(string orderId);
    Task ConvertCartToOrderAsync(int userId, string orderId);
}