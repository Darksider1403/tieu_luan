using EcommerceFashionWebsite.Entity;
using EcommerceFashionWebsite.DTOs;

namespace EcommerceFashionWebsite.Services.Interface
{
    public interface IAccountService
    {
        Task<Account?> GetAccountByUsernameAsync(string username);
        Task<Account?> GetAccountByIdAsync(int accountId);
        Task<Account?> GetAccountByIdAsync(string accountId);
        Task<Account?> CheckLoginAsync(string username, string password);
        Task<bool> IsLoginSuccessAsync(Account account);
        Task<bool> IsPhoneValidAsync(string phone);
        Task<bool> IsEmailValidAsync(string email);
        Task<bool> ValidatePasswordAsync(string password);
        Task<bool> SendVerificationEmailAsync(Account account);
        Task<bool> SendForgotPasswordEmailAsync(Account account);
        Task<Account?> VerifyEmailAsync(string code);
        Task<bool> IsVerificationCodeValidAsync(string code);
        Task<AccountDto> CreateAccountAsync(CreateAccountDto dto);
        Task<bool> ChangePasswordAsync(string username, string currentPassword, string newPassword);
        Task<bool> UpdateUserInfoAsync(string username, string newFullname);
        Task<bool> IsAccountExistAsync(string email);
        Task<int> GetRoleByAccountIdAsync(int accountId);
        Task<Account?> GetAccountByUsernameAndEmailAsync(string username, string email);
        Task<bool> SendPasswordResetEmailAsync(Account account);
        Task<Account?> VerifyPasswordResetCodeAsync(string code);
        Task<bool> UpdatePasswordAsync(int accountId, string hashedPassword);
        
        Task<List<AccountDto>> GetAllAccountsAsync();
        Task<bool> UpdateAccountStatusAsync(string accountId, int status);
        Task<int> UpdateRoleAccountAsync(string accountId, int role);
        Task<bool> DeleteAccountAsync(string accountId);
        
        Task<bool> UpdateAccountStatusAsync(int accountId, int status);
        Task<int> UpdateRoleAccountAsync(int accountId, int role);
        Task<bool> DeleteAccountAsync(int accountId);
        Task<bool> UpdateAccountAsync(int accountId, UpdateAccountDto dto);
        
        Task<bool> UpdateAccountRoleAsync(int accountId, int role);
    }
}