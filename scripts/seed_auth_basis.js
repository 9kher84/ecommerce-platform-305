const { sequelize, Permission, Role, RolePermission, Region, City } = require('../backend/sequelize_setup');
const { v4: uuidv4 } = require('uuid');

const PERMISSIONS = [
    'MANAGE_USERS', 'VIEW_USERS',
    'MANAGE_REQUESTS', 'VIEW_REQUESTS', 'APPROVE_REQUESTS', 'CREATE_REQUEST',
    'MANAGE_QUOTES', 'VIEW_QUOTES', 'CREATE_QUOTE',
    'MANAGE_PAYMENTS', 'VIEW_PAYMENTS',
    'MANAGE_CITIES', 'VIEW_CITIES',
    'VIEW_MARKETPLACE' // New: Permission to browse published requests
];

const ROLES = {
    'admin': ['MANAGE_USERS', 'MANAGE_REQUESTS', 'MANAGE_QUOTES', 'VIEW_PAYMENTS', 'MANAGE_CITIES', 'VIEW_MARKETPLACE'],
    'super_admin': Array.from(PERMISSIONS), // All
    'city_manager': ['VIEW_USERS', 'VIEW_REQUESTS', 'APPROVE_REQUESTS', 'VIEW_QUOTES', 'VIEW_CITIES', 'VIEW_MARKETPLACE'], // Can see market in city
    'buyer': ['VIEW_REQUESTS', 'VIEW_QUOTES', 'CREATE_REQUEST'], // Added Creation
    'seller': ['VIEW_REQUESTS', 'MANAGE_QUOTES', 'CREATE_QUOTE', 'VIEW_MARKETPLACE'] // Added Marketplace Access
};

const CONTEXTS = {
    'Central': ['Riyadh', 'Qassim'],
    'Western': ['Jeddah', 'Mecca', 'Medina'],
    'Eastern': ['Dammam', 'Khobar']
};

async function seed() {
    console.log('🌱 Starting Auth Basis Seeding...');
    try {
        await sequelize.authenticate();

        // 1. Seed Permissions
        for (const key of PERMISSIONS) {
            const [perm, created] = await Permission.findOrCreate({
                where: { key },
                defaults: { id: uuidv4(), description: `Auto-seeded permission ${key}` }
            });
            if (created) console.log(`   + Permission: ${key}`);
        }

        // 2. Seed Roles & Assign Permissions
        for (const [roleName, permKeys] of Object.entries(ROLES)) {
            const [role, created] = await Role.findOrCreate({
                where: { name: roleName },
                defaults: { id: uuidv4(), description: `Standard role ${roleName}` }
            });
            if (created) console.log(`   + Role: ${roleName}`);

            // Find Permissions
            const perms = await Permission.findAll({ where: { key: permKeys } });
            await role.setPermissions(perms); // Idempotent Set (Replace existing associations)
            console.log(`     > Assigned ${perms.length} permissions to ${roleName}`);
        }

        // 3. Seed Contexts (Regions & Cities)
        for (const [regionName, cities] of Object.entries(CONTEXTS)) {
            const [region, regCreated] = await Region.findOrCreate({
                where: { name: regionName },
                defaults: { id: uuidv4() }
            });
            if (regCreated) console.log(`   + Region: ${regionName}`);

            for (const cityName of cities) {
                const [city, cityCreated] = await City.findOrCreate({
                    where: { name: cityName, regionId: region.id },
                    defaults: { id: uuidv4() }
                });
                if (cityCreated) console.log(`     + City: ${cityName}`);
            }
        }

        console.log('✅ Seeding Complete.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
}

seed();
