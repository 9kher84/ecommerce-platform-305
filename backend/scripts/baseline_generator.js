const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, '..');

// Helper to recursively find files
function findFiles(dir, ext) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules')) {
      results = results.concat(findFiles(file, ext));
    } else if (file.endsWith(ext)) {
      results.push(file);
    }
  });
  return results;
}

const jsFiles = findFiles(backendDir, '.js');

let routeCount = 0;
let controllerCount = 0;
let dtoCount = 0;
let repoCount = 0;
let modelCount = 0;
let usecaseCount = 0;
let envVars = new Set();
let featureFlags = new Set();
let endpoints = [];
let models = [];

// 1. Routes & Endpoints
const routeFiles = findFiles(path.join(backendDir, 'routes'), '.js');
routeFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const routeMatches = content.match(/router\.(get|post|put|delete|patch)\((['"`])(.*?)\2/g);
  if (routeMatches) {
    routeCount += routeMatches.length;
    routeMatches.forEach(r => endpoints.push(r.replace(/router\./, '')));
  }
});

// Filter files by component suffix instead of directory
const dtoFiles = jsFiles.filter(f => f.toLowerCase().includes('dto'));
dtoCount = dtoFiles.length;

const repoFiles = jsFiles.filter(f => f.toLowerCase().includes('repository'));
repoCount = repoFiles.length;

const usecaseFiles = jsFiles.filter(f => f.toLowerCase().includes('usecase'));
usecaseCount = usecaseFiles.length;

const controllerFiles = jsFiles.filter(f => f.toLowerCase().includes('controller'));
controllerCount = controllerFiles.length;

// For models, we usually look at Sequelize definitions
let modelDefCount = 0;
jsFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('sequelize.define(') || content.includes('class ') && content.includes('extends Model')) {
    modelDefCount++;
  }
});
modelCount = modelDefCount;

// 7. Environment Variables
jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const envMatches = content.match(/process\.env\.([A-Z0-9_]+)/g);
  if (envMatches) {
    envMatches.forEach(m => {
      const v = m.replace('process.env.', '');
      envVars.add(v);
      if (v.startsWith('ENABLE_') || v.startsWith('FEATURE_')) {
        featureFlags.add(v);
      }
    });
  }
});

// Generate Docs
fs.writeFileSync(path.join(backendDir, 'docs/BASELINE_API.md'), `# API Baseline\nTotal Routes: ${routeCount}\nEndpoints:\n` + endpoints.join('\n'));
fs.writeFileSync(path.join(backendDir, 'docs/BASELINE_DTO.md'), `# DTO Baseline\nTotal DTOs: ${dtoCount}\nFiles:\n` + dtoFiles.map(f => path.basename(f)).join('\n'));
fs.writeFileSync(path.join(backendDir, 'docs/BASELINE_DATABASE.md'), `# Database Baseline\nTotal Models: ${modelCount}\nModels:\n` + models.join('\n'));
fs.writeFileSync(path.join(backendDir, 'docs/BASELINE_ENV.md'), `# Environment Variables\nTotal Env Vars: ${envVars.size}\nTotal Feature Flags: ${featureFlags.size}\nVariables:\n` + Array.from(envVars).join('\n'));

console.log(JSON.stringify({
  routes: routeCount,
  controllers: controllerCount,
  dtos: dtoCount,
  models: modelCount,
  repositories: repoCount,
  usecases: usecaseCount,
  envVars: envVars.size,
  featureFlags: featureFlags.size
}));
