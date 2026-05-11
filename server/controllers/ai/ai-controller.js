const { GoogleGenAI } = require("@google/genai");
const Product = require("../../models/Product");
const Order = require("../../models/Order");
const User = require("../../models/User");

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function getAiProvider() {
  const provider = String(process.env.AI_PROVIDER || "").toLowerCase();
  if (provider === "gemini" && (process.env.GEMINI_API_KEY || process.env.AI_API_KEY)) return "gemini";
  if (provider === "openai" && (process.env.OPENAI_API_KEY || process.env.AI_API_KEY)) return "openai";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.AI_API_KEY) return provider === "openai" ? "openai" : "gemini";
  return null;
}

async function getGeminiCompletion(prompt, systemInstruction) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      systemInstruction,
      temperature: 0.45,
      maxOutputTokens: 256,
    },
  });

  return response?.text || "";
}

async function getOpenAICompletion(prompt, systemInstruction) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.45,
      max_tokens: 256,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "OpenAI request failed");
  }

  return data?.choices?.[0]?.message?.content || "";
}

function buildDescriptionPrompt(productName) {
  return `Generate a professional SEO-friendly marketplace product description for a seller listing called \"${productName}\". Keep it concise, highlight key benefits, and include relevant shopping keywords.`;
}

function buildSentimentPrompt(text) {
  return `Classify the sentiment of the following user review text as positive, neutral, or negative. Return only one word: positive, neutral, or negative.\n\nReview: ${text}`;
}

async function generateDescription(req, res) {
  try {
    const { productName } = req.body;
    if (!productName) {
      return res.status(400).json({ success: false, message: "Product name is required" });
    }

    const provider = getAiProvider();
    if (!provider) {
      return res.status(500).json({ success: false, message: "No AI provider configured" });
    }

    const prompt = buildDescriptionPrompt(productName);
    const systemInstruction = "You are a marketplace product description assistant.";

    const description =
      provider === "gemini"
        ? await getGeminiCompletion(prompt, systemInstruction)
        : await getOpenAICompletion(prompt, systemInstruction);

    return res.status(200).json({ success: true, data: description.trim() });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "AI description generation failed" });
  }
}

async function getRecommendations(req, res) {
  try {
    const { userId } = req.query;
    const recentOrders = userId ? await Order.find({ userId }).sort({ createdAt: -1 }).limit(3) : [];
    const recentCategories = recentOrders
      .flatMap((order) => order.cartItems?.map((item) => item.category || item.title))
      .filter(Boolean);

    const products = await Product.find({ status: "active" }).limit(50);
    const scored = products.map((product) => {
      const score = recentCategories.reduce((sum, category) => {
        return sum + (String(product.category).toLowerCase().includes(String(category).toLowerCase()) ? 1 : 0);
      }, 0);
      return { product, score };
    });

    scored.sort((a, b) => b.score - a.score || b.product._id.toString().localeCompare(a.product._id.toString()));

    return res.status(200).json({
      success: true,
      data: scored.slice(0, 12).map((item) => item.product),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to fetch recommendations" });
  }
}

async function analyzeReviewSentiment(req, res) {
  try {
    const { reviewText } = req.body;
    if (!reviewText) {
      return res.status(400).json({ success: false, message: "Review text is required" });
    }

    const provider = getAiProvider();
    if (!provider) {
      const normalized = String(reviewText).toLowerCase();
      const positive = ["good", "great", "excellent", "love", "perfect", "best"].some((term) => normalized.includes(term));
      const negative = ["bad", "poor", "worst", "terrible", "disappoint", "return"].some((term) => normalized.includes(term));
      const sentiment = positive ? "positive" : negative ? "negative" : "neutral";
      return res.status(200).json({ success: true, data: sentiment });
    }

    const prompt = buildSentimentPrompt(reviewText);
    const systemInstruction = "You are a sentiment classification assistant. Respond with positive, neutral, or negative.";
    const classification =
      provider === "gemini"
        ? await getGeminiCompletion(prompt, systemInstruction)
        : await getOpenAICompletion(prompt, systemInstruction);

    const sentiment = String(classification || "neutral").trim().toLowerCase();

    return res.status(200).json({ success: true, data: sentiment });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Sentiment analysis failed" });
  }
}

async function chat(req, res) {
  try {
    const { message, messages } = req.body;
    const latestMessage =
      message ||
      (Array.isArray(messages) && messages.length
        ? messages[messages.length - 1]?.content || messages[messages.length - 1]?.message
        : "");

    if (!latestMessage) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const provider = getAiProvider();
    if (!provider) {
      return res.status(500).json({ success: false, message: "No AI provider configured" });
    }

    const systemInstruction =
      "You are a concise e-commerce shopping assistant. Help users compare products, understand order flow, and choose relevant items.";
    const reply =
      provider === "gemini"
        ? await getGeminiCompletion(latestMessage, systemInstruction)
        : await getOpenAICompletion(latestMessage, systemInstruction);

    return res.status(200).json({ success: true, data: reply.trim() });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "AI chat failed" });
  }
}

module.exports = {
  generateDescription,
  getRecommendations,
  analyzeReviewSentiment,
  chat,
};
