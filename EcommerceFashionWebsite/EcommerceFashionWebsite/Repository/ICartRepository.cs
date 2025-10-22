using EcommerceFashionWebsite.Entity;

namespace EcommerceFashionWebsite.Repository;

public interface ICartRepository
{
    Task<List<Cart>> GetCartByOrderIdAsync(string orderId);
    Task<Cart?> GetCartItemAsync(string orderId, string productId);
    Task AddToCartAsync(Cart cart);
    Task UpdateCartItemAsync(Cart cart);
    Task RemoveFromCartAsync(string orderId, string productId);
    Task<bool> CartItemExistsAsync(string orderId, string productId);
    Task SaveChangesAsync();
}