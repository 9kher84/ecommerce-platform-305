/**
 * PaymentGatewayPort
 * 
 * Abstract interface for interacting with Payment Providers (Stripe, HyperPay, etc.).
 * Execution Standard PA-01 strictly enforces that no Aggregate depends on provider SDKs.
 * This Port is used by the Application Layer (Use Cases) to proxy requests.
 */
class PaymentGatewayPort {
  /**
   * Authorize a payment (reserve funds on the card)
   * @param {Object} params 
   * @param {string} params.paymentId The internal UUID of the Payment aggregate
   * @param {number} params.amount The amount to authorize
   * @param {string} params.currency The currency code
   * @returns {Promise<{ success: boolean, reference?: string, error?: string }>}
   */
  async authorize(params) {
    throw new Error('Not implemented');
  }

  /**
   * Capture a previously authorized payment
   * @param {Object} params 
   * @param {string} params.reference The provider's reference from authorize
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  async capture(params) {
    throw new Error('Not implemented');
  }

  /**
   * Cancel an authorization
   * @param {Object} params 
   * @param {string} params.reference The provider's reference
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  async cancel(params) {
    throw new Error('Not implemented');
  }
}

module.exports = PaymentGatewayPort;
