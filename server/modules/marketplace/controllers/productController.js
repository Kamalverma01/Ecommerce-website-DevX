const asyncHandler = require("../core/asyncHandler");
const { success } = require("../core/apiResponse");
const productService = require("../services/productService");
const Product = require("../models/Product");

const create = asyncHandler(async (req, res) => {
  const product = await productService.createProduct({ userId: req.user._id, body: req.body, files: req.files });
  return success(res, "Product created.", { product }, 201);
});

const update = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.productId },
    req.body,
    { new: true, runValidators: true }
  );
  return success(res, "Product updated.", { product });
});

const remove = asyncHandler(async (req, res) => {
  await Product.findByIdAndUpdate(req.params.productId, { status: "inactive" });
  return success(res, "Product deactivated.");
});

const search = asyncHandler(async (req, res) => {
  const products = await productService.search(req.query);
  return success(res, "Products fetched.", { products });
});

module.exports = { create, update, remove, search };
