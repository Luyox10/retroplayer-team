import { pool } from '../database/pool.js';
import { AppError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';
import { requireAuth } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const STATUSES = ['pending', 'paid', 'failed', 'refunded'];

function getBaseUrl(req) {
  return `http://${req.headers.host || 'localhost'}`;
}

function getPagination(url) {
  const rawLimit = url.searchParams.get('limit');
  const rawOffset = url.searchParams.get('offset');
  const limit = Math.min(parseInt(rawLimit || '20', 10) || 20, 100);
  const offset = Math.max(parseInt(rawOffset || '0', 10) || 0, 0);
  return { limit, offset };
}

export async function createOrder(req, res) {
  const user = await requireAuth(req);
  const { product_id, payment_method } = req.body || {};
  if (!product_id) throw new AppError('product_id is required', 400, 'VALIDATION_ERROR');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [products] = await connection.execute(
      'SELECT id, name, price, currency, is_active FROM products WHERE id = ? FOR UPDATE',
      [product_id]
    );
    if (products.length === 0) throw new AppError('Product not found', 404, 'NOT_FOUND');
    const product = products[0];
    if (!product.is_active) throw new AppError('Product is not active', 400, 'VALIDATION_ERROR');

    const [owned] = await connection.execute(
      'SELECT id FROM user_assets WHERE user_id = ? AND product_id = ?',
      [user.id, product_id]
    );
    if (owned.length > 0) throw new AppError('Product already owned', 409, 'CONFLICT');

    const [pending] = await connection.execute(
      'SELECT id FROM orders WHERE user_id = ? AND product_id = ? AND status = "pending" FOR UPDATE',
      [user.id, product_id]
    );
    if (pending.length > 0) throw new AppError('Pending order already exists', 409, 'CONFLICT');

    const [result] = await connection.execute(
      `INSERT INTO orders (user_id, product_id, total_amount, currency, status, payment_method)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      [user.id, product_id, product.price, product.currency || 'USD', payment_method || null]
    );

    await connection.commit();
    sendSuccess(res, 201, { id: result.insertId, total_amount: product.price, currency: product.currency || 'USD', status: 'pending' }, 'Order created');
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function getOrders(req, res) {
  const user = await requireAuth(req);
  const url = new URL(req.url, getBaseUrl(req));
  const { limit, offset } = getPagination(url);

  const [rows] = await pool.execute(
    `SELECT o.id, o.product_id, p.name as product_name, o.total_amount, o.currency, o.status, o.payment_method, o.payment_reference, o.created_at, o.updated_at
     FROM orders o
     JOIN products p ON o.product_id = p.id
     WHERE o.user_id = ?
     ORDER BY o.created_at DESC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    [user.id]
  );

  const [[{ total }]] = await pool.execute(
    'SELECT COUNT(*) AS total FROM orders WHERE user_id = ?',
    [user.id]
  );

  sendSuccess(res, 200, { orders: rows, meta: { total, limit, offset } });
}

export async function getOrderById(req, res) {
  const user = await requireAuth(req);
  const url = new URL(req.url, getBaseUrl(req));
  const id = Number(url.pathname.split('/').pop());
  if (Number.isNaN(id) || id <= 0) throw new AppError('Invalid order ID', 400, 'VALIDATION_ERROR');

  const [rows] = await pool.execute(
    `SELECT o.id, o.product_id, p.name as product_name, o.total_amount, o.currency, o.status, o.payment_method, o.payment_reference, o.created_at, o.updated_at
     FROM orders o
     JOIN products p ON o.product_id = p.id
     WHERE o.id = ? AND o.user_id = ?`,
    [id, user.id]
  );

  if (rows.length === 0) throw new AppError('Order not found', 404, 'NOT_FOUND');
  sendSuccess(res, 200, { order: rows[0] });
}

export async function adminGetOrders(req, res) {
  await requireAdmin(req);
  const url = new URL(req.url, getBaseUrl(req));
  const { limit, offset } = getPagination(url);
  const status = url.searchParams.get('status');
  const userId = url.searchParams.get('user_id');

  const conditions = ['1=1'];
  const params = [];
  if (status) { conditions.push('o.status = ?'); params.push(status); }
  if (userId) { conditions.push('o.user_id = ?'); params.push(userId); }

  const [rows] = await pool.execute(
    `SELECT o.id, o.user_id, o.product_id, p.name as product_name, o.total_amount, o.currency, o.status, o.payment_method, o.payment_reference, o.created_at, o.updated_at
     FROM orders o
     JOIN products p ON o.product_id = p.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY o.created_at DESC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    params
  );

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM orders o WHERE ${conditions.join(' AND ')}`,
    params
  );

  sendSuccess(res, 200, { orders: rows, meta: { total, limit, offset } });
}

export async function adminUpdateOrder(req, res) {
  await requireAdmin(req);
  const url = new URL(req.url, getBaseUrl(req));
  const id = Number(url.pathname.split('/').pop());
  if (Number.isNaN(id) || id <= 0) throw new AppError('Invalid order ID', 400, 'VALIDATION_ERROR');

  const { status, payment_method, payment_reference } = req.body || {};
  if (!status) throw new AppError('status is required', 400, 'VALIDATION_ERROR');
  if (!STATUSES.includes(status)) throw new AppError(`status must be one of: ${STATUSES.join(', ')}`, 400, 'VALIDATION_ERROR');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [orders] = await connection.execute(
      'SELECT id, user_id, product_id, status FROM orders WHERE id = ? FOR UPDATE',
      [id]
    );
    if (orders.length === 0) throw new AppError('Order not found', 404, 'NOT_FOUND');

    const oldStatus = orders[0].status;
    const userId = orders[0].user_id;
    const productId = orders[0].product_id;

    if (status === 'paid' && oldStatus !== 'paid') {
      const [existing] = await connection.execute(
        'SELECT id FROM user_assets WHERE user_id = ? AND product_id = ?',
        [userId, productId]
      );
      if (existing.length === 0) {
        await connection.execute(
          'INSERT INTO user_assets (user_id, product_id, quantity) VALUES (?, ?, 1)',
          [userId, productId]
        );
      }
    }

    await connection.execute(
      'UPDATE orders SET status = ?, payment_method = ?, payment_reference = ? WHERE id = ?',
      [status, payment_method || null, payment_reference || null, id]
    );

    await connection.commit();
    sendSuccess(res, 200, null, 'Order updated');
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function adminDeleteOrder(req, res) {
  await requireAdmin(req);
  const url = new URL(req.url, getBaseUrl(req));
  const id = Number(url.pathname.split('/').pop());
  if (Number.isNaN(id) || id <= 0) throw new AppError('Invalid order ID', 400, 'VALIDATION_ERROR');

  const [result] = await pool.execute('DELETE FROM orders WHERE id = ?', [id]);
  if (result.affectedRows === 0) throw new AppError('Order not found', 404, 'NOT_FOUND');
  sendSuccess(res, 200, null, 'Order deleted');
}
