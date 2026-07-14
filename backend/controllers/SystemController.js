const asyncHandler = require("express-async-handler");
const { interceptionMetrics } = require("./productController");

/**
 * @desc   Get shadow migration metrics for Catalog Reads
 * @route  GET /api/system/catalog-metrics
 * @access Private (Admin)
 */
exports.getCatalogMetrics = asyncHandler(async (req, res) => {
  const {
    legacy_requests,
    legacy_total_latency_ms,
    new_catalog_requests,
    new_total_latency_ms,
    fallback_requests,
    fallback_total_latency_ms,
    fallback_reasons
  } = interceptionMetrics;

  const legacy_average_latency_ms = legacy_requests > 0 ? Math.round(legacy_total_latency_ms / legacy_requests) : 0;
  const new_average_latency_ms = new_catalog_requests > 0 ? Math.round(new_total_latency_ms / new_catalog_requests) : 0;
  const fallback_average_latency_ms = fallback_requests > 0 ? Math.round(fallback_total_latency_ms / fallback_requests) : 0;

  res.status(200).json({
    mode: "canary",
    percentage: parseInt(process.env.CANARY_READ_PERCENTAGE || "0", 10),
    featureFlags: {
      reads: process.env.USE_NEW_CATALOG_READS === 'true',
      writes: process.env.USE_NEW_CATALOG_WRITES === 'true' // For future reference
    },
    metrics: {
      legacy_requests,
      legacy_average_latency_ms,
      new_catalog_requests,
      new_average_latency_ms,
      fallback_requests,
      fallback_average_latency_ms,
      fallback_reasons
    },
    note: "Metrics are stored in-memory and will reset on server restart."
  });
});
