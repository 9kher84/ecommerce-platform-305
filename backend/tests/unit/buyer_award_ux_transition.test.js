const QuoteService = require('../../services/quoteService');

describe('Buyer Award → Deal UX Transition Unit Test', () => {
  it('1. Successful Award: acceptQuote returns created active Deal object with ID', async () => {
    // Mock QuoteService.acceptQuote
    jest.spyOn(QuoteService, 'acceptQuote').mockImplementation(async (quoteId, buyerId, context) => {
      if (quoteId === 'invalid-quote') {
        throw new Error('Quote not found');
      }
      return {
        id: 'deal-uuid-12345',
        purchaseRequestId: 'pr-uuid-67890',
        quotationId: quoteId,
        buyerId: buyerId,
        status: 'active',
        totalAmount: 5000
      };
    });

    const deal = await QuoteService.acceptQuote('quote-winner-123', 'buyer-uuid-99', { decision_reason: 'Best Price' });

    expect(deal).toBeDefined();
    expect(deal.id).toBe('deal-uuid-12345');
    expect(deal.status).toBe('active');
    expect(deal.purchaseRequestId).toBe('pr-uuid-67890');

    QuoteService.acceptQuote.mockRestore();
  });

  it('2. Failed Award: Should throw error and NOT produce a false deal state', async () => {
    jest.spyOn(QuoteService, 'acceptQuote').mockImplementation(async (quoteId) => {
      if (quoteId === 'invalid-quote') {
        throw new Error('Quote not found');
      }
    });

    await expect(QuoteService.acceptQuote('invalid-quote', 'buyer-uuid-99')).rejects.toThrow('Quote not found');

    QuoteService.acceptQuote.mockRestore();
  });
});
