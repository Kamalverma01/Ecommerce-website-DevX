const Alert = require("../../models/Alert");

const createAlert = async (req, res) => {
  try {
    const { title, message, targetUserId, targetRole = "all" } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Title and message are required" });
    }

    const alert = await Alert.create({
      title,
      message,
      targetUserId: targetUserId || null,
      targetRole: targetUserId ? "all" : targetRole,
    });

    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error creating alert" });
  }
};

const getUserAlerts = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role === "customer" ? "user" : req.user?.role;
    const alerts = await Alert.find({
      $or: [
        { targetUserId: userId },
        { targetUserId: null, targetRole: { $in: ["all", role, req.user?.role] } },
      ],
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: alerts.map((alert) => ({
        ...alert.toObject(),
        isRead: alert.readBy.some((id) => id.toString() === userId),
      })),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error fetching alerts" });
  }
};

const markAlertAsRead = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.alertId,
      { $addToSet: { readBy: req.user.id } },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }

    res.status(200).json({ success: true, data: alert });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error updating alert" });
  }
};

module.exports = { createAlert, getUserAlerts, markAlertAsRead };
