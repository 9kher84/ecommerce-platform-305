const fs = require('fs');
const path = require('path');

async function run() {
  const { sequelize } = require('./sequelize_setup');
  
  // 1. Gather all existing DB data
  const models = require('./audit_models.json');
  const dbReality = require('./audit_db_reality.json');
  const allTables = dbReality.dbTables || [];
  
  // Get Actual DB Foreign Keys
  let dbFks = [];
  try {
    const [fks] = await sequelize.query(`
      SELECT
          tc.table_name AS table_name,
          ccu.table_name AS foreign_table_name
      FROM
          information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY';
    `);
    dbFks = fks;
  } catch (e) {
    console.error('Error fetching FKs:', e);
  }

  // 2. Scan Codebase for Lifecycle and Usages
  const rootDir = __dirname;
  const dirsToScan = ['controllers', 'services', 'routes', 'jobs', 'middleware', 'scripts', 'tests', 'migrations', 'seeders'];
  
  const lifecycle = {}; // modelName -> { create: [], read: [], update: [], delete: [], ai: [], dashboard: [] }
  const tableEvidence = {}; // tableName -> { model: false, migration: false, fk: false, runtime: false, controller: false, service: false, seeder: false, production: false, ai: false, dashboard: false }
  
  for (const table of allTables) {
    tableEvidence[table] = {
      model: false, migration: false, fk: false, runtime: false, 
      controller: false, service: false, seeder: false, 
      production: false, ai: false, dashboard: false
    };
    
    // Production Data check
    const dupForms = Object.values(dbReality.duplicateAnalysis).find(d => d.forms.includes(table));
    if (dupForms) {
      if (dupForms.counts[table] > 0) tableEvidence[table].production = true;
    } else {
      // Not a duplicate pair, check row count directly
      try {
        const [res] = await sequelize.query(`SELECT count(*) as total FROM "${table}"`);
        if (parseInt(res[0].total, 10) > 0) tableEvidence[table].production = true;
      } catch (e) {}
    }
    
    // DB FK check
    if (dbFks.some(fk => fk.table_name === table || fk.foreign_table_name === table)) {
      tableEvidence[table].fk = true;
    }
  }

  // Map Models to Tables
  const modelToTable = {};
  for (const [mName, mInfo] of Object.entries(models)) {
    modelToTable[mName] = mInfo.physicalTable;
    if (tableEvidence[mInfo.physicalTable]) {
      tableEvidence[mInfo.physicalTable].model = true;
    }
    lifecycle[mName] = { create: new Set(), read: new Set(), update: new Set(), delete: new Set(), ai: new Set(), dashboard: new Set() };
  }

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory() && file !== 'node_modules') {
        scanDir(fullPath);
      } else if (file.endsWith('.js') || file.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const relativePath = fullPath.replace(rootDir, '').replace(/\\/g, '/');
        
        const isController = relativePath.includes('/controllers/');
        const isService = relativePath.includes('/services/');
        const isSeeder = file.includes('seed') || relativePath.includes('/seed');
        const isMigration = relativePath.includes('/migrations/');
        const isAi = content.toLowerCase().includes('ai') || content.toLowerCase().includes('llm') || content.toLowerCase().includes('vector') || file.toLowerCase().includes('ai');
        const isDashboard = relativePath.includes('admin') || relativePath.includes('dashboard');

        // Check explicit physical table names
        for (const table of allTables) {
          if (content.includes(`'${table}'`) || content.includes(`"${table}"`) || content.includes(`\`${table}\``)) {
            if (isMigration) tableEvidence[table].migration = true;
            if (isSeeder) tableEvidence[table].seeder = true;
            if (content.includes('sequelize.query')) tableEvidence[table].runtime = true;
          }
        }

        // Check Sequelize Model interactions
        for (const [mName, table] of Object.entries(modelToTable)) {
          const c = content;
          let used = false;

          // CRUD detection
          if (new RegExp(`\\b${mName}\\.(create|bulkCreate)\\b`).test(c)) { lifecycle[mName].create.add(relativePath); used = true; }
          if (new RegExp(`\\b${mName}\\.(findAll|findOne|findByPk|count)\\b`).test(c)) { lifecycle[mName].read.add(relativePath); used = true; }
          if (new RegExp(`\\b${mName}\\.(update|increment|decrement)\\b`).test(c)) { lifecycle[mName].update.add(relativePath); used = true; }
          if (new RegExp(`\\b${mName}\\.(destroy)\\b`).test(c)) { lifecycle[mName].delete.add(relativePath); used = true; }
          if (new RegExp(`\\b${mName}\\.`).test(c)) used = true; // Any usage

          if (used) {
            if (tableEvidence[table]) {
              tableEvidence[table].runtime = true;
              if (isController) tableEvidence[table].controller = true;
              if (isService) tableEvidence[table].service = true;
              if (isSeeder) tableEvidence[table].seeder = true;
              if (isAi) tableEvidence[table].ai = true;
              if (isDashboard) tableEvidence[table].dashboard = true;
            }
            if (isAi) lifecycle[mName].ai.add(relativePath);
            if (isDashboard) lifecycle[mName].dashboard.add(relativePath);
          }
        }
      }
    }
  }

  // Also check root seeders
  scanDir(rootDir);

  // 3. Generate Report
  const md = [];
  md.push('# 🛡️ DATABASE PROOF REPORT');
  md.push('> This report replaces assumptions with hard evidence. Every table is graded strictly on 10 Evidence Pillars.');
  md.push('');

  md.push('## Part 1: Evidence-Based Canonical Score');
  md.push('Every physical table discovered in PostgreSQL is graded here. We check Code Models, DB constraints, file system usages, and actual row counts.');
  md.push('');

  for (const table of allTables.sort()) {
    const ev = tableEvidence[table];
    let score = 0;
    if (ev.model) score++;
    if (ev.migration) score++;
    if (ev.fk) score++;
    if (ev.runtime) score++;
    if (ev.controller) score++;
    if (ev.service) score++;
    if (ev.seeder) score++;
    if (ev.production) score++;
    if (ev.ai) score++;
    if (ev.dashboard) score++;

    md.push(`### \`${table}\``);
    md.push('```text');
    md.push(`Model           ${ev.model ? '✓' : '×'}`);
    md.push(`Migration       ${ev.migration ? '✓' : '×'}`);
    md.push(`FK              ${ev.fk ? '✓' : '×'}`);
    md.push(`Runtime         ${ev.runtime ? '✓' : '×'}`);
    md.push(`Controller      ${ev.controller ? '✓' : '×'}`);
    md.push(`Service         ${ev.service ? '✓' : '×'}`);
    md.push(`Seeder          ${ev.seeder ? '✓' : '×'}`);
    md.push(`Production Data ${ev.production ? '✓' : '×'}`);
    md.push(`AI Usage        ${ev.ai ? '✓' : '×'}`);
    md.push(`Dashboard Usage ${ev.dashboard ? '✓' : '×'}`);
    md.push('');
    md.push(`Canonical Score   ${score} / 10`);
    md.push('```');

    if (score >= 8) md.push('> **Verdict:** Canonical (Core active entity).');
    else if (score >= 4) md.push('> **Verdict:** Supporting/Utility (Check usage context).');
    else if (score > 0 && ev.production && !ev.model && !ev.runtime) md.push('> **Verdict:** Ghost Table (Has data but disconnected from app).');
    else if (score === 0 || (score === 1 && ev.migration)) md.push('> **Verdict:** Dead Table (No code references, no data. Safe to delete).');
    else md.push('> **Verdict:** Legacy/Abandoned (Low evidence).');
    md.push('');
  }

  md.push('## Part 2: Table Lifecycle Trace');
  md.push('End-to-end tracing of how every core entity is manipulated by the codebase. Answers the "Who creates it? Who reads it?" requirement.');
  md.push('');

  for (const [mName, life] of Object.entries(lifecycle)) {
    if (life.create.size === 0 && life.read.size === 0 && life.update.size === 0 && life.delete.size === 0) {
      continue; // Skip models completely unused in code
    }
    
    md.push(`### Entity: \`${mName}\` (Table: \`${modelToTable[mName]}\`)`);
    
    const cr = Array.from(life.create);
    if (cr.length > 0) md.push(`- **Who creates it?**\n  ${cr.map(f => `  - \`${f}\``).join('\n')}`);
    else md.push(`- **Who creates it?** ⚠️ None directly`);

    const rd = Array.from(life.read);
    if (rd.length > 0) md.push(`- **Who reads it?**\n  ${rd.slice(0,5).map(f => `  - \`${f}\``).join('\n')}${rd.length > 5 ? `\n    ...and ${rd.length-5} more` : ''}`);
    else md.push(`- **Who reads it?** ⚠️ None directly`);

    const up = Array.from(life.update);
    if (up.length > 0) md.push(`- **Who updates it?**\n  ${up.map(f => `  - \`${f}\``).join('\n')}`);
    else md.push(`- **Who updates it?** ⚠️ None directly`);

    const del = Array.from(life.delete);
    if (del.length > 0) md.push(`- **Who deletes it?**\n  ${del.map(f => `  - \`${f}\``).join('\n')}`);
    else md.push(`- **Who deletes it?** ⚠️ None directly`);

    const ai = Array.from(life.ai);
    if (ai.length > 0) md.push(`- **Who sends it to AI?**\n  ${ai.map(f => `  - \`${f}\``).join('\n')}`);
    
    const dash = Array.from(life.dashboard);
    if (dash.length > 0) md.push(`- **Who sends it to Dashboard?**\n  ${dash.map(f => `  - \`${f}\``).join('\n')}`);
    
    md.push('');
  }

  fs.writeFileSync('DATABASE_PROOF_REPORT.md', md.join('\n'));
  console.log('DATABASE_PROOF_REPORT.md generated successfully!');
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
