using EcommerceFashionWebsite.Data;
using EcommerceFashionWebsite.Entity;
using Microsoft.EntityFrameworkCore;

namespace EcommerceFashionWebsite.Repository
{
    public class ProductCommentRepository : IProductCommentRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProductCommentRepository> _logger;

        public ProductCommentRepository(ApplicationDbContext context, ILogger<ProductCommentRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<ProductComment?> GetByIdAsync(int id)
        {
            return await _context.ProductComments
                .Include(c => c.User)
                .Include(c => c.Replies)
                    .ThenInclude(r => r.User)
                .FirstOrDefaultAsync(c => c.Id == id && c.Status == 1);
        }

        public async Task<List<ProductComment>> GetByProductIdAsync(string productId, int page = 1, int pageSize = 20)
        {
            return await _context.ProductComments
                .Include(c => c.User)
                .Include(c => c.Replies.Where(r => r.Status == 1))
                    .ThenInclude(r => r.User)
                .Where(c => c.ProductId == productId && c.Status == 1 && c.ParentId == null)
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<int> GetTotalCommentsAsync(string productId)
        {
            return await _context.ProductComments
                .CountAsync(c => c.ProductId == productId && c.Status == 1);
        }

        public async Task<ProductComment> CreateAsync(ProductComment comment)
        {
            // Check if user has purchased the product
            comment.IsVerifiedPurchase = await HasUserPurchasedProductAsync(comment.UserId, comment.ProductId);
            
            _context.ProductComments.Add(comment);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Comment created: ID={Id}, Product={ProductId}, User={UserId}", 
                comment.Id, comment.ProductId, comment.UserId);
            
            return comment;
        }

        public async Task<ProductComment> UpdateAsync(ProductComment comment)
        {
            comment.UpdatedAt = DateTime.Now;
            _context.ProductComments.Update(comment);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Comment updated: ID={Id}", comment.Id);
            
            return comment;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var comment = await _context.ProductComments.FindAsync(id);
            if (comment == null) return false;

            comment.Status = 0; // Soft delete
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Comment deleted: ID={Id}", id);
            
            return true;
        }

        public async Task<bool> HasUserPurchasedProductAsync(int userId, string productId)
        {
            return await _context.Orders
                .Where(o => o.IdAccount == userId && o.Status == 4) // Status 4 = Delivered
                .SelectMany(o => o.OrderDetail)
                .AnyAsync(od => od.IdProduct == productId);
        }

        public async Task<bool> MarkAsHelpfulAsync(int commentId, int userId)
        {
            try
            {
                var exists = await _context.CommentHelpfuls
                    .AnyAsync(ch => ch.CommentId == commentId && ch.UserId == userId);

                if (exists) return false;

                _context.CommentHelpfuls.Add(new CommentHelpful
                {
                    CommentId = commentId,
                    UserId = userId
                });

                var comment = await _context.ProductComments.FindAsync(commentId);
                if (comment != null)
                {
                    comment.HelpfulCount++;
                }

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking comment as helpful");
                return false;
            }
        }

        public async Task<bool> UnmarkAsHelpfulAsync(int commentId, int userId)
        {
            try
            {
                var helpful = await _context.CommentHelpfuls
                    .FirstOrDefaultAsync(ch => ch.CommentId == commentId && ch.UserId == userId);

                if (helpful == null) return false;

                _context.CommentHelpfuls.Remove(helpful);

                var comment = await _context.ProductComments.FindAsync(commentId);
                if (comment != null && comment.HelpfulCount > 0)
                {
                    comment.HelpfulCount--;
                }

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unmarking comment as helpful");
                return false;
            }
        }

        public async Task<bool> IsMarkedHelpfulByUserAsync(int commentId, int userId)
        {
            return await _context.CommentHelpfuls
                .AnyAsync(ch => ch.CommentId == commentId && ch.UserId == userId);
        }
    }
}