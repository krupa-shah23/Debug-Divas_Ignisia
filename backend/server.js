const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { spawn } = require("child_process");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);
const BASE_DIR = __dirname;
const PYTHON_BIN = process.env.PYTHON_BIN || "python";
const VALID_DROUGHT_MODES = new Set(["normal", "moderate", "severe"]);

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Urban tree optimization backend is running");
});

function runPythonScript(scriptName, args = [], extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(BASE_DIR, scriptName);
    const child = spawn(PYTHON_BIN, [scriptPath, ...args], {
      cwd: BASE_DIR,
      env: { ...process.env, ...extraEnv },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Python process exited with code ${code}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        resolve({ response: stdout.trim() });
      }
    });
  });
}

function runPythonModule(moduleName, args = [], extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, ["-m", moduleName, ...args], {
      cwd: BASE_DIR,
      env: { ...process.env, ...extraEnv },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Python process exited with code ${code}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(stdout.trim() || "Invalid JSON response from pipeline"));
      }
    });
  });
}

app.post("/api/run", async (req, res) => {
  try {
    const { city, droughtMode = "normal" } = req.body || {};
    if (!city || typeof city !== "string") {
      return res.status(400).json({ error: "city is required" });
    }

    if (typeof droughtMode !== "string" || !VALID_DROUGHT_MODES.has(droughtMode)) {
      return res.status(400).json({ error: "droughtMode must be one of: normal, moderate, severe" });
    }

    const result = await runPythonModule("src.pipeline_runner", [
      city.trim().toLowerCase(),
      String(droughtMode),
    ]);

    return res.json(result);
  } catch (error) {
    console.error("Run API error:", error);
    return res.status(500).json({ error: error.message || "Failed to run pipeline" });
  }
});

app.post("/optimize", async (req, res) => {
  try {
    const { city, droughtMode = "normal" } = req.body || {};

    if (!city || typeof city !== "string") {
      return res.status(400).json({ error: "city is required" });
    }

    if (typeof droughtMode !== "string" || !VALID_DROUGHT_MODES.has(droughtMode)) {
      return res.status(400).json({ error: "droughtMode must be one of: normal, moderate, severe" });
    }

    const result = await runPythonModule("src.pipeline_runner", [
      city.trim().toLowerCase(),
      String(droughtMode),
    ]);

    return res.json(result);
  } catch (error) {
    console.error("Optimize API error:", error);
    return res.status(500).json({ error: error.message || "Failed to optimize zones" });
  }
});

app.get("/optimize", (_req, res) => {
  return res.status(200).json({
    message: "Optimize endpoint is running. Send a POST request with { city, droughtMode }.",
    method: "POST",
    example: {
      city: "pune",
      droughtMode: "moderate",
    },
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { query, city, zones = [], total_trees = 0, lang = "en-IN" } = req.body || {};

    if (!query || !query.trim()) {
      return res.status(400).json({ error: "query is required" });
    }

    const args = city
      ? [query.trim(), city.trim()]
      : [query.trim()];

    const result = await runPythonScript(
      path.join("src", "rag_engine.py"),
      args,
      {
        CHAT_CONTEXT_JSON: JSON.stringify({
          zones,
          total_trees,
        }),
      }
    );

    const text = String(result?.response || "").trim();
    const cleanText = text
      .replace(/\*\*/g, "")
      .replace(/[-•]/g, "")
      .replace(/\n+/g, ". ")
      .trim();

    let audio = null;

    if (cleanText) {
      const ttsResponse = await fetch("https://api.sarvam.ai/text-to-speech", {
        method: "POST",
        headers: {
          "api-subscription-key": process.env.SARVAM_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: cleanText,
          target_language_code: lang,
          model: "bulbul:v3",
          speaker: "priya",
          output_audio_codec: "mp3",
        }),
      });

      if (!ttsResponse.ok) {
        const errorText = await ttsResponse.text();
        throw new Error(`Sarvam TTS failed: ${errorText}`);
      }

      const ttsPayload = await ttsResponse.json();
      audio = ttsPayload?.audios?.[0] || null;
    }

    return res.json({
      ...result,
      audio,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return res.status(500).json({ error: error.message });
  }
});

app.post(
  "/api/speech-to-text",
  express.raw({
    type: () => true,
    limit: "15mb",
  }),
  async (req, res) => {
    try {
      const audioBuffer = req.body;
      if (!audioBuffer || !audioBuffer.length) {
        return res.status(400).json({ error: "audio is required" });
      }

      const lang = req.headers["x-language-code"] || "unknown";
      const mimeType = req.headers["content-type"] || "audio/webm";
      const extension = mimeType.includes("wav")
        ? "wav"
        : mimeType.includes("mp3")
          ? "mp3"
          : mimeType.includes("ogg")
            ? "ogg"
            : "webm";

      const form = new FormData();
      form.append(
        "file",
        new Blob([audioBuffer], { type: mimeType }),
        `recording.${extension}`
      );
      form.append("model", "saarika:v2.5");
      form.append("language_code", String(lang));

      const sttResponse = await fetch("https://api.sarvam.ai/speech-to-text", {
        method: "POST",
        headers: {
          "api-subscription-key": process.env.SARVAM_API_KEY,
        },
        body: form,
      });

      if (!sttResponse.ok) {
        const errorText = await sttResponse.text();
        throw new Error(`Sarvam STT failed: ${errorText}`);
      }

      const sttPayload = await sttResponse.json();
      return res.json({
        text: sttPayload?.transcript || "",
        language_code: sttPayload?.language_code || null,
      });
    } catch (error) {
      console.error("STT API error:", error);
      return res.status(500).json({ error: error.message || "STT failed" });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
