require("dotenv").config();
const { Pool } = require("pg");

// Create a new instance of Pool, which manages PostgreSQL connections
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

// Test the connection (optional)
pool.connect((err) => {
  if (err) {
    console.error("Connection error", err.stack);
  } else {
    console.log("Connected to Neon PostgreSQL");
  }
});

module.exports = pool;
