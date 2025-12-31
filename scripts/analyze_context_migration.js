const fs = require('fs');
const path = require('path');
const { sequelize, User, City, Region, Sequelize } = require('../backend/sequelize_setup');
const { Op } = Sequelize;

async function analyzeContextData() {
    console.log('🌍 Starting Context Awareness Analysis...');
    try {
        await sequelize.authenticate();

        // 1. Load All Cities (The Source of Truth)
        const cities = await City.findAll({ include: [{ model: Region, as: 'region' }] });
        const cityMap = new Map(); // Normalized Name -> City Object

        console.log(`📋 Loaded ${cities.length} canonical cities.`);
        cities.forEach(c => {
            cityMap.set(c.name.trim().toLowerCase(), c);
            cityMap.set(c.name_ar ? c.name_ar.trim() : `AR_${c.name}`, c); // Assuming future Arabic support or just fallback
        });

        // 2. Load Users
        const users = await User.findAll({
            attributes: ['id', 'email', 'name', 'city', 'role'],
            raw: true
        });

        console.log(`👥 Analyzing ${users.length} users for context binding...`);

        const analysis = {
            totalUsers: users.length,
            readyForMigration: [],
            requiresAttention: [],
            missingContext: []
        };

        for (const user of users) {
            // Skip Admins/SuperAdmins from mandatory context? 
            // Strictly speaking, owner might not have a city, but CityManagers MUST.
            const userRole = user.role || 'unknown';
            const userCity = user.city ? user.city.trim() : null;

            if (!userCity) {
                const issue = {
                    userId: user.id,
                    email: user.email,
                    role: userRole,
                    reason: 'No city defined in User profile'
                };

                // High Risk if role implies context
                if (['city_manager', 'marketer'].includes(userRole)) {
                    issue.severity = 'HIGH';
                    analysis.requiresAttention.push(issue);
                } else {
                    issue.severity = 'LOW'; // Buyers/Sellers might be global or optional?
                    analysis.missingContext.push(issue);
                }
                continue;
            }

            // Attempt Match
            const match = cityMap.get(userCity.toLowerCase());

            if (match) {
                analysis.readyForMigration.push({
                    userId: user.id,
                    email: user.email,
                    legacyCity: userCity,
                    targetCityId: match.id,
                    targetRegionId: match.regionId
                });
            } else {
                analysis.requiresAttention.push({
                    userId: user.id,
                    email: user.email,
                    role: userRole,
                    legacyCity: userCity,
                    reason: 'City name does not match any canonical City Entity',
                    severity: 'MEDIUM'
                });
            }
        }

        // 3. Generate Report
        const report = {
            generatedAt: new Date(),
            summary: {
                total: users.length,
                ready: analysis.readyForMigration.length,
                issues: analysis.requiresAttention.length,
                missing: analysis.missingContext.length
            },
            issues: analysis.requiresAttention,
            missing: analysis.missingContext
        };

        const logDir = path.join(__dirname, '../migration_logs');
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

        fs.writeFileSync(
            path.join(logDir, 'context_analysis_report.json'),
            JSON.stringify(report, null, 2)
        );

        console.log('✅ Analysis Complete.');
        console.log(`   - Ready: ${analysis.readyForMigration.length}`);
        console.log(`   - Issues: ${analysis.requiresAttention.length} (See Report)`);
        console.log(`   - Missing: ${analysis.missingContext.length}`);

        process.exit(0);

    } catch (error) {
        console.error('❌ Analysis Failed:', error);
        process.exit(1);
    }
}

analyzeContextData();
