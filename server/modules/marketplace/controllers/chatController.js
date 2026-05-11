const asyncHandler = require("../core/asyncHandler");
const { success } = require("../core/apiResponse");
const ChatThread = require("../models/ChatThread");

const sendMessage = asyncHandler(async (req, res) => {
  const thread = await ChatThread.findOneAndUpdate(
    { buyerId: req.body.buyerId, sellerId: req.body.sellerId, orderId: req.body.orderId || null },
    { $push: { messages: { senderId: req.user._id, body: req.body.body } } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return success(res, "Message sent.", { thread });
});

module.exports = { sendMessage };
