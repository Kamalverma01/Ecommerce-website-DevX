// const express = require("express");
// const { chatWithAI } = require("../../controllers/shop/chat-controller");
// const router = express.Router();

// router.post("/", chatWithAI);

// module.exports = router;

const express = require("express");
const { chatWithAI } = require("../../controllers/shop/chat-controller");
const router = express.Router();

// Define both for flexibility
router.post("/", chatWithAI);
router.post("/send", chatWithAI);

module.exports = router;