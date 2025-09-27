using Microsoft.EntityFrameworkCore;
using EcommerceFashionWebsite.Data;
using EcommerceFashionWebsite.DTOs;
using EcommerceFashionWebsite.Entity;

namespace EcommerceFashionWebsite.Repository
{
    public class AccountRepository : IAccountRepository
    {
        private readonly ApplicationDbContext _context;

        public AccountRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Account?> GetAccountByUsernameAsync(string username)
        {
            return await _context.Accounts
                .FirstOrDefaultAsync(a => a.Username == username);
        }

        public async Task<Account?> GetAccountByIdAsync(int accountId)
        {
            return await _context.Accounts
                .FirstOrDefaultAsync(a => a.Id == accountId);
        }

        public async Task<Account?> GetAccountByUsernameAndEmailAsync(string username, string email)
        {
            return await _context.Accounts
                .FirstOrDefaultAsync(a => a.Username == username && a.Email == email);
        }

        public async Task<int> GetRoleByAccountIdAsync(int accountId)
        {
            // Assuming you have an AccessLevel entity/table
            var accessLevel = await _context.AccessLevels
                .FirstOrDefaultAsync(al => al.IdAccount == accountId);
            return accessLevel?.Role ?? 1; // Default to role 1 if not found
        }

        public async Task<int> CreateAccountAsync(string username, string password, string email, string fullname,
            string numberPhone, int status)
        {
            var account = new Account
            {
                Username = username,
                Password = password,
                Email = email,
                Fullname = fullname,
                NumberPhone = numberPhone,
                Status = status
            };

            _context.Accounts.Add(account);
            return await _context.SaveChangesAsync();
        }

        public Task<int> CreateAccountWithSocialAsync(string username, string email, string fullname, int status)
        {
            throw new NotImplementedException();
        }

        public async Task<int> CreateVerifyEmailAsync(string code, DateTime dateCreated, DateTime dateExpired, bool status, int idAccount)
        {
            var verifyEmail = new VerifyEmail
            {
                Code = code,
                DateCreated = dateCreated,
                DateExpired = dateExpired,
                Status = status,
                IdAccount = idAccount
            };

            _context.VerifyEmails.Add(verifyEmail);
            return await _context.SaveChangesAsync();
        }

        public async Task<int> DeleteAccountAsync(string username, string email)
        {
            var account = await _context.Accounts
                .FirstOrDefaultAsync(a => a.Username == username && a.Email == email);

            if (account != null)
            {
                _context.Accounts.Remove(account);
                return await _context.SaveChangesAsync();
            }

            return 0;
        }

        public async Task<int> UpdateAccountStatusAsync(string id, int status)
        {
            if (int.TryParse(id, out int accountId))
            {
                var account = await _context.Accounts.FindAsync(accountId);
                if (account != null)
                {
                    account.Status = status;
                    return await _context.SaveChangesAsync();
                }
            }

            return 0;
        }

        public async Task<int> UpdateAccountPasswordAsync(int id, string password)
        {
            var account = await _context.Accounts.FindAsync(id);
            if (account != null)
            {
                account.Password = password;
                return await _context.SaveChangesAsync();
            }

            return 0;
        }

        public async Task<int> UpdateRoleAccountAsync(string id, int role)
        {
            if (int.TryParse(id, out int accountId))
            {
                var accessLevel = await _context.AccessLevels
                    .FirstOrDefaultAsync(al => al.IdAccount == accountId);

                if (accessLevel != null)
                {
                    accessLevel.Role = role;
                    return await _context.SaveChangesAsync();
                }
            }

            return 0;
        }

        public async Task<int> CreateRoleAccountAsync(Account account, int role)
        {
            var accessLevel = new AccessLevel
            {
                Role = role,
                IdAccount = account.Id
            };

            _context.AccessLevels.Add(accessLevel);
            return await _context.SaveChangesAsync();
        }

        public async Task<int> GetTotalAccountsAsync()
        {
            return await _context.Accounts.CountAsync(a => a.Status == 1);
        }

        public async Task<int> GetTotalAccountsBySearchAsync(string search)
        {
            return await _context.Accounts
                .CountAsync(a => a.Username.Contains(search) && a.Status == 1);
        }

        public async Task<List<Account>> FindAccountsByUsernameAsync(string username)
        {
            return await _context.Accounts
                .Where(a => a.Username.Contains(username) && a.Status > 0)
                .ToListAsync();
        }

        public async Task<int> GetAccountRoleAsync(string id)
        {
            if (int.TryParse(id, out int accountId))
            {
                var accessLevel = await _context.AccessLevels
                    .FirstOrDefaultAsync(al => al.IdAccount == accountId);
                return accessLevel?.Role ?? 1;
            }

            return 1;
        }

        public async Task<bool> UpdatePasswordAsync(string username, string newPassword)
        {
            var account = await _context.Accounts
                .FirstOrDefaultAsync(a => a.Username == username);

            if (account != null)
            {
                account.Password = newPassword;
                var result = await _context.SaveChangesAsync();
                return result > 0;
            }

            return false;
        }

        public async Task<bool> UpdateUserInfoAsync(string username, string newFullname)
        {
            var account = await _context.Accounts
                .FirstOrDefaultAsync(a => a.Username == username);

            if (account != null)
            {
                account.Fullname = newFullname;
                var result = await _context.SaveChangesAsync();
                return result > 0;
            }

            return false;
        }
        
        public async Task<Account?> VerifyEmailAsync(string code)
        {
            var currentDate = DateTime.Now.Date;
    
            var verifyEmail = await _context.VerifyEmails
                .Include(ve => ve.Account)
                .FirstOrDefaultAsync(ve => 
                    ve.Code == code && 
                    ve.DateExpired > currentDate && 
                    !ve.Status);

            if (verifyEmail != null)
            {
                verifyEmail.Status = true;
                await _context.SaveChangesAsync();
                return verifyEmail.Account;
            }
    
            return null;
        }

        public async Task<bool> IsAccountExistAsync(string email)
        {
            return await _context.Accounts.AnyAsync(a => a.Email == email);
        }
        
        public async Task<Account?> VerifyPasswordResetCodeAsync(string code)
        {
            var currentDate = DateTime.Now;

            var verifyEmail = await _context.VerifyEmails
                .Include(ve => ve.Account)
                .FirstOrDefaultAsync(ve => 
                    ve.Code == code && 
                    ve.DateExpired > currentDate && 
                    !ve.Status);

            return verifyEmail?.Account;
        }
    }
}