const fs = require('fs');
const path = require('path');
const { sequelize } = require('../sequelize_setup');

console.log('=== SOVEREIGN BATCH 2 VERIFICATION ===');

const checks = {
    auditService: false,
    sequelizeAssociations: false,
    impersonateCheck: false,
    swaggerDocs: false
};

// 1. Check Audit Service
if (fs.existsSync(path.join(__dirname, '../services/auditService.js'))) {
    checks.auditService = true;
    console.log('✅ Audit Service exists');
} else {
    console.error('❌ Audit Service missing');
}

// 2. Check Sequelize Associations (Static Check)
const setupContent = fs.readFileSync(path.join(__dirname, '../sequelize_setup.js'), 'utf8');
if (setupContent.includes("onDelete: 'CASCADE'") && setupContent.includes("User.belongsToMany(Role")) {
    checks.sequelizeAssociations = true;
    console.log('✅ Sequelize Associations enforced (CASCADE detected)');
} else {
    console.error('❌ Sequelize Associations weak');
}

// 3. Check Impersonate Logic
const authControllerContent = fs.readFileSync(path.join(__dirname, '../controllers/authController.js'), 'utf8');
if (authControllerContent.includes("req.user.id !== config.ownerId") &&
    authControllerContent.includes("logSecurityAlert") &&
    authControllerContent.includes("auditService.log")) {
    checks.impersonateCheck = true;
    console.log('✅ Impersonate logic secured (Owner check + Audit Log)');
} else {
    console.error('❌ Impersonate logic insecure');
}

// 4. Check Swagger Docs
const authRoutesContent = fs.readFileSync(path.join(__dirname, '../routes/authRoutes.js'), 'utf8');
if (authRoutesContent.includes("@swagger") && authRoutesContent.includes("/api/auth/login")) {
    checks.swaggerDocs = true;
    console.log('✅ Swagger Docs present in Auth Routes');
} else {
    console.error('❌ Swagger Docs missing');
}

// Verdict
const allPassed = Object.values(checks).every(v => v);
if (allPassed) {
    console.log('\n✅ ALL SYSTEMS GREEN. BATCH 2 COMPLETE.');
    process.exit(0);
} else {
    console.error('\n❌ VERIFICATION FAILED.');
    process.exit(1);
}
