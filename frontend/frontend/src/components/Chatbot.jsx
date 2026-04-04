import React, { useState } from "react";
import { Input, Button, Card, Typography } from "antd";
import { MessageOutlined, CloseOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function Chatbot({ data }) {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! I'm Saathi AI. Ask me about urban heat, CO₂, or tree planning " }
  ]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input };
    const botReply = getBotResponse(input);

    setMessages([...messages, userMessage, { role: "bot", text: botReply }]);
    setInput("");
  };

  const getBotResponse = (query) => {
    query = query.toLowerCase();

    if (query.includes("highest")) {
      if (!data || data.length === 0) return "No data available.";
      const top = data[0];
      return `Zone ${top.zone_id} has highest priority with impact score ${Number(top.impact_score).toFixed(2)}.`;
    }

    if (query.includes("co2")) {
      return "Higher CO₂ levels increase heat retention and reduce air quality.";
    }

    if (query.includes("trees")) {
      return "Planting trees reduces temperature and lowers urban stress.";
    }

    return "Ask about zones, CO₂, or tree planning ";
  };

  return (
    <>
      {/* FLOATING BUTTON */}
      <Button
        type="primary"
        shape="circle"
        icon={isOpen ? <CloseOutlined style={{ fontSize: '24px' }} /> : <MessageOutlined style={{ fontSize: '24px' }} />}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          width: "60px",
          height: "60px",
          boxShadow: "0 8px 24px rgba(37, 99, 235, 0.4)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#10b981", // Align with green identity
          border: "none",
          transition: "transform 0.2s ease"
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      />

      {/* FLOATING PANEL */}
      <div
        style={{
          position: "fixed",
          bottom: "100px",
          right: "30px",
          width: "340px",
          height: "480px",
          zIndex: 9999,
          pointerEvents: isOpen ? "auto" : "none",
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
          transformOrigin: "bottom right",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <Card
          styles={{ body: { padding: "16px", display: "flex", flexDirection: "column", height: "100%" } }}
          style={{
            height: "100%",
            borderRadius: "16px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
            border: "1px solid #e5e7eb",
            background: "#ffffff"
          }}
        >
          {/* HEADER */}
          <div style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: "12px", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}></span>
              <Text strong style={{ fontSize: "15px", color: "#1f2937" }}>Saathi AI </Text>
            </div>
            <CloseOutlined style={{ color: '#9ca3af', cursor: 'pointer' }} onClick={() => setIsOpen(false)} />
          </div>

          {/* CHAT AREA */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "10px",
              background: "#f8fafc",
              borderRadius: "8px",
              marginBottom: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  textAlign: msg.role === "user" ? "right" : "left",
                  width: "100%"
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "8px 12px",
                    borderRadius: "14px",
                    borderBottomRightRadius: msg.role === "user" ? "4px" : "14px",
                    borderBottomLeftRadius: msg.role === "bot" ? "4px" : "14px",
                    background: msg.role === "user" ? "#10b981" : "#ffffff",
                    color: msg.role === "user" ? "white" : "#1f2937",
                    fontSize: "13px",
                    maxWidth: "90%",
                    wordWrap: "break-word",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    border: msg.role === "bot" ? "1px solid #e5e7eb" : "none"
                  }}
                >
                  {msg.text}
                </span>
              </div>
            ))}
          </div>

          {/* INPUT AREA */}
          <div style={{ display: "flex", gap: "8px" }}>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={handleSend}
              placeholder="Ask me anything..."
              style={{ borderRadius: "8px", fontSize: "13px" }}
            />
            <Button
              type="primary"
              onClick={handleSend}
              style={{ borderRadius: "8px", background: "#10b981", border: "none", fontWeight: 500 }}
            >
              Send
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}