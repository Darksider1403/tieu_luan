using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using EcommerceFashionWebsite.DTOs;
using EcommerceFashionWebsite.Services.Interface;
using EcommerceFashionWebsite.Services;

namespace EcommerceFashionWebsite.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _vnpayService;
        private readonly MoMoService _momoService;
        private readonly IOrderService _orderService;
        private readonly ILogger<PaymentController> _logger;

        public PaymentController(
            IPaymentService vnpayService,
            MoMoService momoService,
            IOrderService orderService,
            ILogger<PaymentController> logger)
        {
            _vnpayService = vnpayService;
            _momoService = momoService;
            _orderService = orderService;
            _logger = logger;
        }

        [HttpPost("vnpay")]
        [Authorize]
        public async Task<ActionResult<PaymentResponseDto>> CreateVNPayPayment([FromBody] PaymentRequestDto request)
        {
            try
            {
                var result = await _vnpayService.CreateVNPayPaymentAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating VNPay payment");
                return StatusCode(500, new { error = "Failed to create payment" });
            }
        }

        [HttpPost("momo")]
        [Authorize]
        public async Task<ActionResult<PaymentResponseDto>> CreateMoMoPayment([FromBody] PaymentRequestDto request)
        {
            try
            {
                var result = await _momoService.CreateMoMoPaymentAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating MoMo payment");
                return StatusCode(500, new { error = "Failed to create payment" });
            }
        }

        [HttpGet("vnpay-return")]
        public async Task<IActionResult> VNPayReturn()
        {
            try
            {
                var queryParams = Request.Query.ToDictionary(x => x.Key, x => x.Value.ToString());
                var isValid = await _vnpayService.ValidateVNPayCallbackAsync(queryParams);

                if (isValid)
                {
                    var orderId = queryParams.GetValueOrDefault("vnp_TxnRef", "");
                    
                    // Update order status to paid
                    await _orderService.UpdateOrderStatusAsync(orderId, 1); // 1 = Paid/Confirmed

                    // Redirect to success page
                    return Redirect($"{Request.Scheme}://{Request.Host}/order-success/{orderId}");
                }

                return Redirect($"{Request.Scheme}://{Request.Host}/payment-failed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing VNPay return");
                return Redirect($"{Request.Scheme}://{Request.Host}/payment-failed");
            }
        }

        [HttpPost("momo-ipn")]
        public async Task<IActionResult> MoMoIPN()
        {
            try
            {
                var queryParams = Request.Query.ToDictionary(x => x.Key, x => x.Value.ToString());
                var isValid = await _momoService.ValidateMoMoCallbackAsync(queryParams);

                if (isValid)
                {
                    var orderId = queryParams.GetValueOrDefault("orderId", "");
                    
                    // Update order status to paid
                    await _orderService.UpdateOrderStatusAsync(orderId, 1);

                    return Ok(new { message = "Success" });
                }

                return BadRequest(new { message = "Invalid signature" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing MoMo IPN");
                return StatusCode(500, new { message = "Error" });
            }
        }

        [HttpGet("momo-return")]
        public async Task<IActionResult> MoMoReturn()
        {
            try
            {
                var queryParams = Request.Query.ToDictionary(x => x.Key, x => x.Value.ToString());
                var isValid = await _momoService.ValidateMoMoCallbackAsync(queryParams);

                if (isValid)
                {
                    var orderId = queryParams.GetValueOrDefault("orderId", "");
                    return Redirect($"{Request.Scheme}://{Request.Host}/order-success/{orderId}");
                }

                return Redirect($"{Request.Scheme}://{Request.Host}/payment-failed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing MoMo return");
                return Redirect($"{Request.Scheme}://{Request.Host}/payment-failed");
            }
        }
    }
}