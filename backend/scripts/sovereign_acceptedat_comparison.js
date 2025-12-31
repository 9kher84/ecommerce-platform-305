const fs = require('fs');
const path = require('path');

function compareAcceptedAt() {
    console.log('=== ACCEPTEDAT COMPARISON REPORT ===');
    console.log('Generated at:', new Date().toISOString());

    // 1. Check PriceQuote model
    const priceQuotePath = path.join(__dirname, '../models/PriceQuote.js');
    console.log('\n1. PRICEQUOTE MODEL ANALYSIS:');

    if (!fs.existsSync(priceQuotePath)) {
        console.log('❌ ERROR: PriceQuote.js not found');
        return;
    }

    const modelContent = fs.readFileSync(priceQuotePath, 'utf8');
    const acceptedAtInModel = modelContent.includes('acceptedAt');
    console.log('- acceptedAt field in model:', acceptedAtInModel ? '✅ FOUND' : '❌ NOT FOUND');

    if (acceptedAtInModel) {
        const lines = modelContent.split('\n');
        const fieldLine = lines.find(l => l.includes('acceptedAt'));
        console.log('- Field definition:', fieldLine?.trim() || 'NOT VISIBLE');
    }

    // 2. Check quoteService usage
    const servicePath = path.join(__dirname, '../services/quoteService.js');
    console.log('\n2. QUOTESERVICE USAGE ANALYSIS:');

    if (!fs.existsSync(servicePath)) {
        console.log('❌ ERROR: quoteService.js not found');
        return;
    }

    const serviceContent = fs.readFileSync(servicePath, 'utf8');
    const lines = serviceContent.split('\n');

    console.log('- Total references to acceptedAt:', serviceContent.match(/acceptedAt/g)?.length || 0);

    lines.forEach((line, index) => {
        if (line.includes('acceptedAt')) {
            console.log(`  Line ${index + 1}: ${line.trim()}`);
        }
    });

    // 3. Conclusion
    console.log('\n3. SOVEREIGN VERDICT:');
    const verdict = acceptedAtInModel ?
        '✅ Model defines acceptedAt, but must verify DB implementation' :
        '❌ CRITICAL: Model does not define acceptedAt field';
    console.log(verdict);
}

compareAcceptedAt();
