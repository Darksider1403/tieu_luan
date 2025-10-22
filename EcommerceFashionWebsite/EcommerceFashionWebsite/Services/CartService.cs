using EcommerceFashionWebsite.DTOs;
using EcommerceFashionWebsite.Entity;
using EcommerceFashionWebsite.Repository;
using EcommerceFashionWebsite.Services.Interface;

namespace EcommerceFashionWebsite.Services;

public class CartService : ICartService
{
    private readonly ICartRepository _cartRepository;
    private readonly IProductService _productService;
    private readonly IOrderRepository _orderRepository;
    private readonly ILogger<CartService> _logger;

    public CartService(
        ICartRepository cartRepository,
        IProductService productService,
        IOrderRepository orderRepository,
        ILogger<CartService> logger)
    {
        _cartRepository = cartRepository;
        _productService = productService;
        _orderRepository = orderRepository;
        _logger = logger;
    }

    public async Task<List<CartItemDetailDto>> GetCartItemsAsync(string orderId)
    {
        try
        {
            var cartItems = await _cartRepository.GetCartByOrderIdAsync(orderId);

            var cartDetails = new List<CartItemDetailDto>();
            foreach (var item in cartItems)
            {
                var product = await _productService.GetProductByIdAsync(item.IdProduct);
                if (product != null)
                {
                    cartDetails.Add(new CartItemDetailDto
                    {
                        ProductId = item.IdProduct,
                        Name = product.Name,
                        Price = product.Price,
                        Quantity = item.Quantity,
                        ThumbnailImage = product.ThumbnailImage,
                        Material = product.Material,
                        Size = product.Size,
                        Color = product.Color
                    });
                }
            }

            return cartDetails;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cart items for order {OrderId}", orderId);
            throw;
        }
    }

    public async Task AddToCartAsync(string orderId, string productId, int quantity)
    {
        try
        {
            if (quantity <= 0)
                throw new ArgumentException("Quantity must be greater than 0");

            // Order already exists from controller, no need to ensure
            var product = await _productService.GetProductByIdAsync(productId);
            if (product == null)
                throw new InvalidOperationException("Product not found");

            var existingItem = await _cartRepository.GetCartItemAsync(orderId, productId);
        
            if (existingItem != null)
            {
                existingItem.Quantity += quantity;
                existingItem.Price = existingItem.Quantity * product.Price;
                await _cartRepository.UpdateCartItemAsync(existingItem);
            }
            else
            {
                var cartItem = new Cart(orderId, productId, quantity, product.Price * quantity);
                await _cartRepository.AddToCartAsync(cartItem);
            }

            _logger.LogInformation("Added {Quantity} units of product {ProductId} to cart {OrderId}", 
                quantity, productId, orderId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding to cart - Order: {OrderId}, Product: {ProductId}", orderId, productId);
            throw;
        }
    }

    public async Task UpdateCartQuantityAsync(string orderId, string productId, int quantity)
    {
        try
        {
            if (quantity <= 0)
                throw new ArgumentException("Quantity must be greater than 0");

            var cartItem = await _cartRepository.GetCartItemAsync(orderId, productId);
            if (cartItem == null)
                throw new InvalidOperationException("Cart item not found");

            cartItem.Quantity = quantity;
            await _cartRepository.UpdateCartItemAsync(cartItem);

            _logger.LogInformation("Updated quantity for product {ProductId} in cart {OrderId} to {Quantity}",
                productId, orderId, quantity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating cart quantity");
            throw;
        }
    }

    public async Task RemoveFromCartAsync(string orderId, string productId)
    {
        try
        {
            await _cartRepository.RemoveFromCartAsync(orderId, productId);
            _logger.LogInformation("Removed product {ProductId} from cart {OrderId}", productId, orderId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing from cart");
            throw;
        }
    }

    public async Task<int> GetCartTotalItemsAsync(string orderId)
    {
        try
        {
            var cartItems = await _cartRepository.GetCartByOrderIdAsync(orderId);
            return cartItems.Sum(item => item.Quantity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cart total items");
            throw;
        }
    }

    public async Task ClearCartAsync(string orderId)
    {
        try
        {
            var cartItems = await _cartRepository.GetCartByOrderIdAsync(orderId);
            foreach (var item in cartItems)
            {
                await _cartRepository.RemoveFromCartAsync(orderId, item.IdProduct);
            }

            _logger.LogInformation("Cleared cart for order {OrderId}", orderId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing cart");
            throw;
        }
    }
}