namespace EcommerceFashionWebsite.DTOs;

public class ChatMessageDto
{
    public string UserMessage { get; set; } = string.Empty;
    public string BotResponse { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}