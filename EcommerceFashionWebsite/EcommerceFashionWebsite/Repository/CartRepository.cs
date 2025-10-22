namespace EcommerceFashionWebsite.Repository;

using EcommerceFashionWebsite.Data;
using EcommerceFashionWebsite.Entity;
using Microsoft.EntityFrameworkCore;


public class CartRepository : ICartRepository
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<CartRepository> _logger;

    public CartRepository(ApplicationDbContext context, ILogger<CartRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<Cart>> GetCartByOrderIdAsync(string orderId)
    {
        try
        {
            return await _context.Carts
                .Where(c => c.IdOrder == orderId)
                .Include(c => c.Product)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cart items for order {OrderId}", orderId);
            throw;
        }
    }

    public async Task<Cart?> GetCartItemAsync(string orderId, string productId)
    {
        try
        {
            return await _context.Carts
                .FirstOrDefaultAsync(c => c.IdOrder == orderId && c.IdProduct == productId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cart item {ProductId} for order {OrderId}", productId, orderId);
            throw;
        }
    }

    public async Task AddToCartAsync(Cart cart)
    {
        try
        {
            await _context.Carts.AddAsync(cart);
            await SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding to cart");
            throw;
        }
    }

    public async Task UpdateCartItemAsync(Cart cart)
    {
        try
        {
            _context.Carts.Update(cart);
            await SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating cart item");
            throw;
        }
    }

    public async Task RemoveFromCartAsync(string orderId, string productId)
    {
        try
        {
            var cartItem = await GetCartItemAsync(orderId, productId);
            if (cartItem != null)
            {
                _context.Carts.Remove(cartItem);
                await SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing cart item");
            throw;
        }
    }

    public async Task<bool> CartItemExistsAsync(string orderId, string productId)
    {
        try
        {
            return await _context.Carts
                .AnyAsync(c => c.IdOrder == orderId && c.IdProduct == productId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if cart item exists");
            throw;
        }
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}