/**
 * e2e/event_driven_commercial_flow.test.js
 * 
 * Wave 2 Capstone E2E Test
 * Simulates the entire event-driven flow from QuotationAccepted to EscrowFunded,
 * proving that all policies and aggregates correctly orchestrate through EventBus
 * using real Repositories and the real Database.
 */

const { initSequelize, User, Organization } = require('../sequelize_setup');
const { PurchaseRequest, PurchaseRequestItem, Quotation, QuotationItem, Award, Escrow, Payment, sequelize } = require('../models');
const EventBus = require('../src/shared/infrastructure/eventBus/EventBus');
const PolicyRegistry = require('../src/shared/infrastructure/eventBus/PolicyRegistry');

// Use Cases
const CreateAwardUseCase = require('../src/modules/sales/application/use-cases/CreateAwardUseCase');
const ConfirmAwardUseCase = require('../src/modules/sales/application/use-cases/ConfirmAwardUseCase');
const CreateEscrowUseCase = require('../src/modules/escrow/application/use-cases/CreateEscrowUseCase');
const CreatePaymentUseCase = require('../src/modules/payments/application/use-cases/CreatePaymentUseCase');
const FundEscrowUseCase = require('../src/modules/escrow/application/use-cases/FundEscrowUseCase');

// Repositories
const AwardRepository = require('../src/modules/sales/repositories/AwardRepository');

const crypto = require('crypto');
const TransactionManager = require('../src/shared/application/TransactionManager');

// Events
const QuotationAcceptedEvent = require('../src/modules/procurement/domain/events/QuotationAcceptedEvent');
const PaymentCapturedEvent = require('../src/modules/payments/domain/events/PaymentCapturedEvent');

// Mock out the external gateway adapter so we don't hit real APIs
jest.mock('../src/modules/payments/infrastructure/gateways/FakePaymentGatewayAdapter', () => {
  return jest.fn().mockImplementation(() => {
    return {
      authorize: async () => ({ success: true, reference: 'gate-auth-e2e' }),
      capture: async () => ({ success: true })
    };
  });
});

describe('E2E: Event-Driven Commercial Flow', () => {
  let dbQuotationId;
  let dbAwardId;
  let dbEscrowId;
  let dbPaymentId;

  let buyerId = crypto.randomUUID();
  let sellerId = crypto.randomUUID();
  let orgBuyerId = crypto.randomUUID();
  let orgSellerId = crypto.randomUUID();

  beforeAll(async () => {
    // 1. Initialize Real DB
    await initSequelize();
    
    // 2. Initialize EventBus Registry
    PolicyRegistry.registerAll();

    // 3. Clear existing test data
    await Payment.destroy({ where: {} });
    await Escrow.destroy({ where: {} });
    await Award.destroy({ where: {} });
    await Quotation.destroy({ where: {} });
    await PurchaseRequest.destroy({ where: {} });
    await User.destroy({ where: { id: [buyerId, sellerId] } });
    await Organization.destroy({ where: { id: [orgBuyerId, orgSellerId] } });

    // 4. Create base database state to simulate QuotationAcceptedEvent
    await User.create({ id: buyerId, email: `buyer-${buyerId}@test.com`, role: 'buyer', password: '123', first_name: 'buyer', last_name: 'buyer', phone: '+12345678' });
    await User.create({ id: sellerId, email: `seller-${sellerId}@test.com`, role: 'seller', password: '123', first_name: 'seller', last_name: 'seller', phone: '+87654321' });
    
    // Only create Organization if model exists, else skip
    if (Organization) {
      await Organization.create({ id: orgBuyerId, name: 'Buyer Org' });
      await Organization.create({ id: orgSellerId, name: 'Seller Org' });
    }

    const pr = await PurchaseRequest.create({
      title: 'E2E PR',
      description: 'E2E Desc',
      status: 'published',
      buyerId: buyerId,
      category: 'General'
    });

    const prItem = await PurchaseRequestItem.create({
      purchaseRequestId: pr.id,
      description: 'E2E PR Item',
      quantity: 1,
      lineNumber: 1,
      unit: 'EA'
    });

    try {
      const quotation = await Quotation.create({
        purchaseRequestId: pr.id,
        sellerId: sellerId,
        sellerOrganizationId: orgSellerId,
        buyerOrganizationId: orgBuyerId,
        totalAmount: 15000,
        currency: 'SAR',
        status: 'accepted'
      });
      dbQuotationId = quotation.id;

      await QuotationItem.create({
        quotationId: dbQuotationId,
        purchaseRequestItemId: prItem.id,
        description: 'E2E Item',
        quantity: 1,
        unitPrice: 15000,
        quantityRequested: 1,
        quantityOffered: 1,
        unitPriceOffered: 15000,
        currency: 'SAR'
      });
    } catch(e) {
      console.error('DB CREATE ERROR:', e);
      throw e;
    }
  });

  afterAll(async () => {
    jest.restoreAllMocks();
  });

  const waitForEvents = () => new Promise(resolve => setTimeout(resolve, 100));

  it('Should seamlessly orchestrate Quotation -> Award -> Escrow -> Payment -> Funded Escrow', async () => {
    // ---------------------------------------------------------
    // STEP 1: Simulate "QuotationAcceptedEvent" (Manual publish)
    // ---------------------------------------------------------
    EventBus.publish({
      name: 'QuotationAcceptedEvent',
      aggregateId: dbQuotationId,
      payload: {
        quotationId: dbQuotationId,
        buyerId: buyerId,
        sellerId: sellerId,
        buyerOrganizationId: orgBuyerId,
        totalAmount: 15000,
        currency: 'SAR'
      }
    });

    await waitForEvents();

    // Verification 1: Award should have been created by AwardCreationPolicy
    const awards = await Award.findAll();
    expect(awards.length).toBe(1);
    const award = awards[0];
    expect(award.status).toBe('accepted');
    expect(parseFloat(award.totalAmount)).toBe(17250);
    dbAwardId = award.id;

    // ---------------------------------------------------------
    // STEP 2: Buyer explicitly Confirms the Award
    // ---------------------------------------------------------
    const confirmAwardUseCase = new ConfirmAwardUseCase({
      awardRepo: new AwardRepository(),
      transactionManager: new TransactionManager()
    });

    try {
      await confirmAwardUseCase.execute({
        awardId: dbAwardId,
        actorId: buyerId,
        expectedVersion: award.version
      });
    } catch(e) {
      console.error('CONFIRM ERROR:', e);
      throw e;
    }
    await waitForEvents();

    // Verification 2: Escrow should have been created
    const escrows = await Escrow.findAll();
    expect(escrows.length).toBe(1);
    const escrow = escrows[0];
    expect(escrow.status).toBe('pending_funding');
    expect(parseFloat(escrow.amount)).toBe(17250);
    dbEscrowId = escrow.id;

    // Verification 3: Payment should have been created via EscrowCreatedEvent -> PaymentInitializationPolicy
    await waitForEvents();
    const payments = await Payment.findAll();
    expect(payments.length).toBe(1);
    const payment = payments[0];
    expect(payment.status).toBe('authorized');
    expect(parseFloat(payment.amount)).toBe(17250);
    dbPaymentId = payment.id;

    // ---------------------------------------------------------
    // STEP 3: Payment is Captured
    // ---------------------------------------------------------
    EventBus.publish(new PaymentCapturedEvent({
      aggregate: {
        id: dbPaymentId,
        escrowId: dbEscrowId,
        awardId: dbAwardId,
        amount: payment.amount,
        currency: payment.currency,
        provider: payment.provider,
        providerReference: payment.providerReference,
        status: 'captured'
      }
    }));

    await waitForEvents();

    // Verification 4: Escrow is Funded via FundEscrowPolicy
    const fundedEscrow = await Escrow.findByPk(dbEscrowId);
    expect(fundedEscrow.status).toBe('funded');
    
    console.log("✅ E2E Commercial Flow complete using Real DB!");
  });

  afterAll(async () => {
    if (sequelize) {
      await sequelize.close();
    }
  });
});
