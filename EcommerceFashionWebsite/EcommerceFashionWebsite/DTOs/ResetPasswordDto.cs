namespace EcommerceFashionWebsite.DTOs;

public class ResetPasswordDto
{
    public string Code { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string RepeatPassword { get; set; } = string.Empty;
}