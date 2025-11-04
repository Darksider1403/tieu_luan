using EcommerceFashionWebsite.DTOs;
using EcommerceFashionWebsite.Entity;
using EcommerceFashionWebsite.Repository;
using EcommerceFashionWebsite.Services.Interface;

namespace EcommerceFashionWebsite.Services
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IProductRepository _productRepository;
        private readonly ILogger<OrderService> _logger;

        public OrderService(
            IOrderRepository orderRepository,
            IProductRepository productRepository,
            ILogger<OrderService> logger)
        {
            _orderRepository = orderRepository;
            _productRepository = productRepository;
            _logger = logger;
        }

        public async Task<int> GetTotalOrdersAsync()
        {
            return await _orderRepository.GetTotalOrdersAsync();
        }

        public async Task<OrderDto?> GetOrderByIdAsync(string orderId)
        {
            var order = await _orderRepository.GetOrderByIdAsync(orderId);
            if (order == null) return null;

            var totalPrice = await _orderRepository.GetTotalPriceOrderDetailAsync(orderId);

            return new OrderDto
            {
                Id = order.Id,
                Fullname = order.Account?.Fullname ?? string.Empty,
                DateBuy = order.DateBuy ?? DateTime.Now,
                DateArrival = order.DateArrival ?? DateTime.Now,
                Address = order.Address,
                NumberPhone = order.NumberPhone,
                Status = order.Status,
                IsVerified = order.IsVerified,
                TotalPrice = totalPrice,
                OrderDetails = order.OrderDetail.Select(od => new OrderDetailDto
                {
                    IdOrder = od.IdOrder,
                    IdProduct = od.IdProduct,
                    ProductName = od.Product?.Name ?? string.Empty,
                    Quantity = od.Quantity,
                    Price = od.Price
                }).ToList()
            };
        }

        public async Task<List<OrderDto>> GetOrdersByAccountIdAsync(int accountId)
        {
            var orders = await _orderRepository.GetOrdersByAccountIdAsync(accountId);

            var orderDtos = new List<OrderDto>();
            foreach (var order in orders)
            {
                var totalPrice = await _orderRepository.GetTotalPriceOrderDetailAsync(order.Id);

                orderDtos.Add(new OrderDto
                {
                    Id = order.Id,
                    DateBuy = order.DateBuy ?? DateTime.Now,
                    DateArrival = order.DateArrival ?? DateTime.Now,
                    Address = order.Address,
                    NumberPhone = order.NumberPhone,
                    Status = order.Status,
                    IsVerified = order.IsVerified,
                    TotalPrice = totalPrice,
                    OrderDetails = order.OrderDetail.Select(od => new OrderDetailDto
                    {
                        IdOrder = od.IdOrder,
                        IdProduct = od.IdProduct,
                        ProductName = od.Product?.Name ?? string.Empty,
                        Quantity = od.Quantity,
                        Price = od.Price
                    }).ToList()
                });
            }

            return orderDtos;
        }

        public async Task<string> CreateOrderAsync(int userId, CreateOrderDto dto)
        {
            try
            {
                // Generate unique order ID
                var orderId = await GenerateUniqueOrderIdAsync();

                var order = new Order
                {
                    Id = orderId,
                    IdAccount = userId,
                    Address = dto.Address,
                    NumberPhone = dto.Phone,
                    Status = dto.PaymentMethod == "COD" ? 0 : 0, // 0 = Pending payment
                    DateBuy = DateTime.Now,
                    DateArrival = DateTime.Now.AddDays(7),
                    IsVerified = false
                };

                await _orderRepository.CreateOrderAsync(order);

                _logger.LogInformation("Order {OrderId} created for user {UserId}", orderId, userId);

                return orderId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating order for user {UserId}", userId);
                throw;
            }
        }


        public async Task<bool> UpdateOrderStatusAsync(string orderId, int status)
        {
            return await _orderRepository.UpdateOrderStatusAsync(orderId, status);
        }

        public async Task<List<OrderDto>> GetAllOrdersAsync()
        {
            var orders = await _orderRepository.GetAllOrdersAsync();

            var orderDtos = new List<OrderDto>();
            foreach (var order in orders)
            {
                var totalPrice = await _orderRepository.GetTotalPriceOrderDetailAsync(order.Id);

                orderDtos.Add(new OrderDto
                {
                    Id = order.Id,
                    Fullname = order.Account?.Fullname ?? string.Empty,
                    DateBuy = order.DateBuy ?? DateTime.Now,
                    DateArrival = order.DateArrival ?? DateTime.Now,
                    Address = order.Address,
                    NumberPhone = order.NumberPhone,
                    Status = order.Status,
                    IsVerified = order.IsVerified,
                    TotalPrice = totalPrice
                });
            }

            return orderDtos;
        }

        public async Task<int> GetTotalProductSoldByCategoryAsync(int categoryId, DateTime fromDate)
        {
            return await _orderRepository.GetTotalProductSoldByCategoryAsync(categoryId, fromDate);
        }

        public async Task<int> GetRevenueByCategoryAsync(int categoryId, DateTime fromDate)
        {
            return await _orderRepository.GetRevenueByCategoryAsync(categoryId, fromDate);
        }

        private async Task<string> GenerateUniqueOrderIdAsync()
        {
            string orderId;
            bool exists;

            do
            {
                var timestamp = DateTime.Now.ToString("yyMMddHHmmss");
                var random = new Random().Next(100, 999);
                orderId = $"OR{timestamp}{random}";

                exists = await _orderRepository.OrderExistsAsync(orderId);
            } while (exists);

            return orderId;
        }
    }
}