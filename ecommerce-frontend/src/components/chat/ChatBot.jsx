import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  ShoppingBag,
  Shield, // ← Thêm icon cho admin
} from "lucide-react";
import { chatbotService } from "../../services/chatbotService";
import "./ChatBot.css";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userRole, setUserRole] = useState(null); // ← Thêm state cho role
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ✅ Load user role khi component mount
  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);
    console.log("Chatbot initialized with role:", role);
  }, []);

  // Welcome message - customize based on role
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage =
        userRole === "Admin"
          ? {
              type: "bot",
              content:
                "Xin chào Admin! 👨‍💼 Tôi là trợ lý AI phân tích của FashionHub. Tôi có thể giúp bạn:\n\n📊 Phân tích doanh thu & lợi nhuận\n📦 Quản lý tồn kho\n🛒 Thống kê đơn hàng\n🏆 Sản phẩm bán chạy\n👥 Phân tích khách hàng\n⚠️ Cảnh báo hệ thống\n\nBạn muốn xem thông tin gì?",
              timestamp: new Date(),
            }
          : {
              type: "bot",
              content:
                "Xin chào! 👋 Tôi là trợ lý AI của FashionHub. Tôi có thể giúp bạn:\n\n✨ Tìm kiếm sản phẩm thời trang\n👗 Tư vấn phối đồ\n📦 Kiểm tra đơn hàng\n💰 Thông tin khuyến mãi\n\nBạn cần hỗ trợ gì hôm nay?",
              timestamp: new Date(),
            };

      setMessages([welcomeMessage]);
    }
  }, [messages.length, userRole]);

  // Load chat history when component mounts
  useEffect(() => {
    loadChatHistory();
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChatHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }

      const history = await chatbotService.getChatHistory();

      if (history && history.length > 0) {
        const formattedHistory = history
          .map((msg) => [
            {
              type: "user",
              content: msg.userMessage,
              timestamp: new Date(msg.timestamp),
            },
            {
              type: "bot",
              content: msg.botResponse,
              timestamp: new Date(msg.timestamp),
            },
          ])
          .flat();

        setMessages((prev) => {
          const welcomeMessage = prev[0];
          return [welcomeMessage, ...formattedHistory];
        });
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");

    // Add user message
    const newUserMessage = {
      type: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    // Show typing indicator
    setIsLoading(true);
    setIsTyping(true);

    try {
      // ✅ QUAN TRỌNG: Gọi đúng method dựa trên role
      let response;

      if (userRole === "Admin") {
        console.log("🔐 Calling sendAdminMessage for admin user");
        response = await chatbotService.sendAdminMessage(userMessage);
      } else {
        console.log("👤 Calling sendMessage for regular user");
        response = await chatbotService.sendMessage(userMessage);
      }

      // Remove typing indicator
      setIsTyping(false);

      if (response.success) {
        const botMessage = {
          type: "bot",
          content: response.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error(response.error || "Failed to get response");
      }
    } catch (error) {
      setIsTyping(false);
      console.error("Error sending message:", error);

      let errorContent =
        "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ hotline 1900-xxxx để được hỗ trợ. 🙏";

      if (error.response?.status === 401) {
        errorContent =
          "Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục sử dụng chatbot. 🔐";
      } else if (error.response?.status === 403) {
        errorContent =
          "Bạn không có quyền truy cập chức năng này. Vui lòng đăng nhập với tài khoản phù hợp. 🚫";
      } else if (error.response?.status === 500) {
        errorContent = "Máy chủ đang bảo trì. Vui lòng thử lại sau ít phút. ⚙️";
      } else if (error.message?.includes("Network Error")) {
        errorContent =
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet của bạn. 🌐";
      }

      const errorMessage = {
        type: "bot",
        content: errorContent,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // ✅ Quick actions khác nhau cho Admin vs Customer
  const QuickActions = () => {
    const adminActions = [
      {
        icon: "📊",
        text: "Doanh thu tháng này",
        query: "Doanh thu tháng này là bao nhiêu?",
      },
      {
        icon: "📦",
        text: "Tồn kho",
        query: "Kiểm tra tình trạng tồn kho",
      },
      {
        icon: "🏆",
        text: "Top sản phẩm",
        query: "Sản phẩm nào bán chạy nhất?",
      },
      {
        icon: "⚠️",
        text: "Cảnh báo",
        query: "Có cảnh báo gì cần chú ý không?",
      },
    ];

    const customerActions = [
      {
        icon: "👗",
        text: "Xem sản phẩm mới",
        query: "Cho tôi xem sản phẩm mới nhất",
      },
      {
        icon: "🎁",
        text: "Khuyến mãi",
        query: "Có chương trình khuyến mãi nào không?",
      },
      {
        icon: "📦",
        text: "Đơn hàng của tôi",
        query: "Kiểm tra đơn hàng của tôi",
      },
      {
        icon: "💡",
        text: "Tư vấn phối đồ",
        query: "Tư vấn phối đồ đi dự tiệc",
      },
    ];

    const quickActions = userRole === "Admin" ? adminActions : customerActions;

    const handleQuickAction = (query) => {
      setInputMessage(query);
      inputRef.current?.focus();
    };

    return (
      <div className="quick-actions">
        <p className="quick-actions-title">
          {userRole === "Admin" ? "📊 Phân tích nhanh:" : "Gợi ý cho bạn:"}
        </p>
        <div className="quick-actions-grid">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="quick-action-btn"
              onClick={() => handleQuickAction(action.query)}
              disabled={isLoading}
            >
              <span className="quick-action-icon">{action.icon}</span>
              <span className="quick-action-text">{action.text}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const formatMessageContent = (content) => {
    let formatted = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    formatted = formatted.replace(/\n/g, "<br/>");
    return formatted;
  };

  return (
    <>
      {/* Chat Button */}
      <button
        className={`chatbot-toggle ${isOpen ? "open" : ""} ${
          userRole === "Admin" ? "admin-mode" : ""
        }`}
        onClick={handleToggleChat}
        aria-label="Toggle chatbot"
      >
        {isOpen ? (
          <X className="icon" />
        ) : (
          <div className="toggle-content">
            {userRole === "Admin" ? (
              <Shield className="icon" />
            ) : (
              <MessageCircle className="icon" />
            )}
            <div className="pulse-dot" />
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div
            className={`chatbot-header ${userRole === "Admin" ? "admin" : ""}`}
          >
            <div className="header-content">
              <div className="bot-avatar">
                <Sparkles className="sparkle-icon" />
                {userRole === "Admin" ? (
                  <Shield className="bot-icon" />
                ) : (
                  <Bot className="bot-icon" />
                )}
              </div>
              <div className="header-text">
                <h3>
                  FashionHub AI Assistant
                  {userRole === "Admin" && (
                    <span className="admin-badge">Admin</span>
                  )}
                </h3>
                <p className="online-status">
                  <span className="status-dot"></span>
                  {userRole === "Admin"
                    ? "Admin Mode - Phân tích dữ liệu"
                    : "Online - Luôn sẵn sàng hỗ trợ"}
                </p>
              </div>
            </div>
            <button
              className="close-btn"
              onClick={handleToggleChat}
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.type} ${
                  message.isError ? "error" : ""
                }`}
              >
                <div className="message-avatar">
                  {message.type === "bot" ? (
                    userRole === "Admin" ? (
                      <Shield size={20} />
                    ) : (
                      <Bot size={20} />
                    )
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div className="message-content">
                  <div
                    className="message-text"
                    dangerouslySetInnerHTML={{
                      __html: formatMessageContent(message.content),
                    }}
                  />
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="message bot typing">
                <div className="message-avatar">
                  {userRole === "Admin" ? (
                    <Shield size={20} />
                  ) : (
                    <Bot size={20} />
                  )}
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && <QuickActions />}

          {/* Input */}
          <div className="chatbot-input-container">
            <form onSubmit={handleSendMessage} className="chatbot-input-form">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  userRole === "Admin"
                    ? "Hỏi về doanh thu, tồn kho, đơn hàng..."
                    : "Nhập câu hỏi của bạn..."
                }
                className="chatbot-input"
                rows="1"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="send-btn"
                disabled={!inputMessage.trim() || isLoading}
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="icon spinning" size={20} />
                ) : (
                  <Send className="icon" size={20} />
                )}
              </button>
            </form>
            <p className="input-hint">
              Nhấn <kbd>Enter</kbd> để gửi, <kbd>Shift + Enter</kbd> để xuống
              dòng
            </p>
          </div>

          {/* Footer */}
          <div className="chatbot-footer">
            <ShoppingBag size={14} />
            <span>
              Powered by AI • FashionHub 2025
              {userRole === "Admin" && " • Admin Analytics"}
            </span>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
