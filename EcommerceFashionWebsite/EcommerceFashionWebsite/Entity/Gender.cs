namespace EcommerceFashionWebsite.Entity;

public class Gender
{
    private int _id;
    private string _sex;

    private static Dictionary<int, Gender> _sexs = new Dictionary<int, Gender>();
    
    static Gender()
    {
        int i = 0;
        // Start 1
        _sexs[++i] = new Gender(1, "Nam");
        _sexs[++i] = new Gender(2, "Nữ");
        _sexs[++i] = new Gender(3, "Khác");
    }
    
    public Gender(int id, string sex)
    {
        _id = id;
        _sex = sex;
    }
    
    public static Gender? GetGender(int id)
    {
        return _sexs.ContainsKey(id) ? _sexs[id] : null;
    }

    public static Gender? GetGender(string gender)
    {
        var count = gender switch
        {
            "freeMale" => 2,
            "other" => 3,
            _ => 1
        };

        return GetGender(count);
    }

    public int GetId()
    {
        return _id;
    }

    public void SetId(int id)
    {
        _id = id;
    }

    public string GetSex()
    {
        return _sex;
    }
}