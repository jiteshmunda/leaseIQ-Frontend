import { useState, useEffect, useRef } from "react";
import "../styles/aiLeaseAssistant.css";
import { Button, Form, Badge } from "react-bootstrap";
import { FiX, FiSend } from "react-icons/fi";
import axios from "axios";

const API_URL = import.meta.env.VITE_AI_ASSISTANT_API_URL;

const AiLeaseAssistant = ({ open, onClose, leaseId, organizationId }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "Hello! I'm your AI lease assistant. I can help you with lease terms, CAM rules, and important dates.",
      isInitial: true,
    },
  ]);

  const userId = sessionStorage.getItem("userId");
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userText = inputValue;

    const userMessage = {
      id: Date.now(),
      type: "user",
      text: userText,
    };

    const botMessageId = Date.now() + 1;

    const botMessage = {
      id: botMessageId,
      type: "bot",
      text: "",
    };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setInputValue("");
    setIsTyping(true);

    let lastResponseLength = 0;

    try {
      await axios.post(
        `${API_URL}/agents/leaseAgent/stream`,
        new URLSearchParams({
          messages: JSON.stringify([
            { role: "user", content: userText },
          ]),
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "x-user-id": userId,
            "x-lease-id": leaseId,
            "x-organization-id": organizationId,
          },
          responseType: "text",
          onDownloadProgress: (progressEvent) => {
            const responseText = progressEvent.event.target.responseText;

            const newChunk = responseText.substring(lastResponseLength);
            lastResponseLength = responseText.length;

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === botMessageId
                  ? { ...msg, text: msg.text + newChunk }
                  : msg
              )
            );

            scrollToBottom();
          },
        }
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId
            ? {
                ...msg,
                text: "⚠️ Unable to fetch response. Please try again.",
                error,
              }
            : msg
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  if (!open) return null;

  return (
    <div className={`ai-assistant-panel ${open ? "open" : ""}`}>
      {/* Header */}
      <div className="ai-header">
        <div className="header-title-area">
          <h4>AI Lease Assistant</h4>
          <span className="ai-status-dot" />
        </div>
        <FiX className="close-icon" onClick={onClose} />
      </div>

      {/* Credits */}
      <div className="ai-credits">
        <Badge className="credits-badge text-white">
          45 AI credits remaining
        </Badge>
      </div>

      {/* Chat */}
      <div className="ai-chat">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`ai-message ${
              msg.type === "bot" ? "ai-bot" : "ai-user"
            }`}
          >
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
          disabled={isTyping}
        />
        <Button type="submit" disabled={!inputValue.trim() || isTyping}>
          <FiSend />
        </Button>
      </Form>
    </div>
  );
};

export default AiLeaseAssistant;
