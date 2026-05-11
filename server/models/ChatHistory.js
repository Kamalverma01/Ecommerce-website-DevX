const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const ChatHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      index: true,
      default: "guest",
    },
    messages: [ChatMessageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatHistory", ChatHistorySchema);
