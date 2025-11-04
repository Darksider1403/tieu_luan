using EcommerceFashionWebsite.Entity;

namespace EcommerceFashionWebsite.Repository;

public interface ICartRepository
{
    // User cart methods (before checkout)
    Task<List<Cart>> GetUserCartItemsAsync(int userId);
    Task<Cart?> GetUserCartItemAsync(int userId, string productId);
    Task AddToUserCartAsync(Cart cart);
    Task UpdateUserCartItemAsync(Cart cart);
    Task RemoveFromUserCartAsync(int userId, string productId);
    Task ClearUserCartAsync(int userId);
    Task<int> GetUserCartCountAsync(int userId);
    
    // Order cart methods (after checkout)
    Task<List<Cart>> GetCartByOrderIdAsync(string orderId);
    Task<Cart?> GetCartItemAsync(string orderId, string productId);
    Task ConvertUserCartToOrderAsync(int userId, string orderId);
    
    // Common methods
    Task<bool> CartItemExistsAsync(int userId, string productId);
    Task SaveChangesAsync();
}