using EcommerceFashionWebsite.Data;
using EcommerceFashionWebsite.Entity;
using EcommerceFashionWebsite.Repository;
using Microsoft.EntityFrameworkCore;

namespace EcommerceFashionWebsite.Repository;

public class ProductRepository : IProductRepository
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ProductRepository> _logger;

    public ProductRepository(ApplicationDbContext context, ILogger<ProductRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<Product>> GetAllProductsAsync()
    {
        return await _context.Products
            .Where(p => p.Status == 1)
            .ToListAsync();
    }

    public async Task<Product?> GetProductByIdAsync(string productId)
    {
        return await _context.Products
            .Where(p => p.Id == productId)
            .Select(p => new Product
            {
                Id = p.Id,
                Name = p.Name,
                Price = p.Price,
                Quantity = p.Quantity,
                Material = p.Material,
                Size = p.Size,
                Color = p.Color,
                Gender = p.Gender,
                Status = p.Status,
                IdCategory = p.IdCategory
            })
            .FirstOrDefaultAsync();
    }

    public async Task<List<Product>> GetProductsByCategoryAsync(int categoryId, int limit = 15)
    {
        return await _context.Products
            .Where(p => p.IdCategory == categoryId && p.Status == 1)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<List<Product>> GetProductsByGenderAsync(string gender, int limit = 15)
    {
        return await _context.Products
            .Where(p => p.Gender == gender && p.Status == 1)
            .Take(limit)
            .ToListAsync();
    }

        public async Task<List<Product>> SearchProductsAsync(string query)
        {
            try
            {
                _logger.LogInformation("Repository search: '{Query}'", query ?? "NULL");

                var productsQuery = _context.Products
                    .AsNoTracking()
                    .Where(p => p.Status == 1); 

                // If query is empty or null, return newest products
                if (string.IsNullOrWhiteSpace(query))
                {
                    var allProducts = await productsQuery
                        .OrderByDescending(p => p.Id) // Newest first
                        .Take(20)
                        .ToListAsync();

                    _logger.LogInformation("Empty query - returning {Count} newest products", allProducts.Count);
                    return allProducts;
                }

                var lowerQuery = query.ToLower().Trim();
                _logger.LogInformation("Searching with normalized query: '{Query}'", lowerQuery);

                // Search in name, description, color
                var searchResults = await productsQuery
                    .Where(p =>
                        p.Name.ToLower().Contains(lowerQuery) ||
                        (p.Color != null && p.Color.ToLower().Contains(lowerQuery)) ||
                        (p.Size != null && p.Size.ToLower().Contains(lowerQuery))
                    )
                    .OrderByDescending(p => p.Id)
                    .Take(20)
                    .ToListAsync();

                _logger.LogInformation("Search found {Count} products", searchResults.Count);

                // If no results with exact match, try more flexible search
                if (!searchResults.Any())
                {
                    _logger.LogInformation("No exact matches, trying flexible search");

                    // Split query into words
                    var words = lowerQuery.Split(' ', StringSplitOptions.RemoveEmptyEntries);

                    searchResults = await productsQuery
                        .Where(p => words.Any(word =>
                            p.Name.ToLower().Contains(word) ||
                            (p.Color != null && p.Color.ToLower().Contains(word))
                        ))
                        .OrderByDescending(p => p.Id)
                        .Take(20)
                        .ToListAsync();

                    _logger.LogInformation("Flexible search found {Count} products", searchResults.Count);
                }

                return searchResults;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Repository search error");
                return new List<Product>();
            }
        }

    public async Task<List<Product>> GetProductsWithPaginationAsync(int pageSize, int offset, int? categoryId = null)
    {
        var query = _context.Products.Where(p => p.Status == 1);

        if (categoryId.HasValue)
        {
            query = query.Where(p => p.IdCategory == categoryId.Value);
        }

        return await query
            .Skip(offset)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetTotalProductsAsync()
    {
        return await _context.Products.CountAsync(p => p.Status == 1);
    }

    public async Task<int> GetTotalProductsByCategoryAsync(int categoryId)
    {
        return await _context.Products
            .CountAsync(p => p.IdCategory == categoryId && p.Status == 1);
    }

    public async Task<int> GetTotalProductsBySearchAsync(string searchTerm)
    {
        return await _context.Products
            .CountAsync(p => p.Name.Contains(searchTerm) && p.Status == 1);
    }

    public async Task<int> CreateProductAsync(Product product)
    {
        _context.Products.Add(product);
        return await _context.SaveChangesAsync();
    }

    public async Task<int> UpdateProductAsync(Product product)
    {
        _context.Products.Update(product);
        return await _context.SaveChangesAsync();
    }

    public async Task<int> UpdateProductStatusAsync(string productId, int status)
    {
        var product = await _context.Products.FindAsync(productId);
        if (product != null)
        {
            product.Status = status;
            return await _context.SaveChangesAsync();
        }

        return 0;
    }

    public async Task<int> DeleteProductAsync(string productId)
    {
        var product = await _context.Products.FindAsync(productId);
        if (product != null)
        {
            // First delete associated images
            await DeleteProductImagesAsync(productId);

            _context.Products.Remove(product);
            return await _context.SaveChangesAsync();
        }

        return 0;
    }

    public async Task<int> DecrementQuantityAsync(List<string> productIds, int decrementAmount)
    {
        if (decrementAmount <= 0)
            throw new ArgumentException("Decrement amount must be greater than 0");

        int totalUpdated = 0;
        foreach (var productId in productIds)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product != null && product.Quantity >= decrementAmount)
            {
                product.Quantity -= decrementAmount;
                totalUpdated++;
            }
        }

        if (totalUpdated > 0)
        {
            await _context.SaveChangesAsync();
        }

        return totalUpdated;
    }

    public async Task<double> GetProductRatingAsync(string productId)
    {
        var averageRating = await _context.ProductRatings
            .Where(pr => pr.ProductId == productId)
            .AverageAsync(pr => (double?)pr.Rating);

        return averageRating ?? 0.0;
    }

    public async Task<Dictionary<string, string>> GetCategoriesAsync()
    {
        var categories = await _context.Categories.ToListAsync();
        return categories.ToDictionary(c => c.Id.ToString(), c => c.Name);
    }

    public async Task<Dictionary<string, string>> GetThumbnailImagesAsync()
    {
        var images = await _context.ProductImages
            .Where(img => img.IsThumbnailImage)
            .ToListAsync();

        var result = new Dictionary<string, string>();
        foreach (var img in images)
        {
            if (!result.ContainsKey(img.ProductId.ToString()))
            {
                result[img.ProductId.ToString()] = img.Source;
            }
        }

        return result;
    }

    public async Task<Dictionary<string, string>> GetProductImagesAsync(string productId)
    {
        var images = await _context.ProductImages
            .Where(img => img.ProductId == productId)
            .ToListAsync();

        var result = new Dictionary<string, string>();
        for (int i = 0; i < images.Count; i++)
        {
            result[i.ToString()] = images[i].Source;
        }

        return result;
    }

    public async Task<string> GetProductThumbnailAsync(string productId)
    {
        var image = await _context.ProductImages
            .FirstOrDefaultAsync(img => img.ProductId == productId && img.IsThumbnailImage);

        return image?.Source ?? string.Empty;
    }

    public async Task<int> InsertImageAsync(string productId, string source, bool isThumbnail)
    {
        var image = new ProductImage
        {
            ProductId = productId,
            Source = source,
            IsThumbnailImage = isThumbnail
        };

        _context.ProductImages.Add(image);
        return await _context.SaveChangesAsync();
    }

    public async Task<int> DeleteProductImagesAsync(string productId)
    {
        var images = await _context.ProductImages
            .Where(img => img.ProductId == productId)
            .ToListAsync();

        _context.ProductImages.RemoveRange(images);
        return await _context.SaveChangesAsync();
    }

    public async Task<List<Slider>> GetAllSlidersAsync()
    {
        return await _context.Sliders.ToListAsync();
    }

    public Task<int> AddProductCommentAsync(ProductComment comment)
    {
        throw new NotImplementedException();
    }


    public async Task<int> UpdateProductCommentAsync(ProductComment comment)
    {
        _context.ProductComments.Update(comment);
        return await _context.SaveChangesAsync();
    }

    public async Task<bool> DeleteProductCommentAsync(int commentId)
    {
        var comment = await _context.ProductComments.FindAsync(commentId);
        if (comment != null)
        {
            _context.ProductComments.Remove(comment);
            await _context.SaveChangesAsync();
            return true;
        }

        return false;
    }

    public async Task<double> GetProductAverageRatingAsync(string productId)
    {
        try
        {
            var avgRating = await _context.ProductRatings
                .Where(pr => pr.ProductId == productId)
                .AverageAsync(pr => (double?)pr.Rating);

            return avgRating ?? 0.0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting average rating for product {ProductId}", productId);
            return 0.0;
        }
    }

    public async Task<int> GetOrCreateProductRatingAsync(string productId, int accountId, int rating)
    {
        var existingComment = await _context.ProductComments
            .FirstOrDefaultAsync(pc => pc.ProductId == productId);

        if (existingComment != null)
        {
          
            _context.ProductComments.Update(existingComment);
        }
        else
        {
            // var newComment = new ProductComment
            // {
            //     ProductId = productId,
            //     AccountId = accountId,
            //     Rating = rating,
            //     Content = string.Empty,
            //     DateComment = DateTime.Now,
            //     Status = 1
            // };

            // _context.ProductComments.Add(newComment);
        }

        return await _context.SaveChangesAsync();
    }

    public async Task<int> GetProductTotalRatingsAsync(string productId)
    {
        try
        {
            return await _context.ProductRatings
                .Where(pr => pr.ProductId == productId)
                .CountAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting total ratings for product {ProductId}", productId);
            return 0;
        }
    }

    public async Task<Dictionary<int, int>> GetProductRatingDistributionAsync(string productId)
    {
        try
        {
            var distribution = await _context.ProductRatings
                .Where(pr => pr.ProductId == productId)
                .GroupBy(pr => pr.Rating)
                .Select(g => new { Rating = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Rating, x => x.Count);

            // Ensure all ratings 1-5 are present
            var result = new Dictionary<int, int>();
            for (int i = 1; i <= 5; i++)
            {
                result[i] = distribution.ContainsKey(i) ? distribution[i] : 0;
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rating distribution for product {ProductId}", productId);
            return new Dictionary<int, int> { { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 } };
        }
    }

    public async Task<int?> GetUserRatingAsync(string productId, int userId)
    {
        try
        {
            var rating = await _context.ProductRatings
                .Where(pr => pr.ProductId == productId && pr.AccountId == userId)
                .Select(pr => (int?)pr.Rating)
                .FirstOrDefaultAsync();

            return rating;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user rating for user {UserId} and product {ProductId}",
                userId, productId);
            return null;
        }
    }

    public async Task<bool> HasUserRatedAsync(string productId, int userId)
    {
        try
        {
            return await _context.ProductRatings
                .AnyAsync(pr => pr.ProductId == productId && pr.AccountId == userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if user has rated");
            return false;
        }
    }

    public async Task<int> AddOrUpdateProductRatingAsync(string productId, int userId, int rating)
    {
        try
        {
            var existingRating = await _context.ProductRatings
                .FirstOrDefaultAsync(pr => pr.ProductId == productId && pr.AccountId == userId);

            if (existingRating != null)
            {
                // Update existing rating
                existingRating.Rating = rating;
                existingRating.DateRating = DateTime.Now;
                _context.ProductRatings.Update(existingRating);

                _logger.LogInformation("Updated rating for user {UserId} on product {ProductId} to {Rating}",
                    userId, productId, rating);
            }
            else
            {
                // Add new rating
                var newRating = new ProductRating
                {
                    ProductId = productId,
                    AccountId = userId,
                    Rating = rating,
                    DateRating = DateTime.Now
                };
                await _context.ProductRatings.AddAsync(newRating);

                _logger.LogInformation("Added new rating for user {UserId} on product {ProductId}: {Rating}",
                    userId, productId, rating);
            }

            return await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding/updating rating for product {ProductId}", productId);
            throw;
        }
    }

    public async Task<bool> HasUserPurchasedProductAsync(string productId, int userId)
    {
        try
        {
            // Check if user has purchased and RECEIVED the product
            var hasPurchased = await _context.Orders
                .Where(o => o.IdAccount == userId
                            && o.IsVerified == true     // ✅ BOOL comparison (hoặc chỉ: o.IsVerified)
                            && o.Status >= 3            // ✅ Must be delivered (3 = Đã giao, 4 = Hoàn thành)
                            && o.Status != 5            // Exclude cancelled orders
                            && o.Status != 6)           // Exclude refunded orders
                .SelectMany(o => o.OrderDetail)
                .AnyAsync(od => od.IdProduct == productId);

            _logger.LogInformation(
                "Purchase check for user {UserId} and product {ProductId}: {HasPurchased} (IsVerified={IsVerified}, Status={Status})",
                userId, productId, hasPurchased, "checked", ">=3");

            return hasPurchased;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if user purchased product {ProductId}", productId);
            return false;
        }
    }
}