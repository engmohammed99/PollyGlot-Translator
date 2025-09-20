import "dotenv/config";
import express from "express";
import cors from "cors";
import { Agent, run } from "@openai/agents";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory (needed for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check API key
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY in .env file");
  console.error("Create .env file with: OPENAI_API_KEY=sk-your-key-here");
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve frontend files

// Create translation agent
const translatorAgent = new Agent({
  name: "PollyGlot Translator",
  instructions: `
        You are a professional translator for the PollyGlot app.
        When given text and a target language, provide accurate translations.
        Only return the translated text, no explanations or additional text.
        Be precise and natural in your translations.
    `,
});

// Routes
app.get("/", (req, res) => {
  res.send(`
        <h1>🌍 PollyGlot Translator Backend</h1>
        <p>Backend server is running! 🚀</p>
        <p><a href="/index.html">Open Translator App</a></p>
        <p>API Endpoint: POST /api/translate</p>
        <hr>
        <h3>API Test:</h3>
        <p>POST to /api/translate with JSON:</p>
        <pre>{"text": "Hello world", "targetLanguage": "French"}</pre>
    `);
});

// Translation endpoint
app.post("/api/translate", async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;

    // Validation
    if (!text || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: text and targetLanguage",
      });
    }

    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        error: "Text too long. Maximum 1000 characters allowed.",
      });
    }

    console.log(`🔄 Translating "${text}" to ${targetLanguage}`);

    // Call OpenAI Agent
    const prompt = `Translate this text to ${targetLanguage}: "${text}"`;
    const result = await run(translatorAgent, prompt);

    console.log(`✅ Translation completed: ${result.finalOutput}`);

    // Return translation
    res.json({
      success: true,
      original: text,
      translated: result.finalOutput,
      targetLanguage: targetLanguage,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Translation error:", error.message);
    res.status(500).json({
      success: false,
      error: "Translation failed. Please try again.",
      details: error.message,
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    openai_connected: !!process.env.OPENAI_API_KEY,
    server: "PollyGlot Backend v1.0",
  });
});

// Handle 404s - FIXED: Remove the problematic catch-all route
// The express.static middleware will handle serving files from /public
// Any unmatched API routes will naturally return 404

// Start server
app.listen(port, () => {
  console.log(`🚀 PollyGlot Backend running at http://localhost:${port}`);
  console.log(`📡 API endpoint: http://localhost:${port}/api/translate`);
  console.log(`🌐 Frontend app: http://localhost:${port}/index.html`);
  console.log(
    `🔑 OpenAI API key: ${
      process.env.OPENAI_API_KEY ? "✅ Loaded" : "❌ Missing"
    }`
  );
});
