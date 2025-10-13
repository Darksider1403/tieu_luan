using System.Text.Json;
using EcommerceFashionWebsite.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace EcommerceFashionWebsite.Controller;

[ApiController]
[Route("api/[controller]")]
public class CartController : ControllerBase
{
    private readonly ILogger<CartController> _logger;
    private const string CartSessionKey = "ShoppingCart";

    public CartController(ILogger<CartController> logger)
    {
        _logger = logger;
    }

    [HttpGet("size")]
    public ActionResult GetCartSize()
    {
        try
        {
            var cart = HttpContext.Session.GetString(CartSessionKey);
            if (string.IsNullOrEmpty(cart))
            {
                return Ok(new { cartSize = 0 });
            }

            var cartItems = JsonSerializer.Deserialize<List<CartItemDto>>(cart);
            var totalItems = cartItems?.Sum(item => item.Quantity) ?? 0;
            
            return Ok(new { cartSize = totalItems });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cart size");
            return Ok(new { cartSize = 0 });
        }
    }

    [HttpPost("add")]
    public ActionResult AddToCart([FromBody] AddToCartDto dto)
    {
        try
        {
            var cart = HttpContext.Session.GetString(CartSessionKey);
            var cartItems = string.IsNullOrEmpty(cart) 
                ? new List<CartItemDto>() 
                : JsonSerializer.Deserialize<List<CartItemDto>>(cart);

            var existingItem = cartItems?.FirstOrDefault(item => item.ProductId == dto.ProductId);
            
            if (existingItem != null)
            {
                existingItem.Quantity += dto.Quantity;
            }
            else
            {
                cartItems?.Add(new CartItemDto
                {
                    ProductId = dto.ProductId,
                    Quantity = dto.Quantity
                });
            }

            HttpContext.Session.SetString(CartSessionKey, JsonSerializer.Serialize(cartItems));
            
            var totalItems = cartItems?.Sum(item => item.Quantity) ?? 0;
            return Ok(new { success = true, cartSize = totalItems });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding to cart");
            return StatusCode(500, new { error = "An error occurred" });
        }
    }

    [HttpGet]
    public ActionResult GetCart()
    {
        try
        {
            var cart = HttpContext.Session.GetString(CartSessionKey);
            if (string.IsNullOrEmpty(cart))
            {
                return Ok(new List<CartItemDto>());
            }

            var cartItems = JsonSerializer.Deserialize<List<CartItemDto>>(cart);
            return Ok(cartItems);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cart");
            return Ok(new List<CartItemDto>());
        }
    }

    [HttpDelete("clear")]
    public ActionResult ClearCart()
    {
        HttpContext.Session.Remove(CartSessionKey);
        return Ok(new { success = true, message = "Cart cleared" });
    }
}
