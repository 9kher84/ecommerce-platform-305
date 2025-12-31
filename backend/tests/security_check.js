const { sequelize } = require('../sequelize_setup');
const fs = require('fs');
const path = require('path');

const baseUrl = 'http://localhost:5000/api';

async function testSecurityFixes() {
    try {
        console.log('🔄 Connecting to database (for cleanup/verification)...');
        await sequelize.authenticate();
        console.log('✅ Database connected.');

        // Test 1: Mass Assignment Vulnerability via API
        console.log('\n🧪 Test 1: Attempting to register admin user via Mass Assignment (API)...');
        const testEmail = `hacker_${Date.now()}@example.com`;

        const res = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Hacker',
                email: testEmail,
                password: 'password123',
                role: 'admin' // ⚠️ Attempting to inject admin role
            })
        });

        const data = await res.json();

        if (res.status === 201) {
            // Check the returned user object
            if (data.user.role === 'buyer') {
                console.log('✅ PASS: API ignored "admin" role and assigned "buyer".');
            } else {
                console.error(`❌ FAIL: API created user with role "${data.user.role}". Security vulnerability exists!`);
                process.exit(1);
            }
        } else if (res.status === 400 && (data.message.includes('role') || JSON.stringify(data.errors).includes('role'))) {
            console.log('✅ PASS: API rejected "admin" role via Validation Middleware.');
        } else {
            console.error(`❌ FAIL: API request failed with status ${res.status}`);
            console.error(data);
            process.exit(1);
        }

        // Test 2: Check Sync Configuration (Static Check)
        console.log('\n🧪 Test 2: Checking sequelize_setup.js for force: true...');
        const setupContent = fs.readFileSync(path.join(__dirname, '../sequelize_setup.js'), 'utf8');

        if (setupContent.includes('force: true')) {
            console.error('❌ FAIL: Found "force: true" in sequelize_setup.js. Data loss risk exists!');
            process.exit(1);
        } else {
            console.log('✅ PASS: "force: true" not found in sequelize_setup.js.');
        }

        console.log('\n🎉 All security checks passed!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error during test:', error);
        process.exit(1);
    }
}

testSecurityFixes();
