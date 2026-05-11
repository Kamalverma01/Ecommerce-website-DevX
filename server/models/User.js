const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    default: "",
  },
  mustChangePassword: {
    type: Boolean,
    default: false,
  },
  temporaryPasswordIssuedAt: {
    type: Date,
    default: null,
  },
  role: {
    type: String,
    enum: ["user", "seller", "super_admin", "admin"],
    default: "user",
  },
  authProvider: {
    type: String,
    enum: ["email", "google", "phone"],
    default: "email",
  },
  firebaseUid: {
    type: String,
    default: "",
    index: true,
  },
  googleId: {
    type: String,
    default: "",
    index: true,
  },
  address: {
    type: String,
    default: "",
    trim: true,
  },
  profileImage: {
    type: String,
    default: "",
    trim: true,
  },
  recentlyViewedProducts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  walletBalance: {
    type: Number,
    default: 0,
  },
  profileMeta: {
    gender: {
      type: String,
      default: "",
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    supportContact: {
      type: String,
      default: "",
      trim: true,
    },
  },
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);
module.exports = User;
