using EcommerceFashionWebsite.Entity;

namespace EcommerceFashionWebsite.Repository;

public interface IAccountRepository
{
    Task<Account?> GetAccountByUsernameAsync(string username);
    Task<Account?> GetAccountByIdAsync(int accountId);
    Task<Account?> GetAccountByUsernameAndEmailAsync(string username, string email);
    Task<int> GetRoleByAccountIdAsync(int accountId);
    Task<int> CreateAccountAsync(string username, string password, string email, string fullname, string numberPhone, int status);
    Task<int> CreateAccountWithSocialAsync(string username, string email, string fullname, int status);
    Task<int> DeleteAccountAsync(string username, string email);
    Task<int> UpdateAccountStatusAsync(string id, int status);
    Task<int> UpdateAccountPasswordAsync(int id, string password);
    Task<int> UpdateRoleAccountAsync(string id, int role);
    Task<int> CreateRoleAccountAsync(Account account, int role);
    Task<int> GetTotalAccountsAsync();
    Task<int> GetTotalAccountsBySearchAsync(string search);
    Task<List<Account>> FindAccountsByUsernameAsync(string username);
    Task<int> GetAccountRoleAsync(string id);
    Task<bool> UpdatePasswordAsync(string username, string newPassword);
    Task<bool> UpdateUserInfoAsync(string username, string newFullname);
    Task<bool> IsAccountExistAsync(string email);
    Task<int> CreateVerifyEmailAsync(string code, DateTime dateCreated, DateTime dateExpired, bool status, int idAccount);
    Task<Account?> VerifyEmailAsync(string code);
    Task<Account?> VerifyPasswordResetCodeAsync(string code);
}