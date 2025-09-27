using EcommerceFashionWebsite.Entity;
using EcommerceFashionWebsite.DTOs;

namespace EcommerceFashionWebsite.Services.Interface
{
    public interface IProductService
    {
        Task<List<ProductDto>> GetAllProductsAsync();
        Task<ProductDto?> GetProductByIdAsync(string productId);
        Task<List<ProductDto>> GetProductsByCategoryAsync(int categoryId, int limit = 15);
        Task<List<ProductDto>> GetProductsByGenderAsync(string gender, int limit = 15);
        Task<List<ProductDto>> SearchProductsAsync(string searchTerm);
        Task<PagedResult<ProductDto>> GetProductsWithPaginationAsync(int page, int pageSize, int? categoryId, string? sortBy = null, string? filter = null);
        Task<ProductDto> CreateProductAsync(CreateProductDto dto);
        Task<ProductDto> UpdateProductAsync(string productId, UpdateProductDto dto);
        Task<bool> UpdateProductStatusAsync(string productId, int status);
        Task<bool> DeleteProductAsync(string productId);
        Task<bool> DecrementQuantityAsync(List<string> productIds, int decrementAmount);
        Task<double> GetProductRatingAsync(string productId);
        Task<Dictionary<string, string>> GetCategoriesAsync();
        Task<List<SliderDto>> GetAllSlidersAsync();
        Task<int> GetTotalProductsAsync();
        Task<int> GetTotalProductsByCategoryAsync(int categoryId);
    }
}