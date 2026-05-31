module.exports = {
  development: {
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_DATABASE || "ecommerce_db",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: true,
    use_env_variable: "DATABASE_URL"
  },
  test: {
    username: "postgres",
    password: "postgres",
    database: "ecommerce_db",
    host: "localhost",
    port: 5432,
    dialect: "postgres",
    logging: false
  },
  production: {
    use_env_variable: "DATABASE_URL",
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};
