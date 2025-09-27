using System;
using EcommerceFashionWebsite.Entity;

namespace EcommerceFashionWebsite.Entity
{
    public class Comment
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime DateComment { get; set; }
        public string IdProduct { get; set; } = string.Empty;
        public int IdAccount { get; set; }
        public Account Account { get; set; }
        public int Status { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string NumberPhone { get; set; } = string.Empty;

        public Comment()
        {
        }

        public override string ToString()
        {
            return $"Comment{{" +
                   $"id={Id}, " +
                   $"content='{Content}', " +
                   $"dateComment={DateComment}, " +
                   $"idProduct='{IdProduct}', " +
                   $"idAccount={IdAccount}, " +
                   $"account={Account}, " +
                   $"status={Status}, " +
                   $"username='{Username}', " +
                   $"email='{Email}', " +
                   $"numberPhone='{NumberPhone}'" +
                   $"}}";
        }
    }
}