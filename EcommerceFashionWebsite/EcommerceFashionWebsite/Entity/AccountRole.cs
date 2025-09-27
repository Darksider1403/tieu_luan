namespace EcommerceFashionWebsite.Entity;

public class AccountRole
{
    private int _id;
    private string _name = string.Empty;

    private static Dictionary<int, AccountRole> _roles = new Dictionary<int, AccountRole>();

    static AccountRole()
    {
        var i = 0;
        // Start 1
        _roles[++i] = new AccountRole(1, "User");
        _roles[++i] = new AccountRole(2, "Admin");
    }

    public AccountRole(int id, string name)
    {
        _id = id;
        _name = name;
    }

    // Lấy ra vai trò của tài khoản
    public static AccountRole? GetRole(int id)
    {
        return _roles.ContainsKey(id) ? _roles[id] : null;
    }

    public int GetId()
    {
        return _id;
    }

    public string GetName()
    {
        return _name;
    }

    public bool IsAdmin()
    {
        return CheckRole("Admin");
    }

    public bool IsUser()
    {
        return CheckRole("User");
    }

    // Kiểm tra vai trò hiện tại có phù hợp
    public bool CheckRole(string role)
    {
        return _roles[_id].GetName().Equals(role);
    }
}