const Category = require("../../models/Category");
const CategoryRequest = require("../../models/CategoryRequest");
const Product = require("../../models/Product");
const slugify = require("../../utils/slugify");

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const slug = slugify(name);

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const category = await Category.create({ name, slug });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    const status = error.code === 11000 ? 409 : 500;
    res.status(status).json({
      success: false,
      message:
        error.code === 11000
          ? "Category already exists"
          : error.message || "Error creating category",
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      Category.find({}).sort({ name: 1 }).skip(skip).limit(limit),
      Category.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching categories",
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const slug = slugify(name);

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const existingCategory = await Category.findById(id);

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const oldSlug = existingCategory.slug;
    existingCategory.name = name;
    existingCategory.slug = slug;
    await existingCategory.save();

    if (oldSlug !== slug) {
      await Product.updateMany({ category: oldSlug }, { $set: { category: slug } });
    }

    res.status(200).json({
      success: true,
      data: existingCategory,
    });
  } catch (error) {
    const status = error.code === 11000 ? 409 : 500;
    res.status(status).json({
      success: false,
      message:
        error.code === 11000
          ? "Category already exists"
          : error.message || "Error updating category",
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    await Product.updateMany({ category: category.slug }, { $unset: { category: "" } });

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting category",
    });
  }
};

const listCategoryRequests = async (req, res) => {
  try {
    const requests = await CategoryRequest.find({})
      .populate("sellerId", "userName email phone role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching category requests",
    });
  }
};

const approveCategoryRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote = "" } = req.body;
    const request = await CategoryRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Category request not found",
      });
    }

    const slug = slugify(request.name);
    let category = await Category.findOne({ slug });

    if (!category) {
      category = await Category.create({ name: request.name, slug });
    }

    request.status = "approved";
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    request.adminNote = String(adminNote).trim();
    await request.save();

    res.status(200).json({
      success: true,
      data: { request, category },
      message: "Category request approved",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error approving category request",
    });
  }
};

const rejectCategoryRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote = "" } = req.body;
    const request = await CategoryRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Category request not found",
      });
    }

    request.status = "rejected";
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    request.adminNote = String(adminNote).trim();
    await request.save();

    res.status(200).json({
      success: true,
      data: request,
      message: "Category request rejected",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error rejecting category request",
    });
  }
};

module.exports = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  listCategoryRequests,
  approveCategoryRequest,
  rejectCategoryRequest,
};
