const Order = require("../../models/Order");
const SupportTicket = require("../../models/SupportTicket");
const User = require("../../models/User");
const {
  sendTicketCreatedNotifications,
  sendTicketStatusNotifications,
} = require("../../helpers/notifications");
const { emitSupportUpdate } = require("../../utils/realtime");
const { normalizeOrderStatus } = require("../../utils/order-status");

function normalizeStatus(order = {}) {
  return normalizeOrderStatus(order.orderStatus || order.status || "");
}

function normalizeDate(value) {
  return value ? new Date(value) : null;
}

function getEligibility(order, type) {
  const status = normalizeStatus(order);
  const deliveredAt = normalizeDate(order.deliveredAt || order.orderUpdateDate);
  const now = new Date();

  if (type === "cancel") {
    const allowed = ["pending", "processing", "confirmed"].includes(status);
    return {
      allowed,
      reason: allowed
        ? ""
        : 'Request not allowed. Cancellation is only available while the order is pending or processing.',
    };
  }

  if (type === "return") {
    const withinWindow =
      deliveredAt && now.getTime() - deliveredAt.getTime() <= 4 * 24 * 60 * 60 * 1000;
    const allowed = status === "delivered" && withinWindow;

    return {
      allowed,
      reason: allowed
        ? ""
        : 'Request not allowed. Returns are available only within 4 days after delivery.',
    };
  }

  return { allowed: true, reason: "" };
}

async function createTicket(req, res) {
  try {
    const userId = req.user?.id || req.body.userId;
    const { orderId, type, message } = req.body;

    if (!userId || !orderId || !type || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "userId, orderId, type and message are required",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (String(order.userId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only create tickets for your own orders",
      });
    }

    const allowedTypes = ["cancel", "return", "modify"];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket type",
      });
    }

    const eligibility = getEligibility(order, type);

    if (!eligibility.allowed) {
      return res.status(400).json({
        success: false,
        message: eligibility.reason,
      });
    }

    const existingPendingTicket = await SupportTicket.findOne({
      userId,
      orderId,
      type,
      status: "pending",
    });

    if (existingPendingTicket) {
      return res.status(409).json({
        success: false,
        message: "A pending request already exists for this order",
      });
    }

    const ticket = await SupportTicket.create({
      userId,
      orderId,
      type,
      message: message.trim(),
    });

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate("userId", "userName email")
      .populate("orderId");

    const user = await User.findById(userId);
    if (user) {
      await sendTicketCreatedNotifications({ user, ticket, order });
    }

    emitSupportUpdate(String(userId), {
      action: "created",
      ticket: populatedTicket,
    });

    res.status(201).json({
      success: true,
      data: populatedTicket,
      message: "Support ticket created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to create support ticket",
    });
  }
}

async function getMyTickets(req, res) {
  try {
    const userId = req.user?.id || req.params.userId;
    const tickets = await SupportTicket.find({ userId })
      .populate("orderId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      tickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user tickets",
    });
  }
}

async function getAllTickets(req, res) {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const tickets = await SupportTicket.find(filter)
      .populate("userId", "userName email")
      .populate("orderId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      tickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching support tickets",
    });
  }
}

async function updateTicket(req, res) {
  try {
    const { id } = req.params;
    const { status, adminResponse = "", orderUpdate } = req.body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket status",
      });
    }

    ticket.status = status;
    ticket.adminResponse = adminResponse.trim();
    await ticket.save();

    const order = await Order.findById(ticket.orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Associated order not found",
      });
    }

    if (status === "approved") {
      order.orderStatus =
        orderUpdate || (ticket.type === "cancel" ? "cancelled" : "returned");
      order.orderUpdateDate = new Date();
      await order.save();
    }

    const user = await User.findById(ticket.userId);
    if (user) {
      await sendTicketStatusNotifications({ user, ticket, order });
    }

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate("userId", "userName email")
      .populate("orderId");

    emitSupportUpdate(String(ticket.userId), {
      action: "updated",
      ticket: populatedTicket,
    });

    res.status(200).json({
      success: true,
      ticket: populatedTicket,
      message: "Support ticket updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to update support ticket",
    });
  }
}

module.exports = {
  createTicket,
  getMyTickets,
  getAllTickets,
  updateTicket,
  getEligibility,
};
