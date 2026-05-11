const Brand = require("../../models/Brand");
const Product = require("../../models/Product");
const { imageUploadUtil } = require("../../helpers/cloudinary");
const slugify = require("../../utils/slugify");

const uploadBrandLogo = async (req, res) => {
  try {
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const url = `data:${req.file.mimetype};base64,${b64}`;
    const result = await imageUploadUtil(url);

    res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error uploading brand logo",
    });
  }
};

const createBrand = async (req, res) => {
  try {
    const { name, logo = "" } = req.body;
    const slug = slugify(name);

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Brand name is required",
      });
    }

    const brand = await Brand.create({ name, slug, logo });

    res.status(201).json({
      success: true,
      data: brand,
    });
  } catch (error) {
    const status = error.code === 11000 ? 409 : 500;
    res.status(status).json({
      success: false,
      message:
        error.code === 11000
          ? "Brand already exists"
          : error.message || "Error creating brand",
    });
  }
};

const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find({}).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching brands",
    });
  }
};

const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, logo = "" } = req.body;
    const slug = slugify(name);

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Brand name is required",
      });
    }

    const existingBrand = await Brand.findById(id);

    if (!existingBrand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    const oldSlug = existingBrand.slug;
    existingBrand.name = name;
    existingBrand.slug = slug;
    existingBrand.logo = logo;
    await existingBrand.save();

    if (oldSlug !== slug) {
      await Product.updateMany({ brand: oldSlug }, { $set: { brand: slug } });
    }

    res.status(200).json({
      success: true,
      data: existingBrand,
    });
  } catch (error) {
    const status = error.code === 11000 ? 409 : 500;
    res.status(status).json({
      success: false,
      message:
        error.code === 11000 ? "Brand already exists" : error.message || "Error updating brand",
    });
  }
};

const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findByIdAndDelete(id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    await Product.updateMany({ brand: brand.slug }, { $unset: { brand: "" } });

    res.status(200).json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting brand",
    });
  }
};

module.exports = {
  uploadBrandLogo,
  createBrand,
  getBrands,
  updateBrand,
  deleteBrand,
};
