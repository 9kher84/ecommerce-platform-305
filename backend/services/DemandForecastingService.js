/**
 * 📈 Sovereign Demand Forecasting Service - V3 ULTRA-LIGHTWEIGHT
 * Optimized for performance (< 50ms) and low memory footprint.
 */
class DemandForecastingService {
  /**
   * Calculate Predicted Demand for the next day
   * USES SLICING TO AVOID O(N) OVER ENTIRE HISTORY
   */
  static predictDemand(history) {
    if (!history || history.length === 0) return 0;

    // 1. Efficiently slice the last 7 entries (O(1) relative to total history size)
    const recentHistory = history.slice(-7);
    if (recentHistory.length === 0) return 0;

    // 2. Simple arithmetic mean (highly efficient)
    const sum = recentHistory.reduce(
      (acc, entry) => acc + (entry.quantity || 0),
      0,
    );
    const average = sum / recentHistory.length;

    return Math.ceil(average);
  }

  /**
   * Calculate Reorder Point with fixed complexity
   */
  static calculateReorderPoint(history, leadTimeDays = 3) {
    const avgDemand = this.predictDemand(history); // Uses optimized predictDemand
    if (avgDemand === 0) return 5;

    const safetyStock = Math.ceil(avgDemand * 0.5 * leadTimeDays);
    return avgDemand * leadTimeDays + safetyStock;
  }
}

module.exports = DemandForecastingService;
