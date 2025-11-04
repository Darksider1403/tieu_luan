using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using EcommerceFashionWebsite.DTOs;
using EcommerceFashionWebsite.Services.Interface;
using System.Security.Claims;

namespace EcommerceFashionWebsite.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrderController : ControllerBase
    {
        private readonly IOrderService _orderService;
        private readonly ICartService _cartService;
        private readonly ILogger<OrderController> _logger;

        public OrderController(
            IOrderService orderService,
            ICartService cartService,
            ILogger<OrderController> logger)
        {
            _orderService = orderService;
            _cartService = cartService;
            _logger = logger;
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : null;
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<List<OrderDto>>> GetUserOrders()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                {
                    return Unauthorized(new { error = "User not authenticated" });
                }

                var orders = await _orderService.GetOrdersByAccountIdAsync(userId.Value);
                return Ok(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user orders");
                return StatusCode(500, new { error = "An error occurred while retrieving orders" });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<OrderDto>> GetOrder(string id)
        {
            try
            {
                var order = await _orderService.GetOrderByIdAsync(id);
                if (order == null)
                {
                    return NotFound(new { error = "Order not found" });
                }

                return Ok(order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving order {OrderId}", id);
                return StatusCode(500, new { error = "An error occurred while retrieving the order" });
            }
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<string>> CreateOrder([FromBody] CreateOrderDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                {
                    return Unauthorized(new { error = "User not authenticated" });
                }

                // Get user's cart items
                var cartItems = await _cartService.GetUserCartItemsAsync(userId.Value);
                
                if (!cartItems.Any())
                {
                    return BadRequest(new { error = "Cart is empty. Please add items before checkout." });
                }

                // Create the order with items from cart
                var orderId = await _orderService.CreateOrderAsync(userId.Value, dto);
                
                // Convert cart items to order items
                await _cartService.ConvertCartToOrderAsync(userId.Value, orderId);
                
                _logger.LogInformation("Order created: {OrderId} by user: {UserId} with {ItemCount} items", 
                    orderId, userId.Value, cartItems.Count);
                
                return Ok(new { success = true, orderId = orderId, message = "Order created successfully" });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid operation during order creation");
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating order");
                return StatusCode(500, new { error = "An error occurred while creating the order" });
            }
        }

        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> UpdateOrderStatus(string id, [FromBody] UpdateOrderStatusDto dto)
        {
            try
            {
                var result = await _orderService.UpdateOrderStatusAsync(id, dto.Status);
                if (!result)
                {
                    return NotFound(new { error = "Order not found" });
                }

                return Ok(new { success = true, message = "Order status updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating order status {OrderId}", id);
                return StatusCode(500, new { error = "An error occurred while updating order status" });
            }
        }

        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<List<OrderDto>>> GetAllOrders()
        {
            try
            {
                var orders = await _orderService.GetAllOrdersAsync();
                return Ok(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all orders");
                return StatusCode(500, new { error = "An error occurred while retrieving orders" });
            }
        }

        [HttpGet("statistics/category/{categoryId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> GetCategoryStatistics(int categoryId, [FromQuery] DateTime? fromDate)
        {
            try
            {
                var from = fromDate ?? DateTime.Now.AddMonths(-1);
                
                var totalSold = await _orderService.GetTotalProductSoldByCategoryAsync(categoryId, from);
                var revenue = await _orderService.GetRevenueByCategoryAsync(categoryId, from);

                return Ok(new
                {
                    categoryId = categoryId,
                    totalProductsSold = totalSold,
                    totalRevenue = revenue,
                    fromDate = from
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving category statistics");
                return StatusCode(500, new { error = "An error occurred while retrieving statistics" });
            }
        }
    }
}