namespace EcommerceFashionWebsite.DTOs;

public class AccountDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Fullname { get; set; } = string.Empty;
    public string? NumberPhone { get; set; } = string.Empty;
    public int Status { get; set; }
    public string Role { get; set; } = "User";
}