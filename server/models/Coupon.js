const mongoose = require("mongoose");

const CouponSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true,
    trim: true 
  },
  discount: { 
    type: Number, 
    required: true 
  },
  expiry: { 
    type: Date, 
    required: true 
  },
  usageLimit: { 
    type: Number, 
    default: 1 
  },
  usedBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }],
}, { timestamps: true });

module.exports = mongoose.model("Coupon", CouponSchema);