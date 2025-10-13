using Microsoft.EntityFrameworkCore;
using EcommerceFashionWebsite.Data;
using EcommerceFashionWebsite.Entity;


namespace EcommerceFashionWebsite.Repository
{
    public class OrderRepository : IOrderRepository
    {
        private readonly ApplicationDbContext _context;

        public OrderRepository(ApplicationDbContext context)
        {
            _context = context;
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

        public async Task<List<OrderDetail>> GetOrderDetailsAsync(string orderId)
        {
            return await _context.OrderDetail
                .Include(od => od.Product)
                .Where(od => od.IdOrder == orderId)
                .ToListAsync();
        }

        public async Task<int> GetTotalPriceOrderDetailAsync(string orderId)
        {
            var total = await _context.OrderDetail
                .Where(od => od.IdOrder == orderId)
                .SumAsync(od => od.Price);
            return total;
        }

        public async Task<string> CreateOrderAsync(Order order)
        {
            // Generate order ID
            var count = await _context.Orders.CountAsync();
            order.Id = $"OR0{count + 1}";
            
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();
            
            return order.Id;
        }

        public async Task<bool> AddOrderDetailAsync(OrderDetail orderDetail)
        {
            _context.OrderDetail.Add(orderDetail);
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
            var total = await _context.OrderDetail
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
            var revenue = await _context.OrderDetail
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
    }
}