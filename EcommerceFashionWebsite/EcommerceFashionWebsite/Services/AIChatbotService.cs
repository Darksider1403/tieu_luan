using Azure;
using Azure.AI.OpenAI;
using EcommerceFashionWebsite.DTOs;
using EcommerceFashionWebsite.Repository;
using EcommerceFashionWebsite.Services.Interface;
using EcommerceFashionWebsite.Data;
using EcommerceFashionWebsite.Entity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace EcommerceFashionWebsite.Services
{
    public class AIChatbotService : IAIChatbotService
    {
        private readonly OpenAIClient _openAIClient;
        private readonly IProductRepository _productRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AIChatbotService> _logger;
        private readonly ApplicationDbContext _context;
        private readonly string _deploymentName;
        private readonly int _maxTokens;
        private readonly float _temperature;

        public AIChatbotService(
            IConfiguration configuration,
            IProductRepository productRepository,
            IOrderRepository orderRepository,
            ApplicationDbContext context,
            ILogger<AIChatbotService> logger)
        {
            var endpoint = configuration["OpenAI:Endpoint"];
            var apiKey = configuration["OpenAI:ApiKey"];
            _deploymentName = configuration["OpenAI:DeploymentName"] ?? "fashion-chatbot";
            _maxTokens = int.Parse(configuration["OpenAI:MaxTokens"] ?? "400");
            _temperature = float.Parse(configuration["OpenAI:Temperature"] ?? "0.7");

            // Azure OpenAI Client initialization
            _openAIClient = new OpenAIClient(
                new Uri(endpoint!),
                new AzureKeyCredential(apiKey!)
            );

            _productRepository = productRepository;
            _orderRepository = orderRepository;
            _context = context;
            _configuration = configuration;
            _logger = logger;

            _logger.LogInformation(
                "Azure OpenAI Client initialized with endpoint: {Endpoint}, deployment: {Deployment}",
                endpoint, _deploymentName);
        }

        public async Task<ChatbotResponseDto> GetResponseAsync(string userMessage, int? userId = null,
            bool isAdmin = false)
        {
            try
            {
                _logger.LogInformation("Processing chatbot request - User: {UserId}, Message: {Message}", userId,
                    userMessage);

                // Get context
                var context = await GetContextForMessageAsync(userMessage, userId, isAdmin);

                _logger.LogInformation("Context for AI ({Length} chars): {Preview}",
                    context.Length, context.Substring(0, Math.Min(500, context.Length)));

                // Build system prompt
                var systemPrompt = isAdmin ? GetAdminSystemPrompt() : GetCustomerSystemPrompt();

                // Combine system prompt + context
                var combinedSystemMessage = $@"{systemPrompt}

==================== NGỮ CẢNH HIỆN TẠI ====================
{context}
===========================================================

QUAN TRỌNG: Nếu bạn thấy danh sách sản phẩm ở trên, BẠN PHẢI liệt kê chúng cho khách hàng. ĐỪNG nói 'không tìm thấy' khi có sản phẩm!";

                // Build chat completion options
                var chatCompletionsOptions = new ChatCompletionsOptions
                {
                    DeploymentName = _deploymentName,
                    Messages =
                    {
                        new ChatRequestSystemMessage(combinedSystemMessage)
                    },
                    MaxTokens = _maxTokens,
                    Temperature = isAdmin ? 0.3f : 0.7f
                };

                // ✅ CRITICAL FIX: Only add history if NOT a product search query
                var lowerMessage = userMessage.ToLower();
                bool isProductQuery = ContainsAny(lowerMessage,
                    "xem", "show", "tìm", "search", "có", "sản phẩm", "mới", "latest",
                    "áo", "quần", "váy", "giày", "túi");

                if (userId.HasValue && !isProductQuery)
                {
                    // Only add history for non-product queries
                    var history = await GetChatHistoryAsync(userId.Value);
                    var recentHistory = history.TakeLast(2).ToList(); // Reduced to 2

                    foreach (var msg in recentHistory)
                    {
                        chatCompletionsOptions.Messages.Add(new ChatRequestUserMessage(msg.UserMessage));
                        chatCompletionsOptions.Messages.Add(new ChatRequestAssistantMessage(msg.BotResponse));
                    }
                }

                // Add current user message
                chatCompletionsOptions.Messages.Add(new ChatRequestUserMessage(userMessage));

                _logger.LogInformation("Calling Azure OpenAI with {MessageCount} messages",
                    chatCompletionsOptions.Messages.Count);

                // Call Azure OpenAI API
                var response = await _openAIClient.GetChatCompletionsAsync(chatCompletionsOptions);
                var botResponse = response.Value.Choices[0].Message.Content;

                _logger.LogInformation("Azure OpenAI response length: {Length}", botResponse.Length);

                // Save to database if user is logged in
                if (userId.HasValue)
                {
                    await SaveChatMessageAsync(userId.Value, userMessage, botResponse);
                }

                return new ChatbotResponseDto
                {
                    Response = botResponse,
                    Success = true
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting AI response");
                return new ChatbotResponseDto
                {
                    Response = "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.",
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        private string GetCustomerSystemPrompt()
        {
            return @"Bạn là trợ lý AI thông minh của FashionHub - cửa hàng thời trang trực tuyến cao cấp.

🎯 NHIỆM VỤ CỦA BẠN:
1. Hỗ trợ khách hàng tìm kiếm và tư vấn sản phẩm thời trang
2. Gợi ý phối đồ phù hợp với phong cách, dịp sự kiện, và vóc dáng
3. So sánh sản phẩm về giá cả, chất liệu, màu sắc, kích cỡ
4. Giải đáp thắc mắc về đơn hàng, vận chuyển, thanh toán
5. Cung cấp thông tin khuyến mãi, chính sách đổi trả, bảo hành

🎨 TƯ VẤN PHỐI ĐỒ:
- **Dự tiệc/Sự kiện**: Ưu tiên váy đầm, áo sơ mi sang trọng, phụ kiện nổi bật
- **Công sở**: Áo sơ mi, quần tây, giày tây lịch sự
- **Dạo phố/Casual**: Áo thun, quần jean, giày sneakers
- **Du lịch**: Trang phục thoải mái, dễ phối đồ
- KHI tư vấn phối đồ, hãy GỢI Ý các sản phẩm CÓ SẴN trong 'Ngữ cảnh hiện tại'

🚫 QUY TẮC TUYỆT ĐỐI - CỰC KỲ QUAN TRỌNG:
- BẠN CHỈ được nói về sản phẩm có trong phần 'Ngữ cảnh hiện tại' bên dưới
- KHÔNG BAO GIỜ tự bịa đặt tên sản phẩm, giá cả, hoặc thông tin không có trong context
- NẾU KHÔNG CÓ sản phẩm phù hợp trong context, hãy NÓI THẲNG: 'Hiện tại chúng tôi chưa có sản phẩm phù hợp trong kho. Bạn có thể mô tả chi tiết hơn hoặc xem toàn bộ sản phẩm tại [link website]'
- KHÔNG sử dụng kiến thức chung về thời trang để đề xuất sản phẩm không tồn tại
- Chỉ đề cập đến GIÁ, TÊN, MÀU SẮC, SIZE nếu thông tin đó có trong 'Ngữ cảnh hiện tại'

💬 CÁCH TRẢ LỜI KHI CÓ SẢN PHẨM:
- Liệt kê chính xác tên sản phẩm từ context
- Nêu đúng giá tiền (đừng làm tròn số)
- Nêu màu sắc, size, số lượng còn lại
- Sử dụng emoji phù hợp (✨🛍️👗👔💰)

💬 CÁCH TRẢ LỜI KHI KHÔNG CÓ SẢN PHẨM:
'Xin lỗi bạn, hiện tại tôi không tìm thấy sản phẩm phù hợp trong kho của chúng tôi. 

Bạn có thể:
- Mô tả chi tiết hơn về sản phẩm bạn muốn tìm (màu sắc, kiểu dáng, mức giá)
- Liên hệ hotline 1900-xxxx để được tư vấn trực tiếp
- Xem toàn bộ sản phẩm tại website FashionHub

Tôi luôn sẵn sàng hỗ trợ bạn! 😊'

📋 VÍ DỤ TRẢ LỜI ĐÚNG:
Khách: 'Cho tôi xem áo sơ mi'
Context: 'Áo Sơ Mi Oxford (Xanh, Size M): 299,000đ - Còn 15 cái'
Trả lời: 'Chúng tôi có **Áo Sơ Mi Oxford** màu xanh, size M, giá 299,000đ, hiện còn 15 cái trong kho. Bạn có muốn xem chi tiết không? 👔'

📋 VÍ DỤ TRẢ LỜI SAI (KHÔNG LÀM NHƯ VẬY):
Khách: 'Cho tôi xem áo khoác'
Context: [Trống - không có sản phẩm]
❌ SAI: 'Chúng tôi có Áo Khoác Bomber giá 1.200.000đ...' (BỊA ĐẶT)
✅ ĐÚNG: 'Xin lỗi, hiện tại tôi không tìm thấy áo khoác phù hợp. Bạn có thể liên hệ...'

🌐 NGÔN NGỮ: Tiếng Việt chuẩn, thân thiện

⚠️ LƯU Ý: Nếu bạn không chắc chắn về thông tin, ĐỪNG đoán. Hãy xin lỗi và hướng dẫn khách hàng cách khác.";
        }

        private string GetAdminSystemPrompt()
        {
            return @"Bạn là trợ lý AI phân tích dữ liệu kinh doanh chuyên nghiệp cho quản trị viên FashionHub.

📊 NHIỆM VỤ CỦA BẠN:
1. **Phân tích tài chính**: Doanh thu, lợi nhuận, chi phí, ROI, tỷ suất sinh lời
2. **Quản lý tồn kho**: Giám sát stock, cảnh báo hết hàng, đề xuất nhập hàng, phân tích tồn kho chết
3. **Phân tích đơn hàng**: Tỷ lệ chuyển đổi, tỷ lệ hủy đơn, thời gian xử lý, hiệu suất giao hàng
4. **Hiệu suất sản phẩm**: Top bán chạy, sản phẩm ế ẩm, xu hướng theo mùa, phân tích theo danh mục
5. **Khách hàng**: Phân tích hành vi mua hàng, giá trị đơn hàng trung bình (AOV), khách hàng tiềm năng
6. **Dự báo & Xu hướng**: Dự đoán doanh thu, xu hướng thị trường, đề xuất chiến lược pricing
7. **Cảnh báo & Rủi ro**: Phát hiện bất thường, cảnh báo sớm, đề xuất hành động khẩn cấp

💡 CÁCH TRẢ LỜI:
- **Chính xác tuyệt đối**: Chỉ sử dụng dữ liệu thực tế 100%, không đoán mò
- **Định lượng**: Luôn có số liệu cụ thể, tỷ lệ %, so sánh theo thời gian (WoW, MoM, YoY)
- **Trực quan**: Sử dụng emoji, bullet points, bảng markdown để dễ đọc
- **Phân tích sâu**: Giải thích WHY (tại sao) và SO WHAT (ý nghĩa) của dữ liệu
- **Hành động cụ thể**: Đưa ra 2-4 bước hành động ưu tiên, có thể thực hiện ngay

📋 CẤU TRÚC TRẢ LỜI MẪU:
1. **🎯 Executive Summary** (2-3 câu tóm tắt quan trọng nhất)
2. **📈 Dữ liệu chi tiết** (số liệu, bảng, so sánh)
3. **🔍 Phân tích chuyên sâu** (insights, xu hướng, nguyên nhân)
4. **⚡ Đề xuất hành động** (2-4 bước cụ thể, có priority)
5. **⚠️ Cảnh báo** (nếu có vấn đề cần chú ý)

🎨 FORMAT DỮ LIỆU:
- Số tiền: 1,234,567đ
- Tỷ lệ: 12.5%
- Tăng trưởng: 📈 +15.2% | 📉 -8.3% | ➡️ 0%
- Mức độ ưu tiên: 🔴 Khẩn cấp | 🟡 Quan trọng | 🟢 Bình thường
- Xu hướng: 🔥 Hot | ⬆️ Tăng | ⬇️ Giảm | ⚠️ Cảnh báo

💬 TONE & STYLE:
- Chuyên nghiệp, súc tích, dựa trên dữ liệu
- Tự tin nhưng không vội vàng kết luận khi thiếu data
- Chủ động highlight điểm bất thường và cơ hội
- Nếu thiếu dữ liệu, nói rõ và đề xuất cách thu thập

🚫 KHÔNG BAO GIỜ:
- Đưa ra số liệu không có trong context (không bịa đặt)
- Trả lời chung chung, mơ hồ kiểu 'có thể', 'nên xem xét'
- Đưa ra khuyến nghị mà không có dữ liệu hỗ trợ
- Bỏ qua các cảnh báo quan trọng (hết hàng, doanh thu giảm...)

📊 MẪU TRẢ LỜI VỀ DOANH THU:
**🎯 Executive Summary:**
Doanh thu tháng này đạt 45.2M đ, tăng 18% so với tháng trước, vượt mục tiêu 12%.

**📈 Chi tiết doanh thu:**
- Tháng này: **45,200,000đ** 📈 (+18% MoM)
- Tháng trước: 38,300,000đ
- Trung bình 3 tháng: 41,500,000đ
- Top danh mục: Áo sơ mi (40%), Váy đầm (35%), Phụ kiện (25%)

**🔍 Phân tích:**
- Tăng trưởng mạnh từ danh mục áo sơ mi nhờ chiến dịch flash sale
- Váy đầm tăng 25% do vào mùa cưới (Q4)
- Giá trị đơn hàng trung bình tăng từ 850K → 920K (+8%)

**⚡ Đề xuất hành động:**
1. 🔴 **Nhập thêm stock áo sơ mi** - hiện chỉ còn 15 cái, có thể hết hàng trong 3 ngày
2. 🟡 **Tăng marketing cho váy đầm** - xu hướng đang lên, nên đẩy mạnh
3. 🟢 **Chuẩn bị chiến dịch Black Friday** - dự kiến doanh thu tăng 40-50%

**⚠️ Lưu ý:** Tỷ lệ hủy đơn tăng 3% (từ 5% → 8%), cần kiểm tra chất lượng dịch vụ giao hàng.

🌐 NGÔN NGỮ: Tiếng Việt chuyên nghiệp, súc tích";
        }

        private async Task<string> GetContextForMessageAsync(string userMessage, int? userId, bool isAdmin)
        {
            var context = new List<string>();
            var lowerMessage = userMessage.ToLower();

            try
            {
                // Block admin queries for non-admin users FIRST
                if (!isAdmin && ContainsAdminKeywords(lowerMessage))
                {
                    return
                        "⚠️ **Thông tin này chỉ dành cho quản trị viên.** Bạn không có quyền truy cập dữ liệu doanh thu, tồn kho, hoặc thống kê quản lý.";
                }

                if (isAdmin)
                {
                    // ==================== ADMIN QUERIES ====================

                    // REVENUE & FINANCIAL ANALYSIS
                    if (ContainsAny(lowerMessage, "doanh thu", "revenue", "bán được", "thu nhập", "tài chính",
                            "lợi nhuận"))
                    {
                        var revenue = await GetRevenueDataAsync();
                        context.Add($"📊 **Doanh thu & Tài chính:**\n{revenue}");

                        // Add profit margin analysis if asking about profit
                        if (ContainsAny(lowerMessage, "lợi nhuận", "profit", "margin"))
                        {
                            var profitAnalysis = await GetProfitAnalysisAsync();
                            context.Add($"💰 **Phân tích lợi nhuận:**\n{profitAnalysis}");
                        }
                    }

                    // INVENTORY MANAGEMENT
                    if (ContainsAny(lowerMessage, "tồn kho", "inventory", "kho", "còn hàng", "hết hàng", "stock"))
                    {
                        var inventory = await GetInventoryDataAsync();
                        context.Add($"📦 **Tồn kho:**\n{inventory}");

                        // Add turnover analysis
                        if (ContainsAny(lowerMessage, "luân chuyển", "turnover", "ế", "chậm bán"))
                        {
                            var turnover = await GetInventoryTurnoverAsync();
                            context.Add($"🔄 **Luân chuyển kho:**\n{turnover}");
                        }
                    }

                    // ORDER ANALYTICS
                    if (ContainsAny(lowerMessage, "đơn hàng", "order", "đơn", "giao hàng", "vận chuyển"))
                    {
                        var orders = await GetOrderStatsAsync();
                        context.Add($"🛒 **Đơn hàng:**\n{orders}");

                        // Add conversion and cancellation rates
                        if (ContainsAny(lowerMessage, "chuyển đổi", "conversion", "hủy", "cancel"))
                        {
                            var conversion = await GetConversionStatsAsync();
                            context.Add($"📊 **Tỷ lệ chuyển đổi:**\n{conversion}");
                        }
                    }

                    // PRODUCT PERFORMANCE
                    if (ContainsAny(lowerMessage, "sản phẩm", "product", "bán chạy", "best seller", "top", "phổ biến",
                            "ế"))
                    {
                        var topProducts = await GetTopSellingProductsAsync();
                        context.Add($"🏆 **Sản phẩm bán chạy:**\n{topProducts}");

                        // Add underperforming products if asked
                        if (ContainsAny(lowerMessage, "ế", "chậm", "không bán", "underperform"))
                        {
                            var slowMoving = await GetSlowMovingProductsAsync();
                            context.Add($"⚠️ **Sản phẩm bán chậm:**\n{slowMoving}");
                        }
                    }

                    // CUSTOMER ANALYTICS
                    if (ContainsAny(lowerMessage, "khách hàng", "customer", "người mua", "user"))
                    {
                        var customerStats = await GetCustomerAnalyticsAsync();
                        context.Add($"👥 **Phân tích khách hàng:**\n{customerStats}");
                    }

                    // CATEGORY PERFORMANCE
                    if (ContainsAny(lowerMessage, "danh mục", "category", "loại sản phẩm"))
                    {
                        var categoryStats = await GetCategoryPerformanceAsync();
                        context.Add($"📂 **Hiệu suất theo danh mục:**\n{categoryStats}");
                    }

                    // ALERTS & WARNINGS
                    if (ContainsAny(lowerMessage, "cảnh báo", "alert", "warning", "vấn đề", "problem"))
                    {
                        var alerts = await GetSystemAlertsAsync();
                        context.Add($"⚠️ **Cảnh báo hệ thống:**\n{alerts}");
                    }

                    // TRENDS & FORECASTING
                    if (ContainsAny(lowerMessage, "xu hướng", "trend", "dự báo", "forecast", "tương lai"))
                    {
                        var trends = await GetTrendsAndForecastAsync();
                        context.Add($"📈 **Xu hướng & Dự báo:**\n{trends}");
                    }
                }
                else
                {
                    // ==================== CUSTOMER QUERIES ====================

                    // PRODUCT SEARCH
                    bool wantsToSeeProducts = ContainsAny(lowerMessage,
                        // Viewing actions
                        "xem", "show", "hiển thị", "cho tôi xem", 
    
                        // Search actions
                        "tìm", "search", "có", "bán",
    
                        // Product keywords
                        "sản phẩm", "product", "mới", "new", "latest",
    
                        // Product categories
                        "áo", "quần", "váy", "đầm", "giày", "túi", "phụ kiện", "dép",
    
                        // Styling & advice keywords (NEW!)
                        "tư vấn", "advice", "gợi ý", "suggest", "recommend",
                        "phối đồ", "outfit", "kết hợp", "mix", "match",
    
                        // Event/occasion keywords (NEW!)
                        "dự tiệc", "party", "sự kiện", "event", "đi chơi", "dạo phố",
                        "đi làm", "công sở", "office", "du lịch", "travel",
                        "cưới", "wedding", "sinh nhật", "birthday",
    
                        // General question words
                        "gì", "what", "nào", "which"
                    );

                    _logger.LogInformation("🔍 Product detection - wantsToSeeProducts: {Wants}", wantsToSeeProducts);

                    if (wantsToSeeProducts)
                    {
                        _logger.LogInformation("✅ Product query detected: {Message}", userMessage);

                        // Extract smart keywords (returns empty string for "newest products")
                        var searchQuery = ExtractSearchKeywords(lowerMessage);

                        _logger.LogInformation("📝 Extracted keywords: '{Keywords}'",
                            string.IsNullOrEmpty(searchQuery) ? "[EMPTY - NEWEST PRODUCTS]" : searchQuery);

                        // Search for products
                        var products = await SearchProductsForContextAsync(searchQuery);

                        _logger.LogInformation("📦 SearchProductsForContextAsync returned {Count} formatted strings",
                            products?.Count ?? 0);

                        if (products.Any())
                        {
                            _logger.LogInformation("✅ Adding {Count} products to context", products.Count);
                            context.Add(
                                $"🛍️ **Sản phẩm có sẵn (Tìm thấy {products.Count}):**\n{string.Join("\n", products)}");
                            context.Add("⚠️ **CHỈ giới thiệu các sản phẩm trên. KHÔNG tự bịa thêm sản phẩm khác.**");
                        }
                        else
                        {
                            _logger.LogWarning("❌ No products returned - adding 'not found' message to context");
                            context.Add(
                                "⚠️ **KHÔNG TÌM THẤY SẢN PHẨM PHÙ HỢP TRONG KHO.** Hãy xin lỗi khách hàng và hướng dẫn họ mô tả chi tiết hơn hoặc liên hệ hotline.");
                        }
                    }
                    else
                    {
                        _logger.LogInformation("ℹ️ Product detection returned false - skipping product search");
                    }

                    // USER'S ORDERS
                    if (userId.HasValue && ContainsAny(lowerMessage, "đơn hàng", "order", "mua", "đặt"))
                    {
                        var orders = await GetUserOrdersAsync(userId.Value);
                        if (orders.Any())
                        {
                            context.Add($"📦 **Đơn hàng của bạn:**\n{string.Join("\n", orders)}");
                        }
                        else
                        {
                            context.Add("📦 **Bạn chưa có đơn hàng nào.**");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting context for message");
                return "⚠️ Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại.";
            }

            _logger.LogInformation("📋 Final context has {Count} items", context.Count);


            if (context.Any())
            {
                var finalContext = string.Join("\n\n", context);
                _logger.LogInformation("📄 Final context length: {Length} chars", finalContext.Length);
                _logger.LogInformation("📄 Final context preview: {Preview}",
                    finalContext.Length > 200 ? finalContext.Substring(0, 200) + "..." : finalContext);
                return finalContext;
            }

            // Return context or friendly fallback
            var fallback = isAdmin
                ? "Tôi sẵn sàng phân tích dữ liệu. Bạn muốn xem thông tin gì? (doanh thu, tồn kho, đơn hàng, sản phẩm...)"
                : "Tôi sẵn sàng hỗ trợ bạn! Bạn muốn tìm sản phẩm gì? (áo, quần, váy, phụ kiện...)";

            _logger.LogInformation("📋 Context empty - returning fallback message");
            return fallback;
        }

        private bool ContainsAny(string text, params string[] keywords)
        {
            return keywords.Any(keyword => text.Contains(keyword));
        }

        private async Task<string> GetRevenueDataAsync()
        {
            try
            {
                var today = DateTime.Today;
                var thisMonth = new DateTime(today.Year, today.Month, 1);
                var lastMonth = thisMonth.AddMonths(-1);

                var monthlyRevenue = await _context.Orders
                    .Where(o => o.DateBuy >= thisMonth && o.Status >= 1 && o.Status != 5)
                    .SelectMany(o => o.OrderDetail)
                    .SumAsync(c => c.Price * c.Quantity);

                var lastMonthRevenue = await _context.Orders
                    .Where(o => o.DateBuy >= lastMonth && o.DateBuy < thisMonth && o.Status >= 1 && o.Status != 5)
                    .SelectMany(o => o.OrderDetail)
                    .SumAsync(c => c.Price * c.Quantity);

                var totalRevenue = await _context.Orders
                    .Where(o => o.Status >= 1 && o.Status != 5)
                    .SelectMany(o => o.OrderDetail)
                    .SumAsync(c => c.Price * c.Quantity);

                var growth = lastMonthRevenue > 0
                    ? ((monthlyRevenue - lastMonthRevenue) / (double)lastMonthRevenue * 100)
                    : 0;
                var growthIcon = growth > 0 ? "📈" : growth < 0 ? "📉" : "➡️";

                return $@"- Tháng này: **{monthlyRevenue:N0}đ** {growthIcon} ({growth:+0.0;-0.0;0}% so với tháng trước)
- Tháng trước: {lastMonthRevenue:N0}đ
- Tổng doanh thu: {totalRevenue:N0}đ";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting revenue data");
                return "Không thể lấy dữ liệu doanh thu";
            }
        }

        private async Task<string> GetInventoryDataAsync()
        {
            try
            {
                var lowStockProducts = await _context.Products
                    .Where(p => p.Quantity < 10 && p.Quantity > 0 && p.Status == 1)
                    .OrderBy(p => p.Quantity)
                    .Select(p => new { p.Name, p.Quantity, p.Id })
                    .Take(5)
                    .ToListAsync();

                var totalProducts = await _context.Products.CountAsync(p => p.Status == 1);
                var outOfStock = await _context.Products.CountAsync(p => p.Quantity == 0 && p.Status == 1);
                var lowStock =
                    await _context.Products.CountAsync(p => p.Quantity < 10 && p.Quantity > 0 && p.Status == 1);

                var result = $@"- Tổng sản phẩm đang bán: {totalProducts}
- ⚠️ Hết hàng: **{outOfStock} sản phẩm**
- 🔴 Sắp hết (<10): **{lowStock} sản phẩm**";

                if (lowStockProducts.Any())
                {
                    result += $"\n\n**Top 5 sản phẩm cần nhập hàng:**";
                    foreach (var p in lowStockProducts)
                    {
                        result += $"\n- {p.Name}: chỉ còn {p.Quantity} cái (ID: {p.Id})";
                    }
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting inventory data");
                return "Không thể lấy dữ liệu tồn kho";
            }
        }

        private async Task<string> GetOrderStatsAsync()
        {
            try
            {
                var today = DateTime.Today;
                var pendingOrders = await _context.Orders.CountAsync(o => o.Status == 0);
                var processingOrders = await _context.Orders.CountAsync(o => o.Status >= 1 && o.Status <= 3);
                var todayOrders = await _context.Orders.CountAsync(o => o.DateBuy >= today);
                var totalOrders = await _context.Orders.CountAsync();

                return $@"- 🔴 Chờ xử lý: **{pendingOrders} đơn** (cần xác nhận ngay!)
- 🟡 Đang xử lý: {processingOrders} đơn
- 📅 Đơn hôm nay: {todayOrders} đơn
- 📊 Tổng đơn hàng: {totalOrders} đơn";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order stats");
                return "Không thể lấy dữ liệu đơn hàng";
            }
        }

        private async Task<string> GetTopSellingProductsAsync()
        {
            try
            {
                var topProducts = await _context.Orders
                    .Where(o => o.Status >= 1 && o.Status != 5)
                    .SelectMany(o => o.OrderDetail)
                    .GroupBy(c => new { c.IdProduct, c.Product!.Name })
                    .Select(g => new
                    {
                        ProductId = g.Key.IdProduct,
                        ProductName = g.Key.Name,
                        TotalSold = g.Sum(c => c.Quantity),
                        Revenue = g.Sum(c => c.Price * c.Quantity)
                    })
                    .OrderByDescending(p => p.TotalSold)
                    .Take(5)
                    .ToListAsync();

                if (!topProducts.Any())
                    return "Chưa có dữ liệu bán hàng";

                var result = "";
                for (int i = 0; i < topProducts.Count; i++)
                {
                    var medal = i == 0 ? "🥇" : i == 1 ? "🥈" : i == 2 ? "🥉" : "📍";
                    result +=
                        $"\n{medal} {topProducts[i].ProductName}: {topProducts[i].TotalSold} cái - {topProducts[i].Revenue:N0}đ";
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting top selling products");
                return "Không thể lấy dữ liệu sản phẩm bán chạy";
            }
        }

        private async Task<List<string>> SearchProductsForContextAsync(string query)
        {
            try
            {
                _logger.LogInformation("=== 🔍 SEARCH START ===");
                _logger.LogInformation("Input query: '{Query}'", query ?? "NULL");

                // Call repository
                var products = await _productRepository.SearchProductsAsync(query);

                _logger.LogInformation("📦 Repository returned: {Count} products", products?.Count ?? 0);

                if (products == null)
                {
                    _logger.LogError("❌ Repository returned NULL");
                    return new List<string>();
                }

                if (!products.Any())
                {
                    _logger.LogWarning("⚠️ Repository returned empty list");
                    return new List<string>();
                }

                // Log first few products
                _logger.LogInformation("📋 First 3 products from repository:");
                foreach (var p in products.Take(3))
                {
                    _logger.LogInformation("  - {Name} (ID:{Id}, Status:{Status}, Qty:{Qty})",
                        p.Name, p.Id, p.Status, p.Quantity);
                }

                // Filter for available products
                var availableProducts = products
                    .Where(p => p.Status == 1 && p.Quantity > 0)
                    .ToList();

                _logger.LogInformation("✅ After filtering (Status=1, Qty>0): {Count} products",
                    availableProducts.Count);

                if (!availableProducts.Any())
                {
                    _logger.LogWarning("❌ All {Total} products filtered out!", products.Count);
                    _logger.LogWarning("Checking why: Status values: {Statuses}, Quantity values: {Quantities}",
                        string.Join(",", products.Take(3).Select(p => p.Status)),
                        string.Join(",", products.Take(3).Select(p => p.Quantity)));
                    return new List<string>();
                }

                // Take top 10
                var top10 = availableProducts.Take(10).ToList();

                _logger.LogInformation("📝 Formatting {Count} products", top10.Count);

                // Format for AI
                var formattedProducts = top10.Select(p =>
                    $"- **{p.Name}** ({p.Color ?? "N/A"}, Size {p.Size ?? "N/A"}): " +
                    $"**{p.Price:N0}đ** - Còn {p.Quantity} cái (ID: {p.Id})"
                ).ToList();

                _logger.LogInformation("=== ✅ SEARCH END: Returning {Count} formatted products ===",
                    formattedProducts.Count);

                return formattedProducts;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in SearchProductsForContextAsync");
                return new List<string>();
            }
        }

        private async Task<List<string>> GetUserOrdersAsync(int userId)
        {
            try
            {
                var orders = await _orderRepository.GetOrdersByAccountIdAsync(userId);
                return orders.Take(3).Select(o =>
                    $"- Đơn **{o.Id}**: {GetOrderStatusText(o.Status)} - Ngày {o.DateBuy:dd/MM/yyyy}"
                ).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user orders");
                return new List<string>();
            }
        }

        private string GetOrderStatusText(int status)
        {
            return status switch
            {
                0 => "⏳ Chờ xác nhận",
                1 => "✅ Đã xác nhận",
                2 => "📦 Đang xử lý",
                3 => "🚚 Đang giao",
                4 => "✨ Đã giao",
                5 => "❌ Đã hủy",
                _ => "❓ Không xác định"
            };
        }

        public async Task<List<ChatMessageDto>> GetChatHistoryAsync(int userId)
        {
            try
            {
                var history = await _context.ChatMessages
                    .Where(cm => cm.UserId == userId)
                    .OrderBy(cm => cm.Timestamp)
                    .Select(cm => new ChatMessageDto
                    {
                        UserMessage = cm.UserMessage,
                        BotResponse = cm.BotResponse,
                        Timestamp = cm.Timestamp
                    })
                    .ToListAsync();

                return history;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting chat history for user {UserId}", userId);
                return new List<ChatMessageDto>();
            }
        }

        public async Task SaveChatMessageAsync(int userId, string userMessage, string botResponse)
        {
            try
            {
                var chatMessage = new ChatMessage
                {
                    UserId = userId,
                    UserMessage = userMessage,
                    BotResponse = botResponse,
                    Timestamp = DateTime.Now
                };

                await _context.ChatMessages.AddAsync(chatMessage);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Saved chat message for user {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving chat message for user {UserId}", userId);
            }
        }

        private async Task<string> GetProfitAnalysisAsync()
        {
            try
            {
                var today = DateTime.Today;
                var thisMonth = new DateTime(today.Year, today.Month, 1);

                var monthlyOrders = await _context.Orders
                    .Where(o => o.DateBuy >= thisMonth && o.Status >= 1 && o.Status != 5)
                    .Include(o => o.OrderDetail)
                    .ThenInclude(od => od.Product)
                    .ToListAsync();

                var totalRevenue = monthlyOrders
                    .SelectMany(o => o.OrderDetail)
                    .Sum(od => od.Price * od.Quantity);

                // Assuming cost is stored somewhere or calculate as 60% of price
                var estimatedCost = totalRevenue * 0.6m; // 60% COGS
                var grossProfit = totalRevenue - estimatedCost;
                var profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0;

                return $@"- Doanh thu: {totalRevenue:N0}đ
- Chi phí ước tính: {estimatedCost:N0}đ
- Lợi nhuận gộp: **{grossProfit:N0}đ** ({profitMargin:F1}%)
- Biên lợi nhuận: {(profitMargin >= 35 ? "🟢" : profitMargin >= 25 ? "🟡" : "🔴")} {profitMargin:F1}%";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting profit analysis");
                return "Không thể tính toán lợi nhuận";
            }
        }

        private async Task<string> GetInventoryTurnoverAsync()
        {
            try
            {
                var slowMoving = await _context.Products
                    .Where(p => p.Quantity > 20 && p.Status == 1)
                    .Select(p => new { p.Name, p.Quantity, p.Id })
                    .OrderByDescending(p => p.Quantity)
                    .Take(5)
                    .ToListAsync();

                if (!slowMoving.Any())
                    return "Không có sản phẩm tồn kho cao";

                var result = "**Top 5 sản phẩm tồn kho cao (có thể bán chậm):**";
                foreach (var p in slowMoving)
                {
                    result += $"\n- {p.Name}: {p.Quantity} cái (ID: {p.Id}) ⚠️";
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting inventory turnover");
                return "Không thể lấy dữ liệu luân chuyển kho";
            }
        }

        private async Task<string> GetConversionStatsAsync()
        {
            try
            {
                var today = DateTime.Today;
                var thisMonth = new DateTime(today.Year, today.Month, 1);

                var totalOrders = await _context.Orders
                    .CountAsync(o => o.DateBuy >= thisMonth);

                var completedOrders = await _context.Orders
                    .CountAsync(o => o.DateBuy >= thisMonth && o.Status == 4);

                var cancelledOrders = await _context.Orders
                    .CountAsync(o => o.DateBuy >= thisMonth && o.Status == 5);

                var completionRate = totalOrders > 0 ? (completedOrders * 100.0 / totalOrders) : 0;
                var cancellationRate = totalOrders > 0 ? (cancelledOrders * 100.0 / totalOrders) : 0;

                var completionIcon = completionRate >= 80 ? "🟢" : completionRate >= 60 ? "🟡" : "🔴";
                var cancellationIcon = cancellationRate <= 10 ? "🟢" : cancellationRate <= 20 ? "🟡" : "🔴";

                return $@"- Tổng đơn hàng: {totalOrders}
- Hoàn thành: **{completedOrders}** {completionIcon} ({completionRate:F1}%)
- Bị hủy: **{cancelledOrders}** {cancellationIcon} ({cancellationRate:F1}%)
- Đánh giá: {(cancellationRate > 15 ? "⚠️ Tỷ lệ hủy cao, cần kiểm tra nguyên nhân" : "✅ Tỷ lệ hoàn thành tốt")}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting conversion stats");
                return "Không thể lấy dữ liệu chuyển đổi";
            }
        }

        private async Task<string> GetSlowMovingProductsAsync()
        {
            try
            {
                // Products with high inventory but low sales in last 30 days
                var thirtyDaysAgo = DateTime.Today.AddDays(-30);

                var productSales = await _context.Orders
                    .Where(o => o.DateBuy >= thirtyDaysAgo && o.Status >= 1 && o.Status != 5)
                    .SelectMany(o => o.OrderDetail)
                    .GroupBy(od => new { od.IdProduct, od.Product!.Name, od.Product.Quantity })
                    .Select(g => new
                    {
                        ProductId = g.Key.IdProduct,
                        ProductName = g.Key.Name,
                        CurrentStock = g.Key.Quantity,
                        SoldLast30Days = g.Sum(od => od.Quantity)
                    })
                    .Where(p => p.CurrentStock > 10 && p.SoldLast30Days < 3)
                    .OrderByDescending(p => p.CurrentStock)
                    .Take(5)
                    .ToListAsync();

                if (!productSales.Any())
                    return "Không có sản phẩm ế ẩm đáng kể";

                var result = "";
                foreach (var p in productSales)
                {
                    result +=
                        $"\n- **{p.ProductName}**: Tồn {p.CurrentStock}, chỉ bán {p.SoldLast30Days} cái trong 30 ngày ⚠️";
                }

                return result + "\n\n**Đề xuất:** Xem xét giảm giá hoặc chương trình khuyến mãi để xử lý tồn kho";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting slow-moving products");
                return "Không thể lấy dữ liệu sản phẩm ế";
            }
        }

        private async Task<string> GetCustomerAnalyticsAsync()
        {
            try
            {
                var today = DateTime.Today;
                var thisMonth = new DateTime(today.Year, today.Month, 1);

                var totalCustomers = await _context.Accounts.CountAsync(a => a.Status == 1);
                var customersWithOrders = await _context.Orders
                    .Where(o => o.DateBuy >= thisMonth)
                    .Select(o => o.IdAccount)
                    .Distinct()
                    .CountAsync();

                var avgOrderValue = await _context.Orders
                    .Where(o => o.DateBuy >= thisMonth && o.Status >= 1 && o.Status != 5)
                    .SelectMany(o => o.OrderDetail)
                    .GroupBy(od => od.IdOrder)
                    .Select(g => g.Sum(od => od.Price * od.Quantity))
                    .AverageAsync();

                return $@"- Tổng khách hàng: {totalCustomers}
- Khách mua hàng tháng này: **{customersWithOrders}**
- Tỷ lệ active: {(totalCustomers > 0 ? (customersWithOrders * 100.0 / totalCustomers) : 0):F1}%
- Giá trị đơn hàng TB: **{avgOrderValue:N0}đ**";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customer analytics");
                return "Không thể lấy dữ liệu khách hàng";
            }
        }

        private async Task<string> GetCategoryPerformanceAsync()
        {
            try
            {
                var today = DateTime.Today;
                var thisMonth = new DateTime(today.Year, today.Month, 1);

                var categorySales = await _context.Orders
                    .Where(o => o.DateBuy >= thisMonth && o.Status >= 1 && o.Status != 5)
                    .SelectMany(o => o.OrderDetail)
                    .GroupBy(od => od.Product!.IdCategory)
                    .Select(g => new
                    {
                        CategoryId = g.Key,
                        TotalRevenue = g.Sum(od => od.Price * od.Quantity),
                        TotalQuantity = g.Sum(od => od.Quantity)
                    })
                    .OrderByDescending(c => c.TotalRevenue)
                    .Take(5)
                    .ToListAsync();

                if (!categorySales.Any())
                    return "Chưa có dữ liệu bán hàng theo danh mục";

                var totalRevenue = categorySales.Sum(c => c.TotalRevenue);
                var result = "";

                foreach (var cat in categorySales)
                {
                    var percentage = (cat.TotalRevenue / (double)totalRevenue * 100);
                    var category = await _context.Categories.FindAsync(cat.CategoryId);
                    result +=
                        $"\n- **{category?.Name ?? "Unknown"}**: {cat.TotalRevenue:N0}đ ({percentage:F1}%) - {cat.TotalQuantity} sản phẩm";
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting category performance");
                return "Không thể lấy dữ liệu danh mục";
            }
        }

        private async Task<string> GetSystemAlertsAsync()
        {
            try
            {
                var alerts = new List<string>();

                // Check for low stock
                var lowStockCount =
                    await _context.Products.CountAsync(p => p.Quantity < 10 && p.Quantity > 0 && p.Status == 1);
                if (lowStockCount > 0)
                    alerts.Add($"🔴 **{lowStockCount} sản phẩm** sắp hết hàng (<10 cái)");

                // Check for out of stock
                var outOfStockCount = await _context.Products.CountAsync(p => p.Quantity == 0 && p.Status == 1);
                if (outOfStockCount > 0)
                    alerts.Add($"⚠️ **{outOfStockCount} sản phẩm** đã hết hàng");

                // Check for pending orders
                var pendingOrders = await _context.Orders.CountAsync(o => o.Status == 0);
                if (pendingOrders > 5)
                    alerts.Add($"🟡 **{pendingOrders} đơn hàng** chờ xử lý (nhiều hơn bình thường)");

                // Check for high cancellation rate this week
                var weekAgo = DateTime.Today.AddDays(-7);
                var recentOrders = await _context.Orders.CountAsync(o => o.DateBuy >= weekAgo);
                var recentCancelled = await _context.Orders.CountAsync(o => o.DateBuy >= weekAgo && o.Status == 5);
                var cancellationRate = recentOrders > 0 ? (recentCancelled * 100.0 / recentOrders) : 0;

                if (cancellationRate > 15)
                    alerts.Add($"🔴 Tỷ lệ hủy đơn tuần này: **{cancellationRate:F1}%** (cao bất thường)");

                return alerts.Any() ? string.Join("\n", alerts) : "✅ Không có cảnh báo quan trọng";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting system alerts");
                return "Không thể lấy cảnh báo hệ thống";
            }
        }

        private async Task<string> GetTrendsAndForecastAsync()
        {
            try
            {
                var today = DateTime.Today;
                var last3Months = new[]
                {
                    new DateTime(today.Year, today.Month, 1).AddMonths(-2),
                    new DateTime(today.Year, today.Month, 1).AddMonths(-1),
                    new DateTime(today.Year, today.Month, 1)
                };

                var monthlyRevenues = new List<decimal>();

                foreach (var month in last3Months)
                {
                    var nextMonth = month.AddMonths(1);
                    var revenue = await _context.Orders
                        .Where(o => o.DateBuy >= month && o.DateBuy < nextMonth && o.Status >= 1 && o.Status != 5)
                        .SelectMany(o => o.OrderDetail)
                        .SumAsync(od => od.Price * od.Quantity);
                    monthlyRevenues.Add(revenue);
                }

                var trend = monthlyRevenues[2] > monthlyRevenues[1] && monthlyRevenues[1] > monthlyRevenues[0]
                    ? "📈 Tăng trưởng liên tục"
                    : monthlyRevenues[2] < monthlyRevenues[1] && monthlyRevenues[1] < monthlyRevenues[0]
                        ? "📉 Giảm liên tục"
                        : "➡️ Dao động";

                var avgGrowth = monthlyRevenues[0] > 0
                    ? (monthlyRevenues[2] - monthlyRevenues[0]) / monthlyRevenues[0] * 100
                    : 0;

                return $@"**Xu hướng 3 tháng:**
- Tháng {last3Months[0]:MM/yyyy}: {monthlyRevenues[0]:N0}đ
- Tháng {last3Months[1]:MM/yyyy}: {monthlyRevenues[1]:N0}đ  
- Tháng {last3Months[2]:MM/yyyy}: {monthlyRevenues[2]:N0}đ

**Đánh giá:** {trend} (Tăng trưởng TB: {avgGrowth:+0.0;-0.0;0}%)

**Dự báo tháng tới:** {(monthlyRevenues[2] * 1.1m):N0}đ (ước tính +10% nếu duy trì)";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting trends");
                return "Không thể phân tích xu hướng";
            }
        }

        private bool ContainsAdminKeywords(string text)
        {
            string[] adminKeywords =
            {
                // Revenue/Finance
                "doanh thu", "revenue", "thu nhập", "lợi nhuận", "profit", "earnings",

                // Inventory
                "tồn kho", "inventory", "kho hàng", "stock", "warehouse",

                // Statistics/Reports
                "thống kê", "statistics", "báo cáo", "report", "dashboard", "analytics",
                "phân tích", "insights", "metrics",

                // Sales data
                "bán chạy nhất", "best seller", "top selling", "sales performance",

                // Management
                "quản lý", "management", "admin", "quản trị"
            };

            var matched = adminKeywords.Where(keyword => text.Contains(keyword)).ToList();

            if (matched.Any())
            {
                _logger.LogInformation("Admin keywords detected: {Keywords}", string.Join(", ", matched));
            }

            return matched.Any();
        }

       private string ExtractSearchKeywords(string message)
{
    _logger.LogInformation("🔑 ExtractSearchKeywords input: '{Message}'", message);

    // Special case: newest/latest products request
    if (ContainsAny(message, "mới nhất", "newest", "latest", "sản phẩm mới", "new products", "hàng mới",
            "có gì", "gì mới"))
    {
        _logger.LogInformation("✅ Detected 'newest products' request - returning empty string");
        return "";
    }

    var keywords = new List<string>();

    // ✅ NEW: Event/Occasion detection
    var occasions = new Dictionary<string, string[]>
    {
        { "dự tiệc", new[] { "dự tiệc", "tiệc", "party", "gala" } },
        { "công sở", new[] { "công sở", "đi làm", "office", "work" } },
        { "dạo phố", new[] { "dạo phố", "đi chơi", "casual", "hang out" } },
        { "du lịch", new[] { "du lịch", "travel", "vacation" } },
        { "cưới", new[] { "cưới", "wedding", "đám cưới" } },
        { "thể thao", new[] { "thể thao", "gym", "sport", "workout" } }
    };

    // Check for occasions first
    foreach (var occasion in occasions)
    {
        if (occasion.Value.Any(keyword => message.Contains(keyword)))
        {
            // For party/formal events -> suggest váy, đầm, áo sơ mi
            if (occasion.Key == "dự tiệc" || occasion.Key == "cưới")
            {
                keywords.Add("váy");
                keywords.Add("đầm");
                _logger.LogInformation("  Detected formal occasion: {Occasion} -> adding formal wear", occasion.Key);
            }
            // For office -> suggest áo sơ mi, quần tây
            else if (occasion.Key == "công sở")
            {
                keywords.Add("áo sơ mi");
                keywords.Add("quần tây");
                _logger.LogInformation("  Detected office occasion -> adding office wear");
            }
            break;
        }
    }

    // Product types
    var productTypes = new Dictionary<string, string[]>
    {
        { "áo", new[] { "áo sơ mi", "áo thun", "áo polo", "áo", "shirt", "ao" } },
        { "quần", new[] { "quần jean", "quần tây", "quần", "pants", "quan" } },
        { "váy", new[] { "váy", "dress", "vay" } },
        { "đầm", new[] { "đầm", "dress", "dam" } },
        { "giày", new[] { "giày", "shoes", "giay" } },
        { "dép", new[] { "dép", "sandals", "dep" } },
        { "túi", new[] { "túi", "bag", "tui" } },
        { "phụ kiện", new[] { "phụ kiện", "accessory", "phu kien" } }
    };

    // Check for product types (only if not already added by occasion)
    if (!keywords.Any())
    {
        foreach (var type in productTypes)
        {
            if (type.Value.Any(keyword => message.Contains(keyword)))
            {
                keywords.Add(type.Key);
                _logger.LogInformation("  Found product type: {Type}", type.Key);
                break;
            }
        }
    }

    // Colors
    var colors = new[]
        { "đỏ", "red", "xanh", "blue", "vàng", "yellow", "đen", "black", "trắng", "white", "hồng", "pink" };
    foreach (var color in colors)
    {
        if (message.Contains(color))
        {
            keywords.Add(color);
            _logger.LogInformation("  Found color: {Color}", color);
            break;
        }
    }

    // Styles
    var styles = new[] { "sơ mi", "polo", "thun", "khoác", "jacket", "jean", "tây", "sang trọng", "lịch sự", "thanh lịch" };
    foreach (var style in styles.Where(s => message.Contains(s)))
    {
        keywords.Add(style);
        _logger.LogInformation("  Found style: {Style}", style);
    }

    var result = keywords.Any() ? string.Join(" ", keywords.Distinct()) : "";

    _logger.LogInformation("🔑 ExtractSearchKeywords output: '{Result}'",
        string.IsNullOrEmpty(result) ? "[EMPTY]" : result);

    return result;
}

        public async Task<string> DiagnosticProductCheck()
        {
            try
            {
                var allProducts = await _context.Products.ToListAsync();
                var activeProducts = allProducts.Where(p => p.Status == 1).ToList();
                var inStockProducts = activeProducts.Where(p => p.Quantity > 0).ToList();

                var result = $@"
📊 DIAGNOSTIC REPORT:
- Total products in DB: {allProducts.Count}
- Products with Status=1: {activeProducts.Count}
- Products with Status=1 AND Qty>0: {inStockProducts.Count}

First 5 products:";

                foreach (var p in allProducts.Take(5))
                {
                    result += $"\n- {p.Name} (ID:{p.Id}, Status:{p.Status}, Qty:{p.Quantity})";
                }

                return result;
            }
            catch (Exception ex)
            {
                return $"Error: {ex.Message}";
            }
        }
        
        private static readonly MemoryCache _responseCache = new MemoryCache(new MemoryCacheOptions
        {
            SizeLimit = 1000 
        });
    }
    
}