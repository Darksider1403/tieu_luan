namespace EcommerceFashionWebsite.Services;

using EcommerceFashionWebsite.Entity;
using EcommerceFashionWebsite.DTOs;
using EcommerceFashionWebsite.Repository;
using EcommerceFashionWebsite.Services.Interface;

public class CartService : ICartService
{
    private readonly ICartRepository _cartRepository;
    private readonly IProductService _productService;
    private readonly IProductRepository _productRepository;
    private readonly ILogger<CartService> _logger;

    public CartService(
        ICartRepository cartRepository,
        IProductService productService,
        IProductRepository productRepository,
        ILogger<CartService> logger)
    {
        _cartRepository = cartRepository;
        _productService = productService;
        _productRepository = productRepository;
        _logger = logger;
    }

    // ==================== USER CART METHODS ====================

    public async Task AddToUserCartAsync(int userId, string productId, int quantity)
    {
        try
        {
            if (quantity <= 0)
            {
                throw new ArgumentException("Quantity must be greater than 0");
            }

            var product = await _productService.GetProductByIdAsync(productId);
            if (product == null)
            {
                throw new InvalidOperationException("Product not found");
            }

            if (product.Quantity < quantity)
            {
                throw new InvalidOperationException($"Not enough stock. Available: {product.Quantity}");
            }

            var existingItem = await _cartRepository.GetUserCartItemAsync(userId, productId);

            if (existingItem != null)
            {
                var newQuantity = existingItem.Quantity + quantity;
                if (product.Quantity < newQuantity)
                {
                    throw new InvalidOperationException($"Not enough stock. Available: {product.Quantity}");
                }

                existingItem.Quantity = newQuantity;
                existingItem.Price = existingItem.Quantity * product.Price;
                await _cartRepository.UpdateUserCartItemAsync(existingItem);
            }
            else
            {
                var cartItem = new Cart
                {
                    IdProduct = productId,
                    Quantity = quantity,
                    IdAccount = userId,
                    IdOrder = null,
                    Price = product.Price * quantity
                };
                await _cartRepository.AddToUserCartAsync(cartItem);
            }

            _logger.LogInformation("Added {Quantity} units of product {ProductId} to user {UserId} cart", 
                quantity, productId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding to cart - User: {UserId}, Product: {ProductId}", 
                userId, productId);
            throw;
        }
    }

    public async Task<List<CartItemDetailDto>> GetUserCartItemsAsync(int userId)
    {
        try
        {
            var cartItems = await _cartRepository.GetUserCartItemsAsync(userId);
            var cartDetails = new List<CartItemDetailDto>();

            foreach (var item in cartItems)
            {
                var thumbnail = await _productRepository.GetProductThumbnailAsync(item.IdProduct);
                var product = item.Product;

                cartDetails.Add(new CartItemDetailDto
                {
                    ProductId = item.IdProduct,
                    Name = product?.Name ?? "Unknown Product",
                    Price = product?.Price ?? 0,
                    Quantity = item.Quantity,
                    TotalPrice = item.Price,
                    ThumbnailImage = thumbnail ?? "",
                    Material = product?.Material ?? "",
                    Size = product?.Size ?? "",
                    Color = product?.Color ?? ""
                });
            }

            return cartDetails;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cart items for user {UserId}", userId);
            throw;
        }
    }

    public async Task UpdateUserCartQuantityAsync(int userId, string productId, int quantity)
    {
        try
        {
            if (quantity <= 0)
            {
                await RemoveFromUserCartAsync(userId, productId);
                return;
            }

            var cartItem = await _cartRepository.GetUserCartItemAsync(userId, productId);
            if (cartItem == null)
            {
                throw new InvalidOperationException("Cart item not found");
            }

            var product = await _productService.GetProductByIdAsync(productId);
            if (product == null)
            {
                throw new InvalidOperationException("Product not found");
            }

            if (product.Quantity < quantity)
            {
                throw new InvalidOperationException($"Not enough stock. Available: {product.Quantity}");
            }

            cartItem.Quantity = quantity;
            cartItem.Price = quantity * product.Price;
            await _cartRepository.UpdateUserCartItemAsync(cartItem);

            _logger.LogInformation("Updated cart quantity for user {UserId}, product {ProductId} to {Quantity}", 
                userId, productId, quantity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating cart quantity");
            throw;
        }
    }

    public async Task RemoveFromUserCartAsync(int userId, string productId)
    {
        try
        {
            await _cartRepository.RemoveFromUserCartAsync(userId, productId);
            _logger.LogInformation("Removed product {ProductId} from user {UserId} cart", 
                productId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing from cart");
            throw;
        }
    }

    public async Task ClearUserCartAsync(int userId)
    {
        try
        {
            await _cartRepository.ClearUserCartAsync(userId);
            _logger.LogInformation("Cleared cart for user {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing cart");
            throw;
        }
    }

    public async Task<int> GetUserCartCountAsync(int userId)
    {
        try
        {
            return await _cartRepository.GetUserCartCountAsync(userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cart count");
            return 0;
        }
    }

    // ==================== ORDER METHODS ====================

    public async Task<List<CartItemDetailDto>> GetOrderItemsAsync(string orderId)
    {
        try
        {
            var orderItems = await _cartRepository.GetCartByOrderIdAsync(orderId);
            var orderDetails = new List<CartItemDetailDto>();

            foreach (var item in orderItems)
            {
                var thumbnail = await _productRepository.GetProductThumbnailAsync(item.IdProduct);
                
                orderDetails.Add(new CartItemDetailDto
                {
                    ProductId = item.IdProduct,
                    Name = item.Product?.Name ?? "Unknown Product",
                    Price = item.Product?.Price ?? 0,
                    Quantity = item.Quantity,
                    TotalPrice = item.Price,
                    ThumbnailImage = thumbnail ?? ""
                });
            }

            return orderDetails;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting order items for order {OrderId}", orderId);
            throw;
        }
    }

    public async Task ConvertCartToOrderAsync(int userId, string orderId)
    {
        try
        {
            await _cartRepository.ConvertUserCartToOrderAsync(userId, orderId);
            _logger.LogInformation("Converted cart to order {OrderId} for user {UserId}", 
                orderId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error converting cart to order");
            throw;
        }
    }
}