const {
  PurchaseRequest,
  PriceQuote,
  User,
  sequelize,
  Sequelize,
} = require("../sequelize_setup");
const DataTypes = Sequelize.DataTypes;
// 🔥 Sovereign Fix: Manual Import to break circular dependency
const Message = require("../models/Message")(sequelize, DataTypes);
// 🔥 Sovereign Fix: Manual Associations
Message.belongsTo(User, { foreignKey: "senderId", as: "sender" });
Message.belongsTo(User, { foreignKey: "receiverId", as: "receiver" });
Message.belongsTo(PurchaseRequest, { foreignKey: "requestId", as: "request" });

/**
 * Chat Handler for Socket.IO
 * Sovereign Rule: Only allow chat in deal_in_progress status
 */
class ChatHandler {
  constructor(io) {
    this.io = io;
  }

  /**
   * Initialize chat handlers
   */
  async initialize() {
    // 🔥 Sovereign Fix: Ensure Message table exists
    await Message.sync();

    this.io.on("connection", (socket) => {
      console.log(`🔌 User connected: ${socket.id}`);
      console.log("DEBUG: Message Model:", Message ? "DEFINED" : "UNDEFINED");
      console.log("DEBUG: User Model:", User ? "DEFINED" : "UNDEFINED");

      // Authenticate user from socket handshake
      const userId =
        socket.handshake.auth.userId || socket.handshake.query.userId;
      if (!userId) {
        console.error("❌ Unauthenticated socket connection");
        socket.disconnect();
        return;
      }

      socket.userId = userId;
      console.log(`✅ Authenticated socket for user: ${userId}`);

      // Join request room
      socket.on("join_request", async (data) => {
        await this.handleJoinRequest(socket, data);
      });

      // Send message
      socket.on("send_message", async (data) => {
        await this.handleSendMessage(socket, data);
      });

      // Mark as read
      socket.on("mark_read", async (data) => {
        await this.handleMarkRead(socket, data);
      });

      // Disconnect
      socket.on("disconnect", () => {
        console.log(`🔌 User disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Handle joining a request chat room
   */
  async handleJoinRequest(socket, { requestId }) {
    try {
      const userId = socket.userId;

      // 1. Fetch request
      const request = await PurchaseRequest.findByPk(requestId);
      if (!request) {
        socket.emit("error", { message: "Request not found" });
        return;
      }

      // 2. SOVEREIGN RULE: Only deal_in_progress allows chat
      if (request.status !== "deal_in_progress") {
        socket.emit("error", {
          message: `Chat is only available for requests in deal_in_progress status. Current status: ${request.status}`,
        });
        return;
      }

      // 3. Find accepted quote to identify seller
      const acceptedQuote = await PriceQuote.findOne({
        where: { purchaseRequestId: requestId, status: "accepted" },
      });

      if (!acceptedQuote) {
        socket.emit("error", {
          message: "No accepted quote found for this request",
        });
        return;
      }

      // 4. Verify user is either buyer or seller
      const isBuyer = request.userId === userId;
      const isSeller = acceptedQuote.sellerId === userId;

      if (!isBuyer && !isSeller) {
        socket.emit("error", {
          message: "Unauthorized: You are not part of this deal",
        });
        return;
      }

      // 5. Join room
      const roomName = `request_${requestId}`;
      socket.join(roomName);
      socket.currentRoom = roomName;
      socket.currentRequestId = requestId;

      console.log(`✅ User ${userId} joined room: ${roomName}`);

      // 6. Send chat history
      const messages = await Message.findAll({
        where: { requestId },
        include: [{ model: User, as: "sender", attributes: ["id", "name"] }],
        order: [["sentAt", "ASC"]],
        limit: 100,
      });

      socket.emit("joined_request", {
        requestId,
        messages: messages.map((m) => m.toJSON()),
      });
    } catch (error) {
      console.error("❌ Error joining request:", error);
      socket.emit("error", { message: "Failed to join request chat" });
    }
  }

  /**
   * Handle sending a message
   */
  async handleSendMessage(socket, { requestId, content }) {
    try {
      const senderId = socket.userId;

      if (!content || content.trim().length === 0) {
        socket.emit("error", { message: "Message content cannot be empty" });
        return;
      }

      // 1. Fetch request
      const request = await PurchaseRequest.findByPk(requestId);
      if (!request) {
        socket.emit("error", { message: "Request not found" });
        return;
      }

      // 2. SOVEREIGN RULE: Only deal_in_progress allows chat
      if (request.status !== "deal_in_progress") {
        socket.emit("error", {
          message: `Cannot send message. Request status must be deal_in_progress. Current: ${request.status}`,
        });
        return;
      }

      // 3. Find accepted quote
      const acceptedQuote = await PriceQuote.findOne({
        where: { purchaseRequestId: requestId, status: "accepted" },
      });

      if (!acceptedQuote) {
        socket.emit("error", { message: "No accepted quote found" });
        return;
      }

      // 4. Determine receiver
      const isBuyer = request.userId === senderId;
      const isSeller = acceptedQuote.sellerId === senderId;

      if (!isBuyer && !isSeller) {
        socket.emit("error", { message: "Unauthorized" });
        return;
      }

      const receiverId = isBuyer ? acceptedQuote.sellerId : request.userId;

      // 5. Save message to DB (Data First principle)
      const message = await Message.create({
        requestId,
        senderId,
        receiverId,
        content: content.trim(),
        isRead: false,
        sentAt: new Date(),
      });

      // 6. Fetch sender info
      const sender = await User.findByPk(senderId, {
        attributes: ["id", "name"],
      });

      const messageData = {
        ...message.toJSON(),
        sender: sender.toJSON(),
      };

      // 7. Broadcast to room
      const roomName = `request_${requestId}`;
      this.io.to(roomName).emit("new_message", messageData);

      console.log(`📨 Message sent in ${roomName} by ${senderId}`);
    } catch (error) {
      console.error("❌ Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  }

  /**
   * Handle marking messages as read
   */
  async handleMarkRead(socket, { requestId }) {
    try {
      const userId = socket.userId;

      await Message.update(
        { isRead: true },
        {
          where: {
            requestId,
            receiverId: userId,
            isRead: false,
          },
        },
      );

      console.log(
        `✅ Messages marked as read for user ${userId} in request ${requestId}`,
      );
    } catch (error) {
      console.error("❌ Error marking messages as read:", error);
    }
  }
}

module.exports = ChatHandler;
