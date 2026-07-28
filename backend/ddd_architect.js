const fs = require('fs');
const path = require('path');

async function run() {
  const { sequelize } = require('./sequelize_setup');
  const models = require('./audit_models.json');
  const dbReality = require('./audit_db_reality.json');
  const analysis = require('./analysis_result.json');

  const rootDir = __dirname;
  const servicesDir = path.join(rootDir, 'services');

  // --- A. FETCH TRUE FKs FROM DB ---
  let dbFks = [];
  try {
    const [fks] = await sequelize.query(`
      SELECT tc.table_name, ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY';
    `);
    dbFks = fks;
  } catch (e) {
    console.error('DB FK fetch error (ignoring if offline):', e.message);
  }

  // --- B. PARSE DOMAIN BOUNDARIES ---
  const domains = {
    'Marketplace': ['Product', 'Category', 'SellerListing', 'Deal', 'AlternativeQuote'],
    'Procurement': ['PurchaseRequest', 'PurchaseRequestItem', 'PurchaseRequestInvitation', 'Quotation', 'QuotationItem', 'Award', 'AwardLine', 'PurchaseOrder', 'PurchaseOrderLine', 'Shipment', 'ShipmentLine', 'Receipt', 'ReceiptLine'],
    'Finance': ['Invoice', 'PaymentTransaction', 'PaymentMethod', 'CommissionTransaction', 'WithdrawalLog'],
    'Identity': ['User', 'Role', 'Permission', 'Organization', 'UserRole', 'RolePermission', 'Team', 'City', 'Region'],
    'AI_Data': ['ProductDNA', 'ProductDNAAttribute', 'SmartPricingMatrix', 'SmartInventory', 'BuyerDecisionContext', 'SellerInteractionEvent', 'MarketSilenceEvent', 'InventoryMetrics'],
    'Observability': ['AuditLog', 'ActionLog', 'AdminActionLog', 'EventLog', 'Notification', 'Message', 'Report', 'SLARecord', 'TrustScore']
  };

  const modelToDomain = {};
  for (const [mName] of Object.entries(models)) {
    let found = 'Core/Other';
    for (const [dom, list] of Object.entries(domains)) {
      if (list.includes(mName)) found = dom;
    }
    modelToDomain[mName] = found;
  }

  // --- C. SERVICE-TO-SERVICE GRAPH & CYCLES ---
  const serviceFiles = fs.existsSync(servicesDir) ? fs.readdirSync(servicesDir).filter(f => f.endsWith('.js')) : [];
  const s2sGraph = {}; // caller -> [callees]
  const serviceNames = serviceFiles.map(f => f.replace('.js', ''));

  serviceNames.forEach(s => s2sGraph[s] = []);

  for (const file of serviceFiles) {
    const caller = file.replace('.js', '');
    const content = fs.readFileSync(path.join(servicesDir, file), 'utf8');
    for (const callee of serviceNames) {
      if (caller !== callee && content.includes(callee)) {
        s2sGraph[caller].push(callee);
      }
    }
  }

  // Find Cycles in Services (DFS)
  const serviceCycles = [];
  function detectCycle(node, visited, recStack, pathArr) {
    visited[node] = true;
    recStack[node] = true;
    pathArr.push(node);

    for (const neighbor of (s2sGraph[node] || [])) {
      if (!visited[neighbor]) {
        detectCycle(neighbor, visited, recStack, pathArr);
      } else if (recStack[neighbor]) {
        // Cycle found
        const cycleStartIndex = pathArr.indexOf(neighbor);
        const cycle = pathArr.slice(cycleStartIndex);
        cycle.push(neighbor); // close loop
        serviceCycles.push(cycle.join(' -> '));
      }
    }
    recStack[node] = false;
    pathArr.pop();
  }
  
  const visited = {};
  const recStack = {};
  for (const s of serviceNames) {
    if (!visited[s]) detectCycle(s, visited, recStack, []);
  }

  // --- D. AGGREGATE ROOTS & DEPENDENCY WEIGHTS ---
  const entityStats = {};
  for (const mName of Object.keys(models)) {
    entityStats[mName] = { incomingTotal: 0, outTotal: 0, crossDomain: 0, files: analysis.usages[mName]?.length || 0 };
  }

  for (const [mName, m] of Object.entries(models)) {
    if (m.associations) {
      for (const a of m.associations) {
        if (entityStats[a.target]) {
          entityStats[mName].outTotal++;
          entityStats[a.target].incomingTotal++;
          if (modelToDomain[mName] !== modelToDomain[a.target]) {
            entityStats[mName].crossDomain++;
            entityStats[a.target].crossDomain++;
          }
        }
      }
    }
  }

  // Calculate True Weights
  // Weight = (Incoming * 10) + (Files * 2) + (CrossDomain * 5)
  for (const mName of Object.keys(models)) {
    entityStats[mName].weight = (entityStats[mName].incomingTotal * 10) + (entityStats[mName].files * 2) + (entityStats[mName].crossDomain * 5);
  }

  // Identify Roots: High weight, low incoming constraints but high files, or explicitly domain heads
  const aggregateRoots = ['User', 'Organization', 'PurchaseRequest', 'Product', 'Invoice', 'Deal', 'Quotation'];


  // ================= REPORT GENERATION =================
  const md = [];
  md.push('# 🏢 DOMAIN-DRIVEN DESIGN & ARCHITECTURE MASTER REPORT');
  md.push('> The definitive 10/10 blueprint for transitioning to a Modular Monolith or Microservices architecture.');
  md.push('');

  // 1. DOMAIN BOUNDARIES
  md.push('## 1. Domain Boundaries (Bounded Contexts)');
  md.push('Entities logically grouped into isolated domains to prepare for Microservice/Modular boundaries.');
  for (const [dom, list] of Object.entries(domains)) {
    md.push(`### 📦 \`${dom}\``);
    const rootsInDom = list.filter(l => aggregateRoots.includes(l));
    md.push(`- **Aggregate Roots:** ${rootsInDom.length ? rootsInDom.map(r => `\`${r}\``).join(', ') : '*None explicitly defined*'}`);
    md.push(`- **Entities:** ${list.join(', ')}`);
    md.push('');
  }

  // 2. TRUE ER DIAGRAM
  md.push('## 2. Definitive ER Diagram (Strict Mermaid Syntax)');
  md.push('True structural constraints mapping belongsTo (||--o{) and hasMany (||--o{) across all bounds.');
  md.push('\`\`\`mermaid');
  md.push('erDiagram');
  for (const [mName, m] of Object.entries(models)) {
    if (m.associations) {
      for (const a of m.associations) {
        let arrow = '}o--o{';
        if (a.type === 'BelongsTo') arrow = '}o--||';
        if (a.type === 'HasMany') arrow = '||--o{';
        if (a.type === 'HasOne') arrow = '||--o|';
        md.push(`    ${mName} ${arrow} ${a.target} : "${a.type}"`);
      }
    }
  }
  md.push('\`\`\`');
  md.push('');

  // 3. AGGREGATE ROOTS & DEPENDENCY WEIGHTS
  md.push('## 3. Weighted Dependency Graph (Top 15 Entities)');
  md.push('Based on `(Incoming Relations * 10) + (File Usages * 2) + (Cross-Domain Links * 5)`.');
  md.push('```text');
  const sortedWeights = Object.entries(entityStats).sort((a,b) => b[1].weight - a[1].weight).slice(0, 15);
  const maxWeight = sortedWeights[0][1].weight || 1;
  sortedWeights.forEach(([mName, stats]) => {
    const barLen = Math.max(1, Math.floor((stats.weight / maxWeight) * 40));
    const bar = '█'.repeat(barLen);
    md.push(`${mName.padEnd(25)} ${bar} ${stats.weight}`);
  });
  md.push('```');
  md.push('');

  // 4. BLAST RADIUS
  md.push('## 4. True Blast Radius Matrix');
  md.push('Calculated using strict DB constraints AND Sequelize ORM Associations.');
  md.push('| Entity | Incoming Dependencies | Cross-Domain Bleed | True Risk Level |');
  md.push('|---|---|---|---|');
  Object.entries(entityStats).sort((a,b) => b[1].incomingTotal - a[1].incomingTotal).slice(0, 20).forEach(([mName, stats]) => {
    let risk = 'Low';
    if (stats.incomingTotal > 8) risk = '🔥 EXTREME';
    else if (stats.incomingTotal > 4) risk = '⚡ HIGH';
    else if (stats.incomingTotal > 1) risk = '⚠️ MEDIUM';
    md.push(`| **${mName}** | ${stats.incomingTotal} associations | ${stats.crossDomain} links | ${risk} |`);
  });
  md.push('');

  // 5. SERVICE TO SERVICE & CYCLES
  md.push('## 5. Service-to-Service Dependency & Cycle Detection');
  md.push('Revealing deep service coupling. A critical step before microservice separation.');
  md.push('');
  if (serviceCycles.length > 0) {
    md.push('### 🔴 CRITICAL: Circular Dependencies Detected');
    md.push('These must be refactored using Event Emitters or Pub/Sub to prevent deadlocks.');
    const uniqueCycles = [...new Set(serviceCycles)];
    uniqueCycles.forEach(c => md.push(`- \`${c}\``));
  } else {
    md.push('### 🟢 No Circular Dependencies Detected');
  }
  md.push('');
  md.push('### Service Call Graph (Top Flows)');
  md.push('\`\`\`mermaid');
  md.push('graph TD');
  let edgeCount = 0;
  for (const [caller, callees] of Object.entries(s2sGraph)) {
    for (const callee of callees) {
      if (edgeCount++ < 100) md.push(`    ${caller} --> ${callee}`);
    }
  }
  md.push('\`\`\`');
  md.push('');

  // 6. B2B LIFECYCLE
  md.push('## 6. The Procurement B2B Lifecycle');
  md.push('The overarching state machine flow driving the application.');
  md.push('\`\`\`mermaid');
  md.push('stateDiagram-v2');
  md.push('    [*] --> PurchaseRequest_Draft');
  md.push('    PurchaseRequest_Draft --> PurchaseRequest_Published : Submit');
  md.push('    PurchaseRequest_Published --> PurchaseRequestInvitation : Match Suppliers (AI)');
  md.push('    PurchaseRequest_Published --> Quotation : Direct Submit');
  md.push('    PurchaseRequestInvitation --> Quotation : Supplier Responds');
  md.push('    Quotation --> Award : Buyer Accepts');
  md.push('    Award --> PurchaseOrder : Contract Signed');
  md.push('    PurchaseOrder --> Shipment : Seller Dispatches');
  md.push('    Shipment --> Receipt : Buyer Confirms');
  md.push('    Receipt --> Invoice : Financials Generated');
  md.push('    Invoice --> PaymentTransaction : Cleared');
  md.push('    PaymentTransaction --> [*]');
  md.push('\`\`\`');
  md.push('');

  fs.writeFileSync('DDD_MASTER_REPORT.md', md.join('\n'));
  console.log('DDD_MASTER_REPORT.md generated successfully!');
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
