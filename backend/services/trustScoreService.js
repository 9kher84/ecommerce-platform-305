const { TrustScore, Deal, PurchaseRequest } = require("../sequelize_setup");
const { Op } = require("sequelize");

async function updateTrustScore(userId) {
  // احسب metrics من قاعدة البيانات
  const totalCompletedDeals = await Deal.count({
    where: { sellerId: userId, status: "completed" },
  });
  const totalDeals = await Deal.count({ where: { sellerId: userId } });
  const completionRate =
    totalDeals > 0 ? (totalCompletedDeals / totalDeals) * 100 : 0;

  const cancelledRequests = await PurchaseRequest.count({
    where: { userId, status: "cancelled" },
  });
  const totalRequests = await PurchaseRequest.count({ where: { userId } });
  const cancellationRate =
    totalRequests > 0 ? (cancelledRequests / totalRequests) * 100 : 0;

  // responseTimeAvg simplified as 0 for now unless there's a clear metric
  const responseTimeAvg = 0;

  // reliability_index = (completion_rate * 0.5) + ((100 - cancellation_rate) * 0.3) + (max(0, (60 - response_time_avg)/60)*0.2)
  const reliabilityIndex =
    completionRate * 0.5 +
    (100 - cancellationRate) * 0.3 +
    Math.max(0, (60 - responseTimeAvg) / 60) * 0.2;

  // قم بتخزين النتيجة
  const [trustScore, created] = await TrustScore.findOrCreate({
    where: { userId },
    defaults: {
      reliabilityIndex,
      completionRate,
      cancellationRate,
      responseTimeAvg,
      lastUpdated: new Date(),
    },
  });

  if (!created) {
    await trustScore.update({
      reliabilityIndex,
      completionRate,
      cancellationRate,
      responseTimeAvg,
      lastUpdated: new Date(),
    });
  }

  // Apply auto sanctions based on Trust Score
  const { applySanction } = require("./sanctionService");
  if (reliabilityIndex < 30) {
    await applySanction(
      userId,
      "shadow_restriction",
      "Reliability Index dropped below 30",
      7 * 24 * 60,
    ); // 7 days in minutes
  }
  if (cancellationRate > 50) {
    await applySanction(
      userId,
      "temporary_suspension",
      "Cancellation Rate exceeded 50%",
      3 * 24 * 60,
    ); // 3 days in minutes
  }
}

async function getTrustScore(userId) {
  const score = await TrustScore.findOne({ where: { userId } });
  return score || null;
}

module.exports = { updateTrustScore, getTrustScore };
