const fs = require('fs');
const path = require('path');

console.log('🕵️ Inspecting Sovereign Docker Setup...');

// Paths
const dockerfile = fs.readFileSync(path.join(__dirname, '../Dockerfile'), 'utf8');
const compose = fs.readFileSync(path.join(__dirname, '../../docker-compose.yml'), 'utf8');

let checks = 0;
let passed = 0;

function assert(condition, message) {
    checks++;
    if (condition) {
        console.log(`✅ PASS: ${message}`);
        passed++;
    } else {
        console.error(`❌ FAIL: ${message}`);
    }
}

// 1. Dockerfile Analysis
console.log('\n📦 Checking Dockerfile:');
assert(dockerfile.includes('FROM node:18-alpine'), 'Base image is node:18-alpine');
assert(dockerfile.includes('HEALTHCHECK'), 'HEALTHCHECK instruction exists');
assert(dockerfile.includes('curl -f http://localhost:5000/api/health'), 'Healthcheck targets correct endpoint');
assert(dockerfile.includes('npm ci --only=production'), 'Clean production install enforced');

// 2. Compose Analysis
console.log('\n🗄️ Checking docker-compose.yml:');
assert(compose.includes('memory: 1G'), 'Memory limit set to 1G');
assert(compose.includes('postgres:14-alpine'), 'Postgres image is strict');
assert(compose.includes('redis:7-alpine'), 'Redis image is strict');
assert(compose.includes('depends_on'), 'Service dependencies defined');
assert(compose.includes('condition: service_healthy'), 'Waits for DB health');

// Summary
console.log(`\n📊 Audit Result: ${passed}/${checks} Checks Passed.`);

if (passed === checks) {
    console.log('🏆 SOVEREIGN CONTAINER STATUS: READY FOR DEPLOYMENT');
    process.exit(0);
} else {
    console.error('⚠️  CONTAINER AUDIT FAILED');
    process.exit(1);
}
