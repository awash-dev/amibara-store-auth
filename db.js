const { Pool } = require("pg");
require("dotenv").config();

let pool;

try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Use all caps for environment variables
  });

  console.log("✅ PostgreSQL connected successfully.");
} catch (error) {
  console.error("❌ Database connection error:", error);
  process.exit(1); // Exit if connection fails
}

module.exports = pool;
