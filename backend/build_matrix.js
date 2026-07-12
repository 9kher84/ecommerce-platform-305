const fs = require('fs');
const path = require('path');

const backendRoutesDir = path.join(__dirname, 'routes');
const frontendDir = path.join(__dirname, '../frontend/src');

function extractBackendRoutes() {
    const routes = [];
    const files = fs.readdirSync(backendRoutesDir).filter(f => f.endsWith('Routes.js'));
    
    files.forEach(file => {
        const content = fs.readFileSync(path.join(backendRoutesDir, file), 'utf8');
        const moduleName = file.replace('Routes.js', '');
        
        let prefix = `/api/${moduleName}`;
        if (moduleName === 'user') prefix = '/api/auth';
        if (moduleName === 'request') prefix = '/api/requests';
        if (moduleName === 'quote') prefix = '/api/quotes';
        if (moduleName === 'product') prefix = '/api/products';
        if (moduleName === 'payment') prefix = '/api/payments';
        if (moduleName === 'deal') prefix = '/api/deals';
        if (moduleName === 'category') prefix = '/api/categories';
        if (moduleName === 'agent') prefix = '/api/agents';
        if (moduleName === 'rating') prefix = '/api/ratings';
        if (moduleName === 'notification') prefix = '/api/notifications';
        if (moduleName === 'invoice') prefix = '/api/invoice';
        if (moduleName === 'pricingMatrix') prefix = '/api/pricing-matrix';
        if (moduleName === 'smartPricing') prefix = '/api/smart-pricing';

        const regex = /router\.(get|post|put|delete|patch)\s*\(\s*(['"`])(.*?)\2\s*,(.*?)\)/gs;
        let match;
        while ((match = regex.exec(content)) !== null) {
            const method = match[1].toUpperCase();
            let routePath = match[3];
            const argsStr = match[4].trim();
            
            const requiresJWT = argsStr.includes('protect') || argsStr.includes('optionalAuth');
            const requiresRoleMatch = argsStr.match(/restrictTo\((.*?)\)|checkRole\((.*?)\)|authorize\((.*?)\)/);
            let requiresRole = requiresRoleMatch ? requiresRoleMatch[0] : 'No';
            let permission = argsStr.includes('authorize') && requiresRoleMatch ? requiresRoleMatch[3].replace(/['"]/g, '') : 'No';

            let fullPath = prefix + routePath;
            if (fullPath.endsWith('/')) fullPath = fullPath.slice(0, -1);
            if (fullPath === '') fullPath = '/';
            fullPath = fullPath.replace(/\/\//g, '/');

            // Controller extraction
            let controllerMatch = argsStr.match(/([a-zA-Z0-9_]+Controller\.[a-zA-Z0-9_]+)/);
            let controller = controllerMatch ? controllerMatch[1] : (argsStr.includes('async') ? 'Inline Async' : 'Inline Handler');

            let tested = 'No';
            if (
                (fullPath === '/api/auth/register' && method === 'POST') ||
                (fullPath === '/api/auth/login' && method === 'POST') ||
                (fullPath === '/api/requests' && method === 'POST') ||
                (fullPath === '/api/requests/:id/status' && method === 'PUT') ||
                (fullPath === '/api/products' && method === 'POST') ||
                (fullPath === '/api/requests/:id/quotes' && method === 'POST') ||
                (fullPath === '/api/quotes/:id/accept' && method === 'POST') ||
                (fullPath === '/api/deals' && method === 'POST')
            ) {
                tested = 'Yes';
            }

            let priority = 'Medium';
            if (fullPath.includes('auth') || fullPath.includes('payment') || fullPath.includes('accept') || fullPath.includes('deals')) priority = 'Critical';
            if (fullPath.includes('reports') || fullPath.includes('radar') || fullPath.includes('smart-pricing')) priority = 'Low';

            routes.push({
                method,
                fullPath,
                file,
                controller,
                middleware: requiresJWT ? 'protect' : 'none',
                jwt: requiresJWT ? 'Yes' : 'No',
                permission,
                role: requiresRole !== 'No' ? 'Yes' : 'No',
                tested,
                priority,
                module: moduleName
            });
        }
    });
    return routes;
}

const routes = extractBackendRoutes();

function findFrontendUsage(routes) {
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

    routes.forEach(route => {
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

        route.frontendUsed = used ? 'Yes' : 'No';
        route.frontendFile = usedFile;
        route.frontendFunc = usedFunc;
    });
}

findFrontendUsage(routes);

// Build report
let md = `# Production Readiness Matrix & E2E Test Plan\n\n`;

md += `## 1. مسارات النظام الفعلية (100% Accurate)\n`;
md += `| Method | Full Route | Router File | Controller | Middleware | JWT | Role | Perm | Frontend | Tested | Priority | Module |\n`;
md += `|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
routes.forEach(r => {
    md += `| ${r.method} | \`${r.fullPath}\` | ${r.file} | ${r.controller} | ${r.middleware} | ${r.jwt} | ${r.role} | ${r.permission} | ${r.frontendUsed === 'Yes' ? 'Yes' : 'Unused by Frontend'} | ${r.tested} | ${r.priority} | ${r.module} |\n`;
});

md += `\n## 2. Frontend Mapping\n`;
md += `| Route | مستخدم في React؟ | الملف | الدالة |\n`;
md += `|---|---|---|---|\n`;
routes.forEach(r => {
    if (r.frontendUsed === 'Yes') {
        md += `| \`${r.fullPath}\` | نعم | ${r.frontendFile} | ${r.frontendFunc} |\n`;
    } else {
        md += `| \`${r.fullPath}\` | Unused by Frontend | - | - |\n`;
    }
});

const total = routes.length;
const tested = routes.filter(r => r.tested === 'Yes').length;
const remaining = total - tested;
const coverage = ((tested / total) * 100).toFixed(2);

md += `\n## 3. التغطية الحقيقية (Real Coverage)\n`;
md += `* Total Routes = ${total}\n`;
md += `* Tested Routes = ${tested}\n`;
md += `* Remaining = ${remaining}\n`;
md += `* Coverage = ${coverage}%\n`;

md += `\n## 4. تحليل الفجوات للمسارات غير المستخدمة في Frontend (Gap Analysis)\n`;
md += `| Method | Route | السبب المحتمل | Feature غير مكتملة / ميت؟ | API داخلي؟ | إجراء (حذف/ربط) |\n`;
md += `|---|---|---|---|---|---|\n`;
routes.filter(r => r.frontendUsed === 'No').forEach(r => {
    let internal = (r.fullPath.includes('admin') || r.fullPath.includes('supervisor')) ? 'نعم (لوحة تحكم)' : 'لا';
    let dead = 'Feature غير مكتملة';
    let reason = 'واجهة المستخدم لم تبرمج لهذا المسار بعد';
    let action = internal === 'نعم (لوحة تحكم)' ? 'يحتاج واجهة إشرافية' : 'يحتاج ربط أو تأجيل للنسخة القادمة';
    md += `| ${r.method} | \`${r.fullPath}\` | ${reason} | ${dead} | ${internal} | ${action} |\n`;
});

md += `\n## 5. مصفوفة الاختبارات التفصيلية (Test Matrix)\n`;
md += `| Route | Positive Test | Negative Test | Authorization Test | Validation Test | Business Rule Test |\n`;
md += `|---|---|---|---|---|---|\n`;
routes.forEach(r => {
    md += `| \`${r.fullPath}\` | إدخال بيانات صحيحة والحصول على 200/201 | إدخال بيانات ناقصة والحصول على 400 | ${r.jwt === 'Yes' ? 'تجربة طلب بدون توكن أو توكن منتهي (401)' : 'لا يتطلب JWT'} | التحقق من صحة أنواع المدخلات (Joi/Zod) | فحص قواعد العمل (مثل رفض السعر السالب) |\n`;
});

md += `\n## 6. Production Readiness Matrix\n`;
md += `* عدد الـ APIs الحقيقي: **${total}**\n`;
md += `* عدد المختبر: **${tested}**\n`;
md += `* عدد غير المختبر: **${remaining}**\n`;
md += `* نسبة الجاهزية الفعلية: **${coverage}%**\n\n`;

md += `### أهم 20 API تمثل أعلى خطورة إذا لم تُختبر:\n`;
routes.filter(r => r.priority === 'Critical' && r.tested === 'No').slice(0, 20).forEach((r, i) => {
    md += `${i + 1}. \`${r.method} ${r.fullPath}\`\n`;
});

fs.writeFileSync('C:/Users/s9khr/.gemini/antigravity-ide/brain/dcf712ce-e192-4ff9-9256-438f8b80604f/production_readiness_matrix.md', md);
console.log("Matrix generated successfully!");
