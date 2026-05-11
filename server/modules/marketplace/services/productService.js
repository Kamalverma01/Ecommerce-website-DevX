const Product = require("../models/Product");
const Brand = require("../models/Brand");
const CategoryRequest = require("../models/CategoryRequest");
const Subscription = require("../models/Subscription");
const { uploadImage, uploadImages } = require("./cloudinaryService");
const sellerService = require("./sellerService");

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function assertProductLimit(sellerId) {
  const subscription = await Subscription.findOne({ sellerId, status: "active" });
  const count = await Product.countDocuments({ sellerId });
  if (subscription && count >= subscription.productLimit) {
    throw new Error(`Product limit reached for ${subscription.plan} plan.`);
  }
}

async function createProduct({ userId, body, files }) {
  const seller = await sellerService.getVerifiedSellerByUser(userId);
  await assertProductLimit(seller._id);

  const images = files?.length ? await uploadImages(files) : body.images || [];
  const product = await Product.create({
    sellerId: seller._id,
    sellerUserId: userId,
    sellerBusinessName: seller.businessName,
    name: body.name,
    title: body.name,
    description: body.description,
    category: body.category,
    brand: body.brand,
    images,
    price: body.price,
    salePrice: body.salePrice || 0,
    stock: body.stock,
    lowStockThreshold: body.lowStockThreshold || 5,
    commissionRate: seller.commissionOverride || body.commissionRate || process.env.GLOBAL_COMMISSION_PERCENTAGE || 10,
    status: body.status || "active",
  });

  return product;
}

async function createBrand({ userId, body, file }) {
  const seller = await sellerService.getVerifiedSellerByUser(userId);
  const logo = file ? await uploadImage(file, "marketplace/brands") : body.logo || "";
  return Brand.create({
    sellerId: seller._id,
    name: body.name,
    slug: slugify(body.name),
    logo,
  });
}

async function requestCategory({ userId, body }) {
  const seller = await sellerService.getVerifiedSellerByUser(userId);
  return CategoryRequest.create({ sellerId: seller._id, name: body.name, reason: body.reason });
}

async function search(query) {
  const filter = { status: "active" };
  if (query.q) filter.$text = { $search: query.q };
  if (query.category) filter.category = query.category;
  if (query.rating) filter.averageRating = { $gte: Number(query.rating) };
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  const sort =
    query.sort === "newest"
      ? { createdAt: -1 }
      : query.sort === "price_asc"
      ? { price: 1 }
      : query.sort === "price_desc"
      ? { price: -1 }
      : { popularityScore: -1 };

  return Product.find(filter).sort(sort).limit(Math.min(Number(query.limit || 24), 100));
}

module.exports = { createProduct, createBrand, requestCategory, search };
