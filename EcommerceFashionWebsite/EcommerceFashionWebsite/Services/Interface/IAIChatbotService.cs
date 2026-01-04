using EcommerceFashionWebsite.DTOs;

namespace EcommerceFashionWebsite.Services.Interface
{
    public interface IAIChatbotService
    {
        Task<ChatbotResponseDto> GetResponseAsync(string userMessage, int? userId = null, bool isAdmin = false);
        Task<List<ChatMessageDto>> GetChatHistoryAsync(int userId);
        Task SaveChatMessageAsync(int userId, string userMessage, string botResponse);
        Task<string> DiagnosticProductCheck();
    }
}