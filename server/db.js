const path = require('path');
const Database = require('better-sqlite3');

const dbFile = process.env.DB_FILE || path.join(__dirname, 'water_system.sqlite');
const db = new Database(dbFile);

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  turbidity REAL NOT NULL,
  quality_status TEXT NOT NULL,
  main_valve_status TEXT NOT NULL,
  diversion_valve_status TEXT NOT NULL,
  filtration_active INTEGER NOT NULL,
  pump_status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS filtration_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  turbidity REAL NOT NULL,
  action TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`);

const DEFAULT_THRESHOLD = 5.0; // NTU example

function getThreshold() {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('threshold');
  if (!row) {
    setThreshold(DEFAULT_THRESHOLD);
    return DEFAULT_THRESHOLD;
  }
  const val = parseFloat(row.value);
  return Number.isNaN(val) ? DEFAULT_THRESHOLD : val;
}

function setThreshold(value) {
  db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run('threshold', String(value));
}

function insertReading(reading) {
  const stmt = db.prepare(`
    INSERT INTO readings (
      timestamp, turbidity, quality_status,
      main_valve_status, diversion_valve_status,
      filtration_active, pump_status
    ) VALUES (@timestamp, @turbidity, @quality_status,
              @main_valve_status, @diversion_valve_status,
              @filtration_active, @pump_status)
  `);
  const result = stmt.run({
    ...reading,
    filtration_active: reading.filtration_active ? 1 : 0
  });
  return result.lastInsertRowid;
}

function insertFiltrationLog(entry) {
  const stmt = db.prepare(`
    INSERT INTO filtration_logs (timestamp, turbidity, action)
    VALUES (@timestamp, @turbidity, @action)
  `);
  stmt.run(entry);
}

function getLatestReading() {
  return db
    .prepare(
      'SELECT * FROM readings ORDER BY datetime(timestamp) DESC LIMIT 1'
    )
    .get();
}

function getReadingsSince(isoTimestamp) {
  return db
    .prepare(
      'SELECT * FROM readings WHERE datetime(timestamp) >= datetime(?) ORDER BY datetime(timestamp)'
    )
    .all(isoTimestamp);
}

function getFiltrationLogs(limit = 100) {
  return db
    .prepare(
      'SELECT * FROM filtration_logs ORDER BY datetime(timestamp) DESC LIMIT ?'
    )
    .all(limit);
}

module.exports = {
  getThreshold,
  setThreshold,
  insertReading,
  insertFiltrationLog,
  getLatestReading,
  getReadingsSince,
  getFiltrationLogs,
  DEFAULT_THRESHOLD
};

