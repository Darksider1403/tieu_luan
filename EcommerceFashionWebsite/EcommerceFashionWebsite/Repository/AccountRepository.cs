using Microsoft.EntityFrameworkCore;
using EcommerceFashionWebsite.Data;
using EcommerceFashionWebsite.DTOs;
using EcommerceFashionWebsite.Entity;

namespace EcommerceFashionWebsite.Repository;

public class AccountRepository : IAccountRepository
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AccountRepository> _logger;

    public AccountRepository(ApplicationDbContext context, ILogger<AccountRepository> logger)
    {
        _context = context;
        _logger = logger;
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
        try
        {
            var accessLevel = await _context.Set<AccessLevel>()
                .Where(al => al.IdAccount == accountId)
                .FirstOrDefaultAsync();

            var roleValue = accessLevel?.Role ?? 0;
            _logger.LogInformation("GetRoleByAccountIdAsync - Account {AccountId} has role: {Role}",
                accountId, roleValue);

            return roleValue;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting role for account {AccountId}", accountId);
            return 0; // Default to User role
        }
    }

    public async Task<Account?> GetAccountByIdAsync(string accountId)
    {
        try
        {
            if (!int.TryParse(accountId, out int id))
            {
                _logger.LogWarning("Invalid account ID format: {AccountId}", accountId);
                return null;
            }

            return await _context.Accounts.FindAsync(id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting account by ID: {AccountId}", accountId);
            throw;
        }
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

    public async Task<int> CreateVerifyEmailAsync(string code, DateTime dateCreated, DateTime dateExpired, bool status,
        int idAccount)
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

    public async Task<bool> UpdateAccountStatusAsync(string accountId, int status)
    {
        try
        {
            if (!int.TryParse(accountId, out int id))
            {
                _logger.LogWarning("Invalid account ID format: {AccountId}", accountId);
                return false;
            }

            var account = await _context.Accounts.FindAsync(id);
            if (account == null)
            {
                _logger.LogWarning("Account not found: {AccountId}", accountId);
                return false;
            }

            account.Status = status;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated status for account {AccountId} to {Status}", accountId, status);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating account status for {AccountId}", accountId);
            throw;
        }
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

    public async Task<int> UpdateRoleAccountAsync(string accountId, int role)
    {
        try
        {
            if (!int.TryParse(accountId, out int id))
            {
                _logger.LogWarning("Invalid account ID format: {AccountId}", accountId);
                return 0;
            }

            var account = await _context.Accounts.FindAsync(id);
            if (account == null)
            {
                _logger.LogWarning("Account not found: {AccountId}", accountId);
                return 0;
            }

            // Find existing access level
            var accessLevel = await _context.AccessLevels
                .FirstOrDefaultAsync(al => al.IdAccount == id);

            if (accessLevel != null)
            {
                // Update existing role
                accessLevel.Role = role;
                _logger.LogInformation("Updated role for account {AccountId} to {Role}", accountId, role);
            }
            else
            {
                // Create new access level
                accessLevel = new AccessLevel
                {
                    IdAccount = id,
                    Role = role
                };
                _context.AccessLevels.Add(accessLevel);
                _logger.LogInformation("Created new access level for account {AccountId} with role {Role}", accountId,
                    role);
            }

            var result = await _context.SaveChangesAsync();
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating role for account {AccountId}", accountId);
            throw;
        }
    }

    public async Task<int> CreateRoleAccountAsync(Account account, int role)
    {
        var accessLevel = new AccessLevel
        {
            Role = role, // 0 = User, 1 = Admin
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

    public async Task<List<Account>> GetAllAccountsAsync()
    {
        try
        {
            var accounts = await _context.Accounts.ToListAsync();
            _logger.LogInformation("Retrieved {Count} accounts", accounts.Count);
            return accounts;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all accounts");
            throw;
        }
    }

    public async Task<bool> DeleteAccountAsync(string accountId)
    {
        try
        {
            if (!int.TryParse(accountId, out int id))
            {
                _logger.LogWarning("Invalid account ID format: {AccountId}", accountId);
                return false;
            }

            var account = await _context.Accounts.FindAsync(id);
            if (account == null)
            {
                _logger.LogWarning("Account not found: {AccountId}", accountId);
                return false;
            }

            // Delete associated access levels first
            var accessLevels = await _context.AccessLevels
                .Where(al => al.IdAccount == id)
                .ToListAsync();

            if (accessLevels.Any())
            {
                _context.AccessLevels.RemoveRange(accessLevels);
            }

            // Delete the account
            _context.Accounts.Remove(account);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted account {AccountId}", accountId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting account {AccountId}", accountId);
            throw;
        }
    }

    public async Task<bool> UpdateAccountStatusAsync(int accountId, int status)
    {
        try
        {
            _logger.LogInformation("=== START UpdateAccountStatusAsync for account {AccountId} ===", accountId);

            var account = await _context.Accounts.FindAsync(accountId);
            if (account == null)
            {
                _logger.LogWarning("Account not found: {AccountId}", accountId);
                return false;
            }

            _logger.LogInformation("Found account: Username={Username}, CurrentStatus={CurrentStatus}",
                account.Username, account.Status);

            var oldStatus = account.Status;
            account.Status = status;

            _logger.LogInformation("Changing status from {OldStatus} to {NewStatus}", oldStatus, status);

            // Explicitly mark as modified
            _context.Entry(account).State = EntityState.Modified;

            _logger.LogInformation("Calling SaveChangesAsync...");
            var rowsAffected = await _context.SaveChangesAsync();

            _logger.LogInformation("SaveChangesAsync completed. Rows affected: {RowsAffected}", rowsAffected);

            // Verify the change
            var verifyAccount = await _context.Accounts
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == accountId);
            _logger.LogInformation("Verification: Account status is now {Status}", verifyAccount?.Status);

            _logger.LogInformation("=== END UpdateAccountStatusAsync ===");

            return rowsAffected > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating account status for {AccountId}", accountId);
            throw;
        }
    }

    public async Task<int> UpdateRoleAccountAsync(int accountId, int role)
    {
        try
        {
            _logger.LogInformation("=== START UpdateRoleAccountAsync for account {AccountId} ===", accountId);

            var account = await _context.Accounts.FindAsync(accountId);
            if (account == null)
            {
                _logger.LogWarning("Account not found: {AccountId}", accountId);
                return 0;
            }

            _logger.LogInformation("Found account: Username={Username}", account.Username);

            // Find existing access level
            var accessLevel = await _context.AccessLevels
                .FirstOrDefaultAsync(al => al.IdAccount == accountId);

            if (accessLevel != null)
            {
                _logger.LogInformation("Updating existing role from {OldRole} to {NewRole}",
                    accessLevel.Role, role);

                // Update existing role
                accessLevel.Role = role;
                _context.Entry(accessLevel).State = EntityState.Modified;
            }
            else
            {
                _logger.LogInformation("Creating new access level with role {Role}", role);

                // Create new access level
                accessLevel = new AccessLevel
                {
                    IdAccount = accountId,
                    Role = role
                };
                _context.AccessLevels.Add(accessLevel);
            }

            _logger.LogInformation("Calling SaveChangesAsync...");
            var result = await _context.SaveChangesAsync();

            _logger.LogInformation("SaveChanges completed. Rows affected: {RowsAffected}", result);

            // Verify
            var verifyRole = await _context.AccessLevels
                .AsNoTracking()
                .FirstOrDefaultAsync(al => al.IdAccount == accountId);
            _logger.LogInformation("Verification: Role is now {Role}", verifyRole?.Role);

            _logger.LogInformation("=== END UpdateRoleAccountAsync ===");

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating role for account {AccountId}", accountId);
            throw;
        }
    }

    public async Task<bool> DeleteAccountAsync(int accountId)
    {
        try
        {
            _logger.LogInformation("=== START DeleteAccountAsync for account {AccountId} ===", accountId);

            var account = await _context.Accounts.FindAsync(accountId);
            if (account == null)
            {
                _logger.LogWarning("Account not found: {AccountId}", accountId);
                return false;
            }

            _logger.LogInformation("Found account: Username={Username}", account.Username);

            // Delete associated access levels first
            var accessLevels = await _context.AccessLevels
                .Where(al => al.IdAccount == accountId)
                .ToListAsync();

            if (accessLevels.Any())
            {
                _logger.LogInformation("Deleting {Count} access levels", accessLevels.Count);
                _context.AccessLevels.RemoveRange(accessLevels);
            }

            // Delete the account
            _logger.LogInformation("Deleting account");
            _context.Accounts.Remove(account);

            _logger.LogInformation("Calling SaveChangesAsync...");
            var result = await _context.SaveChangesAsync();

            _logger.LogInformation("SaveChanges completed. Rows affected: {RowsAffected}", result);

            // Verify
            var verifyAccount = await _context.Accounts.FindAsync(accountId);
            _logger.LogInformation("Verification: Account exists = {Exists}", verifyAccount != null);

            _logger.LogInformation("=== END DeleteAccountAsync ===");

            return result > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting account {AccountId}", accountId);
            throw;
        }
    }

    public async Task<bool> UpdateAccountAsync(int accountId, UpdateAccountDto dto)
    {
        try
        {
            _logger.LogInformation("=== START UpdateAccountAsync for account {AccountId} ===", accountId);

            var account = await _context.Accounts.FindAsync(accountId);
            if (account == null)
            {
                _logger.LogWarning("Account not found: {AccountId}", accountId);
                return false;
            }

            _logger.LogInformation("Found account: Username={Username}", account.Username);

            bool hasChanges = false;

            // Update account fields if provided
            if (!string.IsNullOrEmpty(dto.Email) && account.Email != dto.Email)
            {
                _logger.LogInformation("Updating email from {OldEmail} to {NewEmail}", account.Email, dto.Email);
                account.Email = dto.Email;
                hasChanges = true;
            }

            if (!string.IsNullOrEmpty(dto.Fullname) && account.Fullname != dto.Fullname)
            {
                _logger.LogInformation("Updating fullname from {OldName} to {NewName}", account.Fullname, dto.Fullname);
                account.Fullname = dto.Fullname;
                hasChanges = true;
            }

            if (!string.IsNullOrEmpty(dto.NumberPhone) && account.NumberPhone != dto.NumberPhone)
            {
                _logger.LogInformation("Updating phone from {OldPhone} to {NewPhone}", account.NumberPhone,
                    dto.NumberPhone);
                account.NumberPhone = dto.NumberPhone;
                hasChanges = true;
            }

            if (dto.Status.HasValue && account.Status != dto.Status.Value)
            {
                _logger.LogInformation("Updating status from {OldStatus} to {NewStatus}", account.Status,
                    dto.Status.Value);
                account.Status = dto.Status.Value;
                hasChanges = true;
            }

            // Save account changes
            if (hasChanges)
            {
                _context.Entry(account).State = EntityState.Modified;
                var accountResult = await _context.SaveChangesAsync();
                _logger.LogInformation("Account update: {Rows} rows affected", accountResult);
            }

            // Update role if provided
            if (dto.Role.HasValue)
            {
                _logger.LogInformation("Updating role to {Role}", dto.Role.Value);

                var accessLevel = await _context.AccessLevels
                    .FirstOrDefaultAsync(al => al.IdAccount == accountId);

                if (accessLevel != null)
                {
                    if (accessLevel.Role != dto.Role.Value)
                    {
                        _logger.LogInformation("Changing role from {OldRole} to {NewRole}", accessLevel.Role,
                            dto.Role.Value);
                        accessLevel.Role = dto.Role.Value;
                        _context.Entry(accessLevel).State = EntityState.Modified;
                    }
                }
                else
                {
                    _logger.LogInformation("Creating new access level with role {Role}", dto.Role.Value);
                    accessLevel = new AccessLevel
                    {
                        IdAccount = accountId,
                        Role = dto.Role.Value
                    };
                    _context.AccessLevels.Add(accessLevel);
                }

                var roleResult = await _context.SaveChangesAsync();
                _logger.LogInformation("Role update: {Rows} rows affected", roleResult);
            }

            _logger.LogInformation("=== END UpdateAccountAsync - Success ===");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating account {AccountId}", accountId);
            throw;
        }
    }
}