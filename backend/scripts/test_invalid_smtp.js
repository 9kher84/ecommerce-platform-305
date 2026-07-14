const emailService = require('../services/emailService');

async function run() {
  console.log("=== TESTING INVALID SMTP ===");
  process.env.EMAIL_MOCK_MODE = 'false';
  process.env.SMTP_HOST = 'invalid.example.com';
  process.env.SMTP_PORT = 2525;
  
  // Re-init transporter with invalid host
  emailService.initTransporter();
  
  console.log("Attempting to send an email...");
  const result = await emailService.send({
    to: 'test@example.com',
    subject: 'Test SMTP',
    html: '<p>Test</p>'
  });
  
  console.log("Result object returned to Controller:");
  console.log(result);
  console.log("If this did not crash, the workflow continues successfully!");
}

run();
