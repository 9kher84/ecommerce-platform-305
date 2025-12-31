const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

/**
 * ========================================================================
 * COMMAND 7: READ/WRITE SPLITTING CONFIGURATION
 * ========================================================================
 * تطبيق فصل القراءة والكتابة لتحسين الأداء وتوزيع الحمل
 * 
 * - Write Operations → DB_HOST (Master)
 * - Read Operations → DB_READ_HOSTS (Replicas) with Round-Robin
 * - Fallback: إذا لم تكن Read Replicas متوفرة، يستخدم DB_HOST للقراءة والكتابة
 */

// Parse Read Replicas from environment variable
const parseReadHosts = (hostsString) => {
  if (!hostsString || hostsString.trim() === '') {
    return [];
  }
  return hostsString.split(',').map(host => host.trim()).filter(host => host !== '');
};

const readHosts = parseReadHosts(process.env.DB_READ_HOSTS);
const hasReadReplicas = readHosts.length > 0;

console.log('🔧 Database Configuration:');
console.log(`   - Master Host (Write): ${process.env.DB_HOST}`);
console.log(`   - Read Replicas: ${hasReadReplicas ? readHosts.join(', ') : 'None (using master for reads)'}`);

// Sequelize Configuration with Read/Write Splitting
const sequelizeConfig = {
  dialect: 'postgres',
  logging: false, // Set to console.log for debugging
  pool: {
    max: 10,        // Increased for better concurrency
    min: 2,         // Minimum connections
    acquire: 30000, // Maximum time to acquire connection
    idle: 10000     // Maximum idle time
  }
};

// إعداد الاتصال بقاعدة البيانات
let sequelize;

if (hasReadReplicas) {
  // ========================================================================
  // READ/WRITE SPLITTING ENABLED
  // ========================================================================
  console.log('✅ Read/Write Splitting: ENABLED');

  sequelize = new Sequelize(
    process.env.DB_DATABASE,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      ...sequelizeConfig,
      replication: {
        read: readHosts.map(host => ({
          host: host,
          username: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE,
          port: process.env.DB_PORT || 5432
        })),
        write: {
          host: process.env.DB_HOST,
          username: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE,
          port: process.env.DB_PORT || 5432
        }
      }
    }
  );
} else {
  // ========================================================================
  // FALLBACK: SINGLE HOST (NO READ/WRITE SPLITTING)
  // ========================================================================
  console.log('⚠️  Read/Write Splitting: DISABLED (using single host)');

  sequelize = new Sequelize(
    process.env.DB_DATABASE,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      ...sequelizeConfig,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432
    }
  );
}

/**
 * ========================================================================
 * COMMAND 8: CONNECTION POOL MONITORING
 * ========================================================================
 * مراقبة تجمع الاتصالات لتتبع توجيه الاستعلامات
 */

// Enable connection pool monitoring
setTimeout(() => {
  if (sequelize.connectionManager && sequelize.connectionManager.pool) {
    const pool = sequelize.connectionManager.pool;

    // Monitor connection acquisition
    pool.on('acquire', (connection) => {
      const host = connection?.config?.host || 'unknown';
      const isWrite = host === process.env.DB_HOST;
      const connectionType = isWrite ? '✍️  WRITE (Master)' : '📖 READ (Replica)';

      console.log(`[Pool] Connection acquired: ${connectionType} - ${host}`);
    });

    // Monitor connection release
    pool.on('release', (connection) => {
      const host = connection?.config?.host || 'unknown';
      console.log(`[Pool] Connection released: ${host}`);
    });

    // Monitor connection errors
    pool.on('error', (error) => {
      console.error(`[Pool] Connection error:`, error.message);
    });

    console.log('✅ Connection Pool Monitoring: ENABLED');
  }
}, 1000);

module.exports = { sequelize, parseReadHosts, hasReadReplicas };