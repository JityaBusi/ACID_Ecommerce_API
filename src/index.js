require('dotenv').config();
const express = require('express');
const pool = require('./db/pool');

// Import routes
const productRoutes = require('./routes/products.routes');
const orderRoutes = require('./routes/orders.routes');

const app = express();

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', db: 'healthy' });
  } catch (error) {
    console.error('DB health check failed:', error.message);
    res.status(503).json({ status: 'error', db: 'unhealthy' });
  }
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Start server
const PORT = process.env.API_PORT || 8080;
app.listen(PORT, async () => {
  try {
    await pool.query('SELECT 1');
    console.log('Database connection verified');
  } catch (err) {
    console.error('Database connection failed on startup:', err.message);
  }

  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // Optional: for testing purposes
