const { GoogleGenAI } = require("@google/genai");
const User = require("../../models/User");
const Order = require("../../models/Order");
const ChatHistory = require("../../models/ChatHistory");
const SupportTicket = require("../../models/SupportTicket");

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function getConfiguredProvider() {
  const requestedProvider = String(process.env.AI_PROVIDER || "").toLowerCase();

  if (requestedProvider === "gemini" && process.env.GEMINI_API_KEY) {
    return "gemini";
  }

  if (requestedProvider === "openai" && process.env.OPENAI_API_KEY) {
    return "openai";
  }

  if (process.env.GEMINI_API_KEY) {
    return "gemini";
  }

  if (process.env.OPENAI_API_KEY) {
    return "openai";
  }

  return null;
}

function buildSystemPrompt({ userName, orderHistory, ticketHistory }) {
  return `
You are the official AI support assistant for Panjab Sports Club.
User Name: ${userName}
Order History: ${orderHistory}
Support Tickets: ${ticketHistory}

Help users with:
- Order tracking
- Return and refund policy
- Product details
- Payment issues
- Delivery time

Rules:
- Greet the user naturally and helpfully.
- Keep answers concise, clear, and practical.
- If the user asks about orders or tracking, use the real order context above.
- If they ask about returns or cancellations, use the support ticket context above.
- If they want to create a cancel or return request and do not already have one, tell them they can use the support actions in order details or the support chat flow.
- Never mention competitors.
- Keep the tone sporty, calm, and professional.
- If a support ticket is pending, reassure them it is under review.
- If a support ticket is approved or rejected, direct them to the Support Tracker in their account page for the official response.
`.trim();
}

async function buildUserContext(userId) {
  const [user, orders, tickets] = await Promise.all([
    userId && userId !== "guest"
      ? User.findById(userId).select("userName").lean()
      : null,
    userId && userId !== "guest"
      ? Order.find({ userId }).sort({ createdAt: -1 }).limit(3).lean()
      : [],
    userId && userId !== "guest"
      ? SupportTicket.find({ userId }).sort({ createdAt: -1 }).limit(2).lean()
      : [],
  ]);

  const userName = user?.userName || "Valued Customer";

  const orderHistory = orders.length
    ? orders
        .map((order) => {
          const items =
            order.cartItems?.map((item) => item.title).join(", ") || "Items";
          return `Order ID: ${order._id}, Items: ${items}, Status: ${
            order.orderStatus || "pending"
          }`;
        })
        .join(" | ")
    : "No recent orders.";

  const ticketHistory = tickets.length
    ? tickets
        .map(
          (ticket) =>
            `${ticket.type} request for Order ${ticket.orderId} is ${ticket.status}`
        )
        .join(" | ")
    : "No active support tickets.";

  return {
    userName,
    orderHistory,
    ticketHistory,
  };
}

async function getGeminiResponse(message, context) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const candidateModels = [
    GEMINI_MODEL,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
  ].filter((value, index, list) => value && list.indexOf(value) === index);

  let lastError = null;

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: message,
        config: {
          systemInstruction: buildSystemPrompt(context),
        },
      });

      return {
        text: response.text || "",
        model: modelName,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Gemini request failed");
}

async function getOpenAIResponse(message, context) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.3,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(context),
        },
        {
          role: "user",
          content: message,
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "OpenAI request failed");
  }

  return data?.choices?.[0]?.message?.content?.trim() || "";
}

async function saveChatHistory(userId, message, answer) {
  if (!userId) return;

  await ChatHistory.findOneAndUpdate(
    { userId: userId || "guest" },
    {
      $push: {
        messages: {
          $each: [
            { role: "user", content: message },
            { role: "assistant", content: answer },
          ],
          $slice: -30,
        },
      },
    },
    { upsert: true }
  );
}

const chatWithAI = async (req, res) => {
  try {
    const { message, userId } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const provider = getConfiguredProvider();

    if (!provider) {
      return res.status(500).json({
        success: false,
        message: "No AI provider configured. Add GEMINI_API_KEY or OPENAI_API_KEY.",
      });
    }

    const context = await buildUserContext(userId);

    const geminiResponseOrText =
      provider === "gemini"
        ? await getGeminiResponse(message, context)
        : await getOpenAIResponse(message, context);

    const answer =
      provider === "gemini"
        ? geminiResponseOrText.text
        : geminiResponseOrText;
    const usedModel =
      provider === "gemini"
        ? geminiResponseOrText.model
        : OPENAI_MODEL;

    await saveChatHistory(userId, message, answer);

    res.status(200).json({
      success: true,
      data: answer,
      provider,
      model: usedModel,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    res.status(500).json({
      success: false,
      message: "AI is warming up, try again!",
    });
  }
};

module.exports = { chatWithAI };
