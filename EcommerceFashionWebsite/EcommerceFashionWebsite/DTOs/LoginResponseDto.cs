namespace EcommerceFashionWebsite.DTOs;

public class LoginResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty; // Add this
    public AccountDto? User { get; set; }
    public string RedirectUrl { get; set; } = string.Empty;
}