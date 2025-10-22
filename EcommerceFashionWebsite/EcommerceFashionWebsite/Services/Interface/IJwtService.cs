namespace EcommerceFashionWebsite.Services.Interface;

public interface IJwtService
{
    string GenerateToken(int userId, string username, string role);
    int? ValidateToken(string token);
}