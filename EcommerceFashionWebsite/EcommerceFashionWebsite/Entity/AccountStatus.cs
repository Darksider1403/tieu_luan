namespace EcommerceFashionWebsite.Entity
{
    public class AccountStatus
    {
        private int _id;
        private string _name = string.Empty;

        private static Dictionary<int, AccountStatus> _status = new Dictionary<int, AccountStatus>();

        static AccountStatus()
        {
            // Cần tuân theo luật viết hoa chữ đầu
            // không thì khi thêm mới phải có hàm check
            int i = 0;
            // Start 1
            _status[++i] = new AccountStatus(1, "Khóa tài khoản");
            _status[++i] = new AccountStatus(2, "Hoạt động");
        }

        public AccountStatus(int id, string name)
        {
            _id = id;
            _name = name;
        }

        // Lấy ra trạng thái của tài khoản
        public static AccountStatus? GetStatus(int id)
        {
            return _status.ContainsKey(id) ? _status[id] : null;
        }

        public int GetId()
        {
            return _id;
        }

        public string GetName()
        {
            return _name;
        }

        public bool IsAction()
        {
            return _status[_id].GetName().Equals("Hoạt động");
        }
    }
}