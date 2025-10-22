using EcommerceFashionWebsite.DTOs;
using EcommerceFashionWebsite.Entity;
using EcommerceFashionWebsite.Repository;
using EcommerceFashionWebsite.Services.Interface;
using Microsoft.AspNetCore.Mvc;

namespace EcommerceFashionWebsite.Controller;

[ApiController]
[Route("api/[controller]")]
public class CartController : ControllerBase
{
    private readonly ICartService _cartService;
    private readonly IOrderRepository _orderRepository;
    private readonly ILogger<CartController> _logger;
    private const string OrderIdSessionKey = "OrderId";

    public CartController(ICartService cartService, 
        ILogger<CartController> logger,
        IOrderRepository orderRepository)
    {
        _cartService = cartService;
        _orderRepository = orderRepository;
        _logger = logger;
    }

    private string GetOrderId()
    {
        if (!HttpContext.Session.TryGetValue(OrderIdSessionKey, out var orderIdBytes))
        {
            var orderId = Guid.NewGuid().ToString(); // Temporary GUID until order is created
            HttpContext.Session.Set(OrderIdSessionKey, System.Text.Encoding.UTF8.GetBytes(orderId));
            return orderId;
        }
        return System.Text.Encoding.UTF8.GetString(orderIdBytes);
    }

    [HttpGet("size")]
    public async Task<ActionResult> GetCartSize()
    {
        try
        {
            var orderId = GetOrderId();
            var totalItems = await _cartService.GetCartTotalItemsAsync(orderId);
            return Ok(new { cartSize = totalItems });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cart size");
            return StatusCode(500, new { error = "An error occurred" });
        }
    }

    [HttpPost("add")]
    public async Task<ActionResult> AddToCart([FromBody] AddToCartDto dto)
    {
        try
        {
            if (dto.Quantity <= 0)
                return BadRequest(new { error = "Quantity must be greater than 0" });

            var orderId = await GetOrCreateOrderIdAsync();
            
            await _cartService.AddToCartAsync(orderId, dto.ProductId, dto.Quantity);

            var totalItems = await _cartService.GetCartTotalItemsAsync(orderId);
            return Ok(new { success = true, cartSize = totalItems });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation adding to cart");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding to cart");
            return StatusCode(500, new { error = "An error occurred" });
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<CartItemDetailDto>>> GetCart()
    {
        try
        {
            var orderId = GetOrderId();
            var cartItems = await _cartService.GetCartItemsAsync(orderId);
            return Ok(cartItems);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cart");
            return StatusCode(500, new { error = "An error occurred" });
        }
    }

    [HttpPut("update/{productId}")]
    public async Task<ActionResult> UpdateCartQuantity(string productId, [FromBody] UpdateQuantityDto dto)
    {
        try
        {
            if (dto.Quantity <= 0)
                return BadRequest(new { error = "Quantity must be greater than 0" });

            var orderId = GetOrderId();
            await _cartService.UpdateCartQuantityAsync(orderId, productId, dto.Quantity);

            var totalItems = await _cartService.GetCartTotalItemsAsync(orderId);
            return Ok(new { success = true, cartSize = totalItems });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation updating cart");
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating cart quantity");
            return StatusCode(500, new { error = "An error occurred" });
        }
    }

    [HttpDelete("remove/{productId}")]
    public async Task<ActionResult> RemoveFromCart(string productId)
    {
        try
        {
            var orderId = GetOrderId();
            await _cartService.RemoveFromCartAsync(orderId, productId);

            var totalItems = await _cartService.GetCartTotalItemsAsync(orderId);
            return Ok(new { success = true, cartSize = totalItems, message = "Item removed from cart" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing from cart");
            return StatusCode(500, new { error = "An error occurred" });
        }
    }

    [HttpDelete("clear")]
    public async Task<ActionResult> ClearCart()
    {
        try
        {
            var orderId = GetOrderId();
            await _cartService.ClearCartAsync(orderId);
            return Ok(new { success = true, message = "Cart cleared" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing cart");
            return StatusCode(500, new { error = "An error occurred" });
        }
    }
    
    private async Task<string> GetOrCreateOrderIdAsync()
    {
        if (HttpContext.Session.TryGetValue(OrderIdSessionKey, out var orderIdBytes))
        {
            var existingOrderId = System.Text.Encoding.UTF8.GetString(orderIdBytes);
            
            // Verify it still exists in database
            var exists = await _orderRepository.OrderExistsAsync(existingOrderId);
            if (exists)
            {
                return existingOrderId;
            }
        }

        // Create a new temporary order with proper OR0X format
        var newOrder = new Order
        {
            Id = "", 
            DateBuy = DateTime.Now,
            DateArrival = DateTime.Now.AddDays(16),
            Status = 0,
            NumberPhone = "",
            Address = "",
            IdAccount = null,
            IsVerified = false
        };

        var orderId = await _orderRepository.CreateOrderAsync(newOrder);
        
        // Store in session
        HttpContext.Session.Set(OrderIdSessionKey, System.Text.Encoding.UTF8.GetBytes(orderId));
        
        _logger.LogInformation("Created new session order: {OrderId}", orderId);
        
        return orderId;
    }
}