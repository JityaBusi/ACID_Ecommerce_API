// src/controllers/products.controller.js
const pool = require('../db/pool');

exports.getAllProducts = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, price, stock FROM products ORDER BY id'
    );
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};
