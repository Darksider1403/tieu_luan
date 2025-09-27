namespace EcommerceFashionWebsite.Services.Interface;

public interface IEmailService
{
    Task<bool> SendAsync(string to, string subject, string message);
    string CreateCode();
}