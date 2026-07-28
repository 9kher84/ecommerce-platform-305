const EventBus = require('./EventBus');
const AwardCreationPolicy = require('../../../modules/sales/application/policies/AwardCreationPolicy');
const EscrowInitializationPolicy = require('../../../modules/escrow/application/policies/EscrowInitializationPolicy');
const PaymentInitializationPolicy = require('../../../modules/payments/application/policies/PaymentInitializationPolicy');
const FundEscrowPolicy = require('../../../modules/escrow/application/policies/FundEscrowPolicy');
const NotifySectorSellersPolicy = require('../../../modules/procurement/application/policies/NotifySectorSellersPolicy');
const WorkPackageCreationPolicy = require('../../../modules/sales/application/policies/WorkPackageCreationPolicy');

class PolicyRegistry {
  /**
   * Bootstraps all policies and binds them to the EventBus.
   * This decoupled file ensures the EventBus itself remains unaware of business domains.
   */
  static registerAll() {
    // Procurement Domain Policies
    EventBus.subscribe("RequestPublishedEvent", async (event) => {
      await NotifySectorSellersPolicy(event); // It's wrapped directly
      await WorkPackageCreationPolicy(event);
    });

    // Sales Domain Policies
    EventBus.subscribe("QuotationAcceptedEvent", async (event) => {
      await AwardCreationPolicy.handle(event);
    });

    EventBus.subscribe("AwardConfirmedEvent", async (event) => {
      await EscrowInitializationPolicy.handle(event);
    });

    EventBus.subscribe("EscrowCreatedEvent", async (event) => {
      await PaymentInitializationPolicy.handle(event);
    });

    EventBus.subscribe("PaymentCapturedEvent", async (event) => {
      await FundEscrowPolicy.handle(event);
    });
    
    console.log("✅ All Domain Policies successfully registered to the EventBus.");
  }
}

module.exports = PolicyRegistry;
