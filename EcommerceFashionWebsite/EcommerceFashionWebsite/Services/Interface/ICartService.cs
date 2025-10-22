namespace EcommerceFashionWebsite.Services.Interface;

using EcommerceFashionWebsite.DTOs;

public interface ICartService
{
    Task<List<CartItemDetailDto>> GetCartItemsAsync(string orderId);
    Task AddToCartAsync(string orderId, string productId, int quantity);
    Task UpdateCartQuantityAsync(string orderId, string productId, int quantity);
    Task RemoveFromCartAsync(string orderId, string productId);
    Task<int> GetCartTotalItemsAsync(string orderId);
    Task ClearCartAsync(string orderId);
}