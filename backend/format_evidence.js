const fs = require('fs');
let content = fs.readFileSync('EVIDENCE.md', 'utf8');

const mapping = {
  '1. Buyer Onboarding': { src: 'Simulation Script', e2e: 'YES', note: 'Fully E2E via API' },
  '2. Seller Onboarding': { src: 'Simulation Script', e2e: 'YES', note: 'Fully E2E via API' },
  '3. RFQ Lifecycle': { src: 'Simulation Script', e2e: 'YES', note: 'Fully E2E via API' },
  '4. Quote Submission': { src: 'Simulation Script', e2e: 'YES', note: 'Fully E2E via API' },
  '5. Deal Creation, Invoicing, and Commission Logging': { src: 'Simulation Script', e2e: 'YES', note: 'Fully E2E via API' },
  '6. Event & Notification Lifecycle': { src: 'Simulation Script', e2e: 'YES', note: 'Triggered by E2E API flows' },
  '7. Negotiation': { src: 'Simulation Script', e2e: 'YES', note: 'Fully E2E via API' },
  '8. Payment Processing': { src: 'Simulation Script', e2e: 'YES', note: 'Fully E2E via API. SystemSetting was previously enabled globally.' },
  '9. Messaging & Chat': { src: 'Simulation Script', e2e: 'YES', note: 'Fully E2E via Socket.IO using authentic JWTs obtained from native login.' },
  '10. Rating & Reviews': { src: 'Simulation Script', e2e: 'YES', note: 'Fully E2E via API using authentic JWTs obtained from native login.' },
  '11. Delivery/Fulfillment Lifecycle': { src: 'Simulation Script', e2e: 'YES', note: 'Fully E2E via API using authentic JWTs obtained from native login.' }
};

for (const [key, val] of Object.entries(mapping)) {
  const regex = new RegExp('(## ' + key.replace(/\./g, '\\.') + '.*?\n)', 's');
  content = content.replace(regex, '$1- **Evidence Source**: ' + val.src + '\n');
}

content += '\n## Final Verification Summary\n\n';
content += '| Workflow | Evidence Source | Verified E2E | Notes |\n';
content += '|----------|-----------------|--------------|-------|\n';
for (const [key, val] of Object.entries(mapping)) {
  content += '| ' + key.split(' (')[0] + ' | ' + val.src + ' | ' + val.e2e + ' | ' + val.note + ' |\n';
}

fs.writeFileSync('EVIDENCE.md', content);
console.log('EVIDENCE.md formatted successfully.');
