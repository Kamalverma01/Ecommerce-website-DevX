const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["admin", "seller", "customer", "super_admin", "user"],
      default: "customer",
      index: true,
    },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    blockReason: { type: String, default: "" },
    refreshTokenHash: { type: String, default: "", select: false },
    lastLoginIp: { type: String, default: "" },
    deviceFingerprints: [{ type: String }],
    fraud: {
      returnRate: { type: Number, default: 0 },
      codOrdersToday: { type: Number, default: 0 },
      codWindowStartedAt: { type: Date, default: null },
      riskScore: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1, role: 1 });

module.exports =
  mongoose.models.MarketplaceUser || mongoose.model("MarketplaceUser", UserSchema, "marketplace_users");
