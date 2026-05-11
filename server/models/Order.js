// const mongoose = require("mongoose");

// const OrderSchema = new mongoose.Schema({
//   userId: String,
//   cartId: String,
//   cartItems: [
//     {
//       productId: String,
//       title: String,
//       image: String,
//       price: String,
//       quantity: Number,
//     },
//   ],
//   addressInfo: {
//     addressId: String,
//     address: String,
//     city: String,
//     state: String, // Added this to match your new Address logic
//     pincode: String,
//     phone: String,
//     notes: String,
//   },
//   orderStatus: String,
//   paymentMethod: String,
//   paymentStatus: String,
//   totalAmount: Number,
//   orderDate: Date,
//   orderUpdateDate: Date,
  
//   // Razorpay Specific Fields
//   paymentId: String,       // razorpay_payment_id
//   razorpayOrderId: String, // razorpay_order_id
//   razorpaySignature: String, // razorpay_signature
  
//   payerId: String, // You can keep this for legacy or external reference
// });

// module.exports = mongoose.model("Order", OrderSchema);

const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  cartId: String,
  cartItems: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      sellerName: String,
      title: String,
      image: String,
      price: Number,
      quantity: Number,
      lineTotal: Number,
      commissionPercent: Number,
      commissionAmount: Number,
      sellerEarning: Number,
      platformProfit: Number,
    },
  ],
  addressInfo: {
    addressId: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    phone: String,
    notes: String,
  },
  orderStatus: {
    type: String,
    enum: [
      "placed",
      "pending",
      "processing",
      "confirmed",
      "packed",
      "shipped",
      "out_for_delivery",
      "delivered",
      "cancelled",
      "returned",
      "rejected",
      "under_review",
    ],
    default: "placed",
  },
  paymentMethod: {
    type: String,
    default: "cod",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending",
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
  orderTotal: {
    type: Number,
    default: 0,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  couponCode: {
    type: String,
    default: "",
  },
  giftCardCode: {
    type: String,
    default: "",
  },
  sellerTotals: [
    {
      sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      sellerName: String,
      itemsTotal: Number,
      sellerEarning: Number,
      commissionAmount: Number,
      platformProfit: Number,
      payoutStatus: {
        type: String,
        enum: ["pending", "paid", "held"],
        default: "pending",
      },
    },
  ],
  sellerOrders: [
    {
      sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      sellerName: String,
      items: [
        {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
          },
          title: String,
          image: String,
          price: Number,
          quantity: Number,
          lineTotal: Number,
          commissionPercent: Number,
          commissionAmount: Number,
          sellerEarning: Number,
          platformProfit: Number,
        },
      ],
      subtotal: {
        type: Number,
        default: 0,
      },
      commissionTotal: {
        type: Number,
        default: 0,
      },
      sellerEarningTotal: {
        type: Number,
        default: 0,
      },
      platformProfitTotal: {
        type: Number,
        default: 0,
      },
      orderStatus: {
        type: String,
        enum: ["pending", "processing", "shipped", "delivered", "cancelled", "returned", "rejected"],
        default: "processing",
      },
      deliveredAt: Date,
    },
  ],
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  orderUpdateDate: Date,
  deliveredAt: Date,
  trackingId: {
    type: String,
    default: "",
    trim: true,
    index: true,
  },
  deliveryOtp: {
    codeHash: {
      type: String,
      default: "",
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  statusTimeline: [
    {
      status: {
        type: String,
        required: true,
      },
      note: {
        type: String,
        default: "",
      },
      actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  paymentLogs: [
    {
      status: {
        type: String,
        required: true,
      },
      provider: {
        type: String,
        default: "",
      },
      reference: {
        type: String,
        default: "",
      },
      meta: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  refundLogs: [
    {
      status: {
        type: String,
        default: "requested",
      },
      amount: {
        type: Number,
        default: 0,
      },
      reference: {
        type: String,
        default: "",
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  paymentId: String,
  payerId: String,
  razorpayOrderId: String,
  razorpaySignature: String,
});

OrderSchema.pre("save", function (next) {
  if (this.totalAmount && !this.orderTotal) {
    this.orderTotal = this.totalAmount;
  }
  if (!this.totalAmount && this.orderTotal) {
    this.totalAmount = this.orderTotal;
  }
  next();
});

module.exports = mongoose.model("Order", OrderSchema);
