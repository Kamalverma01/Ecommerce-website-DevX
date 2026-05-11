const asyncHandler = require("../core/asyncHandler");
const { success } = require("../core/apiResponse");
const inventoryService = require("../services/inventoryService");
const sellerService = require("../services/sellerService");

function parseCsv(csv = "") {
  const [headerLine, ...lines] = String(csv).trim().split(/\r?\n/);
  const headers = headerLine.split(",").map((item) => item.trim());
  return lines
    .filter(Boolean)
    .map((line) => {
      const values = line.split(",").map((item) => item.trim());
      return headers.reduce((row, header, index) => ({ ...row, [header]: values[index] }), {});
    });
}

const bulkUpload = asyncHandler(async (req, res) => {
  const seller = await sellerService.getVerifiedSellerByUser(req.user._id);
  const rows = Array.isArray(req.body.rows) ? req.body.rows : parseCsv(req.body.csv);
  const result = await inventoryService.bulkUpsert(rows, seller);
  return success(res, "Inventory bulk upload processed.", {
    matchedCount: result.matchedCount || 0,
    modifiedCount: result.modifiedCount || 0,
  });
});

module.exports = { bulkUpload };
