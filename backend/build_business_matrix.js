const fs = require('fs');

const runtimeRoutes = JSON.parse(fs.readFileSync('runtime_routes.json', 'utf8'));

// 1. Classify and filter APIs
const apiClassifications = [];
const capabilities = {
    'Authentication': { total: 0, tested: 0, apis: [] },
    'Buyer Journey': { total: 0, tested: 0, apis: [] },
    'Seller Journey': { total: 0, tested: 0, apis: [] },
    'RFQ Lifecycle': { total: 0, tested: 0, apis: [] },
    'Quote Lifecycle': { total: 0, tested: 0, apis: [] },
    'Negotiation': { total: 0, tested: 0, apis: [] },
    'Deal Lifecycle': { total: 0, tested: 0, apis: [] },
    'Payment Lifecycle': { total: 0, tested: 0, apis: [] },
    'Notification Lifecycle': { total: 0, tested: 0, apis: [] },
    'Dashboard': { total: 0, tested: 0, apis: [] },
    'Inventory': { total: 0, tested: 0, apis: [] }
};

let excludedCount = 0;
let adminCount = 0;
let businessTotal = 0;
let businessTested = 0;

runtimeRoutes.forEach(ep => {
    ep.methods.forEach(method => {
        let route = ep.path.replace(/:[a-zA-Z0-9_]+/g, ':id');
        if (route.endsWith('/') && route.length > 1) route = route.slice(0, -1);
        
        let classification = 'Business Critical';
        let capability = null;
        let isTested = false;

        // Tested baseline from previous successful cycle
        if (
            (route === '/api/auth/register' && method === 'POST') ||
            (route === '/api/auth/login' && method === 'POST') ||
            (route === '/api/requests' && method === 'POST') ||
            (route === '/api/requests/:id/status' && method === 'PUT') ||
            (route === '/api/products' && method === 'POST') ||
            (route === '/api/requests/:id/quotes' && method === 'POST') ||
            (route === '/api/quotes/:id/accept' && method === 'POST')
        ) {
            isTested = true;
        }

        // Classification Rules
        if (route.includes('/graphql') || route.includes('/health') || route.includes('/mcp') || route.includes('/internal')) {
            classification = 'Infrastructure';
        } else if (route.includes('/supervisor') || route.includes('/admin')) {
            classification = 'Admin';
        } else if (route.includes('/owner')) {
            classification = 'Owner';
        } else {
            // It's a Business API
            if (route.includes('reports') || route.includes('radar')) classification = 'Business Supporting';
            
            // Assign Capability
            if (route.includes('/auth')) capability = 'Authentication';
            else if (route === '/api/users' || route.includes('/api/users/profile')) capability = 'Buyer Journey'; // Or Seller, simplified
            else if (route.includes('/requests') && !route.includes('quotes')) capability = 'RFQ Lifecycle';
            else if (route.includes('/quotes') && !route.includes('negotiate')) capability = 'Quote Lifecycle';
            else if (route.includes('/quotes/:id/negotiate') || route.includes('/quotes/:id/respond')) capability = 'Negotiation';
            else if (route.includes('/deals')) capability = 'Deal Lifecycle';
            else if (route.includes('/payments') || route.includes('/invoice')) capability = 'Payment Lifecycle';
            else if (route.includes('/notifications')) capability = 'Notification Lifecycle';
            else if (route.includes('/dashboard')) capability = 'Dashboard';
            else if (route.includes('/products') || route.includes('/categories')) capability = 'Inventory';
            else capability = 'Buyer Journey'; // default fallback for generic endpoints
        }

        if (['Infrastructure', 'Internal', 'Debug', 'Owner'].includes(classification)) {
            excludedCount++;
        } else if (classification === 'Admin') {
            adminCount++;
        } else {
            businessTotal++;
            if (isTested) businessTested++;
            
            if (capability && capabilities[capability]) {
                capabilities[capability].total++;
                if (isTested) capabilities[capability].tested++;
                capabilities[capability].apis.push({ method, route, isTested });
            }
        }
    });
});

let md = `# Business Capability & Production Readiness Matrix\n\n`;

md += `> [!NOTE]\n`;
md += `> تم تنقية التقرير واستبعاد جميع الـ APIs الخاصة بـ (Infrastructure, Internal, MCP, Health, Debug, Owner) لكونها لا تخدم رحلة العميل. كما تم عزل الـ (Admin APIs) لأنها ليست جزءاً من جاهزية المنتج التجاري المباشر للمستخدم النهائي.\n\n`;

md += `## 1. ملخص تنقية النظام (API Filtration Summary)\n`;
md += `- **إجمالي الـ APIs المسجلة:** ${runtimeRoutes.reduce((acc, r) => acc + r.methods.length, 0)}\n`;
md += `- **المُستبعدة (Infrastructure, Internal, etc):** ${excludedCount}\n`;
md += `- **واجهات الإدارة (Admin/Supervisor):** ${adminCount} (معزولة)\n`;
md += `- **واجهات الأعمال الحقيقية (Business APIs):** ${businessTotal}\n\n`;

md += `## 2. Business Capability Matrix\n`;
md += `| Capability | Total Scenarios | Tested | Untested | Coverage % | Risk Level (If Untested) |\n`;
md += `|---|---|---|---|---|---|\n`;

let totalBusiness = 0;
let totalTestedBusiness = 0;

Object.keys(capabilities).forEach(cap => {
    let t = capabilities[cap].total;
    let ok = capabilities[cap].tested;
    let un = t - ok;
    let cov = t > 0 ? ((ok / t) * 100).toFixed(1) : '100.0';
    
    totalBusiness += t;
    totalTestedBusiness += ok;

    let risk = 'Low';
    if (cap === 'Payment Lifecycle' || cap === 'Authentication' || cap === 'Deal Lifecycle') risk = 'Critical';
    else if (cap === 'RFQ Lifecycle' || cap === 'Quote Lifecycle' || cap === 'Inventory') risk = 'High';
    else if (cap === 'Negotiation' || cap === 'Notification Lifecycle') risk = 'Medium';
    
    if (t > 0) {
        md += `| **${cap}** | ${t} | ${ok} | ${un} | ${cov}% | ${risk} |\n`;
    }
});

md += `\n## 3. تفاصيل قدرات الأعمال (Business Capabilities Detail)\n`;
Object.keys(capabilities).forEach(cap => {
    if (capabilities[cap].total > 0) {
        md += `\n### ${cap}\n`;
        md += `| Method | Route | Status | Scenario / Action |\n`;
        md += `|---|---|---|---|\n`;
        capabilities[cap].apis.forEach(api => {
            let action = api.isTested ? 'تم التحقق من الـ Happy Path' : 'يتطلب اختبار E2E وسيناريوهات الفشل';
            md += `| ${api.method} | \`${api.route}\` | ${api.isTested ? '✅ Tested' : '❌ Untested'} | ${action} |\n`;
        });
    }
});

md += `\n## 4. الجاهزية التجارية الفعلية (True Business Readiness)\n`;
let realCov = totalBusiness > 0 ? ((totalTestedBusiness / totalBusiness) * 100).toFixed(2) : 0;
md += `> [!IMPORTANT]\n`;
md += `> **نسبة الجاهزية الفعلية للمنتج التجاري (Business Readiness): ${realCov}%**\n\n`;
md += `**الاستنتاج القابل للتحقق:**\n`;
md += `النظام التجاري قادر على إكمال دورة شراء مثالية (واحدة) من التسجيل وحتى قبول العرض.\n`;
md += `لكن لإطلاق المشروع تجارياً (Production Ready)، يجب التركيز حصرياً على تغطية واجهات الـ **Critical** و **High Risk** (بإجمالي ${totalBusiness - totalTestedBusiness} سيناريو متبقي ضمن قدرات الأعمال الأساسية).\n`;

fs.writeFileSync('C:/Users/s9khr/.gemini/antigravity-ide/brain/dcf712ce-e192-4ff9-9256-438f8b80604f/implementation_plan.md', md);
console.log("Business Matrix generated!");
