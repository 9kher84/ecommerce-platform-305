const { Sequelize, DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

async function setupProdRBAC() {
  const sequelize = new Sequelize('postgresql://neondb_owner:npg_hudwpP4y8bvU@ep-rapid-river-ap7l6xha-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require', {
    dialect: 'postgres',
    logging: false
  });

  try {
    await sequelize.authenticate();
    
    const t = await sequelize.transaction();
    try {
      console.log("🚀 Setting up RBAC Roles and Permissions on Production...");

      // Define minimal Models manually for production setup
      const Role = sequelize.define('Role', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        name: { type: DataTypes.STRING, unique: true },
        description: DataTypes.STRING
      }, { tableName: 'roles' });

      const Permission = sequelize.define('Permission', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        key: { type: DataTypes.STRING, unique: true },
        description: DataTypes.STRING
      }, { tableName: 'permissions' });

      const RolePermission = sequelize.define('RolePermission', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }
      }, { tableName: 'role_permissions' });

      Role.belongsToMany(Permission, { through: RolePermission, foreignKey: "roleId" });
      Permission.belongsToMany(Role, { through: RolePermission, foreignKey: "permissionId" });

      // 1. Create Roles
      const roles = [
        { id: uuidv4(), name: "buyer", description: "Buyer role" },
        { id: uuidv4(), name: "seller", description: "Seller role" },
        { id: uuidv4(), name: "admin", description: "Admin role" },
      ];

      for (const r of roles) {
        await sequelize.query(`
          INSERT INTO roles (id, name, description, "createdAt", "updatedAt") 
          VALUES ('${r.id}', '${r.name}', '${r.description}', NOW(), NOW())
          ON CONFLICT (name) DO NOTHING
        `, { transaction: t });
      }

      // 2. Create Permissions
      const permissions = [
        { id: uuidv4(), key: "CREATE_REQUEST", description: "Create purchase request" },
        { id: uuidv4(), key: "VIEW_REQUESTS", description: "View requests" },
        { id: uuidv4(), key: "CREATE_QUOTE", description: "Submit price quote" },
        { id: uuidv4(), key: "ACCEPT_QUOTE", description: "Accept a quote" },
      ];

      for (const p of permissions) {
        await sequelize.query(`
          INSERT INTO permissions (id, key, description, "createdAt", "updatedAt") 
          VALUES ('${p.id}', '${p.key}', '${p.description}', NOW(), NOW())
          ON CONFLICT (key) DO NOTHING
        `, { transaction: t });
      }

      // 3. Link Permissions to Roles
      await sequelize.query(`
        INSERT INTO role_permissions ("roleId", "permissionId")
        SELECT r.id, p.id
        FROM roles r, permissions p
        WHERE r.name = 'buyer' AND p.key IN ('CREATE_REQUEST', 'VIEW_REQUESTS', 'ACCEPT_QUOTE')
        ON CONFLICT DO NOTHING
      `, { transaction: t });

      await sequelize.query(`
        INSERT INTO role_permissions ("roleId", "permissionId")
        SELECT r.id, p.id
        FROM roles r, permissions p
        WHERE r.name = 'seller' AND p.key IN ('VIEW_REQUESTS', 'CREATE_QUOTE')
        ON CONFLICT DO NOTHING
      `, { transaction: t });

      // 4. Re-run the user_roles linking because previously roles were empty
      console.log("⏳ Re-linking users to roles in user_roles...");
      await sequelize.query(`
        INSERT INTO user_roles ("userId", "roleId", "createdAt", "updatedAt")
        SELECT u.id, r.id, NOW(), NOW()
        FROM users u
        JOIN roles r ON r.name = u.role::text
        ON CONFLICT DO NOTHING
      `, { transaction: t });
      console.log("✅ Users re-linked to roles");

      await t.commit();
      console.log("✅ Production RBAC Setup Complete.");
      
    } catch (e) {
      await t.rollback();
      throw e;
    }
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Fatal Error:", err.message);
    process.exit(1);
  }
}

setupProdRBAC();
