const pool = require('../db/pool');

/**
 * POST /api/orders
 * Create a new order with ACID transaction
 */
exports.createOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const { user_id, items } = req.body;

    if (!user_id || !items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Invalid request: user_id and items are required');
    }

    await client.query('BEGIN');

    // ===========================
    // Step 1: Calculate totalAmount
    // ===========================
    let totalAmount = 0;

    for (const item of items) {
      const { product_id, quantity } = item;

      // Validate product_id and quantity
      if (!product_id || !quantity || quantity <= 0) {
        throw new Error('Invalid product_id or quantity');
      }

      // Fetch product price and stock with row lock
      const productResult = await client.query(
        `SELECT price, stock
         FROM products
         WHERE id = $1
         FOR UPDATE`,
        [product_id]
      );

      if (productResult.rowCount === 0) {
        throw new Error(`Product ${product_id} not found`);
      }

      const { price, stock } = productResult.rows[0];

      // Check stock
      if (stock < quantity) {
        throw new Error(`Insufficient stock for product ${product_id}`);
      }

      // Add to totalAmount
      totalAmount += parseFloat(price) * quantity;
    }

    // ===========================
    // Step 2: Insert order with totalAmount
    // ===========================
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, status, total_amount)
       VALUES ($1, 'CREATED', $2)
       RETURNING id`,
      [user_id, totalAmount]
    );
    const orderId = orderResult.rows[0].id;

    // ===========================
    // Step 3: Insert order_items and update stock
    // ===========================
    for (const item of items) {
      const { product_id, quantity } = item;

      const productResult = await client.query(
        `SELECT price FROM products WHERE id = $1`,
        [product_id]
      );

      const price = parseFloat(productResult.rows[0].price);

      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, product_id, quantity, price]
      );

      await client.query(
        `UPDATE products
         SET stock = stock - $1
         WHERE id = $2`,
        [quantity, product_id]
      );
    }

    // ===========================
    // Step 4: Simulate payment
    // ===========================
    await client.query(
      `INSERT INTO payments (order_id, amount, status)
       VALUES ($1, $2, 'SUCCESS')`,
      [orderId, totalAmount]
    );

    // ===========================
    // Step 5: Update order status to PAID
    // ===========================
    await client.query(
      `UPDATE orders
       SET status = 'PAID'
       WHERE id = $1`,
      [orderId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Order created successfully',
      order_id: orderId
    });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

/**
 * GET /api/orders/:id
 * Fetch order and its items
 */
exports.getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const orderResult = await pool.query(
      `SELECT * FROM orders WHERE id = $1`,
      [id]
    );

    if (orderResult.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const itemsResult = await pool.query(
      `SELECT product_id, quantity, price
       FROM order_items
       WHERE order_id = $1`,
      [id]
    );

    res.json({
      order: orderResult.rows[0],
      items: itemsResult.rows
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

/**
 * PUT /api/orders/:id/cancel
 * Idempotent cancel order
 */
exports.cancelOrder = async (req, res) => {
  const client = await pool.connect();
  const { id } = req.params;

  try {
    await client.query('BEGIN');

    // Lock order row
    const orderResult = await client.query(
      `SELECT status FROM orders WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (orderResult.rowCount === 0) {
      throw new Error('Order not found');
    }

    const status = orderResult.rows[0].status;

    if (status === 'CANCELLED') {
      await client.query('ROLLBACK');
      return res.json({ message: 'Order already cancelled' });
    }

    if (status === 'PAID') {
      throw new Error('Paid orders cannot be cancelled');
    }

    // Restore stock
    const itemsResult = await client.query(
      `SELECT product_id, quantity
       FROM order_items
       WHERE order_id = $1`,
      [id]
    );

    for (const item of itemsResult.rows) {
      await client.query(
        `UPDATE products
         SET stock = stock + $1
         WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // Update order status
    await client.query(
      `UPDATE orders SET status = 'CANCELLED' WHERE id = $1`,
      [id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Order cancelled successfully' });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};
