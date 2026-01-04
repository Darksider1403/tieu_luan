using EcommerceFashionWebsite.Entity;

namespace EcommerceFashionWebsite.Repository;

public interface IProductCommentRepository
{
    Task<ProductComment?> GetByIdAsync(int id);
    Task<List<ProductComment>> GetByProductIdAsync(string productId, int page = 1, int pageSize = 20);
    Task<int> GetTotalCommentsAsync(string productId);
    Task<ProductComment> CreateAsync(ProductComment comment);
    Task<ProductComment> UpdateAsync(ProductComment comment);
    Task<bool> DeleteAsync(int id);
    Task<bool> HasUserPurchasedProductAsync(int userId, string productId);
    Task<bool> MarkAsHelpfulAsync(int commentId, int userId);
    Task<bool> UnmarkAsHelpfulAsync(int commentId, int userId);
    Task<bool> IsMarkedHelpfulByUserAsync(int commentId, int userId);
}