using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcommerceFashionWebsite.Entity
{
    [Table("accounts")]
    public class Account
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("userName")]
        [StringLength(255)]
        public string? Username { get; set; }

        [Column("password")]
        [StringLength(255)]
        public string? Password { get; set; }

        [Column("email")]
        [StringLength(255)]
        [EmailAddress]
        public string? Email { get; set; }

        [Column("fullname")]
        [StringLength(255)]
        public string? Fullname { get; set; }

        [Column("numberPhone")]
        [StringLength(20)]
        public string? NumberPhone { get; set; }

        [Column("status")]
        public int Status { get; set; }
        
        [NotMapped]
        public bool IsVerified { get; set; }
        
        public Account()
        {
        }

        public Account(int id, string username, string password, string email, 
                      string fullname, string numberPhone, int status, int role)
        {
            Id = id;
            Username = username;
            Password = password;
            Email = email;
            Fullname = fullname;
            NumberPhone = numberPhone;
            Status = status;
        }

        public Account(int id, string email, bool isVerified)
        {
            Id = id;
            Email = email;
            IsVerified = isVerified;
        }

        public Account(string username, string password, int status)
        {
            Username = username;
            Password = password;
            Status = status;
        }

        public override string ToString()
        {
            return $"Account{{ID={Id}, Username='{Username}', Password='{Password}', " +
                   $"Email='{Email}', Fullname='{Fullname}', " +
                   $"NumberPhone='{NumberPhone}', Status={Status}, " +
                   $"IsVerified={IsVerified}}}";
        }
    }
}