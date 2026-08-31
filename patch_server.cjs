const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

const importAdd = `import Database from 'better-sqlite3';
const db = new Database('sil_insurance.db');
db.pragma('journal_mode = WAL');

db.exec(\`
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
\`);

const users = {
  get size() { return db.prepare('SELECT COUNT(*) as count FROM users').get().count; },
  get: (username) => db.prepare('SELECT * FROM users WHERE username = ?').get(username),
  set: (username, u) => db.prepare('INSERT OR REPLACE INTO users (id, username, name, email, role, status, passwordHash, createdAt, lastLogin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(u.id, u.username, u.name, u.email, u.role, u.status, u.passwordHash, u.createdAt, u.lastLogin),
  has: (username) => !!db.prepare('SELECT 1 FROM users WHERE username = ?').get(username),
  values: () => db.prepare('SELECT * FROM users').all(),
  update: (id, updates) => {
    const keys = Object.keys(updates);
    if(keys.length === 0) return;
    const sets = keys.map(k => \`\${k} = ?\`).join(', ');
    const vals = keys.map(k => updates[k]);
    db.prepare(\`UPDATE users SET \${sets} WHERE id = ?\`).run(...vals, id);
  }
};

const auditEvents = {
  unshift: (event) => {
    db.prepare('INSERT INTO audit_events (id, at, action, userId, details) VALUES (?, ?, ?, ?, ?)').run(event.id, event.at, event.action, event.userId, event.details ? JSON.stringify(event.details) : null);
  },
  filter: (fn) => db.prepare('SELECT * FROM audit_events ORDER BY at DESC').all().map(e => ({...e, details: e.details ? JSON.parse(e.details) : null})).filter(fn),
  slice: (start, end) => db.prepare('SELECT * FROM audit_events ORDER BY at DESC LIMIT ? OFFSET ?').all(end - start, start).map(e => ({...e, details: e.details ? JSON.parse(e.details) : null})),
  get length() { return db.prepare('SELECT COUNT(*) as count FROM audit_events').get().count; },
  set length(l) {}
};
\n\n`;

server = server.replace(
  'import crypto from "crypto";',
  'import crypto from "crypto";\n' + importAdd
);

server = server.replace(
  'const users = new Map<string, User>();',
  ''
);

server = server.replace(
  'const auditEvents: any[] = [];',
  ''
);

// We need to also add API endpoints for CRM leads.
const crmEndpoints = `
// CRM Endpoints
app.get("/api/leads", optionalAuth, (req: any, res) => {
  try {
    const leads = db.prepare('SELECT * FROM client_leads ORDER BY createdAt DESC').all();
    res.json({ leads });
  } catch(e) {
    res.status(500).json({error: "Database error"});
  }
});

app.post("/api/leads", optionalAuth, (req: any, res) => {
  const l = req.body;
  if (!l.clientName || !l.phone) return res.status(400).json({error: "Missing required fields"});
  
  const newId = \`lead-\${Date.now()}\`;
  const createdAt = new Date().toISOString();
  
  try {
    db.prepare('INSERT INTO client_leads (id, clientName, phone, email, productType, policyNumber, expiryDate, estimatedPremium, status, lastContactedDate, notes, vehicleOrPropertyDetails, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      newId, l.clientName, l.phone, l.email || "", l.productType || "casco", l.policyNumber || "", l.expiryDate || "", l.estimatedPremium || 0, l.status || "pending", l.lastContactedDate || "", l.notes || "", l.vehicleOrPropertyDetails || "", createdAt
    );
    const saved = db.prepare('SELECT * FROM client_leads WHERE id = ?').get(newId);
    res.json({ lead: saved });
  } catch(e) {
    res.status(500).json({error: "Database error"});
  }
});

app.patch("/api/leads/:id/status", optionalAuth, (req: any, res) => {
  try {
    db.prepare('UPDATE client_leads SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
    res.json({ ok: true });
  } catch(e) {
    res.status(500).json({error: "Database error"});
  }
});
`;

server = server.replace(
  '// AI Property Photo Scan',
  crmEndpoints + '\n// AI Property Photo Scan'
);

fs.writeFileSync('server.ts', server);
console.log("server.ts patched");
