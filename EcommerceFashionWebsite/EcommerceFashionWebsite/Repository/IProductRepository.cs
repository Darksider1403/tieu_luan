using EcommerceFashionWebsite.Entity;

namespace EcommerceFashionWebsite.Repository
{
    public interface IProductRepository
    {
        Task<List<Product>> GetAllProductsAsync();
        Task<Product?> GetProductByIdAsync(string productId); 
        Task<List<Product>> GetProductsByCategoryAsync(int categoryId, int limit = 15);
        Task<List<Product>> GetProductsByGenderAsync(string gender, int limit = 15);
        Task<List<Product>> SearchProductsAsync(string searchTerm);
        Task<List<Product>> GetProductsWithPaginationAsync(int pageSize, int offset, int? categoryId = null);
        Task<int> GetTotalProductsAsync();
        Task<int> GetTotalProductsByCategoryAsync(int categoryId);
        Task<int> GetTotalProductsBySearchAsync(string searchTerm);
        Task<int> CreateProductAsync(Product product);
        Task<int> UpdateProductAsync(Product product);
        Task<int> UpdateProductStatusAsync(string productId, int status); 
        Task<int> DeleteProductAsync(string productId); 
        Task<int> DecrementQuantityAsync(List<string> productIds, int decrementAmount); 
        Task<double> GetProductRatingAsync(string productId); 
        
        // Category and Image methods
        Task<Dictionary<string, string>> GetCategoriesAsync();
        Task<Dictionary<string, string>> GetThumbnailImagesAsync();
        Task<Dictionary<string, string>> GetProductImagesAsync(string productId); 
        Task<string> GetProductThumbnailAsync(string productId); 
        Task<int> InsertImageAsync(string productId, string source, bool isThumbnail); 
        Task<int> DeleteProductImagesAsync(string productId); 
        
        // Slider methods
        Task<List<Slider>> GetAllSlidersAsync();
    }
}