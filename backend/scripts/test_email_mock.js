const emailService = require('../services/emailService');

async function run() {
  console.log("=== TESTING 6 EMAIL METHODS IN MOCK MODE ===");
  process.env.NODE_ENV = 'development';
  process.env.EMAIL_MOCK_MODE = 'true';
  
  // Need a mock user
  const user = { email: 'test@example.com', name: 'Test User' };
  
  console.log("1. Password Reset");
  await emailService.sendPasswordReset(user, 'dummy-token');
  
  console.log("2. Registration Welcome");
  await emailService.sendRegistrationWelcome(user);
  
  console.log("3. RFQ Notification");
  await emailService.sendRFQNotification(['seller@test.com'], 'Test RFQ', 10);
  
  console.log("4. Quote Submitted");
  await emailService.sendQuoteSubmitted('buyer@test.com', 'Test Seller', 'Test RFQ');
  
  console.log("5. Quote Accepted");
  await emailService.sendQuoteAccepted('seller@test.com', 'Test Buyer', 'Test RFQ');
  
  console.log("6. Deal Created");
  await emailService.sendDealCreated({ buyerEmail: 'b@test.com', sellerEmail: 's@test.com' }, 50);
}

run();
