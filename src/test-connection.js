require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect()
  .then(() => console.log('Database connected!'))
  .catch(err => console.error('Connection failed:', err.message))
  .finally(() => pool.end());
