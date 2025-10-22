using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;
using EcommerceFashionWebsite.Services;
using EcommerceFashionWebsite.DTOs;
using EcommerceFashionWebsite.Services.Interface;

namespace EcommerceFashionWebsite.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly IAccountService _accountService;
        private readonly IEncryptService _encryptService;
        private readonly IEmailService _emailService;
        private readonly IJwtService _jwtService; 
        private readonly ILogger<AccountController> _logger;

        public AccountController(IEmailService emailService,
            IAccountService accountService,
            IEncryptService encryptService,
            IJwtService jwtService,
            ILogger<AccountController> logger)
        {
            _emailService = emailService;
            _accountService = accountService;
            _encryptService = encryptService;
            _jwtService = jwtService;
            _logger = logger;
        }

        [HttpPost("login")]
public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginDto loginDto)
{
    try
    {
        if (string.IsNullOrEmpty(loginDto.Username) || string.IsNullOrEmpty(loginDto.Password))
        {
            _logger.LogWarning("Login attempt with missing credentials from IP: {IP}", GetClientIpAddress());
            return BadRequest(new { error = "Username and password are required" });
        }

        var hashedPassword = _encryptService.EncryptMd5(loginDto.Password);
        var account = await _accountService.CheckLoginAsync(loginDto.Username, hashedPassword);

        if (account != null)
        {
            if (await _accountService.IsLoginSuccessAsync(account))
            {
                // Check for required fields
                if (string.IsNullOrEmpty(account.Email) || string.IsNullOrEmpty(account.Username))
                {
                    _logger.LogWarning("Account missing required fields - Username: {Username}, Email: {Email}",
                        account.Username ?? "NULL", account.Email ?? "NULL");
                    return BadRequest(new { error = "Account data is incomplete" });
                }

                // Get user role
                var role = await _accountService.GetRoleByAccountIdAsync(account.Id);
                var roleString = role == 1 ? "Admin" : "User";

                // Generate JWT token
                var token = _jwtService.GenerateToken(account.Id, account.Username, roleString);

                _logger.LogInformation("Successful login for user: {Username} from IP: {IP}",
                    account.Username, GetClientIpAddress());

                return Ok(new LoginResponseDto
                {
                    Success = true,
                    Message = "Login successful",
                    Token = token, // Add this field
                    User = new AccountDto
                    {
                        Id = account.Id,
                        Username = account.Username,
                        Email = account.Email,
                        Fullname = account.Fullname,
                        NumberPhone = account.NumberPhone,
                        Status = account.Status
                    },
                    RedirectUrl = role == 1 ? "/admin" : "/home"
                });
            }
            else
            {
                _logger.LogWarning(
                    "Login attempt failed - account not confirmed or locked: {Username} from IP: {IP}",
                    loginDto.Username, GetClientIpAddress());
                return BadRequest(new { error = "Tài khoản chưa được xác nhận hoặc đã bị khóa" });
            }
        }
        else
        {
            _logger.LogWarning("Login attempt failed - wrong credentials: {Username} from IP: {IP}",
                loginDto.Username, GetClientIpAddress());
            return BadRequest(new { error = "Bạn nhập sai email hoặc mật khẩu" });
        }
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error during login attempt for user: {Username}", loginDto.Username);
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
                var account = await _accountService.VerifyEmailAsync(code);
                if (account != null)
                {
                    _logger.LogInformation("Email verified successfully for account: {AccountId}", account.Id);
                    return Ok(new { success = true, message = "Email verified successfully" });
                }

                return BadRequest(new { error = "Invalid or expired verification code" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying email with code: {Code}", code);
                return StatusCode(500, new { error = "An error occurred during email verification" });
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
    }
}