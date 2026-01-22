using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;
using EcommerceFashionWebsite.Services;
using EcommerceFashionWebsite.DTOs;
using EcommerceFashionWebsite.Repository;
using EcommerceFashionWebsite.Services.Interface;
using Microsoft.AspNetCore.Authorization;

namespace EcommerceFashionWebsite.Controller;

[ApiController]
[Route("api/[controller]")]
public class AccountController : ControllerBase
{
    private readonly IAccountService _accountService;
    private readonly IEncryptService _encryptService;
    private readonly IEmailService _emailService;
    private readonly IJwtService _jwtService;
    private readonly IOrderRepository _orderRepository;
    private readonly IProductService _productService;
    private readonly ILogger<AccountController> _logger;

    public AccountController(IEmailService emailService,
        IAccountService accountService,
        IEncryptService encryptService,
        IOrderRepository orderRepository,
        IJwtService jwtService,
        IProductService productService,
        ILogger<AccountController> logger)
    {
        _emailService = emailService;
        _accountService = accountService;
        _encryptService = encryptService;
        _jwtService = jwtService;
        _orderRepository = orderRepository;
        _productService = productService;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginDto loginDto)
    {
        try
        {
            _logger.LogInformation("Login attempt for username: {Username}", loginDto.Username);

            var hashedPassword = _encryptService.EncryptMd5(loginDto.Password);
            var account = await _accountService.CheckLoginAsync(loginDto.Username, hashedPassword);

            if (account != null)
            {
                _logger.LogInformation("Account found - ID: {AccountId}, Username: {Username}",
                    account.Id, account.Username);

                if (await _accountService.IsLoginSuccessAsync(account))
                {
                    // Get user role
                    var role = await _accountService.GetRoleByAccountIdAsync(account.Id);
                    _logger.LogInformation("Role from DB: {Role}", role);

                    var roleString = role == 1 ? "Admin" : "User";
                    _logger.LogInformation("Role string: {RoleString}", roleString);

                    var redirectUrl = role == 1 ? "/admin" : "/home";
                    _logger.LogInformation("Redirect URL: {RedirectUrl}", redirectUrl);

                    // Generate JWT token
                    var token = _jwtService.GenerateToken(account.Id, account.Username, roleString);

                    return Ok(new LoginResponseDto
                    {
                        Success = true,
                        Message = "Login successful",
                        Token = token,
                        User = new AccountDto
                        {
                            Id = account.Id,
                            Username = account.Username,
                            Email = account.Email,
                            Fullname = account.Fullname,
                            NumberPhone = account.NumberPhone,
                            Status = account.Status,
                            Role = roleString
                        },
                        RedirectUrl = redirectUrl
                    });
                }
            }

            return BadRequest(new { error = "Invalid credentials" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Login error");
            return StatusCode(500, new { error = "An error occurred during login" });
        }
    }

    [HttpPost("logout")]
    public async Task<ActionResult> Logout()
    {
        try
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            // Clear cart from session
            HttpContext.Session.Remove("cart");

            _logger.LogInformation("User logged out successfully from IP: {IP}", GetClientIpAddress());

            return Ok(new
            {
                success = true,
                message = "Logout Successfully",
                redirectUrl = "/home"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return StatusCode(500, new { error = "An error occurred during logout" });
        }
    }

    [HttpPost("register")]
    public async Task<ActionResult<AccountDto>> Register([FromBody] CreateAccountDto dto)
    {
        try
        {
            // Validate input
            if (!await _accountService.IsEmailValidAsync(dto.Email))
            {
                return BadRequest(new { error = "Invalid email format" });
            }

            if (!await _accountService.IsPhoneValidAsync(dto.NumberPhone))
            {
                return BadRequest(new { error = "Invalid phone number format" });
            }

            if (!await _accountService.ValidatePasswordAsync(dto.Password))
            {
                return BadRequest(new
                {
                    error =
                        "Password must be at least 8 characters with uppercase, lowercase, number and special character"
                });
            }

            if (await _accountService.IsAccountExistAsync(dto.Email))
            {
                return BadRequest(new { error = "Account with this email already exists" });
            }

            var account = await _accountService.CreateAccountAsync(dto);

            _logger.LogInformation("New account created: {Username} from IP: {IP}",
                dto.Username, GetClientIpAddress());

            return CreatedAtAction(nameof(GetAccount), new { id = account.Id }, account);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating account for user: {Username}", dto.Username);
            return StatusCode(500, new { error = "An error occurred while creating the account" });
        }
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<AccountDto>> GetCurrentUser()
    {
        try
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            var account = await _accountService.GetAccountByIdAsync(userId);
            if (account == null)
            {
                return NotFound(new { error = "Account not found" });
            }

            return Ok(new AccountDto
            {
                Id = account.Id,
                Username = account.Username,
                Email = account.Email,
                Fullname = account.Fullname,
                NumberPhone = account.NumberPhone,
                Status = account.Status,
                Role = account.Role
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving current user");
            return StatusCode(500, new { error = "An error occurred while retrieving your account" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AccountDto>> GetAccount(int id)
    {
        try
        {
            var account = await _accountService.GetAccountByIdAsync(id);
            if (account == null)
            {
                return NotFound(new { error = "Account not found" });
            }

            return Ok(new AccountDto
            {
                Id = account.Id,
                Username = account.Username,
                Email = account.Email,
                Fullname = account.Fullname,
                NumberPhone = account.NumberPhone,
                Status = account.Status
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving account {AccountId}", id);
            return StatusCode(500, new { error = "An error occurred while retrieving the account" });
        }
    }

    [HttpGet("verify-email")]
    public async Task<ActionResult> VerifyEmail([FromQuery] string code)
    {
        try
        {
            _logger.LogInformation("=== START VerifyEmail endpoint for code: {Code} ===", code);
            
            if (string.IsNullOrWhiteSpace(code))
            {
                _logger.LogWarning("Verification code is missing or empty");
                return BadRequest(new { error = "Verification code is required" });
            }

            var account = await _accountService.VerifyEmailAsync(code);
            if (account != null)
            {
                _logger.LogInformation("Email verified successfully for account: {AccountId}, Username: {Username}", 
                    account.Id, account.Username);
                return Ok(new { 
                    success = true, 
                    message = "Email đã được xác thực thành công! Tài khoản của bạn đã được kích hoạt." 
                });
            }

            _logger.LogWarning("Email verification failed for code: {Code}", code);
            return BadRequest(new { 
                error = "Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại email hoặc đăng ký lại." 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying email with code: {Code}", code);
            return StatusCode(500, new { error = "Có lỗi xảy ra trong quá trình xác thực email. Vui lòng thử lại sau." });
        }
    }

    [HttpPost("send-test-email")]
    public async Task<ActionResult> SendTestEmail([FromBody] EmailDto request)
    {
        try
        {
            var result = await _emailService.SendAsync(
                request.Email,
                "Test Email",
                "This is a test email from your API"
            );

            return Ok(new
                { success = result, message = result ? "Email sent successfully" : "Email failed to send" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private string GetClientIpAddress()
    {
        var ipAddress = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (string.IsNullOrEmpty(ipAddress) || ipAddress.Equals("unknown", StringComparison.OrdinalIgnoreCase))
        {
            ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        }

        return ipAddress ?? "Unknown";
    }

    [HttpGet("test")]
    public IActionResult Test()
    {
        return Ok(new { message = "CORS is working!" });
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        try
        {
            if (string.IsNullOrEmpty(dto.Username) || string.IsNullOrEmpty(dto.Email))
            {
                return BadRequest(new { error = "Username and email are required" });
            }

            var account = await _accountService.GetAccountByUsernameAndEmailAsync(dto.Username, dto.Email);
            if (account == null)
            {
                return BadRequest(new { error = "Email hoặc username không đúng" });
            }

            var result = await _accountService.SendPasswordResetEmailAsync(account);
            if (result)
            {
                return Ok(new { success = true, message = "Password reset email sent successfully" });
            }

            return StatusCode(500, new { error = "Failed to send reset email" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during forgot password request");
            return StatusCode(500, new { error = "An error occurred while processing your request" });
        }
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        try
        {
            if (string.IsNullOrEmpty(dto.Code) || string.IsNullOrEmpty(dto.Password) ||
                string.IsNullOrEmpty(dto.RepeatPassword))
            {
                return BadRequest(new { error = "All fields are required" });
            }

            if (dto.Password != dto.RepeatPassword)
            {
                return BadRequest(new { error = "Password không trùng khớp" });
            }

            if (!await _accountService.ValidatePasswordAsync(dto.Password))
            {
                return BadRequest(new
                {
                    error =
                        "Password must be at least 8 characters with uppercase, lowercase, number and special character"
                });
            }

            var account = await _accountService.VerifyPasswordResetCodeAsync(dto.Code);
            if (account == null)
            {
                return BadRequest(new { error = "Mã code không đúng hoặc đã hết hạn" });
            }

            var hashedPassword = _encryptService.EncryptMd5(dto.Password);
            var result = await _accountService.UpdatePasswordAsync(account.Id, hashedPassword);

            if (result)
            {
                _logger.LogInformation("Password reset successfully for account: {AccountId}", account.Id);
                return Ok(new { success = true, message = "Thay đổi mật khẩu thành công" });
            }

            return StatusCode(500, new { error = "Thay đổi mật khẩu không thành công vui lòng nhập lại" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during password reset");
            return StatusCode(500, new { error = "An error occurred while resetting password" });
        }
    }

    [HttpGet("verify-reset-code")]
    public async Task<ActionResult> VerifyResetCode([FromQuery] string code)
    {
        try
        {
            var account = await _accountService.VerifyPasswordResetCodeAsync(code);
            if (account != null)
            {
                return Ok(new { success = true, message = "Reset code is valid" });
            }

            return BadRequest(new { error = "Invalid or expired reset code" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying reset code: {Code}", code);
            return StatusCode(500, new { error = "An error occurred during verification" });
        }
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        try
        {
            // Get current user from token
            var currentUserIdClaim = User.FindFirst("UserId")?.Value;
            if (string.IsNullOrEmpty(currentUserIdClaim) || !int.TryParse(currentUserIdClaim, out int userId))
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            _logger.LogInformation("Change password request for user {UserId}", userId);

            // Validate current password
            var account = await _accountService.GetAccountByIdAsync(userId);
            if (account == null)
            {
                return NotFound(new { error = "Account not found" });
            }

            var hashedCurrentPassword = _encryptService.EncryptMd5(dto.CurrentPassword);
            if (account.Password != hashedCurrentPassword)
            {
                _logger.LogWarning("Invalid current password for user {UserId}", userId);
                return BadRequest(new { error = "Mật khẩu hiện tại không đúng" });
            }

            // Validate new password
            if (!await _accountService.ValidatePasswordAsync(dto.NewPassword))
            {
                return BadRequest(new
                {
                    error = "Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
                });
            }

            // Update password
            var hashedNewPassword = _encryptService.EncryptMd5(dto.NewPassword);
            var result = await _accountService.UpdatePasswordAsync(userId, hashedNewPassword);

            if (result)
            {
                _logger.LogInformation("Password changed successfully for user {UserId}", userId);
                return Ok(new { success = true, message = "Đổi mật khẩu thành công" });
            }

            return StatusCode(500, new { error = "Đổi mật khẩu thất bại" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password");
            return StatusCode(500, new { error = "Có lỗi xảy ra khi đổi mật khẩu" });
        }
    }

    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<AccountDto>>> GetAllUsers()
    {
        try
        {
            var accounts = await _accountService.GetAllAccountsAsync();
            _logger.LogInformation("Retrieved {Count} users for admin", accounts.Count);
            return Ok(accounts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all users");
            return StatusCode(500, new { error = "An error occurred while retrieving users" });
        }
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> UpdateUserStatus(int id, [FromBody] UpdateStatusDto dto)
    {
        try
        {
            var result = await _accountService.UpdateAccountStatusAsync(id, dto.Status); // Now calls int version
            if (!result)
            {
                return NotFound(new { error = "User not found" });
            }

            _logger.LogInformation("Updated status for user {UserId} to {Status}", id, dto.Status);
            return Ok(new { success = true, message = "Status updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user status for {UserId}", id);
            return StatusCode(500, new { error = "An error occurred while updating status" });
        }
    }

    [HttpPatch("{id}/role")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> UpdateUserRole(int id, [FromBody] UpdateRoleDto dto)
    {
        try
        {
            var result = await _accountService.UpdateRoleAccountAsync(id.ToString(), dto.Role);
            if (result <= 0)
            {
                return NotFound(new { error = "User not found" });
            }

            _logger.LogInformation("Updated role for user {UserId} to {Role}", id, dto.Role);
            return Ok(new { success = true, message = "Role updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user role for {UserId}", id);
            return StatusCode(500, new { error = "An error occurred while updating role" });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteUser(int id)
    {
        try
        {
            // Check if user is trying to delete themselves
            var currentUserId = User.FindFirst("UserId")?.Value;
            if (currentUserId == id.ToString())
            {
                return BadRequest(new { error = "You cannot delete your own account" });
            }

            var result = await _accountService.DeleteAccountAsync(id.ToString());
            if (!result)
            {
                return NotFound(new { error = "User not found" });
            }

            _logger.LogInformation("Deleted user {UserId}", id);
            return Ok(new { success = true, message = "User deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user {UserId}", id);
            return StatusCode(500, new { error = "An error occurred while deleting the user" });
        }
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult> UpdateUser(int id, [FromBody] UpdateAccountDto dto)
    {
        try
        {
            _logger.LogInformation("=== UPDATE USER REQUEST for UserId: {UserId} ===", id);
            _logger.LogInformation("Received DTO - Email: '{Email}', Fullname: '{Fullname}', Phone: '{Phone}', Status: {Status}, Role: {Role}",
                dto.Email, dto.Fullname, dto.NumberPhone, dto.Status, dto.Role);

            // Get current user from token
            var currentUserIdClaim = User.FindFirst("UserId")?.Value;
            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;
            
            _logger.LogInformation("Current user: UserId={CurrentUserId}, Role={CurrentRole}", currentUserIdClaim, currentUserRole);
            
            if (string.IsNullOrEmpty(currentUserIdClaim) || !int.TryParse(currentUserIdClaim, out int currentUserId))
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            // Check if user is updating their own account or if they're an admin
            bool isAdmin = currentUserRole == "Admin";
            bool isOwnAccount = currentUserId == id;

            _logger.LogInformation("Authorization check - IsAdmin: {IsAdmin}, IsOwnAccount: {IsOwnAccount}", isAdmin, isOwnAccount);

            if (!isAdmin && !isOwnAccount)
            {
                _logger.LogWarning("User {CurrentUserId} attempted to update user {TargetUserId} without permission", 
                    currentUserId, id);
                return Forbid();
            }

            // Non-admin users cannot change role or status
            if (!isAdmin && (dto.Role.HasValue || dto.Status.HasValue))
            {
                _logger.LogWarning("Non-admin user {UserId} attempted to change role or status", currentUserId);
                return BadRequest(new { error = "You do not have permission to change role or status" });
            }

            var account = await _accountService.GetAccountByIdAsync(id);
            if (account == null)
            {
                _logger.LogWarning("User not found: {UserId}", id);
                return NotFound(new { error = "User not found" });
            }

            _logger.LogInformation("Calling UpdateAccountAsync...");

            // Use the new complete update method
            var result = await _accountService.UpdateAccountAsync(id, dto);

            if (!result)
            {
                _logger.LogWarning("UpdateAccountAsync returned false for user {UserId}", id);
                return BadRequest(new { error = "Failed to update user" });
            }

            _logger.LogInformation("=== Successfully updated user {UserId} ===", id);
            return Ok(new { success = true, message = "User updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user {UserId}", id);
            return StatusCode(500, new { error = "An error occurred while updating the user" });
        }
    }
}