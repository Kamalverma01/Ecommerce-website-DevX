const express = require("express");

const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  listCategoryRequests,
  approveCategoryRequest,
  rejectCategoryRequest,
} = require("../../controllers/catalog/category-controller");
const { authMiddleware, requireAdmin } = require("../../controllers/auth/auth-controller");

const router = express.Router();

router.get("/", getCategories);
router.get("/requests", authMiddleware, requireAdmin, listCategoryRequests);
router.post("/", authMiddleware, requireAdmin, createCategory);
router.put("/requests/:id/approve", authMiddleware, requireAdmin, approveCategoryRequest);
router.put("/requests/:id/reject", authMiddleware, requireAdmin, rejectCategoryRequest);
router.put("/:id", authMiddleware, requireAdmin, updateCategory);
router.delete("/:id", authMiddleware, requireAdmin, deleteCategory);

module.exports = router;
