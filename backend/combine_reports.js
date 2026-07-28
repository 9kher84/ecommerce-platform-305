const fs = require('fs');

const f1 = fs.readFileSync('DATABASE_PROOF_REPORT.md', 'utf8');
const f2 = fs.readFileSync('ENGINEERING_PROOF_REPORT.md', 'utf8');
const f3 = fs.readFileSync('ULTIMATE_ENTERPRISE_ARCHITECTURE.md', 'utf8');

const combined = `
# 🌌 MASTER SYSTEM ARCHITECTURE & ENGINEERING PROOF
> This document is the culmination of the forensic database audit. It contains every layer of proof, mapping, and risk analysis required for a secure refactoring strategy.

---

${f1}

---

${f2}

---

${f3}
`;

fs.writeFileSync('MASTER_SYSTEM_ARCHITECTURE.md', combined);
console.log('Combined successfully');
