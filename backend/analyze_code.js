const fs = require('fs');
const path = require('path');

const models = require('./model_report.json');

// Directories to scan
const searchDirs = ['controllers', 'services', 'routes', 'jobs', 'middleware'];
const rootDir = __dirname;

const usages = {};
const rawQueries = [];

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Look for model usages
      for (const modelName of Object.keys(models)) {
        if (!usages[modelName]) usages[modelName] = [];
        
        // Match ModelName.method(
        const regex = new RegExp(`\\b${modelName}\\.(findAll|findOne|create|update|destroy|bulkCreate|count)\\b`, 'g');
        if (regex.test(content)) {
          usages[modelName].push(fullPath.replace(rootDir, ''));
        }
      }
      
      // Look for raw queries
      if (content.includes('sequelize.query') || content.includes('query(')) {
        // extract query rough content if possible, or just note the file
        rawQueries.push(fullPath.replace(rootDir, ''));
      }
    }
  }
}

for (const dir of searchDirs) {
  scanDir(path.join(rootDir, dir));
}

// Parse migrations
const migrationsDir = path.join(rootDir, 'migrations');
const migrationsData = [];
if (fs.existsSync(migrationsDir)) {
  const files = fs.readdirSync(migrationsDir).sort();
  for (const file of files) {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    
    // basic regex for createTable, dropTable, renameTable
    const createMatches = [...content.matchAll(/createTable\(\s*['"`](.*?)['"`]/g)].map(m => m[1]);
    const dropMatches = [...content.matchAll(/dropTable\(\s*['"`](.*?)['"`]/g)].map(m => m[1]);
    const renameMatches = [...content.matchAll(/renameTable\(\s*['"`](.*?)['"`]\s*,\s*['"`](.*?)['"`]/g)].map(m => ({from: m[1], to: m[2]}));
    
    if (createMatches.length || dropMatches.length || renameMatches.length) {
      migrationsData.push({
        file,
        created: createMatches,
        dropped: dropMatches,
        renamed: renameMatches
      });
    }
  }
}

const result = {
  usages,
  rawQueries: [...new Set(rawQueries)],
  migrationsData
};

fs.writeFileSync('analysis_result.json', JSON.stringify(result, null, 2));
console.log('Analysis complete!');
