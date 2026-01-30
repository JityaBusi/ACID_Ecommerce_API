const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderById,
  cancelOrder
} = require('../controllers/orders.controller');

router.post('/', createOrder);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);

module.exports = router; // ✅ must export router
