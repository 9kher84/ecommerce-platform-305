const {
  MarketSilenceEvent,
  PurchaseRequest,
  PriceQuote,
} = require("../sequelize_setup");
const { Op } = require("sequelize");

async function checkMarketSilence() {
  console.log("🔍 Checking for market silence events...");

  // Custom threshold or default (24 hours)
  const SILENCE_THRESHOLD =
    parseInt(process.env.MARKET_SILENCE_THRESHOLD) || 1440;
  const thresholdDate = new Date(Date.now() - SILENCE_THRESHOLD * 60 * 1000);

  const silentRequests = await PurchaseRequest.findAll({
    where: {
      status: "published",
      createdAt: { [Op.lt]: thresholdDate },
    },
    include: [{ model: PriceQuote, as: "quotes", required: false }],
  });

  console.log(
    `Found ${silentRequests.length} candidate requests published before ${thresholdDate.toISOString()}`,
  );

  let recordedCount = 0;

  for (const request of silentRequests) {
    // If no quotes exist, it's a candidate for silence event
    if (!request.quotes || request.quotes.length === 0) {
      const existing = await MarketSilenceEvent.findOne({
        where: { requestId: request.id, status: "active" },
      });

      if (!existing) {
        await MarketSilenceEvent.create({
          sectorId: request.sectorId,
          requestId: request.id,
          elapsedTime: Math.floor(
            (new Date() - new Date(request.createdAt)) / (1000 * 60),
          ),
          silenceThreshold: SILENCE_THRESHOLD,
          status: "active",
          notes: "Auto-detected by Market Silence Watchdog",
        });
        recordedCount++;
      }
    }
  }

  console.log(`✅ Recorded ${recordedCount} new market silence events`);
}

checkMarketSilence()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Watchdog failed:", err);
    process.exit(1);
  });
