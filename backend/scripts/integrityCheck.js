const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { AuditLog, sequelize } = require('../sequelize_setup');

console.log('=== SOVEREIGN ORDER 9: INTEGRITY CHECK ===');

// Helper (Reused for consistency)
function getHash(fullPath) {
    if (!fs.existsSync(fullPath)) return null;
    if (fs.lstatSync(fullPath).isDirectory()) {
        const files = fs.readdirSync(fullPath);
        const hashes = files.map(f => getHash(path.join(fullPath, f)));
        return crypto.createHash('sha256').update(hashes.join('')).digest('hex');
    } else {
        const content = fs.readFileSync(fullPath);
        return crypto.createHash('sha256').update(content).digest('hex');
    }
}

async function runCheck() {
    try {
        const snapshotPath = path.join(__dirname, '../.sovereign_snapshot.json');
        if (!fs.existsSync(snapshotPath)) {
            throw new Error('Snapshot file missing! Security compromised.');
        }

        const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
        let violationDetected = false;

        for (const [target, expectedHash] of Object.entries(snapshot)) {
            const currentHash = getHash(path.join(__dirname, '../', target));

            if (currentHash !== expectedHash) {
                console.error(`🚨 INTEGRITY VIOLATION: ${target} has been modified!`);
                violationDetected = true;

                // Log to Audit
                if (sequelize) {
                    await AuditLog.create({
                        action: 'INTEGRITY_VIOLATION',
                        resourceType: 'System',
                        resourceId: 'SovereignFile',
                        details: { file: target, expected: expectedHash, actual: currentHash },
                        timestamp: new Date()
                    });
                }
            } else {
                console.log(`✅ ${target}: Integrity Confirmed`);
            }
        }

        if (violationDetected) {
            console.error('❌ SYSTEM COMPROMISED');
            process.exit(1);
        } else {
            console.log('✅ ALL SYSTEMS SECURE');
            process.exit(0);
        }

    } catch (error) {
        console.error('Execution Failed:', error);
        process.exit(1);
    }
}

runCheck();
