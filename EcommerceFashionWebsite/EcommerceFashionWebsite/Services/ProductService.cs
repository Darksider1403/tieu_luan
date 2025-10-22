using EcommerceFashionWebsite.Entity;
using EcommerceFashionWebsite.Repository;
using EcommerceFashionWebsite.DTOs;
using EcommerceFashionWebsite.Services.Interface;

namespace EcommerceFashionWebsite.Services
{
    public class ProductService : IProductService
    {
        private readonly IProductRepository _productRepository;
        private readonly IAccountRepository _accountRepository;
        private readonly ILogger<ProductService> _logger;

        public ProductService(IProductRepository productRepository,
            IAccountRepository accountRepository,
            ILogger<ProductService> logger)
        {
            _productRepository = productRepository;
            _accountRepository = accountRepository;
            _logger = logger;
        }

        public async Task<List<ProductDto>> GetAllProductsAsync()
        {
            var products = await _productRepository.GetAllProductsAsync();
            var thumbnails = await _productRepository.GetThumbnailImagesAsync();

            var productDtos = new List<ProductDto>();
            foreach (var product in products)
            {
                var dto = await MapToDtoAsync(product);
                if (thumbnails.TryGetValue(product.Id, out var thumbnail))
                {
                    dto.ThumbnailImage = thumbnail;
                }

                productDtos.Add(dto);
            }

            return productDtos;
        }

        public async Task<ProductDto?> GetProductByIdAsync(string productId)
        {
            var product = await _productRepository.GetProductByIdAsync(productId);
            if (product == null) return null;

            return await MapToDtoAsync(product);
        }

        public async Task<List<ProductDto>> GetProductsByCategoryAsync(int categoryId, int limit = 15)
        {
            var products = await _productRepository.GetProductsByCategoryAsync(categoryId, limit);
            var thumbnails = await _productRepository.GetThumbnailImagesAsync();

            var productDtos = new List<ProductDto>();
            foreach (var product in products)
            {
                var dto = await MapToDtoAsync(product);
                if (thumbnails.TryGetValue(product.Id, out var thumbnail))
                {
                    dto.ThumbnailImage = thumbnail;
                }

                productDtos.Add(dto);
            }

            return productDtos;
        }

        public async Task<List<ProductDto>> GetProductsByGenderAsync(string gender, int limit = 15)
        {
            var products = await _productRepository.GetProductsByGenderAsync(gender, limit);
            var thumbnails = await _productRepository.GetThumbnailImagesAsync();

            var productDtos = new List<ProductDto>();
            foreach (var product in products)
            {
                var dto = await MapToDtoAsync(product);
                if (thumbnails.TryGetValue(product.Id, out var thumbnail))
                {
                    dto.ThumbnailImage = thumbnail;
                }

                productDtos.Add(dto);
            }

            return productDtos;
        }

        public async Task<List<ProductDto>> SearchProductsAsync(string searchTerm)
        {
            var products = await _productRepository.SearchProductsAsync(searchTerm);
            var thumbnails = await _productRepository.GetThumbnailImagesAsync();

            var productDtos = new List<ProductDto>();
            foreach (var product in products)
            {
                var dto = await MapToDtoAsync(product);
                if (thumbnails.TryGetValue(product.Id, out var thumbnail))
                {
                    dto.ThumbnailImage = thumbnail;
                }

                productDtos.Add(dto);
            }

            return productDtos;
        }

        public async Task<PagedResult<ProductDto>> GetProductsWithPaginationAsync(int page, int pageSize,
            int? categoryId, string? sortBy = null, string? filter = null)
        {
            var offset = page * pageSize;
            var products = await _productRepository.GetProductsWithPaginationAsync(pageSize, offset, categoryId);

            // Get all thumbnails in one call for efficiency
            var thumbnails = await _productRepository.GetThumbnailImagesAsync();

            // Convert to DTOs and populate thumbnails and ratings
            var productDtos = new List<ProductDto>();
            foreach (var product in products)
            {
                var dto = await MapToDtoAsync(product);
                if (thumbnails.TryGetValue(product.Id, out var thumbnail))
                {
                    dto.ThumbnailImage = thumbnail;
                }

                productDtos.Add(dto);
            }

            var totalProducts = categoryId != null
                ? await _productRepository.GetTotalProductsByCategoryAsync(categoryId.Value)
                : await _productRepository.GetTotalProductsAsync();

            var totalPages = (int)Math.Ceiling((double)totalProducts / pageSize);

            return new PagedResult<ProductDto>
            {
                Items = productDtos,
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
                return await MapToDtoAsync(product);
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
            return await MapToDtoAsync(product);
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

        public async Task<Dictionary<string, string>> GetProductImagesAsync(string productId)
        {
            return await _productRepository.GetProductImagesAsync(productId);
        }

        public async Task<List<ProductCommentDto>> GetProductCommentsAsync(string productId)
        {
            try
            {
                var comments = await _productRepository.GetProductCommentsAsync(productId);
        
                var commentDtos = comments.Select(c => new ProductCommentDto
                {
                    Username = c.Account?.Username ?? "Anonymous",
                    Content = c.Content,
                    Rating = c.Rating,
                    DateComment = c.DateComment,
                    Avatar = string.Empty
                }).ToList();

                return commentDtos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting product comments for {ProductId}", productId);
                return new List<ProductCommentDto>();
            }
        }

        public async Task<bool> AddProductRatingAsync(string productId, int accountId, int rating)
        {
            try
            {
                if (rating < 1 || rating > 5)
                    return false;

                var result = await _productRepository.GetOrCreateProductRatingAsync(productId, accountId, rating);
                return result > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding product rating");
                return false;
            }
        }

        public async Task<bool> AddProductCommentAsync(string productId, int accountId, string content)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(content))
                    return false;

                var comment = new ProductComment
                {
                    ProductId = productId,
                    AccountId = accountId,
                    Content = content.Trim(),
                    Rating = 0
                };

                var result = await _productRepository.AddProductCommentAsync(comment);
                return result > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding product comment");
                return false;
            }
        }

        // Updated mapping method that populates thumbnail and rating
        private async Task<ProductDto> MapToDtoAsync(Product product)
        {
            var thumbnailImage = await _productRepository.GetProductThumbnailAsync(product.Id);
            var rating = await _productRepository.GetProductRatingAsync(product.Id);

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
                Status = product.Status,
                ThumbnailImage = thumbnailImage,
                Rating = rating
            };
        }

        // Keep the synchronous version for backwards compatibility if needed
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
                Status = product.Status,
                ThumbnailImage = string.Empty,
                Rating = 0.0 
            };
        }
    }
}