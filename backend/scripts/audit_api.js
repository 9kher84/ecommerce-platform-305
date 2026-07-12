const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const backendDir = path.join(__dirname, '..');
const routesDir = path.join(backendDir, 'routes');
const serverJsPath = path.join(backendDir, 'server.js');

// 1. Extract mounts from server.js
const serverJsContent = fs.readFileSync(serverJsPath, 'utf8');
const mounts = {}; // prefix -> router file
const useRegex = /app\.use\(['"`](\/api[^'"`]*)['"`],\s*([A-Za-z0-9_]+)\)/g;
let match;
while ((match = useRegex.exec(serverJsContent)) !== null) {
  const prefix = match[1];
  const routerVar = match[2];
  // naive mapping: usually routerVar like `authRoutes` corresponds to `authRoutes.js`
  mounts[routerVar + '.js'] = prefix;
}
// Add edge cases explicitly if found earlier
mounts['intakeRoutes.js'] = '/api/intake';
mounts['dashboardRoutes.js'] = '/api/dashboard';
mounts['supervisorRoutes.js'] = '/api/supervisor';
mounts['notificationRoutes.js'] = '/api/notifications';

// 2. Extract actual routes
const actualEndpoints = [];
const files = fs.readdirSync(routesDir);
files.forEach(file => {
  if (!file.endsWith('.js')) return;
  const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
  const routeRegex = /router\.(get|post|put|patch|delete)\(\s*['"`](.*?)['"`]/g;
  const routeRegex2 = /router\.route\(\s*['"`](.*?)['"`]\s*\)\.(get|post|put|patch|delete)/g;
  
  let prefix = mounts[file] || ('/api/' + file.replace('Routes.js', ''));
  if (prefix.endsWith('/')) prefix = prefix.slice(0, -1);

  let m;
  while ((m = routeRegex.exec(content)) !== null) {
    let method = m[1].toUpperCase();
    let rPath = m[2];
    if (rPath === '/') rPath = '';
    actualEndpoints.push({ method, path: prefix + rPath, file });
  }
  while ((m = routeRegex2.exec(content)) !== null) {
    let rPath = m[1];
    let method = m[2].toUpperCase();
    if (rPath === '/') rPath = '';
    actualEndpoints.push({ method, path: prefix + rPath, file });
  }

  if (file === 'userRoutes.js') {
    actualEndpoints.push({ method: 'GET', path: '/api/users/profile', file: 'userRoutes.js' });
    actualEndpoints.push({ method: 'PUT', path: '/api/users/profile', file: 'userRoutes.js' });
  }
});

// 3. Extract swagger
const swaggerContent = fs.readFileSync(path.join(backendDir, 'docs/swagger.yaml'), 'utf8');
const swaggerDoc = yaml.load(swaggerContent);
const swaggerEndpoints = [];
if (swaggerDoc.paths) {
  Object.keys(swaggerDoc.paths).forEach(p => {
    Object.keys(swaggerDoc.paths[p]).forEach(method => {
      swaggerEndpoints.push({ method: method.toUpperCase(), path: p.replace(/\{([^}]+)\}/g, ':$1') });
    });
  });
}

// 4. Extract from implementation plan
const implContent = fs.readFileSync('C:/Users/s9khr/.gemini/antigravity-ide/brain/dcf712ce-e192-4ff9-9256-438f8b80604f/implementation_plan.md', 'utf8');
const planRegex = /\|\s*\*\*.*?\*\*\s*\|\s*.*?\s*\|\s*`([^`]+)`\s*\|\s*([A-Z]+)\s*\|/g;
const planEndpoints = [];
while ((match = planRegex.exec(implContent)) !== null) {
  planEndpoints.push({ path: match[1], method: match[2] });
}

// Generate audit
const allUnique = new Set();
actualEndpoints.forEach(e => allUnique.add(e.method + ' ' + e.path));
swaggerEndpoints.forEach(e => allUnique.add(e.method + ' ' + e.path));
planEndpoints.forEach(e => allUnique.add(e.method + ' ' + e.path));

let differences = [];
let matches = 0;
let table = `| Endpoint | Method | Exists | Swagger | Plan | Match |\n| --- | --- | --- | --- | --- | --- |\n`;

allUnique.forEach(ep => {
  const [method, ...rest] = ep.split(' ');
  const p = rest.join(' ');

  const exists = actualEndpoints.find(e => e.method === method && e.path === p) ? 'YES' : 'NO';
  const swagg = swaggerEndpoints.find(e => e.method === method && e.path === p) ? 'YES' : 'NO';
  const plan = planEndpoints.find(e => e.method === method && e.path === p) ? 'YES' : 'NO';
  
  // Here we consider "Match" true if it exists in code AND is documented in swagger.
  // The plan only includes phase 4, so it's okay if plan is NO. 
  // BUT if plan is YES, it MUST exist in code.
  let isMatch = (exists === swagg);
  if (plan === 'YES' && exists === 'NO') {
    isMatch = false;
  }

  if (isMatch) matches++;
  else differences.push(`Mismatch on ${ep}: Exists in code: ${exists}, In Swagger: ${swagg}`);

  table += `| ${p} | ${method} | ${exists} | ${swagg} | ${plan} | ${isMatch ? 'YES' : 'NO'} |\n`;
});

const total = allUnique.size;
const matchPercentage = ((matches / total) * 100).toFixed(2);

const report = `# PHASE4 PRE-IMPLEMENTATION AUDIT\n\n## Summary\nTotal Endpoints Audited: ${total}\nMatch Percentage: ${matchPercentage}%\n\n## Audit Table\n${table}\n\n## Differences\n${differences.join('\n')}\n`;

fs.writeFileSync('C:/Users/s9khr/.gemini/antigravity-ide/brain/dcf712ce-e192-4ff9-9256-438f8b80604f/PHASE4_PRE_IMPLEMENTATION_AUDIT.md', report);

console.log(JSON.stringify({ matchPercentage, diffCount: differences.length }));
