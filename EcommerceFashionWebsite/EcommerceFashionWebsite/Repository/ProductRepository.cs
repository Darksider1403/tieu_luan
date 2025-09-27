using EcommerceFashionWebsite.Data;
using EcommerceFashionWebsite.Entity;
using EcommerceFashionWebsite.Repository;
using Microsoft.EntityFrameworkCore;

namespace EcommerceFashionWebsite.Repository;

public class ProductRepository : IProductRepository
{
    private readonly ApplicationDbContext _context;

    public ProductRepository(ApplicationDbContext context)
    {
        _context = context;
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

    public async Task<List<Product>> SearchProductsAsync(string searchTerm)
    {
        return await _context.Products
            .Where(p => p.Name.Contains(searchTerm) && p.Status == 1)
            .ToListAsync();
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
}