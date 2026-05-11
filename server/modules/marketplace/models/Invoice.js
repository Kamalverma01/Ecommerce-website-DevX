const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceOrder", required: true, unique: true },
    invoiceNumber: { type: String, required: true, unique: true },
    gstAmount: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    pdfUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.MarketplaceInvoice ||
  mongoose.model("MarketplaceInvoice", InvoiceSchema, "marketplace_invoices");
