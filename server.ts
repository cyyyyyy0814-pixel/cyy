import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

  app.use(express.json());

  // API Route for analysis
  app.post("/api/analyze", async (req, res) => {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    if (!genAI) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
        }
      });
      
      const prompt = `
        You are an advanced emotion detection AI used in a mental health support system.
        Your task is to analyze the user's message carefully and identify the MOST ACCURATE emotional state.
        You MUST classify the emotion into ONLY ONE of these categories: Happy, Sad, Stress, Neutral.

        Emotion Definitions:
        Happy: joy, excitement, motivation, gratitude, feeling positive, proud, relaxed.
        Sad: heartbreak, breakup, loneliness, emotional pain, disappointment, crying, hopelessness, depression-like feelings.
        Stress: anxiety, overwhelmed, pressure, burnout, frustration, too much work, exam stress, lack of sleep, panic.
        Neutral: statements without strong emotion, informational sentences, emotionally unclear messages.

        VERY IMPORTANT RULES:
        - Do NOT default to Neutral.
        - Understand the meaning and context of the sentence.
        - Short emotional sentences are still emotional.
        - "I am sad", "I feel lonely", "I want to cry" = Sad.
        - "I am stressed", "too many assignments", "I cannot sleep because of work" = Stress.
        - "I am happy", "today is amazing", "I feel excited" = Happy.
        - Only use Neutral when there is NO clear emotion.

        CRITICAL: Use VERY SIMPLE English for feedback and suggestion. Avoid big or difficult words.

        You must return your answer ONLY in this exact JSON format:
        {
          "emotion": "Sad",
          "feedback": "...",
          "suggestion": "..."
        }

        DO NOT return explanations.
        DO NOT return markdown.
        DO NOT return extra text.

        Analyze this message now:
        USER MESSAGE: "${text}"
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();
      
      console.log("Gemini raw response:", textResponse);

      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (parseError) {
        console.error("JSON parse error:", parseError, "Raw text:", textResponse);
        // Fallback or attempt to clean markdown
        const cleaned = textResponse.replace(/```json|```/g, "").trim();
        data = JSON.parse(cleaned);
      }

      res.json(data);
    } catch (error: any) {
      console.error("Gemini error details:", error);
      res.status(500).json({ 
        error: "Analysis failed", 
        message: error.message || "Unknown error",
        details: process.env.NODE_ENV !== "production" ? error.stack : undefined
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
