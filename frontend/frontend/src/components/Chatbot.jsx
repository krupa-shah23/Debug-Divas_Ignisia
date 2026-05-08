import { useRef, useState } from "react";
import { Alert, Button, Card, Input, List, Select, Space, Spin, Tag, Typography } from "antd";

import { chatWithZones, speechToTextAudio } from "../utils/api";

const { Text, Title } = Typography;
const LANGUAGE_OPTIONS = [
  "en-IN",
  "hi-IN",
  "ta-IN",
  "te-IN",
  "mr-IN",
  "gu-IN",
  "kn-IN",
  "ml-IN",
  "bn-IN",
  "pa-IN",
  "ur-IN",
  "or-IN",
  "as-IN",
  "sa-IN",
  "kok-IN",
];

function normalizeChatZones(zones) {
  if (!Array.isArray(zones)) {
    return [];
  }

  return zones.map((zone, index) => {
    if (typeof zone === "string") {
      const zoneIdMatch = zone.match(/Zone\s+([A-Za-z0-9_-]+)/i);
      return {
        key: `${zoneIdMatch?.[1] || index}-${index}`,
        zone_id: zoneIdMatch?.[1] || `zone-${index + 1}`,
        summary: zone,
      };
    }

    return {
      key: `${zone.zone_id || index}-${index}`,
      zone_id: zone.zone_id || `zone-${index + 1}`,
      summary: zone.summary || "",
    };
  });
}

export default function Chatbot({
  city,
  onZonesHighlighted,
  onError,
  data = [],
  selectedZones = [],
  simulation = null,
}) {
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en-IN");
  const [isPlaying, setIsPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioSrc, setAudioSrc] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: "Ask about high-priority zones, canopy stress, heat hotspots, or water feasibility.",
      zones: [],
    },
  ]);

  const handleSubmit = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || loading) {
      return;
    }

    setChatError("");
    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: "user",
        text: trimmedQuery,
        zones: [],
      },
    ]);
    setQuery("");
    setLoading(true);

    try {
      const result = await chatWithZones({
        query: trimmedQuery,
        city,
        selectedZones,
        totalTrees: simulation?.total_trees || 0,
        lang: selectedLanguage,
      });
      const normalizedZones = normalizeChatZones(result?.zones);
      const answer = result?.answer || result?.response || "Could not generate response.";
      const highlightIds = Array.isArray(result?.highlight_ids)
        ? result.highlight_ids
        : normalizedZones.map((zone) => zone.zone_id);

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: answer,
          zones: normalizedZones,
        },
      ]);

      onZonesHighlighted?.(highlightIds);

      if (result?.audio && audioRef.current) {
        const nextAudioSrc = `data:audio/mp3;base64,${result.audio}`;
        setAudioSrc(nextAudioSrc);
        audioRef.current.pause();
        audioRef.current.src = nextAudioSrc;
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to contact the chatbot.";

      setChatError(message);
      onError?.(message);
      onZonesHighlighted?.([]);
    } finally {
      setLoading(false);
    }
  };

  const stopAudio = () => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  const playAudio = async () => {
    if (!audioRef.current || !audioSrc) {
      return;
    }

    await audioRef.current.play();
    setIsPlaying(true);
  };

  const startRecording = async () => {
    try {
      setChatError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          const blob = new Blob(audioChunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });
          const sttResult = await speechToTextAudio({
            audioBlob: blob,
            lang: selectedLanguage,
          });
          setQuery(sttResult?.text || "");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to transcribe audio.";
          setChatError(message);
          onError?.(message);
        } finally {
          mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
      };

      recorder.start();
      setRecording(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Microphone access failed.";
      setChatError(message);
      onError?.(message);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) {
      return;
    }

    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  return (
    <Card
      className="eco-card"
      title={<Title level={5} style={{ margin: 0 }}>Saathi AI</Title>}
      styles={{ body: { display: "flex", flexDirection: "column", gap: 16 } }}
    >
      {chatError ? <Alert type="error" showIcon message={chatError} /> : null}
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />

      <List
        dataSource={messages}
        locale={{ emptyText: "Start the conversation." }}
        style={{
          maxHeight: 380,
          overflowY: "auto",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 12,
          background: "linear-gradient(180deg, #f8fffb 0%, #eef7f1 100%)",
        }}
        renderItem={(message) => (
          <List.Item style={{ border: "none", padding: "6px 0" }}>
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: message.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "88%",
                  padding: "12px 14px",
                  borderRadius: 18,
                  background: message.role === "user" ? "#1b4332" : "#ffffff",
                  color: message.role === "user" ? "#ffffff" : "#203126",
                  border: message.role === "user" ? "none" : "1px solid #d8eadb",
                  boxShadow: "0 10px 24px rgba(27, 67, 50, 0.08)",
                }}
              >
                <Text style={{ color: "inherit", whiteSpace: "pre-wrap" }}>{message.text}</Text>
                {message.zones?.length ? (
                  <Space wrap size={[8, 8]} style={{ marginTop: 10 }}>
                    {message.zones.map((zone) => (
                      <Tag
                        key={zone.key}
                        color="purple"
                        style={{ marginInlineEnd: 0, borderRadius: 999 }}
                      >
                        {zone.zone_id}
                      </Tag>
                    ))}
                  </Space>
                ) : null}
              </div>
            </div>
          </List.Item>
        )}
      />

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Spin size="small" />
          <Text type="secondary">Generating response...</Text>
        </div>
      ) : null}

      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Select
          value={selectedLanguage}
          onChange={setSelectedLanguage}
          options={LANGUAGE_OPTIONS.map((languageCode) => ({
            value: languageCode,
            label: languageCode,
          }))}
        />
        <Space.Compact style={{ width: "100%" }}>
          <Input
            value={query}
            placeholder="Ask which zones need intervention and why"
            onChange={(event) => setQuery(event.target.value)}
            onPressEnter={handleSubmit}
            disabled={loading}
          />
          <Button onClick={recording ? stopRecording : startRecording} disabled={loading}>
            {recording ? "Stop Mic" : "Mic"}
          </Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            Send
          </Button>
          {isPlaying ? (
            <Button onClick={stopAudio}>Stop</Button>
          ) : (
            <Button onClick={playAudio} disabled={!audioSrc}>
              Play
            </Button>
          )}
        </Space.Compact>
      </Space>
    </Card>
  );
}
