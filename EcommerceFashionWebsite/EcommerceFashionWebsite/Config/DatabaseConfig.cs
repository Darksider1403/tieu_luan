namespace EcommerceFashionWebsite.Config;

public class DatabaseConfig
{
    public string Host { get; set; } = "127.0.0.1";
    public string Port { get; set; } = "3306";
    public string Username { get; set; } = "root";
    public string Password { get; set; } = "12345678";
    public string DatabaseName { get; set; } = "project_ltw_tester";

    public string GetConnectionString()
    {
        return $"Server={Host};Port={Port};Database={DatabaseName};Uid={Username};Pwd={Password};";
    }
}