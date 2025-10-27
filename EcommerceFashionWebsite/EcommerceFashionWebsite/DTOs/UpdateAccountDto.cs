namespace EcommerceFashionWebsite.DTOs;

public class UpdateAccountDto
{
    public string? Email { get; set; }
    public string? Fullname { get; set; }
    public string? NumberPhone { get; set; }
    public int? Status { get; set; }
    public int? Role { get; set; }
}