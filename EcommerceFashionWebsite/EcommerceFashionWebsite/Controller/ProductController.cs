using Microsoft.AspNetCore.Mvc;
using EcommerceFashionWebsite.Services.Interface;
using EcommerceFashionWebsite.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace EcommerceFashionWebsite.Controller;

[ApiController]
[Route("api/[controller]")]
public class ProductController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly ILogger<ProductController> _logger;

    public ProductController(IProductService productService, ILogger<ProductController> logger)
    {
        _productService = productService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<ProductDto>>> GetProducts(
        [FromQuery] int page = 0,
        [FromQuery] int pageSize = 12,
        [FromQuery] int category = 1,
        [FromQuery] string? order = null,
        [FromQuery] string? filter = null)
    {
        try
        {
            var result =
                await _productService.GetProductsWithPaginationAsync(page, pageSize, category, order, filter);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving products");
            return StatusCode(500, new { error = "An error occurred while retrieving products" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetProduct(string id)
    {
        try
        {
            var product = await _productService.GetProductByIdAsync(id);
            if (product == null)
                return NotFound(new { error = "Product not found" });

            // Debug: Log what we're returning
            _logger.LogInformation("GetProduct returning: {@Product}", product);

            return Ok(product);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving product {ProductId}", id);
            return StatusCode(500, new { error = "An error occurred while retrieving the product" });
        }
    }

    [HttpGet("category/{categoryId}")]
    public async Task<ActionResult<List<ProductDto>>> GetProductsByCategory(int categoryId,
        [FromQuery] int limit = 15)
    {
        try
        {
            var products = await _productService.GetProductsByCategoryAsync(categoryId, limit);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving products by category {idCategory}", categoryId);
            return StatusCode(500, new { error = "An error occurred while retrieving products" });
        }
    }

    [HttpGet("gender/{gender}")]
    public async Task<ActionResult<List<ProductDto>>> GetProductsByGender(string gender, [FromQuery] int limit = 15)
    {
        try
        {
            var products = await _productService.GetProductsByGenderAsync(gender, limit);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving products by gender {Gender}", gender);
            return StatusCode(500, new { error = "An error occurred while retrieving products" });
        }
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<ProductDto>>> SearchProducts([FromQuery] string term)
    {
        try
        {
            var products = await _productService.SearchProductsAsync(term);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching products with term {SearchTerm}", term);
            return StatusCode(500, new { error = "An error occurred while searching products" });
        }
    }

    [HttpPost]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromForm] CreateProductDto dto)
    {
        try
        {
            _logger.LogInformation("=== CREATE PRODUCT REQUEST ===");
            _logger.LogInformation("Product ID: {Id}", dto.Id);
            _logger.LogInformation("Product Name: {Name}", dto.Name);
            _logger.LogInformation("Images count: {Count}", dto.Images?.Count ?? 0);
            
            if (dto.Images == null || dto.Images.Count == 0)
            {
                _logger.LogWarning("No images provided");
                return BadRequest(new { error = "At least one product image is required" });
            }

            if (dto.Images.Count > 4)
            {
                return BadRequest(new { error = "Maximum 4 images allowed (0.jpg, 1.jpg, 2.jpg, 3.jpg)" });
            }

            // Validate images
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            const long maxFileSize = 5 * 1024 * 1024; // 5MB

            foreach (var image in dto.Images)
            {
                _logger.LogInformation("Image: {FileName}, Size: {Size} bytes", image.FileName, image.Length);
                
                var extension = Path.GetExtension(image.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(extension))
                {
                    return BadRequest(new { error = $"Invalid file type: {extension}. Allowed types: {string.Join(", ", allowedExtensions)}" });
                }

                if (image.Length > maxFileSize)
                {
                    return BadRequest(new { error = $"File {image.FileName} exceeds maximum size of 5MB" });
                }
            }

            var product = await _productService.CreateProductAsync(dto);
            _logger.LogInformation("Product created successfully: {ProductId}", product.Id);
            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating product");
            return StatusCode(500, new { error = "An error occurred while creating the product" });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ProductDto>> UpdateProduct(string id, [FromForm] UpdateProductDto dto)
    {
        try
        {
            // Validate images if provided
            if (dto.Images != null && dto.Images.Count > 0)
            {
                if (dto.Images.Count > 4)
                {
                    return BadRequest(new { error = "Maximum 4 images allowed (0.jpg, 1.jpg, 2.jpg, 3.jpg)" });
                }

                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                const long maxFileSize = 5 * 1024 * 1024; // 5MB

                foreach (var image in dto.Images)
                {
                    var extension = Path.GetExtension(image.FileName).ToLowerInvariant();
                    if (!allowedExtensions.Contains(extension))
                    {
                        return BadRequest(new { error = $"Invalid file type: {extension}. Allowed types: {string.Join(", ", allowedExtensions)}" });
                    }

                    if (image.Length > maxFileSize)
                    {
                        return BadRequest(new { error = $"File {image.FileName} exceeds maximum size of 5MB" });
                    }
                }
            }

            var product = await _productService.UpdateProductAsync(id, dto);
            return Ok(product);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating product {ProductId}", id);
            return StatusCode(500, new { error = "An error occurred while updating the product" });
        }
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> UpdateProductStatus(string id, [FromBody] UpdateStatusDto dto)
    {
        try
        {
            var result = await _productService.UpdateProductStatusAsync(id, dto.Status);
            if (!result)
                return NotFound(new { error = "Product not found" });

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating product status {ProductId}", id);
            return StatusCode(500, new { error = "An error occurred while updating product status" });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteProduct(string id)
    {
        try
        {
            var result = await _productService.DeleteProductAsync(id);
            if (!result)
                return NotFound(new { error = "Product not found" });

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product {ProductId}", id);
            return StatusCode(500, new { error = "An error occurred while deleting the product" });
        }
    }

    [HttpGet("categories")]
    public async Task<ActionResult<Dictionary<string, string>>> GetCategories()
    {
        try
        {
            var categories = await _productService.GetCategoriesAsync();
            return Ok(categories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving categories");
            return StatusCode(500, new { error = "An error occurred while retrieving categories" });
        }
    }

    [HttpGet("sliders")]
    public async Task<ActionResult<List<SliderDto>>> GetSliders()
    {
        try
        {
            var sliders = await _productService.GetAllSlidersAsync();
            return Ok(sliders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving sliders");
            return StatusCode(500, new { error = "An error occurred while retrieving sliders" });
        }
    }

    [HttpGet("{id}/images")]
    public async Task<ActionResult<Dictionary<string, string>>> GetProductImages(string id)
    {
        try
        {
            var images = await _productService.GetProductImagesAsync(id);
            return Ok(images);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving product images {ProductId}", id);
            return StatusCode(500, new { error = "An error occurred while retrieving images" });
        }
    }

    [HttpPost("rate")]
    [Authorize]
    public async Task<ActionResult> RateProduct([FromBody] AddRatingDto dto)
    {
        try
        {
            if (string.IsNullOrEmpty(dto.ProductId))
                return BadRequest(new { error = "Product ID is required" });

            if (dto.Rating < 1 || dto.Rating > 5)
                return BadRequest(new { error = "Rating must be between 1 and 5" });

            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized(new { error = "User not authenticated" });

            var result = await _productService.AddOrUpdateProductRatingAsync(dto.ProductId, userId, dto.Rating);

            if (!result)
            {
                return BadRequest(new { error = "You must purchase this product before rating it" });
            }

            _logger.LogInformation("Product rated: ProductId={ProductId}, UserId={UserId}, Rating={Rating}",
                dto.ProductId, userId, dto.Rating);
        
            return Ok(new { success = true, message = "Rating added successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding product rating");
            return StatusCode(500, new { error = "An error occurred while adding rating" });
        }
    }

    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<ProductDto>>> GetAllProducts()
    {
        try
        {
            _logger.LogInformation("Admin fetching all products");
            var products = await _productService.GetAllProductsAsync();
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all products");
            return StatusCode(500, new { error = "An error occurred while retrieving products" });
        }
    }
    
    [HttpGet("{id}/rating")]
    public async Task<ActionResult<ProductRatingInfoDto>> GetProductRating(string id)
    {
        try
        {
            int? userId = null;
            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int uid))
            {
                userId = uid;
            }

            var ratingInfo = await _productService.GetProductRatingInfoAsync(id, userId);
            return Ok(ratingInfo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving product rating {ProductId}", id);
            return StatusCode(500, new { error = "An error occurred while retrieving rating" });
        }
    }
}