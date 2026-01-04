using EcommerceFashionWebsite.DTOs;
using EcommerceFashionWebsite.Entity;
using EcommerceFashionWebsite.Repository;
using EcommerceFashionWebsite.Services.Interface;

namespace EcommerceFashionWebsite.Services
{
    public class ProductCommentService : IProductCommentService
    {
        private readonly IProductCommentRepository _commentRepository;
        private readonly ILogger<ProductCommentService> _logger;

        public ProductCommentService(
            IProductCommentRepository commentRepository,
            ILogger<ProductCommentService> logger)
        {
            _commentRepository = commentRepository;
            _logger = logger;
        }

        public async Task<List<ProductCommentDto>> GetProductCommentsAsync(string productId, int page = 1, int pageSize = 20, int? currentUserId = null)
        {
            var comments = await _commentRepository.GetByProductIdAsync(productId, page, pageSize);
            var dtos = new List<ProductCommentDto>();

            foreach (var comment in comments)
            {
                dtos.Add(await MapToDto(comment, currentUserId));
            }

            return dtos;
        }

        public async Task<int> GetTotalCommentsAsync(string productId)
        {
            return await _commentRepository.GetTotalCommentsAsync(productId);
        }

        public async Task<ProductCommentDto> CreateCommentAsync(CreateCommentDto dto, int userId)
        {
            var comment = new ProductComment
            {
                ProductId = dto.ProductId,
                UserId = userId,
                Comment = dto.Comment,
                ParentId = dto.ParentId,
                Status = 1
            };

            var created = await _commentRepository.CreateAsync(comment);
            var result = await _commentRepository.GetByIdAsync(created.Id);
            return await MapToDto(result!, userId);
        }

        public async Task<ProductCommentDto> UpdateCommentAsync(int commentId, UpdateCommentDto dto, int userId)
        {
            var comment = await _commentRepository.GetByIdAsync(commentId);
    
            if (comment == null)
            {
                _logger.LogWarning("Comment {CommentId} not found", commentId);
                throw new KeyNotFoundException("Không tìm thấy bình luận.");
            }

            _logger.LogInformation("Checking permissions: CommentUserId={CommentUserId}, CurrentUserId={CurrentUserId}", 
                comment.UserId, userId);

            if (comment.UserId != userId)
            {
                _logger.LogWarning("User {UserId} tried to edit comment owned by {OwnerId}", userId, comment.UserId);
                throw new UnauthorizedAccessException("Bạn không có quyền chỉnh sửa bình luận này.");
            }

            comment.Comment = dto.Comment;

            var updated = await _commentRepository.UpdateAsync(comment);
            return await MapToDto(updated, userId);
        }
        
        public async Task<ProductCommentDto> UpdateCommentAsync(int commentId, UpdateCommentDto dto, int userId, string? userRole = null)
        {
            var comment = await _commentRepository.GetByIdAsync(commentId);
    
            if (comment == null)
                throw new KeyNotFoundException("Không tìm thấy bình luận.");

            // ✅ Allow admins to edit any comment
            bool isAdmin = userRole?.ToLower() == "admin";
            bool isOwner = comment.UserId == userId;

            if (!isOwner && !isAdmin)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền chỉnh sửa bình luận này.");
            }

            comment.Comment = dto.Comment;
            var updated = await _commentRepository.UpdateAsync(comment);
            return await MapToDto(updated, userId);
        }

        public async Task<bool> DeleteCommentAsync(int commentId, int userId)
        {
            var comment = await _commentRepository.GetByIdAsync(commentId);
            
            if (comment == null)
                throw new KeyNotFoundException("Không tìm thấy bình luận.");

            if (comment.UserId != userId)
                throw new UnauthorizedAccessException("Bạn không có quyền xóa bình luận này.");

            return await _commentRepository.DeleteAsync(commentId);
        }

        public async Task<bool> MarkCommentAsHelpfulAsync(int commentId, int userId)
        {
            return await _commentRepository.MarkAsHelpfulAsync(commentId, userId);
        }

        public async Task<bool> UnmarkCommentAsHelpfulAsync(int commentId, int userId)
        {
            return await _commentRepository.UnmarkAsHelpfulAsync(commentId, userId);
        }

        private async Task<ProductCommentDto> MapToDto(ProductComment comment, int? currentUserId)
        {
            var isHelpful = currentUserId.HasValue 
                ? await _commentRepository.IsMarkedHelpfulByUserAsync(comment.Id, currentUserId.Value)
                : false;

            var dto = new ProductCommentDto
            {
                Id = comment.Id,
                ProductId = comment.ProductId,
                UserId = comment.UserId,
                UserName = comment.User?.Username ?? "Anonymous",
                UserAvatar = "",
                Comment = comment.Comment,
                ParentId = comment.ParentId,
                IsVerifiedPurchase = comment.IsVerifiedPurchase,
                HelpfulCount = comment.HelpfulCount,
                CreatedAt = comment.CreatedAt,
                UpdatedAt = comment.UpdatedAt,
                IsHelpfulByCurrentUser = isHelpful,
                CanEdit = currentUserId.HasValue && currentUserId.Value == comment.UserId,
                CanDelete = currentUserId.HasValue && currentUserId.Value == comment.UserId
            };

            foreach (var reply in comment.Replies.OrderBy(r => r.CreatedAt))
            {
                dto.Replies.Add(await MapToDto(reply, currentUserId));
            }

            return dto;
        }
    }
}