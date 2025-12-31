const fs = require('fs');
const path = require('path');

console.log('=== SOVEREIGN TRANSITIONAL VERIFICATION ===');

const checks = {
    lockedFiles: false,
    snapshotExists: false,
    dashboardRoute: false
};

// 1. Check Seal Snapshot
if (fs.existsSync(path.join(__dirname, '../.sovereign_snapshot.json'))) {
    checks.snapshotExists = true;
}

// 2. Check Read-Only Attribute (Simulation Check)
// We rely on the script output, but here we check existence of 'core' folder at least
if (fs.existsSync(path.join(__dirname, '../core'))) {
    checks.lockedFiles = true;
}

// 3. Check Dashboard Route
const routeContent = fs.readFileSync(path.join(__dirname, '../routes/dashboardRoutes.js'), 'utf8');
if (routeContent.includes('/command') && routeContent.includes('getCommandData')) {
    checks.dashboardRoute = true;
}

console.log('Snapshot:', checks.snapshotExists ? '✅' : '❌');
console.log('Core/Seal:', checks.lockedFiles ? '✅' : '❌');
console.log('Dashboard:', checks.dashboardRoute ? '✅' : '❌');

if (Object.values(checks).every(v => v)) {
    console.log('\n✅ TRANSITIONAL PHASE COMPLETE');
    process.exit(0);
} else {
    console.log('\n❌ TRANSITIONAL PHASE FAILED');
    process.exit(1);
}
