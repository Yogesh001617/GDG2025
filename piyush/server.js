// server.js
// Place this file in the project root (same level as the 'piyush' folder).
// Run with: node server.js   (or npm start if package.json start points to server.js)

require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
app.use(cors());

// Serve static frontend from the "piyush" folder
const STATIC_DIR = path.join(__dirname, 'piyush');
app.use(express.static(STATIC_DIR));

// Parse JSON for regular routes
app.use(express.json());

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? Stripe(stripeSecret) : null;
const PORT = process.env.PORT || 3000;

// SQLite DB path (data.db in project root by default)
const DB_PATH = process.env.SQLITE_PATH || path.join(__dirname, 'data.db');
const db = new Database(DB_PATH);

// Create bookings table if it doesn't exist
db.prepare(
  `CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    serviceId TEXT,
    serviceName TEXT,
    amount_cents INTEGER,
    currency TEXT DEFAULT 'usd',
    customerName TEXT,
    email TEXT,
    date TEXT,
    time TEXT,
    status TEXT DEFAULT 'pending',
    sessionId TEXT,
    paymentIntentId TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`
).run();

// Prepared statements
const insertBookingStmt = db.prepare(
  `INSERT INTO bookings (serviceId, serviceName, amount_cents, currency, customerName, email, date, time, status)
   VALUES (@serviceId, @serviceName, @amount_cents, @currency, @customerName, @email, @date, @time, 'pending')`
);
const updateBookingSessionStmt = db.prepare(
  `UPDATE bookings SET sessionId = @sessionId, updated_at = CURRENT_TIMESTAMP WHERE id = @id`
);
const markBookingPaidStmt = db.prepare(
  `UPDATE bookings SET status = 'paid', paymentIntentId = @paymentIntentId, updated_at = CURRENT_TIMESTAMP WHERE id = @id`
);
const getBookingByIdStmt = db.prepare(`SELECT * FROM bookings WHERE id = ?`);
const getAllBookingsStmt = db.prepare(`SELECT * FROM bookings ORDER BY created_at DESC`);
const updateBookingStatusStmt = db.prepare(
  `UPDATE bookings SET status = @status, updated_at = CURRENT_TIMESTAMP WHERE id = @id`
);

// Basic auth for admin API
function basicAuth(req, res, next) {
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASS || 'password';
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Authentication required');
  }
  const base64 = auth.split(' ')[1];
  const [user, pass] = Buffer.from(base64, 'base64').toString().split(':');
  if (user === adminUser && pass === adminPass) return next();
  res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
  return res.status(401).send('Invalid credentials');
}

// Root route: serve home page (your file is home.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'home.html'));
});

// Endpoint to create checkout session and create a pending booking
app.post('/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(500).send('Stripe not configured on server.');

  const {
    serviceId = 'unknown',
    serviceName = 'Service',
    price = '0',
    customerName,
    email,
    date,
    time
  } = req.body || {};

  if (!email || !customerName || !date || !time) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const amountCents = Math.round(Number(price) * 100);
  if (Number.isNaN(amountCents) || amountCents < 0) {
    return res.status(400).json({ error: 'Invalid price.' });
  }

  // Insert pending booking
  const info = {
    serviceId,
    serviceName,
    amount_cents: amountCents,
    currency: 'usd',
    customerName,
    email,
    date,
    time
  };
  const result = insertBookingStmt.run(info);
  const bookingId = result.lastInsertRowid;

  try {
    const successUrl = process.env.STRIPE_SUCCESS_URL || `${req.headers.origin}/success`;
    const cancelUrl = process.env.STRIPE_CANCEL_URL || `${req.headers.origin}/cancel`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${serviceName} — ${date} ${time}`,
            metadata: { bookingId: String(bookingId) }
          },
          unit_amount: amountCents
        },
        quantity: 1
      }],
      client_reference_id: String(bookingId),
      customer_email: email,
      metadata: {
        bookingId: String(bookingId),
        serviceId,
        serviceName,
        customerName,
        date,
        time
      },
      success_url: successUrl,
      cancel_url: cancelUrl
    });

    updateBookingSessionStmt.run({ sessionId: session.id, id: bookingId });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Unable to create checkout session.' });
  }
});

// Stripe webhook (raw body)
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers['stripe-signature'];
  let event;

  if (webhookSecret && stripe) {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed.', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    try {
      event = JSON.parse(req.body.toString());
    } catch (err) {
      console.error('Failed to parse webhook body', err);
      return res.status(400).send('Invalid payload');
    }
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const bookingId = session.client_reference_id || (session.metadata && session.metadata.bookingId);
    const paymentIntentId = session.payment_intent || null;
    if (bookingId) {
      try {
        markBookingPaidStmt.run({ paymentIntentId: paymentIntentId || null, id: bookingId });
        console.log(`Booking ${bookingId} marked as paid (session ${session.id})`);
      } catch (err) {
        console.error('Error updating booking status:', err);
      }
    } else {
      console.warn('Webhook missing bookingId');
    }
  }

  res.json({ received: true });
});

// Admin APIs (protected)
app.get('/api/bookings', basicAuth, (req, res) => {
  const rows = getAllBookingsStmt.all();
  res.json(rows);
});

app.post('/api/bookings/:id/status', basicAuth, (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  if (!id || !status) return res.status(400).json({ error: 'Missing id or status' });
  try {
    updateBookingStatusStmt.run({ id, status });
    const updated = getBookingByIdStmt.get(id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to update status' });
  }
});

// Simple success/cancel pages if not present; serve from disk if files exist in static folder
app.get('/success', (req, res) => {
  const p = path.join(STATIC_DIR, 'success.html');
  if (require('fs').existsSync(p)) return res.sendFile(p);
  res.send(`<html><body style="font-family:system-ui;padding:2rem"><h1>Payment successful!</h1><p>Thanks — your appointment is booked.</p></body></html>`);
});
app.get('/cancel', (req, res) => {
  const p = path.join(STATIC_DIR, 'cancel.html');
  if (require('fs').existsSync(p)) return res.sendFile(p);
  res.send(`<html><body style="font-family:system-ui;padding:2rem"><h1>Payment canceled</h1><p>Your booking was not completed.</p></body></html>`);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Serving static files from ${STATIC_DIR}`);
  console.log(`SQLite DB path: ${DB_PATH}`);
});