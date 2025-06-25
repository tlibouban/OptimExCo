const { Pool } = require("pg");

// Use DATABASE_URL from environment variables (Render.com style)
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "DATABASE_URL not defined. Add it to Render environment variables."
  );
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }, // Render postgres requires SSL
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
