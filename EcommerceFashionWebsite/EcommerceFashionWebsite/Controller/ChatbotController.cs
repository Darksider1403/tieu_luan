using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using EcommerceFashionWebsite.Services.Interface;
using EcommerceFashionWebsite.DTOs;

namespace EcommerceFashionWebsite.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatbotController : ControllerBase
    {
        private readonly IAIChatbotService _chatbotService;
        private readonly ILogger<ChatbotController> _logger;

        public ChatbotController(IAIChatbotService chatbotService, ILogger<ChatbotController> logger)
        {
            _chatbotService = chatbotService;
            _logger = logger;
        }

        [HttpPost("chat")]
        public async Task<ActionResult<ChatbotResponseDto>> Chat([FromBody] ChatbotRequestDto request)
        {
            try
            {
                var userIdClaim = User.FindFirst("UserId")?.Value;
                int? userId = null;
                
                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int uid))
                {
                    userId = uid;
                }

                var response = await _chatbotService.GetResponseAsync(request.Message, userId, false);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing chat request");
                return StatusCode(500, new ChatbotResponseDto 
                { 
                    Success = false, 
                    Error = "Failed to process request" 
                });
            }
        }

        [HttpPost("admin/chat")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ChatbotResponseDto>> AdminChat([FromBody] ChatbotRequestDto request)
        {
            try
            {
                _logger.LogInformation("=== ADMIN CHAT REQUEST ===");
                _logger.LogInformation("Request received at: {Time}", DateTime.Now);
                _logger.LogInformation("Message: {Message}", request.Message);
        
                var userIdClaim = User.FindFirst("UserId")?.Value;
                var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
        
                _logger.LogInformation("User ID Claim: {UserId}", userIdClaim);
                _logger.LogInformation("Role Claim: {Role}", roleClaim);
                _logger.LogInformation("All Claims: {Claims}", 
                    string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}")));
        
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    _logger.LogWarning("Unauthorized - Invalid user ID");
                    return Unauthorized();
                }

                _logger.LogInformation("Calling service with isAdmin=true");
                var response = await _chatbotService.GetResponseAsync(request.Message, userId, true);
        
                _logger.LogInformation("Response success: {Success}", response.Success);
                _logger.LogInformation("Response length: {Length}", response.Response?.Length ?? 0);
        
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing admin chat request");
                return StatusCode(500, new ChatbotResponseDto 
                { 
                    Success = false, 
                    Error = "Failed to process request" 
                });
            }
        }

        [HttpGet("history")]
        [Authorize]
        public async Task<ActionResult<List<ChatMessageDto>>> GetHistory()
        {
            try
            {
                var userIdClaim = User.FindFirst("UserId")?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized();
                }

                var history = await _chatbotService.GetChatHistoryAsync(userId);
                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting chat history");
                return StatusCode(500, new { error = "Failed to get history" });
            }
        }
        
        [HttpGet("diagnostic")]
        public async Task<IActionResult> DiagnosticCheck()
        {
            var result = await _chatbotService.DiagnosticProductCheck();
            return Ok(result);
        }
    }
}