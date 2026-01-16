import { useState, useEffect, useRef } from "react";
import "../styles/aiLeaseAssistant.css";
import { Button, Form, Badge } from "react-bootstrap";
import { FiX, FiSend } from "react-icons/fi";

const AiLeaseAssistant = ({ open, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "Hello! I'm your AI lease assistant. I can help you answer questions about leases, CAM rules, and important dates.",
      isInitial: true,
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open) {
      scrollToBottom();
    }
  }, [messages, open]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      text: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate bot thinking
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        type: "bot",
        text: `I understand you're asking about "${userMessage.text}". I'm currently processing the lease documents to give you an accurate answer. This is a simulated response for demonstration.`,
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  if (!open) return null;

  return (
    <div className={`ai-assistant-panel ${open ? "open" : ""}`}>
      {/* Header */}
      <div className="ai-header">
        <div className="header-title-area">
          <h4>AI Lease Assistant</h4>
          <span className="ai-status-dot"></span>
        </div>
        <FiX className="close-icon" onClick={onClose} />
      </div>

      {/* Credits */}
      <div className="ai-credits">
        <Badge className="credits-badge text-white">45 AI credits remaining</Badge>
      </div>

      {/* Chat */}
      <div className="ai-chat">
        {messages.map((msg) => (
          <div key={msg.id} className={`ai-message ${msg.type === "bot" ? "ai-bot" : "ai-user"}`}>
            {msg.text}
            {msg.isInitial && (
              <div className="initial-prompt">
                <strong>What would you like to know?</strong>
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="ai-message ai-bot typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <Form className="ai-input" onSubmit={handleSendMessage}>
        <Form.Control
          type="text"
          placeholder="Ask a question..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <Button type="submit" disabled={!inputValue.trim() || isTyping}>
          <FiSend />
        </Button>
      </Form>
    </div>
  );
};

export default AiLeaseAssistant;
