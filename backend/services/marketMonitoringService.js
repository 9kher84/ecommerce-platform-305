const {
  MarketSilenceEvent,
  SellerInteractionEvent,
  PurchaseRequest,
  PriceQuote,
  sequelize,
} = require("../sequelize_setup");
const { Op } = require("sequelize");

class MarketMonitoringService {
  constructor() {
    this.SILENCE_THRESHOLD = process.env.MARKET_SILENCE_THRESHOLD || 1440; // 24 hours in minutes
  }

  // Record market silence event
  async recordMarketSilence(request) {
    try {
      const elapsedMs = new Date() - new Date(request.createdAt);
      const elapsedTime = Math.floor(elapsedMs / (1000 * 60)); // convert to minutes

      if (elapsedTime >= this.SILENCE_THRESHOLD) {
        const existingEvent = await MarketSilenceEvent.findOne({
          where: { requestId: request.id, status: "active" },
        });

        if (!existingEvent) {
          await MarketSilenceEvent.create({
            sectorId: request.sectorId,
            requestId: request.id,
            elapsedTime,
            silenceThreshold: this.SILENCE_THRESHOLD,
            status: "active",
          });

          console.log(
            `📊 [Market Monitoring] Silence event recorded for request ${request.id} in sector ${request.sectorId}`,
          );
        }
      }
    } catch (error) {
      console.error("Error recording market silence:", error.message);
      // Silent logging - do not bubble up
    }
  }

  // Record seller interaction event
  async recordSellerInteraction(
    sellerId,
    requestId,
    interactionType,
    metadata = {},
  ) {
    try {
      await SellerInteractionEvent.create({
        sellerId,
        requestId,
        interactionType,
        metadata,
        timestamp: new Date(),
      });

      console.log(
        `📊 [Market Monitoring] ${interactionType} interaction recorded for seller ${sellerId} on request ${requestId}`,
      );
    } catch (error) {
      console.error("Error recording seller interaction:", error.message);
      // Silent logging
    }
  }

  // Periodic check for stale requests (can be called from cron)
  async checkForSilentRequests() {
    try {
      const thresholdDate = new Date(
        Date.now() - this.SILENCE_THRESHOLD * 60 * 1000,
      );

      const silentRequests = await PurchaseRequest.findAll({
        where: {
          status: "published",
          createdAt: { [Op.lt]: thresholdDate },
        },
        include: [{ model: PriceQuote, as: "quotes", required: false }],
      });

      for (const request of silentRequests) {
        // If no quotes exist, it's a silence event
        if (!request.quotes || request.quotes.length === 0) {
          await this.recordMarketSilence(request);
        }
      }
    } catch (error) {
      console.error("Error checking for silent requests:", error.message);
    }
  }
}

module.exports = new MarketMonitoringService();
