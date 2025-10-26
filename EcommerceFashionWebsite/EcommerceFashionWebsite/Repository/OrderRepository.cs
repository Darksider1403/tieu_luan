using Microsoft.EntityFrameworkCore;
using EcommerceFashionWebsite.Data;
using EcommerceFashionWebsite.Entity;


namespace EcommerceFashionWebsite.Repository;

public class OrderRepository : IOrderRepository
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<OrderRepository> _logger;

    public OrderRepository(ApplicationDbContext context, ILogger<OrderRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<int> GetTotalOrdersAsync()
    {
        return await _context.Orders.CountAsync();
    }

    public async Task<int> GetTotalOrdersBySearchAsync(string search)
    {
        return await _context.Orders
            .Include(o => o.Account)
            .Where(o => o.Account != null && o.Account.Fullname.Contains(search))
            .CountAsync();
    }

    public async Task<Order?> GetOrderByIdAsync(string orderId)
    {
        return await _context.Orders
            .Include(o => o.Account)
            .Include(o => o.OrderDetail)
            .ThenInclude(od => od.Product)
            .FirstOrDefaultAsync(o => o.Id == orderId);
    }

    public async Task<List<Order>> GetOrdersByAccountIdAsync(int accountId)
    {
        return await _context.Orders
            .Include(o => o.OrderDetail)
            .Where(o => o.IdAccount == accountId)
            .OrderByDescending(o => o.DateBuy)
            .ToListAsync();
    }

    public async Task<List<Cart>> GetOrderDetailsAsync(string orderId)
    {
        return await _context.Carts
            .Include(od => od.Product)
            .Where(od => od.IdOrder == orderId)
            .ToListAsync();
    }

    public async Task<int> GetTotalPriceOrderDetailAsync(string orderId)
    {
        var total = await _context.Carts
            .Where(od => od.IdOrder == orderId)
            .SumAsync(od => od.Price);
        return total;
    }

    public async Task<string> CreateOrderAsync(Order order)
    {
        try
        {
            // Only generate order ID if not provided (empty or null)
            if (string.IsNullOrWhiteSpace(order.Id))
            {
                var count = await _context.Orders.CountAsync();
                order.Id = $"OR0{count + 1}";
            }

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Order created with ID: {OrderId}", order.Id);

            return order.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating order with ID: {OrderId}", order.Id);
            throw;
        }
    }

    public async Task<bool> AddOrderDetailAsync(Cart cart)
    {
        _context.Carts.Add(cart);
        var result = await _context.SaveChangesAsync();
        return result > 0;
    }

    public async Task<bool> UpdateOrderStatusAsync(string orderId, int status)
    {
        var order = await _context.Orders.FindAsync(orderId);
        if (order == null) return false;

        order.Status = status;
        var result = await _context.SaveChangesAsync();
        return result > 0;
    }

    public async Task<List<Order>> GetAllOrdersAsync()
    {
        return await _context.Orders
            .Include(o => o.Account)
            .Include(o => o.OrderDetail)
            .OrderByDescending(o => o.DateBuy)
            .ToListAsync();
    }

    public async Task<int> GetTotalProductSoldByCategoryAsync(int categoryId, DateTime fromDate)
    {
        var total = await _context.Carts
            .Include(od => od.Product)
            .Include(od => od.Order)
            .Where(od => od.Product != null &&
                         od.Product.IdCategory == categoryId &&
                         od.Order != null &&
                         od.Order.DateBuy >= fromDate &&
                         od.Order.Status == 1)
            .SumAsync(od => od.Quantity);

        return total;
    }

    public async Task<int> GetRevenueByCategoryAsync(int categoryId, DateTime fromDate)
    {
        var revenue = await _context.Carts
            .Include(od => od.Product)
            .Include(od => od.Order)
            .Where(od => od.Product != null &&
                         od.Product.IdCategory == categoryId &&
                         od.Order != null &&
                         od.Order.DateBuy >= fromDate &&
                         od.Order.Status == 1)
            .SumAsync(od => od.Price);

        return revenue;
    }

    public async Task<bool> OrderExistsAsync(string orderId)
    {
        return await _context.Orders.AnyAsync(o => o.Id == orderId);
    }

    public async Task<Order?> GetUserActiveOrderAsync(int accountId)
    {
        try
        {
            return await _context.Orders
                .Where(o => o.IdAccount == accountId && o.Status == 0)
                .OrderByDescending(o => o.DateBuy)
                .FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user active order for account {AccountId}", accountId);
            throw;
        }
    }

    public async Task<bool> MergeSessionCartWithUserCartAsync(string sessionOrderId, int accountId)
    {
        try
        {
            _logger.LogInformation("Starting cart merge - Session Order: {SessionOrderId}, User: {AccountId}",
                sessionOrderId, accountId);

            // Get session cart items
            var sessionCartItems = await _context.Carts
                .Where(c => c.IdOrder == sessionOrderId)
                .ToListAsync();

            if (!sessionCartItems.Any())
            {
                _logger.LogInformation("No items in session cart to merge");

                // Delete empty session order
                var emptySessionOrder = await _context.Orders.FindAsync(sessionOrderId);
                if (emptySessionOrder != null && emptySessionOrder.IdAccount == null)
                {
                    _context.Orders.Remove(emptySessionOrder);
                    await _context.SaveChangesAsync();
                }

                return true;
            }

            // Find or create user's active order
            var userOrder = await _context.Orders
                .Where(o => o.IdAccount == accountId && o.Status == 0)
                .OrderByDescending(o => o.DateBuy)
                .FirstOrDefaultAsync();

            if (userOrder == null)
            {
                _logger.LogInformation("No active order found for user, transferring session order");

                // Transfer the session order to the user
                var sessionOrder = await _context.Orders.FindAsync(sessionOrderId);
                if (sessionOrder != null)
                {
                    sessionOrder.IdAccount = accountId;
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Transferred session order {OrderId} to user {AccountId}",
                        sessionOrderId, accountId);
                    return true;
                }

                return false;
            }

            _logger.LogInformation("Merging session cart into existing user cart {UserOrderId}", userOrder.Id);

            // Merge cart items into user's existing cart
            foreach (var sessionItem in sessionCartItems)
            {
                var existingItem = await _context.Carts
                    .FirstOrDefaultAsync(c => c.IdOrder == userOrder.Id &&
                                              c.IdProduct == sessionItem.IdProduct);

                if (existingItem != null)
                {
                    // Update quantity and price if item already exists
                    var unitPrice = existingItem.Quantity > 0
                        ? existingItem.Price / existingItem.Quantity
                        : sessionItem.Price / sessionItem.Quantity;

                    existingItem.Quantity += sessionItem.Quantity;
                    existingItem.Price = existingItem.Quantity * unitPrice;

                    _logger.LogInformation("Updated existing item {ProductId}: quantity {OldQty} -> {NewQty}",
                        sessionItem.IdProduct, existingItem.Quantity - sessionItem.Quantity, existingItem.Quantity);
                }
                else
                {
                    // Add new item to user's cart
                    var newCartItem = new Cart
                    {
                        IdOrder = userOrder.Id,
                        IdProduct = sessionItem.IdProduct,
                        Quantity = sessionItem.Quantity,
                        Price = sessionItem.Price
                    };

                    _context.Carts.Add(newCartItem);

                    _logger.LogInformation("Added new item {ProductId} to user cart", sessionItem.IdProduct);
                }

                // Remove from session cart
                _context.Carts.Remove(sessionItem);
            }

            // Delete the session order
            var oldSessionOrder = await _context.Orders.FindAsync(sessionOrderId);
            if (oldSessionOrder != null && oldSessionOrder.IdAccount == null)
            {
                _context.Orders.Remove(oldSessionOrder);
                _logger.LogInformation("Deleted session order {OrderId}", sessionOrderId);
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Successfully merged session cart {SessionOrderId} with user cart {UserOrderId}",
                sessionOrderId, userOrder.Id);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error merging session cart {SessionOrderId} with user cart for account {AccountId}",
                sessionOrderId, accountId);
            return false;
        }
    }
}