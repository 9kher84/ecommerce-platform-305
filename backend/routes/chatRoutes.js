const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  Message,
  PurchaseRequest,
  PriceQuote,
  User,
} = require("../sequelize_setup");

/**
 * GET /api/chat/:requestId
 * Retrieve chat history for a request
 */
router.get("/:requestId", protect, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    // 1. Verify request exists
    const request = await PurchaseRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: { message: "Request not found" },
      });
    }

    // 2. SOVEREIGN RULE: Only deal_in_progress allows chat
    if (request.status !== "deal_in_progress") {
      return res.status(403).json({
        success: false,
        error: {
          message: `Chat is only available for requests in deal_in_progress status. Current: ${request.status}`,
        },
      });
    }

    // 3. Find accepted quote
    const acceptedQuote = await PriceQuote.findOne({
      where: { purchaseRequestId: requestId, status: "accepted" },
    });

    if (!acceptedQuote) {
      return res.status(404).json({
        success: false,
        error: { message: "No accepted quote found" },
      });
    }

    // 4. Verify user is authorized (buyer or seller)
    const isBuyer = request.userId === userId;
    const isSeller = acceptedQuote.sellerId === userId;

    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        success: false,
        error: { message: "Unauthorized: You are not part of this deal" },
      });
    }

    // 5. Fetch messages
    const messages = await Message.findAll({
      where: { requestId },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name"],
        },
        {
          model: User,
          as: "receiver",
          attributes: ["id", "name"],
        },
      ],
      order: [["sentAt", "ASC"]],
      limit: 200,
    });

    // 6. Mark messages as read
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

    res.status(200).json({
      success: true,
      data: {
        requestId,
        status: request.status,
        messages: messages.map((m) => m.toJSON()),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching chat history:", error);
    res.status(500).json({
      success: false,
      error: { message: "Failed to fetch chat history" },
    });
  }
});

module.exports = router;
