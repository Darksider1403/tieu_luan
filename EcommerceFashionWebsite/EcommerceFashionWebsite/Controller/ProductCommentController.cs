using EcommerceFashionWebsite.DTOs;
using EcommerceFashionWebsite.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EcommerceFashionWebsite.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductCommentController : ControllerBase
    {
        private readonly IProductCommentService _commentService;
        private readonly ILogger<ProductCommentController> _logger;

        public ProductCommentController(
            IProductCommentService commentService,
            ILogger<ProductCommentController> logger)
        {
            _commentService = commentService;
            _logger = logger;
        }

        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetProductComments(
            string productId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = GetCurrentUserId();
                var comments = await _commentService.GetProductCommentsAsync(productId, page, pageSize, userId);
                var totalComments = await _commentService.GetTotalCommentsAsync(productId);

                return Ok(new
                {
                    comments,
                    totalComments,
                    page,
                    pageSize,
                    totalPages = (int)Math.Ceiling(totalComments / (double)pageSize)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting comments");
                return StatusCode(500, new { message = "Lỗi server" });
            }
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateComment([FromBody] CreateCommentDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                    return Unauthorized();

                var comment = await _commentService.CreateCommentAsync(dto, userId.Value);
                return Ok(comment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating comment");
                return StatusCode(500, new { message = "Lỗi server" });
            }
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateComment(int id, [FromBody] UpdateCommentDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                    return Unauthorized();
                
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var comment = await _commentService.UpdateCommentAsync(id, dto, userId.Value, userRole);
                return Ok(comment);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating comment");
                return StatusCode(500, new { message = "Lỗi server" });
            }
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteComment(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                    return Unauthorized();

                await _commentService.DeleteCommentAsync(id, userId.Value);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting comment");
                return StatusCode(500, new { message = "Lỗi server" });
            }
        }

        [Authorize]
        [HttpPost("{id}/helpful")]
        public async Task<IActionResult> MarkAsHelpful(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                    return Unauthorized();

                var result = await _commentService.MarkCommentAsHelpfulAsync(id, userId.Value);
                
                if (!result)
                    return BadRequest(new { message = "Bạn đã đánh dấu hữu ích rồi" });

                return Ok(new { message = "Đã đánh dấu hữu ích" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking helpful");
                return StatusCode(500, new { message = "Lỗi server" });
            }
        }

        [Authorize]
        [HttpDelete("{id}/helpful")]
        public async Task<IActionResult> UnmarkAsHelpful(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                    return Unauthorized();

                var result = await _commentService.UnmarkCommentAsHelpfulAsync(id, userId.Value);
                
                if (!result)
                    return BadRequest(new { message = "Bạn chưa đánh dấu hữu ích" });

                return Ok(new { message = "Đã bỏ đánh dấu hữu ích" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unmarking helpful");
                return StatusCode(500, new { message = "Lỗi server" });
            }
        }

        private int? GetCurrentUserId()
        {
            // ✅ Your JWT uses "UserId" claim
            var userIdClaim = User.FindFirst("UserId")?.Value;
    
            if (userIdClaim != null && int.TryParse(userIdClaim, out int userId))
            {
                _logger.LogInformation("Found UserId in token: {UserId}", userId);
                return userId;
            }
    
            _logger.LogWarning("Could not find UserId in token. Available claims: {Claims}", 
                string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}")));
            return null;
        }
        
        [Authorize]
        [HttpGet("debug/me")]
        public IActionResult GetCurrentUser()
        {
            var userId = GetCurrentUserId();
            var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
    
            return Ok(new
            {
                userId,
                isAuthenticated = User.Identity?.IsAuthenticated,
                claims
            });
        }
    }
}