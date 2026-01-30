const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                   
  idleTimeoutMillis: 30000,  
  connectionTimeoutMillis: 5000, 
});

pool.on('connect', () => console.log('PostgreSQL pool connected'));
pool.on('error', (err) => console.error('Unexpected DB error', err));

module.exports = pool;
