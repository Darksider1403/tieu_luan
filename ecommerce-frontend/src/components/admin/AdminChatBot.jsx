import React, { useState, useEffect, useRef } from "react";
import {
  BarChart3,
  X,
  Send,
  Loader2,
  Bot,
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import { chatbotService } from "../../services/chatbotService";
import "./AdminChatbot.css";

const AdminChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          type: "bot",
          content:
            "Xin chào Admin! 📊 Tôi là trợ lý AI phân tích dữ liệu của bạn.\n\nTôi có thể giúp bạn:\n\n📈 Phân tích doanh thu\n📦 Theo dõi tồn kho\n🛒 Thống kê đơn hàng\n🏆 Sản phẩm bán chạy\n\nBạn muốn xem báo cáo gì?",
          timestamp: new Date(),
        },
      ]);
    }
  }, [messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");

    const newUserMessage = {
      type: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await chatbotService.sendAdminMessage(userMessage);

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

      const errorMessage = {
        type: "bot",
        content: "Xin lỗi, không thể lấy dữ liệu phân tích. Vui lòng thử lại.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const QuickReports = () => {
    const reports = [
      {
        icon: DollarSign,
        text: "Doanh thu",
        query: "Báo cáo doanh thu tháng này",
      },
      {
        icon: Package,
        text: "Tồn kho",
        query: "Kiểm tra tồn kho hiện tại",
      },
      {
        icon: ShoppingCart,
        text: "Đơn hàng",
        query: "Thống kê đơn hàng hôm nay",
      },
      {
        icon: TrendingUp,
        text: "Top sản phẩm",
        query: "Sản phẩm bán chạy nhất",
      },
    ];

    const handleQuickReport = (query) => {
      setInputMessage(query);
      inputRef.current?.focus();
    };

    return (
      <div className="admin-quick-reports">
        <p className="quick-reports-title">Báo cáo nhanh:</p>
        <div className="quick-reports-grid">
          {reports.map((report, index) => (
            <button
              key={index}
              className="quick-report-btn"
              onClick={() => handleQuickReport(report.query)}
              disabled={isLoading}
            >
              <report.icon className="report-icon" size={18} />
              <span>{report.text}</span>
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
      <button
        className={`admin-chatbot-toggle ${isOpen ? "open" : ""}`}
        onClick={handleToggleChat}
      >
        {isOpen ? <X size={24} /> : <BarChart3 size={24} />}
      </button>

      {isOpen && (
        <div className="admin-chatbot-window">
          <div className="admin-chatbot-header">
            <div className="admin-header-content">
              <div className="admin-bot-avatar">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3>AI Analytics Assistant</h3>
                <p>Phân tích dữ liệu thông minh</p>
              </div>
            </div>
            <button className="admin-close-btn" onClick={handleToggleChat}>
              <X size={20} />
            </button>
          </div>

          <div className="admin-chatbot-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`admin-message ${message.type} ${
                  message.isError ? "error" : ""
                }`}
              >
                <div className="admin-message-avatar">
                  <Bot size={20} />
                </div>
                <div className="admin-message-content">
                  <div
                    className="admin-message-text"
                    dangerouslySetInnerHTML={{
                      __html: formatMessageContent(message.content),
                    }}
                  />
                  <span className="admin-message-time">
                    {message.timestamp.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="admin-message bot typing">
                <div className="admin-message-avatar">
                  <Bot size={20} />
                </div>
                <div className="admin-message-content">
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

          {messages.length <= 1 && <QuickReports />}

          <div className="admin-chatbot-input-container">
            <form onSubmit={handleSendMessage} className="admin-input-form">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Hỏi về doanh thu, tồn kho, đơn hàng..."
                className="admin-chatbot-input"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="admin-send-btn"
                disabled={!inputMessage.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="spinning" size={20} />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminChatbot;
