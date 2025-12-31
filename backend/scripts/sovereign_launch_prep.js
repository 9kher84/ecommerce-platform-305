const fs = require('fs');
const path = require('path');
const { auditService } = require('../services/auditService');
const { sequelize } = require('../sequelize_setup');

console.log('=== SOVEREIGN LAUNCH PREPARATION ===');

async function prep() {
    try {
        // 1. CLEANUP
        const scriptsToDelete = [
            'sovereign_treachery_test.js',
            'sovereign_stress_test.js',
            'sovereign_structure_test.js'
        ];

        let deletedCount = 0;
        scriptsToDelete.forEach(script => {
            const fullPath = path.join(__dirname, script);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                console.log(`🗑️ Deleted: ${script}`);
                deletedCount++;
            }
        });

        // 2. AUDIT LOGGING
        // Use a valid UUID for the system actor to satisfy Postgres
        const systemUUID = '00000000-0000-0000-0000-000000000000';

        const audit = require('../services/auditService');

        // Log Cleanup
        await audit.log(
            systemUUID,
            'CLEANUP_COMPLETED',
            { filesDeleted: deletedCount, scripts: scriptsToDelete },
            'System',
            'Script'
        );
        console.log('✅ Cleanup logged to Audit.');

        // Log Launch
        await audit.log(
            systemUUID,
            'SOVEREIGN_LAUNCH_INITIATED',
            { mode: 'Sovereign', timestamp: new Date() },
            'System',
            'Lifecycle'
        );
        console.log('✅ Launch event logged to Audit.');

        console.log('=== READY FOR LIFT OFF ===');
        process.exit(0);

    } catch (error) {
        console.error('❌ Prep Failed:', error);
        process.exit(1);
    }
}

prep();
