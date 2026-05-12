require("dotenv").config();

const http = require("http");
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");

// --- ROUTES ---
const authRouter = require("./routes/auth/auth-routes");
const adminProductsRouter = require("./routes/admin/products-routes");
const adminOrderRouter = require("./routes/admin/order-routes");
const adminSellerRouter = require("./routes/admin/seller-routes");
const adminDashboardRouter = require("./routes/admin/dashboard-routes");
const adminFinancialRouter = require("./routes/admin/financial-routes");
const adminCommissionRouter = require("./routes/admin/commission-routes");
const shopProductsRouter = require("./routes/shop/products-routes");
const shopCartRouter = require("./routes/shop/cart-routes");
const shopAddressRouter = require("./routes/shop/address-routes");
const shopOrderRouter = require("./routes/shop/order-routes");
const shopSearchRouter = require("./routes/shop/search-routes");
const shopReviewRouter = require("./routes/shop/review-routes");
const sellerRouter = require("./routes/seller/seller-routes");
const aiRouter = require("./routes/ai/ai-routes");
const commonFeatureRouter = require("./routes/common/feature-routes");
const categoryRouter = require("./routes/catalog/category-routes");
const brandRouter = require("./routes/catalog/brand-routes");
const chatRouter = require("./routes/shop/chat-routes");
const supportRouter = require("./routes/shop/support-routes");
const wishlistRouter = require("./routes/shop/wishlist-routes");
const couponRouter = require("./routes/shop/coupon-routes");
const alertRouter = require("./routes/shop/alert-routes");
const notificationRouter = require("./routes/shop/notification-routes");
const authExtensionRouter = require("./extensions/auth/routes/auth-extension-routes");
const marketplaceModule = require("./modules/marketplace");

const { notFound, errorHandler } = require("./middleware/error-handler");
const { setIo } = require("./utils/realtime");
const { verifyRazorpayWebhook } = require("./controllers/shop/order-controller");

const app = express();
const server = http.createServer(app);
const defaultClientOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
];
const clientOrigins = (process.env.CLIENT_URL || process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultClientOrigins, ...clientOrigins])];
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

setIo(io);

io.on("connection", (socket) => {
  socket.on("support:join", ({ userId, role }) => {
    if (userId) {
      socket.join(`user:${userId}`);
    }

    if (role === "admin") {
      socket.join("admins");
    }
  });

  socket.on("order:join", ({ orderId, userId, sellerId, role }) => {
    if (orderId) {
      socket.join(`order:${orderId}`);
    }

    if (userId) {
      socket.join(`user:${userId}`);
    }

    if (sellerId) {
      socket.join(`seller:${sellerId}`);
    }

    if (role === "admin") {
      socket.join("admins");
    }
  });
});

// --- AI CONFIG ---
const activeAiProvider = process.env.AI_PROVIDER
  ? String(process.env.AI_PROVIDER).toLowerCase()
  : process.env.GEMINI_API_KEY
  ? "gemini"
  : process.env.OPENAI_API_KEY
  ? "openai"
  : process.env.AI_API_KEY
  ? "gemini"
  : "none";

const activeAiModel =
  activeAiProvider === "gemini"
    ? process.env.GEMINI_MODEL || "gemini-2.5-flash"
    : activeAiProvider === "openai"
    ? process.env.OPENAI_MODEL || "gpt-4o-mini"
    : "none";

if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY && !process.env.AI_API_KEY) {
  console.log("WARNING: No AI API key found. Add AI_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY.");
} else {
  console.log(`AI provider: ${activeAiProvider} | model: ${activeAiModel}`);
}

// --- DATABASE ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.log("MongoDB Connection Error:", error));

// --- MIDDLEWARE ---
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Expires",
      "Pragma",
    ],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.post(
  "/api/shop/order/webhook",
  express.raw({ type: "application/json" }),
  verifyRazorpayWebhook
);
app.post(
  "/api/orders/webhook",
  express.raw({ type: "application/json" }),
  verifyRazorpayWebhook
);
app.use(express.json({ limit: "5mb" }));

// --- API ROUTES ---
app.use("/api/auth", authRouter);
app.use("/api/admin/products", adminProductsRouter);
app.use("/api/admin/orders", adminOrderRouter);
app.use("/api/admin/sellers", adminSellerRouter);
app.use("/api/admin/seller", adminSellerRouter);
app.use("/api/admin/dashboard", adminDashboardRouter);
app.use("/api/admin/financial", adminFinancialRouter);
app.use("/api/admin/commission", adminCommissionRouter);

app.use("/api/shop/products", shopProductsRouter);
app.use("/api/shop/cart", shopCartRouter);
app.use("/api/shop/address", shopAddressRouter);
app.use("/api/shop/order", shopOrderRouter);
app.use("/api/orders", shopOrderRouter);
app.use("/api/shop/search", shopSearchRouter);
app.use("/api/shop/review", shopReviewRouter);
app.use("/api/shop/wishlist", wishlistRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/ai", aiRouter);

app.use("/api/shop/chat", chatRouter);
app.use("/api/chat", chatRouter);

app.use("/api/support", supportRouter);
app.use("/api/alerts", alertRouter);
app.use("/api/notifications", notificationRouter);

app.use("/api/common/feature", commonFeatureRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/brands", brandRouter);
app.use("/api/coupon", couponRouter);
app.use("/api/auth-ext", authExtensionRouter);
app.use(marketplaceModule.mountPath, marketplaceModule.router);

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 5000);

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the other server process or set a different PORT in server/.env.`
    );
    process.exit(1);
  }

  console.error("Server error:", error);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const shutdown = (signal, shouldRethrowSignal = false) => {
  console.log(`${signal} received. Closing server...`);

  server.close(async () => {
    await mongoose.connection.close(false);

    if (shouldRethrowSignal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(0);
  });
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGUSR2", () => shutdown("SIGUSR2", true));
