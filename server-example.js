/**
 * server-example.js
 * ------------------------------------------------------------------
 * REFERENCE ONLY — not required for the static site to load, and not
 * required to test the Razorpay TEST-mode checkout. Run this if you
 * want:
 *   (a) real SQL-backed product search behind GET /api/search, and/or
 *   (b) production-grade Razorpay order creation + signature
 *       verification (see the comment block above /create-order).
 *
 * Setup:
 *   npm init -y
 *   npm install express razorpay cors dotenv better-sqlite3
 *   create a .env file with:
 *     RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
 *     RAZORPAY_KEY_SECRET=your_test_key_secret   <-- NEVER expose this in frontend code
 *   node server-example.js
 *
 * On startup this loads products.sql into a local SQLite database
 * file (vantra.db) — no separate database server to install. Swap
 * better-sqlite3 for mysql2/pg if you want MySQL/Postgres instead;
 * the SQL in products.sql works on either with the noted tweaks.
 *
 * Frontend wiring:
 *   - script.js already calls GET /api/search?q=... and falls back
 *     to a local in-memory search if this server isn't running, so
 *     search works immediately once you start this file — no other
 *     frontend changes needed.
 *   - Checkout still uses the simple client-only Razorpay flow by
 *     default. To upgrade to the safer flow, follow the 3 steps in
 *     the comment above POST /create-order.
 * ------------------------------------------------------------------
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Database = require('better-sqlite3');

const app = express();
app.use(cors());
app.use(express.json());

// ---- Load products.sql into a local SQLite file on every boot, so
// the seed data in that file is always the source of truth. ----
const db = new Database(path.join(__dirname, 'vantra.db'));
const seedSql = fs.readFileSync(path.join(__dirname, 'products.sql'), 'utf8');
db.exec(seedSql);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * GET /api/search?q=fridge
 * Searches name / category / variant / spec with a parameterised
 * LIKE query — the search term is always bound, never concatenated
 * into the SQL string, so it can't be used for SQL injection.
 */
app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ results: [] });

  const term = `%${q}%`;
  const stmt = db.prepare(`
    SELECT id, name, category, variant, spec, price, icon, stock
    FROM products
    WHERE name LIKE ? OR category LIKE ? OR variant LIKE ? OR spec LIKE ?
    ORDER BY name
    LIMIT 20
  `);
  const rows = stmt.all(term, term, term, term);

  // shape rows to match what script.js expects ({ cat, ... })
  const results = rows.map(r => ({
    id: r.id, name: r.name, cat: r.category, variant: r.variant,
    spec: r.spec, price: r.price, icon: r.icon, stock: r.stock,
  }));

  res.json({ results });
});

/**
 * GET /api/products
 * Full catalogue, useful for re-populating the product grid from
 * the database instead of the hardcoded array in script.js.
 */
app.get('/api/products', (req, res) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY category, name').all();
  res.json({ products: rows });
});

/**
 * POST /create-order
 * body: { cart: { "mob-01a": 2, "lap-02": 1 } }
 *
 * PRODUCTION NOTE: re-prices the cart from the SQL database so the
 * browser can never just send whatever amount it likes. This is the
 * server-side order-creation step referenced in script.js's checkout
 * handler — wire it in by:
 *   1. POSTing the cart here instead of computing amount in the browser.
 *   2. Passing the returned order.id as `order_id` in the Razorpay
 *      options (instead of a raw `amount`).
 *   3. After payment, POST razorpay_order_id / razorpay_payment_id /
 *      razorpay_signature to /verify-payment below before trusting it.
 */
app.post('/create-order', async (req, res) => {
  try {
    const cart = req.body.cart || {};
    const ids = Object.keys(cart);
    if (!ids.length) return res.status(400).json({ error: 'Empty cart.' });

    const placeholders = ids.map(() => '?').join(',');
    const rows = db.prepare(`SELECT id, price FROM products WHERE id IN (${placeholders})`).all(...ids);
    const priceById = Object.fromEntries(rows.map(r => [r.id, r.price]));

    const amountRupees = ids.reduce((sum, id) => sum + (priceById[id] || 0) * cart[id], 0);
    if (amountRupees <= 0) return res.status(400).json({ error: 'Invalid cart.' });

    const order = await razorpay.orders.create({
      amount: Math.round(amountRupees * 100), // paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });

    res.json({ order, amountRupees });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create order.' });
  }
});

/**
 * POST /verify-payment
 * body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Recomputes the HMAC signature using your Key Secret and compares
 * it to what Razorpay sent back. Only trust the payment if they match.
 */
app.post('/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const isValid = expected === razorpay_signature;

  if (isValid) {
    // mark the order as paid in your database here
    return res.json({ ok: true });
  }
  res.status(400).json({ ok: false, error: 'Signature mismatch.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Vantra reference server (search + payments) running on :${PORT}`));
