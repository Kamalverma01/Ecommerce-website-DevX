const asyncHandler = require("../core/asyncHandler");
const { success } = require("../core/apiResponse");
const sellerService = require("../services/sellerService");
const Seller = require("../models/Seller");
const Wallet = require("../models/Wallet");
const Order = require("../models/Order");
const Commission = require("../models/Commission");
const Notification = require("../models/Notification");
const AppSeller = require("../../../models/Seller");
const AppOrder = require("../../../models/Order");
const AppProduct = require("../../../models/Product");

const register = asyncHandler(async (req, res) => {
  const data = await sellerService.registerSeller(req.body);
  return success(res, "Seller application submitted for admin approval.", data, 201);
});

const approve = asyncHandler(async (req, res) => {
  let seller = await sellerService.approveSeller(req.params.sellerId, req.body.note).catch(() => null);
  if (!seller) {
    seller = await AppSeller.findByIdAndUpdate(
      req.params.sellerId,
      { status: "approved", approvedAt: new Date(), notes: req.body.note || "" },
      { new: true }
    );
  }
  return success(res, "Seller approved.", { seller });
});

const reject = asyncHandler(async (req, res) => {
  let seller = await sellerService.rejectSeller(req.params.sellerId, req.body.note).catch(() => null);
  if (!seller) {
    seller = await AppSeller.findByIdAndUpdate(
      req.params.sellerId,
      { status: "rejected", rejectedAt: new Date(), notes: req.body.note || "" },
      { new: true }
    );
  }
  return success(res, "Seller rejected.", { seller });
});

const wallet = asyncHandler(async (req, res) => {
  const seller = await sellerService.getVerifiedSellerByUser(req.user._id);
  const walletDoc = await Wallet.findOne({ sellerId: seller._id });
  return success(res, "Seller wallet fetched.", { wallet: walletDoc });
});

const withdraw = asyncHandler(async (req, res) => {
  const seller = await sellerService.getVerifiedSellerByUser(req.user._id);
  const amount = Number(req.body.amount || 0);

  if (!amount || amount <= 0) {
    throw new Error("Withdrawal amount must be greater than zero.");
  }

  const walletDoc = await Wallet.findOne({ sellerId: seller._id });
  if (!walletDoc) {
    throw new Error("Seller wallet not found.");
  }

  if (walletDoc.isFrozen) {
    throw new Error("Wallet is frozen. Withdrawal cannot be requested.");
  }

  if (walletDoc.availableBalance < amount) {
    throw new Error("Insufficient available balance.");
  }

  walletDoc.availableBalance -= amount;
  walletDoc.frozenBalance += amount;
  await walletDoc.save();

  const request = await Notification.create({
    userId: req.user._id,
    sellerId: seller._id,
    channel: "in_app",
    type: "wallet_withdrawal_request",
    title: "Wallet withdrawal requested",
    body: `Withdrawal request for Rs. ${amount.toLocaleString("en-IN")} is queued for admin review.`,
    metadata: {
      amount,
      method: req.body.method || "bank",
      reference: req.body.reference || "",
      status: "pending",
    },
  });

  return success(res, "Withdrawal request submitted.", { wallet: walletDoc, request }, 201);
});

const orders = asyncHandler(async (req, res) => {
  const seller = await sellerService.getVerifiedSellerByUser(req.user._id);
  const sellerOrders = await Order.find({ sellerIds: seller._id }).sort({ createdAt: -1 });
  return success(res, "Seller orders fetched.", { orders: sellerOrders });
});

const adminList = asyncHandler(async (req, res) => {
  const appSellers = await AppSeller.find()
    .populate("userId", "userName email phone role emailVerified phoneVerified createdAt")
    .sort({ createdAt: -1 });
  const appSellerUserIds = appSellers.map((seller) => seller.userId?._id).filter(Boolean);

  const [appOrders, appProducts] = await Promise.all([
    AppOrder.find({ "sellerTotals.sellerId": { $in: appSellerUserIds } }),
    AppProduct.find({ sellerId: { $in: appSellerUserIds } }),
  ]);

  const appData = appSellers.map((seller) => {
    const sellerUserId = String(seller.userId?._id || "");
    const sellerOrders = appOrders.filter((order) =>
      order.sellerTotals?.some((total) => String(total.sellerId) === sellerUserId)
    );
    const totals = sellerOrders.flatMap((order) =>
      (order.sellerTotals || []).filter((total) => String(total.sellerId) === sellerUserId)
    );
    const totalRevenue = totals.reduce((sum, total) => sum + Number(total.itemsTotal || 0), 0);
    const totalCommission = totals.reduce((sum, total) => sum + Number(total.commissionAmount || 0), 0);
    const availableBalance = totals
      .filter((total) => total.payoutStatus !== "paid")
      .reduce((sum, total) => sum + Number(total.sellerEarning || 0), 0);
    const productCount = appProducts.filter((product) => String(product.sellerId) === sellerUserId).length;

    return {
      source: "existing",
      seller,
      user: seller.userId,
      wallet: {
        totalEarnings: totalRevenue - totalCommission,
        commissionDeducted: totalCommission,
        availableBalance,
      },
      commission: {
        pending: { total: totalCommission, count: totals.length },
        earned: { total: totalCommission, count: totals.length },
        reversed: { total: 0, count: 0 },
        paid: { total: 0, count: 0 },
      },
      totalOrders: sellerOrders.length,
      productCount,
    };
  });

  const sellers = await Seller.find()
    .populate("userId", "userName email phone role emailVerified phoneVerified createdAt")
    .sort({ createdAt: -1 });
  const sellerIds = sellers.map((seller) => seller._id);

  const [wallets, commissions, orderCounts] = await Promise.all([
    Wallet.find({ sellerId: { $in: sellerIds } }),
    Commission.aggregate([
      { $match: { sellerId: { $in: sellerIds } } },
      {
        $group: {
          _id: { sellerId: "$sellerId", status: "$status" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      { $unwind: "$sellerIds" },
      { $match: { sellerIds: { $in: sellerIds } } },
      { $group: { _id: "$sellerIds", totalOrders: { $sum: 1 } } },
    ]),
  ]);

  const walletBySeller = new Map(wallets.map((walletDoc) => [String(walletDoc.sellerId), walletDoc]));
  const ordersBySeller = new Map(orderCounts.map((row) => [String(row._id), row.totalOrders]));
  const commissionBySeller = commissions.reduce((map, row) => {
    const sellerId = String(row._id.sellerId);
    const current = map.get(sellerId) || {};
    current[row._id.status] = { total: row.total, count: row.count };
    map.set(sellerId, current);
    return map;
  }, new Map());

  const data = sellers.map((seller) => ({
    source: "marketplace",
    seller,
    user: seller.userId,
    wallet: walletBySeller.get(String(seller._id)) || null,
    commission: commissionBySeller.get(String(seller._id)) || {},
    totalOrders: ordersBySeller.get(String(seller._id)) || 0,
  }));

  return success(res, "Seller details fetched.", { sellers: [...appData, ...data] });
});

const adminDetail = asyncHandler(async (req, res) => {
  const appSeller = await AppSeller.findById(req.params.sellerId).populate(
    "userId",
    "userName email phone role emailVerified phoneVerified createdAt"
  );

  if (appSeller) {
    const sellerUserId = appSeller.userId?._id;
    const [orders, products] = await Promise.all([
      AppOrder.find({ "sellerTotals.sellerId": sellerUserId }).sort({ createdAt: -1 }).limit(50),
      AppProduct.find({ sellerId: sellerUserId }).sort({ createdAt: -1 }).limit(50),
    ]);
    const totals = orders.flatMap((order) =>
      (order.sellerTotals || []).filter((total) => String(total.sellerId) === String(sellerUserId))
    );
    const totalCommission = totals.reduce((sum, total) => sum + Number(total.commissionAmount || 0), 0);
    const totalEarnings = totals.reduce((sum, total) => sum + Number(total.sellerEarning || 0), 0);

    return success(res, "Seller detail fetched.", {
      source: "existing",
      seller: appSeller,
      user: appSeller.userId,
      wallet: {
        totalEarnings,
        commissionDeducted: totalCommission,
        availableBalance: totalEarnings,
      },
      commissions: totals,
      orders,
      products,
    });
  }

  const seller = await Seller.findById(req.params.sellerId).populate(
    "userId",
    "userName email phone role emailVerified phoneVerified createdAt"
  );
  const [walletDoc, commissions, orders] = await Promise.all([
    Wallet.findOne({ sellerId: req.params.sellerId }),
    Commission.find({ sellerId: req.params.sellerId }).sort({ createdAt: -1 }).limit(50),
    Order.find({ sellerIds: req.params.sellerId }).sort({ createdAt: -1 }).limit(50),
  ]);

  return success(res, "Seller detail fetched.", {
    seller,
    user: seller?.userId || null,
    wallet: walletDoc,
    commissions,
    orders,
  });
});

module.exports = { register, approve, reject, wallet, withdraw, orders, adminList, adminDetail };
