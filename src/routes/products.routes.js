const express = require('express');
const router = express.Router();
const { getAllProducts } = require('../controllers/products.controller');

// Route
router.get('/', getAllProducts);

module.exports = router;  


