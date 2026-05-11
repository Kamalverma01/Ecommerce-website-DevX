const Product = require("../../models/Product");

const searchProducts = async (req, res) => {
  try {
    const { keyword } = req.params;

    if (!keyword || !keyword.trim()) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Case-insensitive regex
    const regEx = new RegExp(keyword, "i");

    // Strictly searching only in the title field
    const searchResults = await Product.find({
      title: regEx 
    }).limit(20);

    res.status(200).json({
      success: true,
      data: searchResults,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error occurred while searching",
    });
  }
};

module.exports = { searchProducts };