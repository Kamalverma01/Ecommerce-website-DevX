const Notification = require("../../models/Notification");

const listMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(100);
    return res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    return res.status(200).json({ success: true, data: notification });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Failed to update notification" });
  }
};

const createNotification = async (req, res) => {
  try {
    const { userId, eventType, title, message, channel = "in_app", metadata = {} } = req.body;

    if (!userId || !eventType || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "userId, eventType, title and message are required",
      });
    }

    const notification = await Notification.create({
      userId,
      eventType,
      title,
      message,
      channel,
      metadata,
    });
    return res.status(201).json({ success: true, data: notification });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Failed to create notification" });
  }
};

module.exports = {
  listMyNotifications,
  markNotificationRead,
  createNotification,
};
