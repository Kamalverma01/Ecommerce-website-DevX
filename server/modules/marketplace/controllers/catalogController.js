const asyncHandler = require("../core/asyncHandler");
const { success } = require("../core/apiResponse");
const Category = require("../models/Category");
const CategoryRequest = require("../models/CategoryRequest");
const productService = require("../services/productService");

function slugify(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create({ ...req.body, slug: slugify(req.body.name), createdBy: req.user._id });
  return success(res, "Category created.", { category }, 201);
});

const requestCategory = asyncHandler(async (req, res) => {
  const request = await productService.requestCategory({ userId: req.user._id, body: req.body });
  return success(res, "Category request submitted.", { request }, 201);
});

const decideCategoryRequest = asyncHandler(async (req, res) => {
  const request = await CategoryRequest.findByIdAndUpdate(
    req.params.requestId,
    { status: req.body.status, adminNote: req.body.adminNote || "" },
    { new: true }
  );
  return success(res, "Category request updated.", { request });
});

const createBrand = asyncHandler(async (req, res) => {
  const brand = await productService.createBrand({ userId: req.user._id, body: req.body, file: req.file });
  return success(res, "Brand created.", { brand }, 201);
});

module.exports = { createCategory, requestCategory, decideCategoryRequest, createBrand };
