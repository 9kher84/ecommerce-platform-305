const IOpportunityParser = require("../interfaces/IOpportunityParser");
const CommercialOpportunityDTO = require("../domain/CommercialOpportunityDTO");

class HeuristicParser extends IOpportunityParser {
  /**
   * @param {string} input 
   * @returns {Promise<CommercialOpportunityDTO>}
   */
  async parse(input) {
    if (!input || typeof input !== "string") {
      throw new Error("Input must be a valid string");
    }

    const lowerInput = input.toLowerCase();
    const data = {};

    // 1. Determine Type (Supply vs Demand)
    if (lowerInput.includes("عندي") || lowerInput.includes("للبيع") || lowerInput.includes("يوجد")) {
      data.type = "SUPPLY";
    } else if (lowerInput.includes("مطلوب") || lowerInput.includes("احتاج") || lowerInput.includes("أريد")) {
      data.type = "DEMAND";
    }

    // 2. Extract Price using simple regex
    const priceMatch = input.match(/(?:بـ|بسعر|سعر)\s*(\d+(?:\.\d+)?)/);
    if (priceMatch) {
      data.price = parseFloat(priceMatch[1]);
    }

    // 3. Extract Quantity
    const qtyMatch = input.match(/(\d+)\s*(حبة|طن|كيلو|قطعة|كرتون)/);
    if (qtyMatch) {
      data.quantity = parseInt(qtyMatch[1], 10);
      data.unit = qtyMatch[2];
    }

    // 4. Extract Name (fallback to the first few words if no clear product name)
    const lines = input.split("\n");
    const firstLine = lines[0].replace(/مطلوب|للبيع|عندي|احتاج|يوجد/g, "").trim();
    if (firstLine.length > 0) {
      data.name = firstLine;
    } else {
      data.name = "Unknown Opportunity";
    }

    return new CommercialOpportunityDTO(data);
  }
}

module.exports = HeuristicParser;
