import React, { useState } from "react";
import { Input, Button, Card, Typography } from "antd";

const { Title } = Typography;

export default function Chatbot({ data }) {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! Ask me about urban heat, CO₂, or tree planning 🌳" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input) return;

    const userMessage = { role: "user", text: input };
    const botReply = getBotResponse(input);

    setMessages([...messages, userMessage, { role: "bot", text: botReply }]);
    setInput("");
  };

  const getBotResponse = (query) => {
    query = query.toLowerCase();

    if (query.includes("highest")) {
      const top = data[0];
      return `Zone ${top.zone_id} has highest priority with impact score ${top.impact_score.toFixed(2)}.`;
    }

    if (query.includes("co2")) {
      return "Higher CO₂ levels increase heat retention and reduce air quality.";
    }

    if (query.includes("trees")) {
      return "Planting trees reduces temperature and lowers urban stress.";
    }

    return "Ask about zones, CO₂, or tree planning 🌿";
  };

  return (
    <Card
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        borderRadius: "12px",
      }}
    >
      {/* HEADER */}
      <Title level={4} style={{ marginBottom: 10 }}>
        🤖 Urban AI Assistant
      </Title>

      {/* CHAT AREA */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px",
          background: "#fafafa",
          borderRadius: "8px",
          marginBottom: "10px"
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              textAlign: msg.role === "user" ? "right" : "left",
              marginBottom: "8px"
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: "12px",
                background: msg.role === "user" ? "#1677ff" : "#e6f4ff",
                color: msg.role === "user" ? "white" : "black"
              }}
            >
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      {/* INPUT AREA */}
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onPressEnter={handleSend}
        placeholder="Ask something..."
      />

      <Button
        type="primary"
        onClick={handleSend}
        style={{ marginTop: "8px" }}
      >
        Send
      </Button>
    </Card>
  );
}