using Microsoft.EntityFrameworkCore;
using EcommerceFashionWebsite.Data;
using EcommerceFashionWebsite.Entity;


namespace EcommerceFashionWebsite.Repository
{
    public class OrderRepository : IOrderRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<OrderRepository> _logger;

        public OrderRepository(ApplicationDbContext context,  ILogger<OrderRepository> logger)
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
    }
}