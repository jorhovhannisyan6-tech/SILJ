const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(
  "get size() { return db.prepare('SELECT COUNT(*) as count FROM users').get().count; }",
  "get size() { return (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count; }"
);
server = server.replace(
  "get: (username) => db.prepare('SELECT * FROM users WHERE username = ?').get(username)",
  "get: (username) => db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any"
);
server = server.replace(
  "values: () => db.prepare('SELECT * FROM users').all(),",
  "values: () => db.prepare('SELECT * FROM users').all() as any[],"
);
server = server.replace(
  "get length() { return db.prepare('SELECT COUNT(*) as count FROM audit_events').get().count; }",
  "get length() { return (db.prepare('SELECT COUNT(*) as count FROM audit_events').get() as any).count; }"
);
server = server.replace(
  "filter: (fn) => db.prepare('SELECT * FROM audit_events ORDER BY at DESC').all().map(e => ({...e, details: e.details ? JSON.parse(e.details) : null})).filter(fn)",
  "filter: (fn: any) => (db.prepare('SELECT * FROM audit_events ORDER BY at DESC').all() as any[]).map(e => ({...e, details: e.details ? JSON.parse(e.details) : null})).filter(fn)"
);
server = server.replace(
  "slice: (start, end) => db.prepare('SELECT * FROM audit_events ORDER BY at DESC LIMIT ? OFFSET ?').all(end - start, start).map(e => ({...e, details: e.details ? JSON.parse(e.details) : null}))",
  "slice: (start: number, end: number) => (db.prepare('SELECT * FROM audit_events ORDER BY at DESC LIMIT ? OFFSET ?').all(end - start, start) as any[]).map(e => ({...e, details: e.details ? JSON.parse(e.details) : null}))"
);
server = server.replace(
  "app.get(\"/api/admin/users\",auth,requireRole(\"admin\",\"manager\"),(_req,res)=>res.json({users:[...users.values()].map(({passwordHash,...u})=>u)}));",
  "app.get(\"/api/admin/users\",auth,requireRole(\"admin\",\"manager\"),(_req,res)=>res.json({users:[...users.values()].map(({passwordHash,...u}: any)=>u)}));"
);

fs.writeFileSync('server.ts', server);
console.log("Types patched");
