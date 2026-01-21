const express = require("express");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Must match what the webpage sends (after normalization)
const ALLOWED_PROMPTS = [
  "Explain how photosynthesis works in about a paragraph.",
  "Create a study plan for a 30 word vocabulary quiz that I have in 3 days.",
  "Solve the following equation using completing the square: x^2 + 7x + 12 = 0",
  "List the 4 greatest causes of World War I.",
  "Summarize act 1 of Romeo and Juliet without spoiling later acts."
];

function normalizePrompt(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

app.post("/api/chat", async (req, res) => {
  const t0 = Date.now();
  try {
    const prompt = normalizePrompt(req.body.prompt);

    if (!ALLOWED_PROMPTS.includes(prompt)) {
      return res.status(400).json({ error: "INVALID_PROMPT" });
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
  		"You are an AI assistant for a high school student.\n" +
  		"Keep your behavior consistent with the following:\n" +
  		"Use a calm and neutral tone.\n" +
  		"Do not use emojis, jokes, or slang.\n" +
  		"Do not make answers longer than 8 sentences.\n" +
  		"Language should be appropriate for high schoolers.\n" +
  		"Answer immediately with no greeting.\n" +
  		"Do not ask follow up questions.\n" +
  		"Do not use LaTeX or any backslash-based math formatting. Write all math in plain text only (e.g., -5/3, (x+1)^2, sqrt(1/2))."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.6,
      max_output_tokens: 280,
      store: false
    });

    const text = response.output_text || "(No response)";
    const apiMs = Date.now() - t0;

    // Return API time so frontend can do 50% wait / 50% typing
    res.json({ text, apiMs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running at http://localhost:" + PORT);
});

