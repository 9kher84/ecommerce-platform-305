const fs = require('fs');
const path = require('path');

const runtimeRoutes = JSON.parse(fs.readFileSync('runtime_routes.json', 'utf8'));
const frontendDir = path.join(__dirname, '../frontend/src');

const routesList = [];

runtimeRoutes.forEach(ep => {
    ep.methods.forEach(method => {
        let routePath = ep.path;
        if (routePath.endsWith('/') && routePath.length > 1) routePath = routePath.slice(0, -1);
        
        let moduleName = 'unknown';
        if (routePath.includes('/auth') || routePath.includes('/users')) moduleName = 'Auth';
        else if (routePath.includes('/requests')) moduleName = 'PurchaseRequests';
        else if (routePath.includes('/quotes')) moduleName = 'Quotes';
        else if (routePath.includes('/products')) moduleName = 'Products';
        else if (routePath.includes('/payments')) moduleName = 'Payments';
        else if (routePath.includes('/deals')) moduleName = 'Deals';
        else if (routePath.includes('/admin') || routePath.includes('/supervisor')) moduleName = 'Admin/Supervisor';
        else if (routePath.includes('/ratings') || routePath.includes('/notifications') || routePath.includes('/chat')) moduleName = 'Engagement';
        else if (routePath.includes('pricing')) moduleName = 'Pricing/AI';
        
        const middlewares = ep.middlewares.join(', ');
        const requiresJWT = middlewares.includes('protect') || middlewares.includes('optionalAuth') ? 'Yes' : 'No';
        const requiresRole = middlewares.includes('checkRole') || middlewares.includes('restrictTo') || middlewares.includes('authorize') ? 'Yes' : 'No';
        
        let tested = 'No';
        if (
            (routePath === '/api/auth/register' && method === 'POST') ||
            (routePath === '/api/auth/login' && method === 'POST') ||
            (routePath === '/api/requests' && method === 'POST') ||
            (routePath === '/api/requests/:id/status' && method === 'PUT') ||
            (routePath === '/api/products' && method === 'POST') ||
            (routePath === '/api/requests/:id/quotes' && method === 'POST') ||
            (routePath === '/api/quotes/:id/accept' && method === 'POST')
        ) {
            tested = 'Yes';
        }

        routesList.push({
            method,
            fullPath: routePath,
            middlewares,
            jwt: requiresJWT,
            role: requiresRole,
            module: moduleName,
            tested,
            frontendUsed: 'No',
            frontendFile: '-',
            frontendFunc: '-'
        });
    });
});

function findFrontendUsage() {
    let frontendFiles = [];
    function scan(dir) {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir);
        files.forEach(f => {
            const full = path.join(dir, f);
            if (fs.statSync(full).isDirectory()) scan(full);
            else if (f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.ts') || f.endsWith('.tsx')) {
                frontendFiles.push({ name: f, full, content: fs.readFileSync(full, 'utf8') });
            }
        });
    }
    scan(frontendDir);

    routesList.forEach(route => {
        let cleanPath = route.fullPath.replace(/:[a-zA-Z0-9_]+/g, '');
        if (cleanPath.endsWith('/')) cleanPath = cleanPath.slice(0, -1);

        let used = false;
        let usedFile = '-';
        let usedFunc = '-';

        frontendFiles.forEach(ff => {
            if (ff.content.includes(cleanPath)) {
                used = true;
                usedFile = ff.name;
                const funcMatch = ff.content.match(/(?:function|const)\s+([a-zA-Z0-9_]+)\s*=?\s*\(.*?\)/);
                if (funcMatch) usedFunc = funcMatch[1];
            }
        });

        route.frontendUsed = used ? 'Yes' : 'Unused by Frontend';
        route.frontendFile = usedFile;
        route.frontendFunc = usedFunc;
    });
}
findFrontendUsage();

// Generate Final Output File
let md = `# Production Readiness Matrix & E2E Test Plan\n\n`;

md += `## المرحلة الأولى: الـ APIs الفعلية (Express Runtime)\n`;
md += `| Method | Full Route | Middleware | JWT | Role | Module |\n`;
md += `|---|---|---|---|---|---|\n`;
routesList.forEach(r => {
    md += `| ${r.method} | \`${r.fullPath}\` | ${r.middlewares} | ${r.jwt} | ${r.role} | ${r.module} |\n`;
});

md += `\n## المرحلة الثانية: Frontend Mapping\n`;
md += `| Route | Used in Frontend? | File | Function |\n`;
md += `|---|---|---|---|\n`;
routesList.forEach(r => {
    md += `| \`${r.fullPath}\` | ${r.frontendUsed} | ${r.frontendFile} | ${r.frontendFunc} |\n`;
});

md += `\n## المرحلة الثالثة: Backend APIs with No Frontend Consumer\n`;
md += `| Method | Route | السبب المحتمل | النوع | الإجراء |\n`;
md += `|---|---|---|---|---|\n`;
routesList.filter(r => r.frontendUsed === 'Unused by Frontend').forEach(r => {
    let type = (r.fullPath.includes('admin') || r.fullPath.includes('supervisor')) ? 'Admin API' : 'Future Feature';
    let action = type === 'Admin API' ? 'ربطه بلوحة تحكم الإدارة' : 'مراجعته للنسخة القادمة';
    md += `| ${r.method} | \`${r.fullPath}\` | واجهة المستخدم لم تكتمل بعد | ${type} | ${action} |\n`;
});

const total = routesList.length;
const tested = routesList.filter(r => r.tested === 'Yes').length;
const remaining = total - tested;
const coverage = ((tested / total) * 100).toFixed(2);

md += `\n## المرحلة الرابعة: Coverage الحقيقي\n`;
md += `* Total APIs = ${total}\n`;
md += `* Tested APIs = ${tested}\n`;
md += `* Untested APIs = ${remaining}\n`;
md += `* Coverage % = ${coverage}%\n`;

md += `\n## المرحلة الخامسة: Test Matrix\n`;
md += `| Route | Positive | Negative | Auth | Validation | Business Rules | Status |\n`;
md += `|---|---|---|---|---|---|---|\n`;
routesList.forEach(r => {
    md += `| \`${r.fullPath}\` | 200/201 | 400 Bad Request | ${r.jwt === 'Yes' ? '401 Unauthorized' : 'N/A'} | Joi Schema | Domain logic | ${r.tested === 'Yes' ? 'Tested' : 'Untested'} |\n`;
});

md += `\n## المرحلة السادسة: Production Readiness Matrix\n`;
md += `* عدد الـ APIs الحقيقي: **${total}**\n`;
md += `* عدد المختبر: **${tested}**\n`;
md += `* عدد غير المختبر: **${remaining}**\n`;
md += `* نسبة الجاهزية الفعلية: **${coverage}%**\n\n`;

fs.writeFileSync('C:/Users/s9khr/.gemini/antigravity-ide/brain/dcf712ce-e192-4ff9-9256-438f8b80604f/implementation_plan.md', md);
console.log("Runtime Matrix built successfully!");
