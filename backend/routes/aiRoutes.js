const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createRateLimiter } = require("../middleware/rateLimit");
const { validateAiIdeaBody } = require("../middleware/requestGuards");

const aiLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 40,
  keyBuilder: (req) => `${req.ip}:${req.path}`,
  message: "Too many AI generation requests. Please try again later.",
});

// 🔥 HELPER FALLBACK (still useful)
const generateTitleText = (idea) => {
  const words = idea.toLowerCase().split(" ");
  const keyword = words[0] || "event";
  const titles = [
    `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Masterclass`,
    `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Experience`,
    `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Connect & Learn`,
    `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Workshop Pro`,
    `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Excellence Summit`,
  ];
  return titles[Math.floor(Math.random() * titles.length)];
};

const generateDescriptionText = (idea) => {
  return `Join us for an exclusive ${idea.toLowerCase()} experience designed for enthusiasts and professionals alike.

What you'll get:
• In-depth learning and practical insights
• Networking with industry experts
• Hands-on activities and interactive sessions
• Certificates and lifetime community access
• Q&A sessions with experienced mentors

Perfect for skill development and building meaningful connections.`;
};

const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

const generateWithGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "GEMINI_API_KEY is missing" };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError = null;

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text()?.trim();

      if (text) {
        return { ok: true, text, model: modelName };
      }
    } catch (error) {
      lastError = error;
      console.error(`Gemini failed on model ${modelName}:`, error?.message || error);
    }
  }

  return {
    ok: false,
    error: lastError?.message || "Gemini generation failed",
  };
};

const formatProviderError = (errorText) => {
  if (!errorText) return "Provider unavailable";
  const firstLine = String(errorText).split("\n")[0] || "Provider unavailable";
  return firstLine.slice(0, 220);
};

const generateWithGroq = async (prompt) => {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return { ok: false, error: "GROQ_API_KEY is missing" };
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: "You are an event copywriter. Return concise, high-quality plain text only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error?.message || `Groq request failed with status ${response.status}`,
      };
    }

    if (!text) {
      return { ok: false, error: "Groq response contained no text" };
    }

    return { ok: true, text, model: "llama-3.1-8b-instant" };
  } catch (error) {
    return { ok: false, error: error?.message || "Groq generation failed" };
  }
};




// ================= TITLE =================
router.post("/generate-title", aiLimiter, validateAiIdeaBody, async (req, res) => {
  try {
    const { idea } = req.body;

    const prompt = `Generate one catchy event title in max 6 words for: ${idea}. Return only the title text.`;
    const geminiResult = await generateWithGemini(prompt);

    if (geminiResult.ok) {
      return res.json({
        success: true,
        title: geminiResult.text,
        source: "gemini",
        model: geminiResult.model,
      });
    }

    const groqResult = await generateWithGroq(prompt);
    if (groqResult.ok) {
      return res.json({
        success: true,
        title: groqResult.text,
        source: "groq",
        model: groqResult.model,
        warning: geminiResult.error,
      });
    }

    // deterministic free fallback when Gemini key is absent or provider fails
    const title = generateTitleText(idea);
    res.json({
      success: true,
      title,
      source: "template-fallback",
      warning: `Gemini: ${formatProviderError(geminiResult.error)}; Groq: ${formatProviderError(groqResult.error)}`,
    });

  } catch (err) {
    console.error("❌ TITLE ERROR:", err);
    res.json({
      success: true,
      title: generateTitleText(req.body.idea),
      source: "template-fallback",
      warning: err?.message || "Failed to generate title",
    });
  }
});




// ================= DESCRIPTION =================
router.post("/generate-description", aiLimiter, validateAiIdeaBody, async (req, res) => {
  try {
    const { idea } = req.body;

    const prompt = `Write a compelling event description (120-150 words) for: ${idea}. Keep it engaging and practical.`;
    const geminiResult = await generateWithGemini(prompt);

    if (geminiResult.ok) {
      return res.json({
        success: true,
        description: geminiResult.text,
        source: "gemini",
        model: geminiResult.model,
      });
    }

    const groqResult = await generateWithGroq(prompt);
    if (groqResult.ok) {
      return res.json({
        success: true,
        description: groqResult.text,
        source: "groq",
        model: groqResult.model,
        warning: geminiResult.error,
      });
    }

    // deterministic free fallback when Gemini key is absent or provider fails
    const description = generateDescriptionText(idea);
    res.json({
      success: true,
      description,
      source: "template-fallback",
      warning: `Gemini: ${formatProviderError(geminiResult.error)}; Groq: ${formatProviderError(groqResult.error)}`,
    });

  } catch (err) {
    console.error("❌ DESC ERROR:", err);
    res.json({
      success: true,
      description: generateDescriptionText(req.body.idea),
      source: "template-fallback",
      warning: err?.message || "Failed to generate description",
    });
  }
});

module.exports = router;