/**
 * NotificationService
 *
 * Manages real-time notifications via Socket.IO
 */
const { Notification } = require("../sequelize_setup");

class NotificationService {
  constructor() {
    this.io = null;
  }

  /**
   * Initialize Socket.IO instance
   * @param {Object} io - Socket.IO server instance
   */
  init(io) {
    this.io = io;
    console.log("✅ NotificationService initialized with Socket.IO");

    this.io.on("connection", (socket) => {
      console.log(`🔌 New client connected: ${socket.id}`);

      // Join user to their own room based on user ID (sent via query or auth)
      // Example: client connects with ?userId=123
      const userId = socket.handshake.query.userId;
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`👤 User ${userId} joined room user:${userId}`);
      }

      socket.on("disconnect", () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Send notification to a specific user (DB + Socket)
   * @param {string} userId - Target user ID
   * @param {string} type - Notification type (e.g., 'NEW_SECTOR_REQUEST')
   * @param {Object} data - Notification payload { title, message, ... }
   */
  async sendToUser(userId, type, data) {
    try {
      // 1. Persistence (DB)
      const notification = await Notification.create({
        userId,
        type,
        title: data.title || "Notification",
        message: data.message || "",
        data: data.data || {}, // Store metadata separately from title/message
        isRead: false,
      });

      // 2. Real-time (Socket)
      if (this.io) {
        this.io.to(`user:${userId}`).emit("notification", {
          ...notification.toJSON(),
          // Ensure consistency
        });
        console.log(`📢 Notification stored & sent to user ${userId}: ${type}`);
      } else {
        console.warn(
          "⚠️ Socket.IO not initialized, but notification saved to DB.",
        );
      }
    } catch (error) {
      console.error(
        `❌ Failed to send notification to user ${userId}:`,
        error.message,
      );
      // Non-blocking: Function typically called in fire-and-forget manner
    }
  }

  /**
   * Send notification to all admins
   * @param {string} type
   * @param {Object} data
   */
  sendToAdmins(type, data) {
    if (!this.io) return;
    this.io.to("admins").emit("admin_notification", {
      type,
      timestamp: new Date(),
      data,
    });
  }
}

module.exports = new NotificationService();
