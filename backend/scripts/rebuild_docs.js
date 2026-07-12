const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const backendDir = path.join(__dirname, '..');
const routesDir = path.join(backendDir, 'routes');
const serverJsPath = path.join(backendDir, 'server.js');

// Extract mounts
const serverJsContent = fs.readFileSync(serverJsPath, 'utf8');
const mounts = {};
const useRegex = /app\.use\(['"`](\/api[^'"`]*)['"`],\s*([A-Za-z0-9_]+)\)/g;
let match;
while ((match = useRegex.exec(serverJsContent)) !== null) {
  mounts[match[2] + '.js'] = match[1];
}
mounts['intakeRoutes.js'] = '/api/intake';
mounts['dashboardRoutes.js'] = '/api/dashboard';
mounts['supervisorRoutes.js'] = '/api/supervisor';
mounts['notificationRoutes.js'] = '/api/notifications';

// Extract actual routes
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

  // Explicitly handle /api/users/profile because of chaining across comments
  if (file === 'userRoutes.js') {
    actualEndpoints.push({ method: 'GET', path: '/api/users/profile', file: 'userRoutes.js' });
    actualEndpoints.push({ method: 'PUT', path: '/api/users/profile', file: 'userRoutes.js' });
  }
});

// Build Swagger
const paths = {};
actualEndpoints.forEach(ep => {
  let swaggPath = ep.path.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
  if (!paths[swaggPath]) paths[swaggPath] = {};
  paths[swaggPath][ep.method.toLowerCase()] = {
    summary: `Endpoint from ${ep.file}`,
    responses: { '200': { description: 'OK' } }
  };
});

const swaggerDoc = {
  openapi: '3.0.0',
  info: { title: 'Sovereign Ecommerce Platform', version: '1.0.0' },
  paths
};

fs.writeFileSync(path.join(backendDir, 'docs/swagger.yaml'), yaml.dump(swaggerDoc));

// Build BASELINE_API.md
let md = `# API Baseline\nTotal Routes: ${actualEndpoints.length}\n\n`;
actualEndpoints.forEach(ep => {
  md += `- ${ep.method} ${ep.path} (Router: ${ep.file})\n`;
});
fs.writeFileSync(path.join(backendDir, 'docs/BASELINE_API.md'), md);

console.log('Docs rebuilt successfully.');
