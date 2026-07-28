const PaymentGatewayPort = require('../../application/ports/PaymentGatewayPort');

/**
 * FakePaymentGatewayAdapter
 * 
 * A mock adapter used for development and specification testing.
 * Implements the PaymentGatewayPort.
 */
class FakePaymentGatewayAdapter extends PaymentGatewayPort {
  constructor(shouldFail = false) {
    super();
    this.shouldFail = shouldFail;
  }

  async authorize(params) {
    if (this.shouldFail) {
      return {
        success: false,
        error: "Insufficient funds in test card"
      };
    }

    return {
      success: true,
      reference: `fake_auth_${params.paymentId}_${Date.now()}`
    };
  }

  async capture(params) {
    if (this.shouldFail) {
      return {
        success: false,
        error: "Network error during capture"
      };
    }

    return {
      success: true
    };
  }

  async cancel(params) {
    return {
      success: true
    };
  }
}

module.exports = FakePaymentGatewayAdapter;
