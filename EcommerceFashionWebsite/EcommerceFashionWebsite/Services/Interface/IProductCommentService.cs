using EcommerceFashionWebsite.DTOs;

namespace EcommerceFashionWebsite.Services.Interface;

public interface IProductCommentService
{
    Task<List<ProductCommentDto>> GetProductCommentsAsync(string productId, int page = 1, int pageSize = 20, int? currentUserId = null);
    Task<int> GetTotalCommentsAsync(string productId);
    Task<ProductCommentDto> CreateCommentAsync(CreateCommentDto dto, int userId);
    Task<ProductCommentDto> UpdateCommentAsync(int commentId, UpdateCommentDto dto, int userId);
    Task<ProductCommentDto> UpdateCommentAsync(int commentId, UpdateCommentDto dto, int userId, string? userRole = null);
    Task<bool> DeleteCommentAsync(int commentId, int userId);
    Task<bool> MarkCommentAsHelpfulAsync(int commentId, int userId);
    Task<bool> UnmarkCommentAsHelpfulAsync(int commentId, int userId);
}