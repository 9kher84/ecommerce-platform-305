const fs = require('fs');
const path = require('path');

function extractRoutes(dir) {
  const routes = [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('Routes.js'));
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const moduleName = file.replace('Routes.js', '');
    
    // Simple regex to match router.METHOD('/path', middlewares..., controller.action)
    // This won't be perfect for multi-line but good enough for a rough overview
    const regex = /router\.(get|post|put|delete|patch)\s*\(\s*(['"`])(.*?)\2\s*,(.*?)\)/gs;
    
    let match;
    while ((match = regex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const routePath = match[3];
      const argsStr = match[4].trim();
      
      const requiresJWT = argsStr.includes('protect') || argsStr.includes('optionalAuth');
      const requiresRole = argsStr.includes('checkRole') || argsStr.includes('authorize');
      
      // Determine testing status based on simulate_cycle.js
      let tested = 'No';
      if (
        (moduleName === 'auth' && routePath === '/register' && method === 'POST') ||
        (moduleName === 'request' && routePath === '/' && method === 'POST') ||
        (moduleName === 'request' && routePath === '/:id/status' && method === 'PUT') ||
        (moduleName === 'product' && routePath === '/' && method === 'POST') ||
        (moduleName === 'quote' && routePath === '/:id/accept' && method === 'POST') ||
        (moduleName === 'request' && routePath === '/:id/quotes' && method === 'POST') // Assuming it's in requestRoutes or quoteRoutes
      ) {
        tested = 'Yes';
      }

      routes.push({
        module: moduleName,
        file: file,
        method: method,
        route: routePath,
        middlewares: argsStr,
        requiresJWT,
        requiresRole,
        tested
      });
    }
  }
  return routes;
}

const allRoutes = extractRoutes('./routes');
console.log(JSON.stringify(allRoutes, null, 2));
