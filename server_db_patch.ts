import Database from 'better-sqlite3';
const db = new Database('sil_insurance.db');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    name TEXT,
    email TEXT,
    role TEXT,
    status TEXT,
    passwordHash TEXT,
    createdAt TEXT,
    lastLogin TEXT
  );

  CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY,
    at TEXT,
    action TEXT,
    userId TEXT,
    details TEXT
  );
  
  CREATE TABLE IF NOT EXISTS client_leads (
    id TEXT PRIMARY KEY,
    clientName TEXT,
    phone TEXT,
    email TEXT,
    productType TEXT,
    policyNumber TEXT,
    expiryDate TEXT,
    estimatedPremium REAL,
    status TEXT,
    lastContactedDate TEXT,
    notes TEXT,
    vehicleOrPropertyDetails TEXT,
    createdAt TEXT
  );
`);

export const DB = db;
