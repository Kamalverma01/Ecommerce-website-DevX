const express = require("express");
const authController = require("./controllers/authController");
const sellerController = require("./controllers/sellerController");
const productController = require("./controllers/productController");
const catalogController = require("./controllers/catalogController");
const orderController = require("./controllers/orderController");
const financeController = require("./controllers/financeController");
const fraudController = require("./controllers/fraudController");
const couponController = require("./controllers/couponController");
const reviewController = require("./controllers/reviewController");
const analyticsController = require("./controllers/analyticsController");
const recommendationController = require("./controllers/recommendationController");
const returnController = require("./controllers/returnController");
const invoiceController = require("./controllers/invoiceController");
const chatController = require("./controllers/chatController");
const inventoryController = require("./controllers/inventoryController");
const subscriptionController = require("./controllers/subscriptionController");
const profileController = require("./controllers/profileController");
const { authenticate, requireRoles } = require("./middleware/auth");
const { uploadProductImages, uploadBrandLogo } = require("./middleware/upload");
const { marketplaceRateLimit, apiLogger, requireBody } = require("./middleware/security");

const router = express.Router();
router.use(apiLogger);
router.use(marketplaceRateLimit);

router.post("/auth/register", requireBody(["userName", "email", "phone", "password"]), authController.register);
router.post("/auth/login", requireBody(["email", "password"]), authController.login);
router.post("/auth/refresh", authController.refresh);
router.post("/auth/otp/request", authController.requestOtp);
router.post("/auth/otp/verify", authController.verifyOtp);
router.get("/profile/me", authenticate, profileController.me);
router.put("/profile/me", authenticate, profileController.updateMe);
router.post("/profile/logout", authenticate, profileController.logout);

router.post("/sellers/register", sellerController.register);
router.get("/admin/sellers", authenticate, requireRoles("admin", "super_admin"), sellerController.adminList);
router.get("/admin/sellers/:sellerId", authenticate, requireRoles("admin", "super_admin"), sellerController.adminDetail);
router.post("/admin/sellers/:sellerId/approve", authenticate, requireRoles("admin", "super_admin"), sellerController.approve);
router.post("/admin/sellers/:sellerId/reject", authenticate, requireRoles("admin", "super_admin"), sellerController.reject);
router.get("/seller/wallet", authenticate, requireRoles("seller"), sellerController.wallet);
router.post("/seller/wallet/withdraw", authenticate, requireRoles("seller"), sellerController.withdraw);
router.get("/seller/orders", authenticate, requireRoles("seller"), sellerController.orders);

router.post("/admin/categories", authenticate, requireRoles("admin", "super_admin"), catalogController.createCategory);
router.post("/seller/category-requests", authenticate, requireRoles("seller"), catalogController.requestCategory);
router.patch("/admin/category-requests/:requestId", authenticate, requireRoles("admin", "super_admin"), catalogController.decideCategoryRequest);
router.post("/seller/brands", authenticate, requireRoles("seller"), uploadBrandLogo, catalogController.createBrand);

router.post("/seller/products", authenticate, requireRoles("seller"), uploadProductImages, productController.create);
router.patch("/seller/products/:productId", authenticate, requireRoles("seller"), productController.update);
router.delete("/seller/products/:productId", authenticate, requireRoles("seller"), productController.remove);
router.post("/seller/inventory/bulk", authenticate, requireRoles("seller"), inventoryController.bulkUpload);
router.post("/seller/subscription", authenticate, requireRoles("seller"), subscriptionController.updatePlan);
router.get("/products", productController.search);

router.post("/orders", authenticate, requireRoles("customer", "user"), orderController.place);
router.get("/admin/orders", authenticate, requireRoles("admin", "super_admin"), orderController.adminList);
router.patch("/orders/:orderId/status", authenticate, requireRoles("admin", "super_admin", "seller"), orderController.updateStatus);
router.post("/orders/:orderId/delivery-otp", orderController.verifyDeliveryOtp);

router.get("/admin/commission", authenticate, requireRoles("admin", "super_admin"), financeController.commissionSummary);
router.post("/payments/:orderId/intent", authenticate, financeController.createPaymentIntent);
router.post("/payments/capture", authenticate, financeController.markPaid);
router.post("/payments/refund", authenticate, requireRoles("admin", "super_admin"), financeController.refund);

router.get("/admin/fraud", authenticate, requireRoles("admin", "super_admin"), fraudController.list);
router.post("/admin/fraud/sellers/:sellerId/flag", authenticate, requireRoles("admin", "super_admin"), fraudController.flagSeller);

router.post("/coupons", authenticate, requireRoles("admin", "super_admin", "seller"), couponController.create);
router.post("/coupons/apply", authenticate, couponController.apply);

router.post("/reviews", authenticate, requireRoles("customer", "user"), reviewController.create);
router.get("/admin/analytics", authenticate, requireRoles("admin", "super_admin"), analyticsController.admin);
router.get("/seller/analytics", authenticate, requireRoles("seller"), analyticsController.seller);

router.get("/recommendations/trending", recommendationController.trending);
router.get("/recommendations/also-bought/:productId", recommendationController.alsoBought);

router.post("/returns", authenticate, requireRoles("customer", "user"), returnController.requestReturn);
router.post("/admin/returns/:returnId/approve", authenticate, requireRoles("admin", "super_admin"), returnController.approveReturn);
router.post("/invoices/:orderId", authenticate, requireRoles("admin", "super_admin", "seller"), invoiceController.generate);

router.post("/chat/messages", authenticate, chatController.sendMessage);

module.exports = router;
