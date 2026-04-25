const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const db = new Database(path.join(dataDir, 'db.sqlite'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS processed_messages (
    message_id TEXT PRIMARY KEY,
    processed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT UNIQUE NOT NULL,
    history TEXT DEFAULT '[]',
    last_message_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT NOT NULL,
    name TEXT,
    date TEXT,
    time TEXT,
    service TEXT,
    status TEXT DEFAULT 'confirmed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('[DB] Tablas inicializadas correctamente');

function getOrCreateConversation(phoneNumber) {
  db.prepare(`
    INSERT OR IGNORE INTO conversations (phone_number, history, last_message_at)
    VALUES (?, '[]', CURRENT_TIMESTAMP)
  `).run(phoneNumber);

  const row = db.prepare('SELECT * FROM conversations WHERE phone_number = ?').get(phoneNumber);
  console.log(`[DB] getOrCreateConversation: phone=${phoneNumber}, mensajes=${JSON.parse(row.history).length}`);
  return row;
}

function updateHistory(phoneNumber, history) {
  const truncated = history.slice(-20);
  db.prepare(`
    UPDATE conversations
    SET history = ?, last_message_at = CURRENT_TIMESTAMP
    WHERE phone_number = ?
  `).run(JSON.stringify(truncated), phoneNumber);
  console.log(`[DB] updateHistory: phone=${phoneNumber}, mensajes guardados=${truncated.length}`);
}

function createAppointment({ phoneNumber, name, date, time, service }) {
  const result = db.prepare(`
    INSERT INTO appointments (phone_number, name, date, time, service)
    VALUES (?, ?, ?, ?, ?)
  `).run(phoneNumber, name, date, time, service);
  console.log(`[DB] createAppointment: id=${result.lastInsertRowid}, phone=${phoneNumber}, servicio=${service}, fecha=${date} ${time}`);
  return result.lastInsertRowid;
}

function isDuplicateMessage(messageId) {
  const existing = db.prepare('SELECT message_id FROM processed_messages WHERE message_id = ?').get(messageId);
  if (existing) return true;
  db.prepare('INSERT INTO processed_messages (message_id) VALUES (?)').run(messageId);
  return false;
}

function isSlotTaken(date, time) {
  const row = db.prepare(`
    SELECT id FROM appointments
    WHERE date = ? AND time = ? AND status = 'confirmed'
  `).get(date, time);
  return !!row;
}

module.exports = { getOrCreateConversation, updateHistory, createAppointment, isSlotTaken, isDuplicateMessage };
