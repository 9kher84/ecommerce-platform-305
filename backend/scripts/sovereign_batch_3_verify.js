const fs = require('fs');
const path = require('path');

console.log('=== SOVEREIGN BATCH 3 VERIFICATION ===');

const checks = {
    swaggerRequests: false,
    swaggerQuotes: false,
    swaggerPricing: false,
    auditIntegration: false
};

// 1. Check Swagger Gaps
const reqContent = fs.readFileSync(path.join(__dirname, '../routes/requestRoutes.js'), 'utf8');
if (reqContent.includes('@swagger')) checks.swaggerRequests = true;

const quoteContent = fs.readFileSync(path.join(__dirname, '../routes/quoteRoutes.js'), 'utf8');
if (quoteContent.includes('@swagger')) checks.swaggerQuotes = true;

// 2. Check Smart Pricing Service & Audit
if (fs.existsSync(path.join(__dirname, '../services/smartPricingService.js'))) {
    const serviceContent = fs.readFileSync(path.join(__dirname, '../services/smartPricingService.js'), 'utf8');
    if (serviceContent.includes("require('./auditService')") && serviceContent.includes("auditService.log")) {
        checks.auditIntegration = true;
    }
}

// 3. Check Pricing Routes
if (fs.existsSync(path.join(__dirname, '../routes/smartPricingRoutes.js'))) {
    const routeContent = fs.readFileSync(path.join(__dirname, '../routes/smartPricingRoutes.js'), 'utf8');
    if (routeContent.includes('@swagger')) checks.swaggerPricing = true;
}

console.log('Swagger Requests:', checks.swaggerRequests ? '✅' : '❌');
console.log('Swagger Quotes:', checks.swaggerQuotes ? '✅' : '❌');
console.log('Swagger Pricing:', checks.swaggerPricing ? '✅' : '❌');
console.log('Audit Integration:', checks.auditIntegration ? '✅' : '❌');

if (Object.values(checks).every(v => v)) {
    console.log('\n✅ BATCH 3 VERIFICATION PASSED');
    process.exit(0);
} else {
    console.log('\n❌ BATCH 3 VERIFICATION FAILED');
    process.exit(1);
}
