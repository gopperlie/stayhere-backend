import dotenv from "dotenv";
dotenv.config();
import debugModule from "debug";
import pkg from "pg";
const { Pool } = pkg;
const debug = debugModule("persistence:db");
// Create a new instance of Pool, which manages PostgreSQL connections
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    debug("executed query", { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error("Error executing query", { text, err });
    throw err; // Re-throw the error after logging it
  }
};

const getClient = async () => {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;
  // set a timeout of 5 seconds, after which we will log this client's last query
  const timeout = setTimeout(() => {
    console.error("A client has been checked out for more than 5 seconds!");
    console.error(
      `The last executed query on this client was: ${client.lastQuery}`
    );
  }, 5000);
  // monkey patch the query method to keep track of the last query executed
  client.query = (...args) => {
    client.lastQuery = args;
    return query.apply(client, args);
  };
  client.release = () => {
    // clear our timeout
    clearTimeout(timeout);
    // set the methods back to their old un-monkey-patched version
    client.query = query;
    client.release = release;
    return release.apply(client);
  };
  return client;
};

// Test the connection (optional)
// pool.connect((err) => {
//   if (err) {
//     console.error("Connection error", err.stack);
//   } else {
//     debug("Connected to Neon PostgreSQL");
//   }
// });
export { pool, query, getClient };
