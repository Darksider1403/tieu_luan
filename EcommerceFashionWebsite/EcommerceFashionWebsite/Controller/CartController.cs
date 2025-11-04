using EcommerceFashionWebsite.DTOs;
using EcommerceFashionWebsite.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EcommerceFashionWebsite.Controller;

[ApiController]
[Route("api/[controller]")]
public class CartController : ControllerBase
{
    private readonly ICartService _cartService;
    private readonly ILogger<CartController> _logger;

    public CartController(ICartService cartService, ILogger<CartController> logger)
    {
        _cartService = cartService;
        _logger = logger;
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("UserId")?.Value;
        if (string.IsNullOrEmpty(userIdClaim))
            return null;
        
        return int.TryParse(userIdClaim, out int userId) ? userId : null;
    }

    [HttpGet("size")]
    [Authorize]
    public async Task<ActionResult> GetCartSize()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Ok(new { cartSize = 0 });
            }

            var totalItems = await _cartService.GetUserCartCountAsync(userId.Value);
            return Ok(new { cartSize = totalItems });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cart size");
            return Ok(new { cartSize = 0 });
        }
    }

    [HttpPost("add")]
    [Authorize]
    public async Task<ActionResult> AddToCart([FromBody] AddToCartDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { error = "Please login to add items to cart" });
            }

            if (dto.Quantity <= 0)
            {
                return BadRequest(new { error = "Quantity must be greater than 0" });
            }

            await _cartService.AddToUserCartAsync(userId.Value, dto.ProductId, dto.Quantity);

            var totalItems = await _cartService.GetUserCartCountAsync(userId.Value);
            return Ok(new { success = true, cartSize = totalItems, message = "Added to cart successfully" });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation adding to cart");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding to cart");
            return StatusCode(500, new { error = "Failed to add to cart" });
        }
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<CartItemDetailDto>>> GetCart()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { error = "Please login to view cart" });
            }

            var cartItems = await _cartService.GetUserCartItemsAsync(userId.Value);
            return Ok(cartItems);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cart");
            return StatusCode(500, new { error = "Failed to get cart" });
        }
    }

    [HttpPut("update/{productId}")]
    [Authorize]
    public async Task<ActionResult> UpdateCartQuantity(string productId, [FromBody] UpdateQuantityDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { error = "Please login to update cart" });
            }

            if (dto.Quantity < 0)
            {
                return BadRequest(new { error = "Quantity cannot be negative" });
            }

            await _cartService.UpdateUserCartQuantityAsync(userId.Value, productId, dto.Quantity);

            var totalItems = await _cartService.GetUserCartCountAsync(userId.Value);
            return Ok(new { success = true, cartSize = totalItems, message = "Cart updated successfully" });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation updating cart");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating cart quantity");
            return StatusCode(500, new { error = "Failed to update cart" });
        }
    }

    [HttpDelete("remove/{productId}")]
    [Authorize]
    public async Task<ActionResult> RemoveFromCart(string productId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { error = "Please login to remove items" });
            }

            await _cartService.RemoveFromUserCartAsync(userId.Value, productId);

            var totalItems = await _cartService.GetUserCartCountAsync(userId.Value);
            return Ok(new { success = true, cartSize = totalItems, message = "Item removed from cart" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing from cart");
            return StatusCode(500, new { error = "Failed to remove item" });
        }
    }

    [HttpDelete("clear")]
    [Authorize]
    public async Task<ActionResult> ClearCart()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { error = "Please login to clear cart" });
            }

            await _cartService.ClearUserCartAsync(userId.Value);
            return Ok(new { success = true, cartSize = 0, message = "Cart cleared successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing cart");
            return StatusCode(500, new { error = "Failed to clear cart" });
        }
    }
}