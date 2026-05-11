const express = require("express");
const {
  generateDescription,
  getRecommendations,
  analyzeReviewSentiment,
  chat,
} = require("../../controllers/ai/ai-controller");

const router = express.Router();

router.post("/description", generateDescription);
router.post("/generate-description", generateDescription);
router.get("/recommendations", getRecommendations);
router.post("/review/sentiment", analyzeReviewSentiment);
router.post("/sentiment", analyzeReviewSentiment);
router.post("/chat", chat);

module.exports = router;
