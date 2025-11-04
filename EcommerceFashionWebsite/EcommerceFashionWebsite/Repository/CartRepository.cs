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

    // ==================== USER CART METHODS (Shopping Cart) ====================
    
    public async Task<List<Cart>> GetUserCartItemsAsync(int userId)
    {
        try
        {
            return await _context.Carts
                .Where(c => c.IdAccount == userId && c.IdOrder == null)
                .Include(c => c.Product)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cart items for user {UserId}", userId);
            throw;
        }
    }

    public async Task<Cart?> GetUserCartItemAsync(int userId, string productId)
    {
        try
        {
            return await _context.Carts
                .FirstOrDefaultAsync(c => c.IdAccount == userId 
                                       && c.IdProduct == productId 
                                       && c.IdOrder == null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cart item {ProductId} for user {UserId}", productId, userId);
            throw;
        }
    }

    public async Task AddToUserCartAsync(Cart cart)
    {
        try
        {
            // Create a NEW cart object to ensure clean state
            var newCart = new Cart
            {
                // DO NOT set Id - let it auto-increment
                IdProduct = cart.IdProduct,
                Quantity = cart.Quantity,
                IdAccount = cart.IdAccount,
                IdOrder = null, // EXPLICITLY set to null
                Price = cart.Price,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
        
            _logger.LogInformation("Adding cart item: Product={ProductId}, Account={AccountId}, Order={OrderId}", 
                newCart.IdProduct, newCart.IdAccount, newCart.IdOrder ?? "NULL");
        
            await _context.Carts.AddAsync(newCart);
            await _context.SaveChangesAsync();
        
            _logger.LogInformation("Successfully added cart item with ID: {CartId}", newCart.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding to user cart");
            throw;
        }
    }

    public async Task UpdateUserCartItemAsync(Cart cart)
    {
        try
        {
            cart.UpdatedAt = DateTime.Now;
            _context.Carts.Update(cart);
            await SaveChangesAsync();
            
            _logger.LogInformation("Updated cart item {CartId} for user {UserId}", 
                cart.Id, cart.IdAccount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user cart item");
            throw;
        }
    }

    public async Task RemoveFromUserCartAsync(int userId, string productId)
    {
        try
        {
            var cartItem = await GetUserCartItemAsync(userId, productId);
            if (cartItem != null)
            {
                _context.Carts.Remove(cartItem);
                await SaveChangesAsync();
                
                _logger.LogInformation("Removed product {ProductId} from user {UserId} cart", 
                    productId, userId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing from user cart");
            throw;
        }
    }

    public async Task ClearUserCartAsync(int userId)
    {
        try
        {
            var cartItems = await _context.Carts
                .Where(c => c.IdAccount == userId && c.IdOrder == null)
                .ToListAsync();

            if (cartItems.Any())
            {
                _context.Carts.RemoveRange(cartItems);
                await SaveChangesAsync();
                
                _logger.LogInformation("Cleared cart for user {UserId}, removed {Count} items", 
                    userId, cartItems.Count);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing user cart");
            throw;
        }
    }

    public async Task<int> GetUserCartCountAsync(int userId)
    {
        try
        {
            return await _context.Carts
                .Where(c => c.IdAccount == userId && c.IdOrder == null)
                .SumAsync(c => c.Quantity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cart count for user {UserId}", userId);
            return 0;
        }
    }

    public async Task<bool> CartItemExistsAsync(int userId, string productId)
    {
        try
        {
            return await _context.Carts
                .AnyAsync(c => c.IdAccount == userId 
                            && c.IdProduct == productId 
                            && c.IdOrder == null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if cart item exists");
            return false;
        }
    }

    // ==================== ORDER METHODS (After Checkout) ====================
    
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
            _logger.LogError(ex, "Error getting cart item {ProductId} for order {OrderId}", 
                productId, orderId);
            throw;
        }
    }

    public async Task ConvertUserCartToOrderAsync(int userId, string orderId)
    {
        try
        {
            var cartItems = await _context.Carts
                .Where(c => c.IdAccount == userId && c.IdOrder == null)
                .ToListAsync();

            if (!cartItems.Any())
            {
                throw new InvalidOperationException("No cart items to convert to order");
            }

            foreach (var item in cartItems)
            {
                item.IdOrder = orderId;
                item.UpdatedAt = DateTime.Now;
            }

            _context.Carts.UpdateRange(cartItems);
            await SaveChangesAsync();
            
            _logger.LogInformation("Converted {Count} cart items to order {OrderId} for user {UserId}", 
                cartItems.Count, orderId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error converting cart to order");
            throw;
        }
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}