using Microsoft.AspNetCore.Mvc;
using EcommerceFashionWebsite.Services.Interface;
using EcommerceFashionWebsite.DTOs;

namespace EcommerceFashionWebsite.Controller
{
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
                var result = await _productService.GetProductsWithPaginationAsync(page, pageSize, category, order, filter);
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

                return Ok(product);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving product {ProductId}", id);
                return StatusCode(500, new { error = "An error occurred while retrieving the product" });
            }
        }

        [HttpGet("category/{categoryId}")]
        public async Task<ActionResult<List<ProductDto>>> GetProductsByCategory(int categoryId, [FromQuery] int limit = 15)
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
        public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductDto dto)
        {
            try
            {
                var product = await _productService.CreateProductAsync(dto);
                return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product");
                return StatusCode(500, new { error = "An error occurred while creating the product" });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ProductDto>> UpdateProduct(string id, [FromBody] UpdateProductDto dto)
        {
            try
            {
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

        public class UpdateStatusDto
        {
            public int Status { get; set; }
        }
    }
}