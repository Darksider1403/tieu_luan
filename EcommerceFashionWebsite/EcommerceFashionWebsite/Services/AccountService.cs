using System.Text.RegularExpressions;
using EcommerceFashionWebsite.Entity;
using EcommerceFashionWebsite.DTOs;
using EcommerceFashionWebsite.Repository;
using EcommerceFashionWebsite.Services.Interface;
using Microsoft.EntityFrameworkCore;

namespace EcommerceFashionWebsite.Services;

public class AccountService : IAccountService
{
    private readonly IAccountRepository _accountRepository;
    private readonly IEmailService _emailService;
    private readonly IEncryptService _encryptService;
    private readonly ILogger _logger;

    public AccountService(IAccountRepository accountRepository, 
        IEmailService emailService,
        ILogger<AccountService> logger,
        IEncryptService encryptService)
    {
        _accountRepository = accountRepository;
        _emailService = emailService;
        _encryptService = encryptService;
        _logger = logger;
    }

    public async Task<Account?> GetAccountByUsernameAsync(string username)
    {
        return await _accountRepository.GetAccountByUsernameAsync(username);
    }

    public async Task<Account?> GetAccountByIdAsync(int accountId)
    {
        return await _accountRepository.GetAccountByIdAsync(accountId);
    }
        
    public async Task<Account?> GetAccountByIdAsync(string accountId)
    {
        if (!int.TryParse(accountId, out int id))
        {
            return null;
        }
        return await _accountRepository.GetAccountByIdAsync(id);
    }

    public async Task<Account?> CheckLoginAsync(string username, string password)
    {
        var account = await _accountRepository.GetAccountByUsernameAsync(username);
        if (account != null && account.Username == username && account.Password == password)
        {
            return account;
        }

        return null;
    }

    public async Task<bool> IsLoginSuccessAsync(Account account)
    {
        return account.Status == 1;
    }

    public async Task<bool> IsPhoneValidAsync(string phone)
    {
        const string regex = @"^0[0-9]{9}$";
        return Regex.IsMatch(phone, regex);
    }

    public async Task<bool> IsEmailValidAsync(string email)
    {
        const string regex = @"^[\w\-.]+@([\w\-]+\.)+[\w\-]{2,4}$";
        return Regex.IsMatch(email, regex);
    }

    public async Task<bool> ValidatePasswordAsync(string password)
    {
        const string regex = @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+.=!])(?!.*\s).{8,}$";
        return Regex.IsMatch(password, regex);
    }

    public async Task<bool> SendVerificationEmailAsync(Account account)
    {
        var code = _emailService.CreateCode();
        var message = $"http://localhost:3000/verify-email?code={code}";
        var dateCreated = DateTime.Now;
        var dateExpired = dateCreated.AddDays(1);

        var result =
            await _accountRepository.CreateVerifyEmailAsync(code, dateCreated, dateExpired, false, account.Id);
        if (result > 0)
        {
            return await _emailService.SendAsync(account.Email, "Xác nhận email", message);
        }

        return false;
    }

    public async Task<bool> SendForgotPasswordEmailAsync(Account account)
    {
        var code = _emailService.CreateCode();
        var dateCreated = DateTime.Now;
        var dateExpired = dateCreated.AddDays(1);

        var result =
            await _accountRepository.CreateVerifyEmailAsync(code, dateCreated, dateExpired, false, account.Id);
        if (result > 0)
        {
            return await _emailService.SendAsync(account.Email, "Quên mật khẩu", code);
        }

        return false;
    }

    public async Task<Account?> VerifyEmailAsync(string code)
    {
        var account = await _accountRepository.VerifyEmailAsync(code);
        if (account != null)
        {
            await _accountRepository.UpdateAccountStatusAsync(account.Id.ToString(), 1);
            await _accountRepository.CreateRoleAccountAsync(account, 0);
            return account;
        }

        return null;
    }

    public async Task<bool> IsVerificationCodeValidAsync(string code)
    {
        var account = await _accountRepository.VerifyEmailAsync(code);
        return account != null;
    }

    public async Task<AccountDto> CreateAccountAsync(CreateAccountDto dto)
    {
        var hashedPassword = _encryptService.EncryptMd5(dto.Password);
        var result = await _accountRepository.CreateAccountAsync(
            dto.Username, hashedPassword, dto.Email, dto.Fullname, dto.NumberPhone, 0);

        if (result > 0)
        {
            var account = await _accountRepository.GetAccountByUsernameAsync(dto.Username);
            if (account != null)
            {
                await SendVerificationEmailAsync(account);

                return new AccountDto
                {
                    Id = account.Id,
                    Username = account.Username,
                    Email = account.Email,
                    Fullname = account.Fullname,
                    NumberPhone = account.NumberPhone,
                    Status = account.Status
                };
            }
        }

        throw new Exception("Failed to create account");
    }

    public async Task<bool> ChangePasswordAsync(string username, string currentPassword, string newPassword)
    {
        var account = await _accountRepository.GetAccountByUsernameAsync(username);
        if (account != null && account.Password == currentPassword)
        {
            var hashedNewPassword = _encryptService.EncryptMd5(newPassword);
            return await _accountRepository.UpdatePasswordAsync(username, hashedNewPassword);
        }

        return false;
    }

    public async Task<bool> UpdateUserInfoAsync(string username, string newFullname)
    {
        return await _accountRepository.UpdateUserInfoAsync(username, newFullname);
    }

    public async Task<bool> IsAccountExistAsync(string email)
    {
        return await _accountRepository.IsAccountExistAsync(email);  
    }

    public async Task<int> GetRoleByAccountIdAsync(int accountId)
    {
        return await _accountRepository.GetRoleByAccountIdAsync(accountId);
    }
        
    public async Task<Account?> GetAccountByUsernameAndEmailAsync(string username, string email)
    {
        return await _accountRepository.GetAccountByUsernameAndEmailAsync(username, email);
    }

    public async Task<bool> SendPasswordResetEmailAsync(Account account)
    {
        var code = _emailService.CreateCode();
        var message = $"http://localhost:3000/forgot-password?code={code}";
        var dateCreated = DateTime.Now;
        var dateExpired = dateCreated.AddDays(1);
    
        var result = await _accountRepository.CreateVerifyEmailAsync(code, dateCreated, dateExpired, false, account.Id);
        if (result > 0)
        {
            return await _emailService.SendAsync(account.Email, "Đặt lại mật khẩu", 
                $"Click vào link sau để đặt lại mật khẩu: {message}");
        }

        return false;
    }

    public async Task<Account?> VerifyPasswordResetCodeAsync(string code)
    {
        return await _accountRepository.VerifyPasswordResetCodeAsync(code);
    }

    public async Task<bool> UpdatePasswordAsync(int accountId, string hashedPassword)
    {
        var result = await _accountRepository.UpdateAccountPasswordAsync(accountId, hashedPassword);
        return result > 0;
    }

    public async Task<List<AccountDto>> GetAllAccountsAsync()
    {
        try
        {
            var accounts = await _accountRepository.GetAllAccountsAsync();
        
            var accountDtos = new List<AccountDto>();
        
            foreach (var account in accounts)
            {
                // Get role for each account
                var role = await GetRoleByAccountIdAsync(account.Id);
                var roleString = role == 1 ? "Admin" : "User";
            
                accountDtos.Add(new AccountDto
                {
                    Id = account.Id,
                    Username = account.Username ?? string.Empty,
                    Email = account.Email ?? string.Empty,
                    Fullname = account.Fullname,
                    NumberPhone = account.NumberPhone,
                    Status = account.Status,
                    Role = roleString
                });
            }
        
            return accountDtos;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetAllAccountsAsync");
            throw;
        }
    }

    public async Task<bool> UpdateAccountStatusAsync(string accountId, int status)
    {
        return await _accountRepository.UpdateAccountStatusAsync(accountId, status);
    }

    public async Task<int> UpdateRoleAccountAsync(string accountId, int role)
    {
        return await _accountRepository.UpdateRoleAccountAsync(accountId, role);
    }
        
    public async Task<bool> DeleteAccountAsync(string accountId)
    {
        return await _accountRepository.DeleteAccountAsync(accountId);
    }

    public async Task<bool> UpdateAccountStatusAsync(int accountId, int status)
    {
        return await _accountRepository.UpdateAccountStatusAsync(accountId, status);
    }

    public async Task<int> UpdateRoleAccountAsync(int accountId, int role)
    {
        return await _accountRepository.UpdateRoleAccountAsync(accountId, role);
    }

    public async Task<bool> DeleteAccountAsync(int accountId)
    {
        return await _accountRepository.DeleteAccountAsync(accountId);
    }

    public async Task<int> CreateRoleAccountAsync(Account account, int role)
    {
        return await _accountRepository.CreateRoleAccountAsync(account, role);
    }
        
    public async Task<bool> UpdateAccountAsync(int accountId, UpdateAccountDto dto)
    {
        return await _accountRepository.UpdateAccountAsync(accountId, dto);
    }
}