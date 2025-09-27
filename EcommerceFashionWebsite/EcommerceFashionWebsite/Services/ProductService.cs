using EcommerceFashionWebsite.Entity;
using EcommerceFashionWebsite.Repository;
using EcommerceFashionWebsite.DTOs;
using EcommerceFashionWebsite.Services.Interface;

namespace EcommerceFashionWebsite.Services
{
    public class ProductService : IProductService
    {
        private readonly IProductRepository _productRepository;

        public ProductService(IProductRepository productRepository)
        {
            _productRepository = productRepository;
        }

        public async Task<List<ProductDto>> GetAllProductsAsync()
        {
            var products = await _productRepository.GetAllProductsAsync();
            return products.Select(MapToDto).ToList();
        }

        public async Task<ProductDto?> GetProductByIdAsync(string productId)
        {
            var product = await _productRepository.GetProductByIdAsync(productId);
            return product != null ? MapToDto(product) : null;
        }

        public async Task<List<ProductDto>> GetProductsByCategoryAsync(int categoryId, int limit = 15)
        {
            var products = await _productRepository.GetProductsByCategoryAsync(categoryId, limit);
            return products.Select(MapToDto).ToList();
        }

        public async Task<List<ProductDto>> GetProductsByGenderAsync(string gender, int limit = 15)
        {
            var products = await _productRepository.GetProductsByGenderAsync(gender, limit);
            return products.Select(MapToDto).ToList();
        }

        public async Task<List<ProductDto>> SearchProductsAsync(string searchTerm)
        {
            var products = await _productRepository.SearchProductsAsync(searchTerm);
            return products.Select(MapToDto).ToList();
        }

        public async Task<PagedResult<ProductDto>> GetProductsWithPaginationAsync(int page, int pageSize, int? categoryId, string? sortBy = null, string? filter = null)
        {
            var offset = page * pageSize;
            var products = await _productRepository.GetProductsWithPaginationAsync(pageSize, offset, categoryId); // Convert int? to string
    
            // Fix the logic - it was backwards
            var totalProducts = categoryId != null
                ? await _productRepository.GetTotalProductsByCategoryAsync(categoryId.Value) 
                : await _productRepository.GetTotalProductsAsync(); 

            var totalPages = (int)Math.Ceiling((double)totalProducts / pageSize);

            return new PagedResult<ProductDto>
            {
                Items = products.Select(MapToDto).ToList(),
                CurrentPage = page,
                PageSize = pageSize,
                TotalPages = totalPages,
                TotalItems = totalProducts
            };
        }

        public async Task<ProductDto> CreateProductAsync(CreateProductDto dto)
        {
            var product = new Product
            {
                Id = dto.Id,
                Name = dto.Name,
                Price = dto.Price,
                Quantity = dto.Quantity,
                Material = dto.Material,
                Size = dto.Size,
                Color = dto.Color,
                Gender = dto.Gender,
                IdCategory = dto.IdCategory,
                Status = 1
            };

            var result = await _productRepository.CreateProductAsync(product);
            if (result > 0)
            {
                return MapToDto(product);
            }

            throw new Exception("Failed to create product");
        }

        public async Task<ProductDto> UpdateProductAsync(string productId, UpdateProductDto dto)
        {
            var product = await _productRepository.GetProductByIdAsync(productId);
            if (product == null)
                throw new ArgumentException("Product not found");

            product.Name = dto.Name;
            product.Price = dto.Price;
            product.Quantity = dto.Quantity;
            product.Material = dto.Material;
            product.Size = dto.Size;
            product.Color = dto.Color;
            product.Gender = dto.Gender;
            product.IdCategory = dto.IdCategory;

            await _productRepository.UpdateProductAsync(product);
            return MapToDto(product);
        }

        public async Task<bool> UpdateProductStatusAsync(string productId, int status)
        {
            var result = await _productRepository.UpdateProductStatusAsync(productId, status);
            return result > 0;
        }

        public async Task<bool> DeleteProductAsync(string productId) 
        {
            var result = await _productRepository.DeleteProductAsync(productId);
            return result > 0;
        }

        public async Task<bool> DecrementQuantityAsync(List<string> productIds, int decrementAmount) 
        {
            var result = await _productRepository.DecrementQuantityAsync(productIds, decrementAmount);
            return result > 0;
        }

        public async Task<double> GetProductRatingAsync(string productId) 
        {
            return await _productRepository.GetProductRatingAsync(productId);
        }

        public async Task<Dictionary<string, string>> GetCategoriesAsync()
        {
            return await _productRepository.GetCategoriesAsync();
        }

        public async Task<List<SliderDto>> GetAllSlidersAsync()
        {
            var sliders = await _productRepository.GetAllSlidersAsync();
            return sliders.Select(s => new SliderDto
            {
                Id = s.Id,
                Source = s.Source
            }).ToList();
        }

        public async Task<int> GetTotalProductsAsync()
        {
            return await _productRepository.GetTotalProductsAsync();
        }

        public async Task<int> GetTotalProductsByCategoryAsync(int categoryId)
        {
            return await _productRepository.GetTotalProductsByCategoryAsync(categoryId);
        }

        private static ProductDto MapToDto(Product product)
        {
            return new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                Price = product.Price,
                Quantity = product.Quantity,
                Material = product.Material,
                Size = product.Size,
                Color = product.Color,
                Gender = product.Gender,
                IdCategory = product.IdCategory,
                Status = product.Status
            };
        }
    }
}