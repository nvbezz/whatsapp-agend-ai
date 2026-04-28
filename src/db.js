const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS processed_messages (
      message_id TEXT PRIMARY KEY,
      processed_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      phone_number TEXT UNIQUE NOT NULL,
      history TEXT DEFAULT '[]',
      last_message_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      phone_number TEXT NOT NULL,
      name TEXT,
      date TEXT,
      time TEXT,
      service TEXT,
      status TEXT DEFAULT 'confirmed',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_slot
      ON appointments(date, time) WHERE status = 'confirmed';

    CREATE TABLE IF NOT EXISTS rate_limits (
      phone_number TEXT NOT NULL,
      window_start TIMESTAMPTZ NOT NULL,
      count INT NOT NULL DEFAULT 1
    );
  `);
  console.log('[DB] Tablas inicializadas correctamente');
}

async function getOrCreateConversation(phoneNumber) {
  await pool.query(
    `INSERT INTO conversations (phone_number, history, last_message_at)
     VALUES ($1, '[]', NOW())
     ON CONFLICT (phone_number) DO NOTHING`,
    [phoneNumber]
  );
  const { rows } = await pool.query(
    'SELECT * FROM conversations WHERE phone_number = $1',
    [phoneNumber]
  );
  const row = rows[0];
  console.log(`[DB] getOrCreateConversation: phone=${phoneNumber}, mensajes=${JSON.parse(row.history).length}`);
  return row;
}

async function updateHistory(phoneNumber, history) {
  const truncated = history.slice(-20);
  await pool.query(
    `UPDATE conversations SET history = $1, last_message_at = NOW() WHERE phone_number = $2`,
    [JSON.stringify(truncated), phoneNumber]
  );
  console.log(`[DB] updateHistory: phone=${phoneNumber}, mensajes guardados=${truncated.length}`);
}

async function createAppointment({ phoneNumber, name, date, time, service }) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO appointments (phone_number, name, date, time, service)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [phoneNumber, name, date, time, service]
    );
    const id = rows[0].id;
    console.log(`[DB] createAppointment: id=${id}, phone=${phoneNumber}, servicio=${service}, fecha=${date} ${time}`);
    return id;
  } catch (err) {
    if (err.code === '23505') {
      const slotError = new Error(`Horario ${date} ${time} ya reservado`);
      slotError.name = 'SlotTakenError';
      throw slotError;
    }
    throw err;
  }
}

async function isDuplicateMessage(messageId) {
  const { rowCount } = await pool.query(
    `INSERT INTO processed_messages (message_id) VALUES ($1) ON CONFLICT DO NOTHING`,
    [messageId]
  );
  return rowCount === 0;
}

async function isSlotTaken(date, time) {
  const { rows } = await pool.query(
    `SELECT id FROM appointments WHERE date = $1 AND time = $2 AND status = 'confirmed'`,
    [date, time]
  );
  return rows.length > 0;
}

async function checkRateLimit(phoneNumber) {
  const windowStart = new Date(Date.now() - 5 * 60 * 1000);

  await pool.query(
    `DELETE FROM rate_limits WHERE phone_number = $1 AND window_start < $2`,
    [phoneNumber, windowStart]
  );

  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(count), 0) AS total FROM rate_limits
     WHERE phone_number = $1 AND window_start >= $2`,
    [phoneNumber, windowStart]
  );

  if (parseInt(rows[0].total, 10) >= 20) return false;

  await pool.query(
    `INSERT INTO rate_limits (phone_number, window_start, count) VALUES ($1, NOW(), 1)`,
    [phoneNumber]
  );
  return true;
}

async function cleanupRateLimits() {
  const result = await pool.query(
    `DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 hour'`
  );
  if (result.rowCount > 0) {
    console.log(`[DB] cleanupRateLimits: ${result.rowCount} filas eliminadas`);
  }
}

module.exports = {
  pool,
  initDB,
  getOrCreateConversation,
  updateHistory,
  createAppointment,
  isSlotTaken,
  isDuplicateMessage,
  checkRateLimit,
  cleanupRateLimits,
};
