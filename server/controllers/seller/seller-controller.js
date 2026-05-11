const Seller = require("../../models/Seller");
const Product = require("../../models/Product");
const Order = require("../../models/Order");
const User = require("../../models/User");
const Transaction = require("../../models/Transaction");
const OrderItem = require("../../models/OrderItem");
const Brand = require("../../models/Brand");
const Category = require("../../models/Category");
const CategoryRequest = require("../../models/CategoryRequest");
const { imageUploadUtil } = require("../../helpers/cloudinary");
const { normalizeOrderStatus } = require("../../utils/order-status");
const { getPlatformSetting } = require("../../utils/platform-settings");
const { emitOrderUpdate } = require("../../utils/realtime");
const slugify = require("../../utils/slugify");
const validator = require("validator");

const SELLER_ITEM_STATUS = ["processing", "shipped", "delivered"];

function isNonEmptyText(value, max = 500) {
  return typeof value === "string" && validator.isLength(value.trim(), { min: 1, max });
}

async function uploadFiles(files = []) {
  const uploads = files.map((file) => {
    const b64 = Buffer.from(file.buffer).toString("base64");
    const url = `data:${file.mimetype};base64,${b64}`;
    return imageUploadUtil(url);
  });

  return Promise.all(uploads);
}

const applySeller = async (req, res) => {
  try {
    const {
      businessName,
      phone,
      address,
      businessType = "",
      supportEmail = "",
      gstNumber = "",
      pickupPincode = "",
      productCategories = [],
    } = req.body;
    const userId = req.user.id;

    const normalizedPhone = String(phone || "").replace(/\D/g, "");
    if (
      !isNonEmptyText(businessName, 120) ||
      !isNonEmptyText(address, 500) ||
      !validator.isLength(normalizedPhone, { min: 7, max: 15 })
    ) {
      return res.status(400).json({ success: false, message: "All onboarding fields are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Authenticated user not found" });
    }

    const existing = await Seller.findOne({ userId });

    if (existing && existing.status === "approved") {
      return res.status(400).json({ success: false, message: "You are already an approved seller" });
    }

    const application = await Seller.findOneAndUpdate(
      { userId },
      {
        userId,
        businessName: businessName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        businessType: String(businessType).trim(),
        supportEmail: String(supportEmail).trim().toLowerCase(),
        gstNumber: String(gstNumber).trim().toUpperCase(),
        pickupPincode: String(pickupPincode).trim(),
        productCategories: Array.isArray(productCategories)
          ? productCategories.map((category) => String(category).trim()).filter(Boolean)
          : String(productCategories)
              .split(",")
              .map((category) => category.trim())
              .filter(Boolean),
        status: "pending",
        approvedAt: null,
        rejectedAt: null,
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({ success: true, data: application });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to submit seller application" });
  }
};

const getMyApplication = async (req, res) => {
  try {
    const application = await Seller.findOne({ userId: req.user.id });
    if (!application) {
      return res.status(404).json({ success: false, message: "No seller application found" });
    }

    return res.status(200).json({ success: true, data: application });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to load seller application" });
  }
};

const getSellerProducts = async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.user.id });
    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to fetch seller products" });
  }
};

const uploadSellerProductImages = async (req, res) => {
  try {
    const files = req.files || [];
    if (files.length < 1 || files.length > 4) {
      return res.status(400).json({
        success: false,
        message: "Upload between 1 and 4 product images",
      });
    }

    const results = await uploadFiles(files);
    return res.status(200).json({
      success: true,
      data: results.map((result) => result.secure_url || result.url),
      result: results,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to upload product images" });
  }
};

const uploadSellerBrandLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Brand logo is required" });
    }

    const [result] = await uploadFiles([req.file]);
    return res.status(200).json({
      success: true,
      data: result.secure_url || result.url,
      result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to upload brand logo" });
  }
};

const getSellerBrands = async (req, res) => {
  try {
    const brands = await Brand.find({ sellerId: req.user.id }).sort({ name: 1 });
    return res.status(200).json({ success: true, data: brands });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to fetch seller brands" });
  }
};

const createSellerBrand = async (req, res) => {
  try {
    const { name, logo = "" } = req.body;
    const slug = slugify(name);

    if (!slug) {
      return res.status(400).json({ success: false, message: "Brand name is required" });
    }

    const seller = await Seller.findOne({ userId: req.user.id, status: "approved" });
    if (!seller) {
      return res.status(403).json({ success: false, message: "Only approved sellers can create brands" });
    }

    const brand = await Brand.create({
      name: name.trim(),
      slug,
      logo,
      sellerId: req.user.id,
      sellerBusinessName: seller.businessName,
      ownerRole: "seller",
    });

    return res.status(201).json({ success: true, data: brand });
  } catch (error) {
    const status = error.code === 11000 ? 409 : 500;
    return res.status(status).json({
      success: false,
      message: error.code === 11000 ? "Brand already exists" : "Unable to create seller brand",
    });
  }
};

const requestSellerCategory = async (req, res) => {
  try {
    const { name, reason = "" } = req.body;
    const slug = slugify(name);

    if (!slug) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return res.status(409).json({ success: false, message: "Category already exists" });
    }

    const seller = await Seller.findOne({ userId: req.user.id, status: "approved" });
    if (!seller) {
      return res.status(403).json({ success: false, message: "Only approved sellers can request categories" });
    }

    const request = await CategoryRequest.create({
      sellerId: req.user.id,
      sellerBusinessName: seller.businessName,
      name: name.trim(),
      reason: String(reason).trim(),
    });

    return res.status(201).json({ success: true, data: request });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to request category" });
  }
};

const addSellerProduct = async (req, res) => {
  try {
    const { title, name, description, images, category, brand, price, totalStock, salePrice } = req.body;
    const productName = String(name || title || "").trim();

    if (
      !isNonEmptyText(productName, 160) ||
      !isNonEmptyText(description, 5000) ||
      !isNonEmptyText(category, 120) ||
      !isNonEmptyText(brand, 120) ||
      !validator.isFloat(String(price), { min: 0 }) ||
      !validator.isInt(String(totalStock), { min: 0 })
    ) {
      return res.status(400).json({ success: false, message: "Product name, description, category, brand, price and stock are required" });
    }

    const seller = await Seller.findOne({ userId: req.user.id, status: "approved" });
    if (!seller) {
      return res.status(403).json({ success: false, message: "Only approved sellers can add products" });
    }

    const imageList = Array.isArray(images) ? images.filter(Boolean) : images ? [images] : [];
    if (imageList.length < 3 || imageList.length > 4) {
      return res.status(400).json({ success: false, message: "Add 3 to 4 product images" });
    }

    const categoryExists = await Category.findOne({ slug: category });
    if (!categoryExists) {
      return res.status(400).json({ success: false, message: "Select an admin-created category" });
    }

    const brandExists = await Brand.findOne({ slug: brand, sellerId: req.user.id });
    if (!brandExists) {
      return res.status(400).json({ success: false, message: "Select one of your seller brands" });
    }

    const commissionPercent = seller.commissionOverride ?? (await getPlatformSetting("globalCommissionPercent", 10));

    const product = new Product({
      title: productName,
      name: productName,
      description: description.trim(),
      images: imageList,
      image: imageList[0] || "",
      category: category.trim(),
      brand: brand.trim(),
      price: Number(price),
      salePrice: Number(salePrice) || 0,
      totalStock: Number(totalStock),
      averageReview: 0,
      sellerId: req.user.id,
      sellerName: seller.businessName || req.user.userName || "Seller",
      businessName: seller.businessName || req.user.userName || "Seller",
      status: "active",
      commissionPercent,
    });

    await product.save();
    return res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to create seller product" });
  }
};

const editSellerProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await Product.findOne({ _id: id, sellerId: req.user.id });
    if (!product) {
      return res.status(404).json({ success: false, message: "Seller product not found" });
    }

    const allowedFields = ["title", "description", "images", "category", "price", "salePrice", "totalStock", "status", "commissionPercent"];
    allowedFields.forEach((field) => {
      if (typeof updates[field] !== "undefined") {
        product[field] = updates[field];
      }
    });

    if (updates.images) {
      product.images = Array.isArray(updates.images) ? updates.images : [updates.images];
      product.image = product.images[0] || product.image;
    }

    await product.save();
    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to update seller product" });
  }
};

const deleteSellerProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOneAndDelete({ _id: id, sellerId: req.user.id });
    if (!product) {
      return res.status(404).json({ success: false, message: "Seller product not found" });
    }

    return res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to delete seller product" });
  }
};

const getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ "sellerOrders.sellerId": req.user.id }).sort({ orderDate: -1 });
    const mapped = orders.map((order) => {
      const sellerOrder = order.sellerOrders.filter((item) => String(item.sellerId) === String(req.user.id));
      return {
        _id: order._id,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        orderDate: order.orderDate,
        sellerOrders: sellerOrder,
        addressInfo: order.addressInfo,
      };
    });

    return res.status(200).json({ success: true, data: mapped });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to fetch seller orders" });
  }
};

const updateSellerOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { sellerOrderId, orderStatus } = req.body;
    const normalizedStatus = normalizeOrderStatus(orderStatus);
    if (!SELLER_ITEM_STATUS.includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: "Invalid seller order status" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const sellerOrder = order.sellerOrders.id(sellerOrderId);
    if (!sellerOrder || String(sellerOrder.sellerId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "You are not authorized for this seller order" });
    }

    sellerOrder.orderStatus = normalizedStatus;
    await OrderItem.updateMany(
      { orderId: order._id, sellerId: req.user.id },
      { orderStatus: normalizedStatus }
    );
    if (normalizedStatus === "delivered") {
      sellerOrder.deliveredAt = new Date();
    }

    const allDelivered = order.sellerOrders.every((item) => item.orderStatus === "delivered");
    if (allDelivered) {
      order.orderStatus = "delivered";
      order.deliveredAt = new Date();
    } else if (order.orderStatus === "pending") {
      order.orderStatus = "processing";
    }

    await order.save();
    emitOrderUpdate(order);
    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to update seller order status" });
  }
};

const getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const products = await Product.find({ sellerId });
    const orders = await Order.find({ "sellerOrders.sellerId": sellerId });

    const statistics = {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue: 0,
      totalCommission: 0,
      totalSellerEarning: 0,
      totalPlatformProfit: 0,
      topProducts: [],
      salesByDay: {},
      salesByMonth: {},
    };

    const productSales = {};
    orders.forEach((order) => {
      order.sellerOrders
        .filter((item) => String(item.sellerId) === String(sellerId))
        .forEach((sellerOrder) => {
          statistics.totalRevenue += sellerOrder.subtotal || 0;
          statistics.totalCommission += sellerOrder.commissionTotal || 0;
          statistics.totalSellerEarning += sellerOrder.sellerEarningTotal || 0;
          statistics.totalPlatformProfit += sellerOrder.platformProfitTotal || 0;

          sellerOrder.items.forEach((item) => {
            productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
          });

          const dateKey = new Date(order.orderDate).toISOString().slice(0, 10);
          statistics.salesByDay[dateKey] = (statistics.salesByDay[dateKey] || 0) + (sellerOrder.subtotal || 0);
          const monthKey = new Date(order.orderDate).toISOString().slice(0, 7);
          statistics.salesByMonth[monthKey] = (statistics.salesByMonth[monthKey] || 0) + (sellerOrder.subtotal || 0);
        });
    });

    statistics.topProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productId, quantity]) => ({ productId, quantity }));

    return res.status(200).json({ success: true, data: statistics });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to fetch seller dashboard" });
  }
};

module.exports = {
  applySeller,
  getMyApplication,
  getSellerProducts,
  uploadSellerProductImages,
  uploadSellerBrandLogo,
  getSellerBrands,
  createSellerBrand,
  requestSellerCategory,
  addSellerProduct,
  editSellerProduct,
  deleteSellerProduct,
  getSellerOrders,
  updateSellerOrderStatus,
  getSellerDashboard,
};
