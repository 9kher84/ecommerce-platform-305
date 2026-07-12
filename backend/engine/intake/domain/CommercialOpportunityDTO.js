class CommercialOpportunityDTO {
  constructor(data = {}) {
    this.type = data.type || null; // 'SUPPLY' | 'DEMAND'
    this.assetTypeCode = data.assetTypeCode || null;
    this.name = data.name || null;
    this.quantity = data.quantity || null;
    this.unit = data.unit || null;
    this.price = data.price || null;
    this.currency = data.currency || 'SAR';
    this.location = data.location || null;
    this.metadata = data.metadata || {};
  }
}

module.exports = CommercialOpportunityDTO;
