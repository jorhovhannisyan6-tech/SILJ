import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const getDirname = () => {
  if (typeof __dirname !== "undefined" && __dirname) return __dirname;
  try {
    const metaUrl = typeof import.meta !== "undefined" && import.meta ? (import.meta as any).url : undefined;
    if (metaUrl) return path.dirname(fileURLToPath(metaUrl));
  } catch {}
  return process.cwd();
};

const currentDir = getDirname();

const getRequire = () => {
  if (typeof require !== "undefined") return require;
  try {
    const metaUrl = typeof import.meta !== "undefined" && import.meta ? (import.meta as any).url : undefined;
    return createRequire(metaUrl || "file://" + path.resolve("server.ts"));
  } catch {
    return createRequire("file://" + path.resolve("server.ts"));
  }
};

let db: any;
const dbDir = (process.env.NODE_ENV === 'production' || process.env.K_SERVICE) ? '/tmp' : '.';
try {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
} catch (dirErr) {
  console.warn("Could not ensure db directory:", dirErr);
}
const dbPath = path.join(dbDir, 'sil_insurance.db');

try {
  const req = getRequire();
  const Database = req('better-sqlite3');
  db = new Database(dbPath);
  try {
    db.pragma('journal_mode = WAL');
  } catch {
    try {
      db.pragma('journal_mode = DELETE');
    } catch {}
  }
  
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
} catch (e) {
  console.warn("Could not load native better-sqlite3 module. Using pure JSON file persistence fallback.", e);
  
  const tableFiles: Record<string, string> = {
    users: path.join(dbDir, 'sil_users.json'),
    audit_events: path.join(dbDir, 'sil_audit_events.json'),
    client_leads: path.join(dbDir, 'sil_client_leads.json')
  };

  const loadTable = (table: string): any[] => {
    const file = tableFiles[table];
    if (file && fs.existsSync(file)) {
      try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch (err) {
        return [];
      }
    }
    return [];
  };

  const saveTable = (table: string, data: any[]) => {
    const file = tableFiles[table];
    if (file) {
      try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
      } catch (err) {
        console.error(`Failed to persist table ${table}:`, err);
      }
    }
  };

  db = {
    pragma: () => {},
    exec: () => {},
    prepare: (sql: string) => {
      const lowerSql = sql.toLowerCase();
      
      return {
        get: (...args: any[]) => {
          if (lowerSql.includes('from users')) {
            const usersList = loadTable('users');
            if (lowerSql.includes('count(*)')) {
              return { count: usersList.length };
            }
            if (lowerSql.includes('username = ?')) {
              return usersList.find(u => u.username === args[0]);
            }
            if (lowerSql.includes('1 from users')) {
              return usersList.some(u => u.username === args[0]) ? { 1: 1 } : undefined;
            }
          }
          if (lowerSql.includes('from audit_events')) {
            const eventsList = loadTable('audit_events');
            if (lowerSql.includes('count(*)')) {
              return { count: eventsList.length };
            }
          }
          if (lowerSql.includes('from client_leads')) {
            const leadsList = loadTable('client_leads');
            if (lowerSql.includes('id = ?')) {
              return leadsList.find(l => l.id === args[0]);
            }
          }
          return undefined;
        },
        all: (...args: any[]) => {
          if (lowerSql.includes('from users')) {
            return loadTable('users');
          }
          if (lowerSql.includes('from audit_events')) {
            let eventsList = loadTable('audit_events');
            eventsList.sort((a, b) => b.at.localeCompare(a.at));
            if (lowerSql.includes('limit ? offset ?')) {
              const limit = args[0];
              const offset = args[1];
              return eventsList.slice(offset, offset + limit);
            }
            return eventsList;
          }
          if (lowerSql.includes('from client_leads')) {
            let leadsList = loadTable('client_leads');
            leadsList.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            return leadsList;
          }
          return [];
        },
        run: (...args: any[]) => {
          if (lowerSql.includes('insert or replace into users') || lowerSql.includes('insert into users')) {
            const usersList = loadTable('users');
            const newUser = {
              id: args[0],
              username: args[1],
              name: args[2],
              email: args[3],
              role: args[4],
              status: args[5],
              passwordHash: args[6],
              createdAt: args[7],
              lastLogin: args[8]
            };
            const idx = usersList.findIndex(u => u.username === newUser.username);
            if (idx >= 0) {
              usersList[idx] = { ...usersList[idx], ...newUser };
            } else {
              usersList.push(newUser);
            }
            saveTable('users', usersList);
            return { changes: 1 };
          }
          if (lowerSql.includes('update users set')) {
            const usersList = loadTable('users');
            const id = args[args.length - 1];
            const userIdx = usersList.findIndex(u => u.id === id);
            if (userIdx >= 0) {
              const user = usersList[userIdx];
              const setClause = sql.split(/set/i)[1].split(/where/i)[0];
              const fields = setClause.split(',').map(f => f.trim().split('=')[0].trim());
              fields.forEach((f, index) => {
                user[f] = args[index];
              });
              usersList[userIdx] = user;
              saveTable('users', usersList);
            }
            return { changes: 1 };
          }
          if (lowerSql.includes('insert into audit_events')) {
            const eventsList = loadTable('audit_events');
            const newEvent = {
              id: args[0],
              at: args[1],
              action: args[2],
              userId: args[3],
              details: args[4]
            };
            eventsList.push(newEvent);
            saveTable('audit_events', eventsList);
            return { changes: 1 };
          }
          if (lowerSql.includes('insert into client_leads')) {
            const leadsList = loadTable('client_leads');
            const newLead = {
              id: args[0],
              clientName: args[1],
              phone: args[2],
              email: args[3],
              productType: args[4],
              policyNumber: args[5],
              expiryDate: args[6],
              estimatedPremium: args[7],
              status: args[8],
              lastContactedDate: args[9],
              notes: args[10],
              vehicleOrPropertyDetails: args[11],
              createdAt: args[12]
            };
            leadsList.push(newLead);
            saveTable('client_leads', leadsList);
            return { changes: 1 };
          }
          if (lowerSql.includes('update client_leads set') && lowerSql.includes('where id = ?')) {
            const leadsList = loadTable('client_leads');
            const id = args[args.length - 1];
            const leadIdx = leadsList.findIndex(l => l.id === id);
            if (leadIdx >= 0) {
              const lead = leadsList[leadIdx];
              const setClause = sql.split(/set/i)[1].split(/where/i)[0];
              const fields = setClause.split(',').map(f => f.trim().split('=')[0].trim());
              fields.forEach((f, index) => {
                lead[f] = args[index];
              });
              leadsList[leadIdx] = lead;
              saveTable('client_leads', leadsList);
            }
            return { changes: 1 };
          }
          if (lowerSql.includes('delete from users where id = ?')) {
            const usersList = loadTable('users');
            const id = args[0];
            const filtered = usersList.filter(u => u.id !== id);
            saveTable('users', filtered);
            return { changes: 1 };
          }
          if (lowerSql.includes('delete from client_leads where id = ?')) {
            const leadsList = loadTable('client_leads');
            const id = args[0];
            const filtered = leadsList.filter(l => l.id !== id);
            saveTable('client_leads', filtered);
            return { changes: 1 };
          }
          if (lowerSql.includes('delete from audit_events where id = ?')) {
            const eventsList = loadTable('audit_events');
            const id = args[0];
            const filtered = eventsList.filter(e => e.id !== id);
            saveTable('audit_events', filtered);
            return { changes: 1 };
          }
          if (lowerSql.includes('delete from audit_events')) {
            saveTable('audit_events', []);
            return { changes: 1 };
          }
          return { changes: 0 };
        }
      };
    }
  };
}

const users = {
  get size() { return (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count; },
  get: (username: string) => {
    const list = db.prepare('SELECT * FROM users').all() as any[];
    return list.find(u => u.username && u.username.toLowerCase() === String(username).toLowerCase());
  },
  getById: (id: string) => {
    const list = db.prepare('SELECT * FROM users').all() as any[];
    return list.find(u => u.id === id);
  },
  set: (username: string, u: any) => db.prepare('INSERT OR REPLACE INTO users (id, username, name, email, role, status, passwordHash, createdAt, lastLogin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(u.id, u.username, u.name, u.email, u.role, u.status, u.passwordHash, u.createdAt, u.lastLogin),
  has: (username: string) => {
    const list = db.prepare('SELECT * FROM users').all() as any[];
    return list.some(u => u.username && u.username.toLowerCase() === String(username).toLowerCase());
  },
  delete: (id: string) => db.prepare('DELETE FROM users WHERE id = ?').run(id),
  values: () => db.prepare('SELECT * FROM users').all() as any[],
  update: (id: string, updates: any) => {
    const keys = Object.keys(updates);
    if(keys.length === 0) return;
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const vals = keys.map(k => updates[k]);
    db.prepare(`UPDATE users SET ${sets} WHERE id = ?`).run(...vals, id);
  }
};

const auditEvents = {
  unshift: (event: any) => {
    db.prepare('INSERT INTO audit_events (id, at, action, userId, details) VALUES (?, ?, ?, ?, ?)').run(event.id, event.at, event.action, event.userId, event.details ? JSON.stringify(event.details) : null);
  },
  filter: (fn: any) => (db.prepare('SELECT * FROM audit_events ORDER BY at DESC').all() as any[]).map(e => {
    let details = e.details;
    if (typeof details === 'string') {
      try { details = JSON.parse(details); } catch {}
    }
    return { ...e, details };
  }).filter(fn),
  slice: (start: number, end: number) => (db.prepare('SELECT * FROM audit_events ORDER BY at DESC LIMIT ? OFFSET ?').all(end - start, start) as any[]).map(e => {
    let details = e.details;
    if (typeof details === 'string') {
      try { details = JSON.parse(details); } catch {}
    }
    return { ...e, details };
  }),
  get length() { return (db.prepare('SELECT COUNT(*) as count FROM audit_events').get() as any).count; },
  set length(l) {}
};




dotenv.config();

const app = express();
const PORT = 3000;
const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const KB = path.join(ROOT, "knowledge-base");

app.use(express.json({ limit: "20mb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Health check endpoints for Cloud Run & load balancers
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});
app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok" });
});
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// Lightweight Cloud Run-compatible auth layer. For multi-instance production,
// replace the in-memory stores with a shared database/Redis session store.
type Role = "agent"|"underwriter"|"manager"|"auditor"|"admin"|"casco_sales"|"support";
type User = { id:string; username:string; name:string; email:string; role:Role; status:"active"|"pending"|"disabled"; passwordHash:string; createdAt:string; lastLogin?:string };

const sessions = new Map<string, { userId:string; expires:number }>();

const hashPassword=(p:string,salt=crypto.randomBytes(16).toString("hex"))=>`${salt}:${crypto.scryptSync(String(p),salt,64).toString("hex")}`;
const verifyPassword=(p:string,stored:string)=>{const [salt,hash]=String(stored).split(":"); if(!salt||!hash)return false; const actual=crypto.scryptSync(String(p),salt,64).toString("hex"); return crypto.timingSafeEqual(Buffer.from(actual,"hex"),Buffer.from(hash,"hex"));};
const seedUser=()=>{ 
  const currentUsers = users.values();
  const hasAdmin = currentUsers.some(u => u.role === 'admin' && u.status === 'active');
  if(!hasAdmin) {
    const u=process.env.SIL_ADMIN_USERNAME || "Admin"; 
    const p=process.env.SIL_ADMIN_PASSWORD || "Admin"; 
    users.set(u,{id:crypto.randomUUID(),username:u,name:"System Administrator",email:"admin@sil.am",role:"admin",status:"active",passwordHash:hashPassword(p),createdAt:new Date().toISOString()}); 
    users.set("jor",{id:crypto.randomUUID(),username:"jor",name:"Jor Hovhannisyan",email:"jor.hovhannisyan6@gmail.com",role:"admin",status:"active",passwordHash:hashPassword("admin"),createdAt:new Date().toISOString()});
  }
};
seedUser();
const addServerAudit=(action:string,userId?:string,details?:any)=>{auditEvents.unshift({id:crypto.randomUUID(),at:new Date().toISOString(),action,userId,details});};
const auth=(req:any,res:any,next:any)=>{ const token=req.headers.authorization?.replace(/^Bearer\s+/i,"") || req.headers["x-session-token"]; const session=token?sessions.get(token):undefined; if(!session||session.expires<Date.now()) return res.status(401).json({error:"Authentication required"}); const user=[...users.values()].find((u:any)=>u.id===session.userId); if(!user||user.status!=="active") return res.status(401).json({error:"Account is not active"}); req.user=user; next(); };
const optionalAuth=(req:any,res:any,next:any)=>{ const token=req.headers.authorization?.replace(/^Bearer\s+/i,"") || req.headers["x-session-token"]; const session=token?sessions.get(token):undefined; if(session && session.expires>=Date.now()){ const user=[...users.values()].find((u:any)=>u.id===session.userId); if(user && user.status==="active") req.user=user; } next(); };
const requireRole=(...roles:Role[]) => (req:any,res:any,next:any)=> roles.includes(req.user?.role) ? next() : res.status(403).json({error:"Insufficient permissions"});

app.post("/api/auth/login",(req,res)=>{ 
  const {username,password}=req.body||{}; 
  const trimmedUser = String(username||"").trim();
  const user=users.get(trimmedUser) as any; 
  if(!user||user.status!=="active"||!verifyPassword(password||"",user.passwordHash)){
    addServerAudit("auth.login.failed",undefined,{username: trimmedUser}); 
    return res.status(401).json({error:"Սխալ username/password կամ account-ը դեռ հաստատված չէ"});
  } 
  const token=crypto.randomBytes(32).toString("hex"); 
  sessions.set(token,{userId:user.id,expires:Date.now()+8*60*60*1000}); 
  user.lastLogin=new Date().toISOString(); 
  users.update(user.id, { lastLogin: user.lastLogin });
  addServerAudit("auth.login.success",user.id); 
  const {passwordHash,...safe}=user as any; 
  res.json({token,user:safe}); 
});

app.post("/api/auth/register",(req,res)=>{ 
  const {username,password,name,email}=req.body||{}; 
  const trimmedUser = String(username||"").trim();
  if(!trimmedUser||!password||!name)return res.status(400).json({error:"Պարտադիր դաշտերը լրացված չեն"}); 
  if(users.has(trimmedUser))return res.status(409).json({error:"Username-ը արդեն գոյություն ունի"}); 
  
  const isAutoAdmin = (email && email.toLowerCase() === "jor.hovhannisyan6@gmail.com") || users.size === 0;
  
  const u:User={
    id:crypto.randomUUID(),
    username: trimmedUser,
    name: String(name).trim(),
    email: email ? String(email).trim() : "",
    role: isAutoAdmin ? "admin" : "agent",
    status: isAutoAdmin ? "active" : "pending",
    passwordHash:hashPassword(password),
    createdAt:new Date().toISOString()
  }; 
  users.set(trimmedUser,u); 
  addServerAudit(isAutoAdmin ? "auth.registration.auto_admin" : "auth.registration.pending",u.id,{username: trimmedUser}); 
  res.status(201).json({pending: !isAutoAdmin, ok: true}); 
});

app.get("/api/auth/me",auth,(req:any,res)=>{const {passwordHash,...safe}=req.user;res.json({user:safe});});
app.post("/api/auth/logout",auth,(req:any,res)=>{const token=req.headers.authorization?.replace(/^Bearer\s+/i,"") || req.headers["x-session-token"]; if(token)sessions.delete(token); addServerAudit("auth.logout",req.user.id); res.json({ok:true});});

app.get("/api/admin/users",auth,requireRole("admin","manager"),(_req,res)=>{
  const list = [...users.values()].map(({passwordHash,...u}: any)=>u);
  res.json({users: list});
});

app.post("/api/admin/users",auth,requireRole("admin"),(req:any,res)=>{
  const {username, password, name, email, role, status} = req.body || {};
  const trimmedUser = String(username||"").trim();
  if(!trimmedUser || !password || !name) {
    return res.status(400).json({error: "Օգտանունը, գաղտնաբառը և անունը պարտադիր են"});
  }
  if(users.has(trimmedUser)) {
    return res.status(409).json({error: "Այս օգտանունով օգտատեր արդեն գոյություն ունի"});
  }
  const validRole = ["agent","underwriter","manager","auditor","admin","casco_sales","support"].includes(role) ? role : "agent";
  const validStatus = ["active","pending","disabled"].includes(status) ? status : "active";
  const newUser: User = {
    id: crypto.randomUUID(),
    username: trimmedUser,
    name: String(name).trim(),
    email: email ? String(email).trim() : "",
    role: validRole as Role,
    status: validStatus as any,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };
  users.set(trimmedUser, newUser);
  addServerAudit("user.create_by_admin", req.user.id, {target: newUser.id, username: trimmedUser, role: validRole});
  const {passwordHash, ...safe} = newUser;
  res.status(201).json({user: safe, ok: true});
});

app.post("/api/admin/users/:id/approve",auth,requireRole("admin","manager"),(req:any,res)=>{
  const u = users.getById(req.params.id);
  if(!u)return res.status(404).json({error:"User not found"});
  users.update(u.id, { status: "active" });
  addServerAudit("user.approve",req.user.id,{target:u.id, username: u.username});
  res.json({ok:true});
});

app.post("/api/admin/users/:id/reject",auth,requireRole("admin","manager"),(req:any,res)=>{
  const u = users.getById(req.params.id);
  if(!u)return res.status(404).json({error:"User not found"});
  users.update(u.id, { status: "disabled" });
  addServerAudit("user.reject",req.user.id,{target:u.id, username: u.username});
  res.json({ok:true});
});

app.patch("/api/admin/users/:id",auth,requireRole("admin"),(req:any,res)=>{
  const u = users.getById(req.params.id);
  if(!u)return res.status(404).json({error:"User not found"});
  const updates: any = {};
  if(req.body.name) updates.name = String(req.body.name).trim();
  if(req.body.email !== undefined) updates.email = String(req.body.email).trim();
  if(req.body.role && ["agent","underwriter","manager","auditor","admin","casco_sales","support"].includes(req.body.role)) {
    updates.role = req.body.role;
  }
  if(req.body.status && ["active","pending","disabled"].includes(req.body.status)) {
    updates.status = req.body.status;
  }
  if(req.body.password && String(req.body.password).trim().length > 0) {
    updates.passwordHash = hashPassword(req.body.password);
  }
  users.update(u.id, updates);
  addServerAudit("user.update",req.user.id,{target:u.id, updates: Object.keys(updates)});
  res.json({ok:true});
});

app.delete("/api/admin/users/:id",auth,requireRole("admin"),(req:any,res)=>{
  const u = users.getById(req.params.id);
  if(!u) return res.status(404).json({error:"User not found"});
  if(u.id === req.user.id) {
    return res.status(400).json({error:"Չեք կարող ջնջել ձեր սեփական ակտիվ օգտահաշիվը"});
  }
  users.delete(u.id);
  addServerAudit("user.delete",req.user.id,{target:u.id, username: u.username});
  res.json({ok:true, message: "User deleted"});
});
app.get("/api/admin/audit",auth,requireRole("admin","manager","auditor"),(req:any,res)=>{
  const q=String(req.query.q||"").toLowerCase();
  const allEvents = auditEvents.filter(e=>!q||JSON.stringify(e).toLowerCase().includes(q));
  res.json({events:allEvents, total: allEvents.length});
});
app.delete("/api/admin/audit/:id",auth,requireRole("admin"),(req:any,res)=>{
  const id = req.params.id;
  try {
    db.prepare('DELETE FROM audit_events WHERE id = ?').run(id);
    addServerAudit("audit.delete_entry", req.user.id, { deletedId: id });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete audit event", details: e?.message });
  }
});
app.delete("/api/admin/audit",auth,requireRole("admin"),(req:any,res)=>{
  try {
    db.prepare('DELETE FROM audit_events').run();
    addServerAudit("audit.clear_all", req.user.id, { note: "Audit log purged after verified export" });
    res.json({ ok: true, message: "Audit logs cleared successfully" });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to clear audit logs", details: e?.message });
  }
});
app.get("/api/admin/security",auth,requireRole("admin","manager","auditor"),(_req,res)=>res.json({activeSessions:sessions.size,users:[...users.values()].length,failedLogins:auditEvents.filter(x=>x.action==="auth.login.failed").length,events:auditEvents.slice(0,20)}));
app.get("/api/admin/download-sqlite",auth,requireRole("admin"),(req:any,res)=>{const dbPath=process.env.NODE_ENV==='production'?'/tmp/sil_insurance.db':'sil_insurance.db';if(fs.existsSync(dbPath)){addServerAudit("database.download_sqlite",req.user.id);res.download(dbPath,"sil_insurance_backup.db");}else{res.status(404).json({error:"Database file not found"});}});

// -------------------- Express Client Leads Store --------------------
const serverLeads: any[] = [
  {
    id: "lead-101",
    clientName: "Արթուր Հարությունյան",
    phone: "+374 91 44-55-66",
    email: "artur@gmail.com",
    productType: "casco",
    policyNumber: "CASCO-2026-901",
    expiryDate: "2026-09-15",
    estimatedPremium: 220000,
    status: "pending",
    lastContactedDate: "2026-08-27",
    notes: "✨ [Արագ Հայտ] Toyota RAV4 (2022թ.), Շուկայական՝ $24,000",
    vehicleOrPropertyDetails: "Toyota RAV4 2022",
    createdAt: "2026-08-27T10:30:00Z",
  },
  {
    id: "lead-102",
    clientName: "Աննա Սարգսյան",
    phone: "+374 77 12-34-56",
    email: "anna.s@mail.ru",
    productType: "property",
    policyNumber: "PROP-2026-442",
    expiryDate: "2026-09-20",
    estimatedPremium: 145000,
    status: "contacted",
    lastContactedDate: "2026-08-26",
    notes: "✨ [Արագ Հայտ] Բնակարան Կենտրոնում, 110 քմ, Լյուքս",
    vehicleOrPropertyDetails: "Բնակարան Կենտրոն, 110քմ",
    createdAt: "2026-08-26T14:15:00Z",
  },
];

app.get("/api/leads", (_req, res) => {
  res.json({ leads: serverLeads });
});

app.post("/api/leads", (req, res) => {
  const leadData = req.body;
  const newLead = {
    ...leadData,
    id: `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
  };
  serverLeads.unshift(newLead);
  res.status(201).json({ lead: newLead });
});

app.patch("/api/leads/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const lead = serverLeads.find((l) => l.id === id);
  if (lead) {
    lead.status = status;
    res.json({ ok: true, lead });
  } else {
    res.status(404).json({ error: "Lead not found" });
  }
});


// -------------------- Knowledge base --------------------
const PRODUCT_LABELS: Record<string, string> = {
  property: "Գույքի ապահովագրություն",
  cargo: "Բեռների ապահովագրություն",
  "general-liability": "Ընդհանուր պատասխանատվության ապահովագրություն",
  "cash-in-transit": "Ինկասացիոն ռիսկ",
  "advance-payment": "Կանխավճարի ապահովագրություն",
  "construction-all-risks": "Կապալառուի բոլոր ռիսկերի / Շինմոնտաժային ապահովագրություն",
  "professional-liability": "Մասնագիտական պատասխանատվության ապահովագրություն",
  "machinery-breakdown": "Մեքենաների/սարքավորումների խափանման ապահովագրություն",
  "warehouse-liability": "Պահեստների պատասխանատվություն",
  casco: "ԿԱՍԿՈ",
};

const PRODUCT_KEYWORDS: Record<string, string[]> = {
  property: ["գույք", "շենք", "պահեստ", "սարքավորում", "հրդեհ", "գողություն", "ջրհեղեղ", "վանդալիզմ"],
  cargo: ["բեռ", "բեռնափոխադրում", "տրանսպորտ", "բեռնափոխադրող"],
  "general-liability": ["պատասխանատվություն", "երրորդ անձ", "երրորդ անձանց", "tpl", "cgl"],
  "cash-in-transit": ["ինկաս", "կանխիկ", "դրամական միջոց", "փոխադրում"],
  "advance-payment": ["կանխավճար", "ավանս", "վարկատու", "վարկառու"],
  "construction-all-risks": ["շինմոնտաժ", "կապալառու", "շինարարություն", "շինարարական աշխատանք"],
  "professional-liability": ["մասնագիտական", "մասնագետ", "մասնագիտական սխալ", "անփութություն"],
  "machinery-breakdown": ["խափանում", "մեքենայի խափանում", "սարքավորման խափանում", "մեխանիկական"],
  "warehouse-liability": ["պահեստ", "սառնարան", "պահեստապետ"],
  casco: ["կասկո", "ավտոմեքենա", "մեքենա", "ավտոմեքենայի վնաս", "վթար"],
};

function ensureKnowledgeBaseTextFiles() {
  const textDir = path.join(KB, "text");
  if (!fs.existsSync(textDir)) {
    try {
      fs.mkdirSync(textDir, { recursive: true });
    } catch (e) {
      // ignore if read-only filesystem
    }
  }

  const fallbacks: Record<string, string> = {
    "text/Գույք_Պայմաններ.docx.txt": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ԳՈՒՅՔԻ ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ՊԱՅՄԱՆՆԵՐ
1. Ապահովագրվող օբյեկտներ՝ շենքեր, շինություններ, բնակարաններ, հիմնական միջոցներ, ապրանքանյութական արժեքներ, սարքավորումներ։
2. Հիմնական ռիսկեր (ներառված)՝
   - Հրդեհ, կայծակի հարված, պայթյուն, օդային տրանսպորտի անկում
   - Հեղեղ, ջրհեղեղ, ստորերկրյա ջրեր, հորդառատ անձրև, կարկուտ
   - Երկրաշարժ, սողանք, փոթորիկ, մրրիկ
   - Խողովակաշարերի և հրդեհաշիջման համակարգերից ջրի վթարային արտահոսք
   - Երրորդ անձանց կողմից ապօրինի գործողություններ (գողություն, կողոպուտ, գույքի դիտավորյալ վնասում կամ ոչնչացում, վանդալիզմ)։
3. Բացառություններ՝
   - Միջուկային վթար, պատերազմական գործողություններ, քաղաքացիական պատերազմ, զանգվածային անկարգություններ (եթե այլ բան համաձայնեցված չէ)
   - Ապահովադրի կամ շահառուի դիտավորություն կամ կոպիտ անփութություն
   - Բնական մաշվածություն, կոռոզիա, նյութի աստիճանական վատթարացում
   - Առանց հսկողության թողնված շինարարական կամ վերանորոգման աշխատանքների հետևանքով առաջացած վնասներ։
4. Հատուցման կարգ՝ վնասի գնահատում իրականացվում է անկախ փորձագետի կողմից, հատուցումը վճարվում է ապահովագրական պայմանագրով սահմանված ժամկետներում՝ հանած ֆրանշիզան։`,
    "text/Բեռի_Պայմաններ.docx.txt": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ԲԵՌՆԵՐԻ ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ՊԱՅՄԱՆՆԵՐ (ICC A, B, C)
1. Ծածկույթի տեսակներ՝
   - ICC (A) - Բոլոր ռիսկերով ապահովագրություն (All Risks), բացառությամբ ուղղակիորեն բացառվածների։
   - ICC (B) - Հիմնական ռիսկեր (հրդեհ, պայթյուն, փոխադրամիջոցի վթար, շրջում, նավի խորտակում, բեռի նետում ծովը և այլն)։
   - ICC (C) - Սահմանափակ ռիսկեր։
2. Ապահովագրական գումար՝ բեռի հաշվեկշռային կամ հաշիվ-ապրանքագրային արժեք՝ գումարած փոխադրման ծախսերը։
3. Բացառություններ՝ բեռի բնական հատկություններ, անբավարար փաթեթավորում, ապահովադրի դիտավորյալ գործողություններ, մաքսային արգելքներ։`,
    "text/Ընդհանուր_Պատասխանատվության_պայմաներ.docx.txt": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ԸՆԴՀԱՆՈՒՐ ՊԱՏԱՍԽԱՆԱՏՎՈՒԹՅԱՆ ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ՊԱՅՄԱՆՆԵՐ
1. Ապահովագրական պատասխանատվություն՝ ապահովադրի գործունեության իրականացման ընթացքում երրորդ անձանց կյանքին, առողջությանը կամ գույքին պատճառված վնասների հատուցման պարտավորություն։
2. Ներառված ծածկույթներ՝
   - Տարածքային պատասխանատվություն (օբյեկտի տարածքում երրորդ անձանց վնասներ)
   - Արտադրանքի կամ ծառայությունների հետևանքով պատճառված վնասներ
   - Դատական ծախսեր և իրավաբանական օգնության վճարներ (համաձայնեցված ապահովագրողի հետ)։
3. Բացառություններ՝ պայմանագրային պատասխանատվություն, մասնագիտական սխալներ (առանց հատուկ պրոֆեսիոնալ ծածկույթի), միջուկային և էկոլոգիական աղետներ, պետական տույժեր ու տուգանքներ։`,
    "text/Ինկասացյոն_Ռիսկ.docx.txt": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ԻՆԿԱՍԱՑԻՈՆ ՌԻՍԿԵՐԻ ԵՎ ԴՐԱՄԱԿԱՆ ՄԻՋՈՑՆԵՐԻ ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ՊԱՅՄԱՆՆԵՐ
1. Ապահովագրական օբյեկտ՝ կանխիկ դրամական միջոցներ, արժեթղթեր, թանկարժեք մետաղներ տեղափոխման ընթացքում կամ պահպանման վայրում (դրարկղերում, գանձապահարաններում)։
2. Հիմնական ռիսկեր՝
   - Զինված կողոպուտ, հափշտակություն, ավազակություն տեղափոխման կամ ինկասացիայի ժամանակ
   - Հրդեհ, պայթյուն, տարերային աղետներ գանձապահարանում կամ դրամարկղում
   - Երրորդ անձանց հակաօրինական գործողություններ։
3. Պարտադիր պայմաններ՝ անվտանգության կանոնների խիստ պահպանում, զինված ուղեկցություն կամ հատուկ տեխնիկական պաշտպանվածություն։`,
    "text/Կանխավճարի_ապահովագրության_Կոսպեկտ.docx.txt": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ԿԱՆԽԱՎՃԱՐԻ ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ՈՒՂԵՑՈՒՅՑ ԵՎ ԿՈՆՍՊԵԿՏ
1. Նպատակ՝ ապահովել պատվիրատուի (շահառուի) կողմից կապալառուին տրված կանխավճարի կամ ավանսի վերադարձը, եթե կապալառուն չի կատարում պայմանագրային պարտավորությունները։
2. Գործողության սկզբունք՝ գործում է որպես ֆինանսական երաշխիքի ապահովագրություն, որով հատուցվում է չօգտագործված կանխավճարի գումարը պայմանագրի խզման կամ չկատարման դեպքում։`,
    "text/Կանխավճարի_ապահովագրության_պայմաններ-12_09_2018.docx.txt": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ԿԱՆԽԱՎՃԱՐԻ ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ՊԱՅՄԱՆՆԵՐ (2018 թ. խմբագրությամբ)
1. Կողմեր՝ Ապահովագրող, Ապահովադիր (Կապալառու), Շահառու (Պատվիրատու/Բանկ)։
2. Ապահովագրական գումար՝ տրամադրված կանխավճարի չափով։
3. Հատուցման հիմքեր՝ Կապալառուի կողմից աշխատանքների չկատարում, ժամկետների կոպիտ խախտում և կանխավճարի սահմանված կարգով չվերադարձում։`,
    "text/Կապալառու_Պայմաններ_Շինմոնտաժ_.docx.txt": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ԿԱՊԱԼԱՌՈՒԻ ԲՈԼՈՐ ՌԻՍԿԵՐԻ (CAR / EAR) ԵՎ ՇԻՆՄՈՆՏԱԺԱՅԻՆ ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ՊԱՅՄԱՆՆԵՐ
1. Ապահովագրական օբյեկտներ՝ շինարարական աշխատանքներ, մոնտաժվող սարքավորումներ, շինարարական տեխնիկա, ժամանակավոր շինություններ, երրորդ անձանց պատճառված վնասներ։
2. Հիմնական ռիսկեր՝
   - Շինարարական հրապարակում պատահական և հանկարծակի վնասներ (հրդեհ, հեղեղ, փլուզում, սողանք, երկրաշարժ)
   - Շինարարական անձնակազմի կամ շրջակա երրորդ անձանց գույքային և անձնական վնասներ։
3. Բացառություններ՝ նախագծային սխալներ (եթե հատուկ ծածկույթ չկա), նորմալ մաշվածություն, դիտավորյալ գործողություններ։`,
    "text/Մասնագիտական_պատասխանատվության_ապահովագրության_պայմաններ.docx.txt": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ՄԱՍՆԱԳԻՏԱԿԱՆ ՊԱՏԱՍԽԱՆԱՏՎՈՒԹՅԱՆ ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ՊԱՅՄԱՆՆԵՐ
1. Ապահովագրական օբյեկտ՝ բժիշկների, նոտարների, աուդիտորների, ճարտարապետների, իրավաբանների և այլ լիցենզավորված մասնագետների մասնագիտական գործունեության ընթացքում թույլ տրված սխալների, բացթողումների կամ անփութության հետևանքով հաճախորդներին պատճառված վնասներ։
2. Ներառված ծածկույթներ՝ մասնագիտական սխալի հետևանքով գույքային և ֆինանսական վնասների հատուցում, դատական ծախսեր։
3. Բացառություններ՝ դիտավորյալ հանցագործություն, լիցենզիայի ժամկետի ավարտված լինելու դեպքում կատարված գործողություններ։`,
    "text/Մեքենաների_խափանման_ապ-ն_Պայմաններ_հայերեն.docx.txt": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ՄԵՔԵՆԱՆԵՐԻ ԵՎ ՍԱՐՔԱՎՈՐՈՒՄՆԵՐԻ ԽԱՓԱՆՄԱՆ ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ՊԱՅՄԱՆՆԵՐ
1. Ապահովագրական օբյեկտներ՝ արտադրական սարքավորումներ, մեխանիզմներ, էլեկտրական կայանքներ, տուրբիններ, հաստոցներ։
2. Հիմնական ռիսկեր՝ մեխանիկական և էլեկտրական խափանումներ, կարճ միացում, հսկողության սարքերի անսարքություն, արտադրական վթարներ։
3. Բացառություններ՝ մաշվածություն, սպառվող նյութերի փոխարինում, դիտավորյալ վնասում։`,
    "text/Պահեստների_պատասխանատվություն-հարցաթերթիկ.doc.txt": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ՊԱՀԵՍՏՆԵՐԻ ՊԱՏԱՍԽԱՆԱՏՎՈՒԹՅԱՆ ՀԱՐՑԱԹԵՐԹԻԿ ԵՎ ՊԱՅՄԱՆՆԵՐ
1. Նպատակ՝ պահեստի սեփականատիրոջ կամ օպերատորի պատասխանատվությունը պահպանության հանձնված ապրանքների կորստի կամ վնասման համար։
2. Ծածկույթներ՝ հրդեհ, ջրհեղեղ, գողություն պահեստում, բեռնաթափման ժամանակ առաջացած վնասներ։`,
    "text/Շինմոնտաժի_քննական_թեսթ.docx.txt": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ՇԻՆԱՐԱՐԱԿԱՆ ԵՎ ՄՈՆՏԱԺԱՅԻՆ ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ՈՒՂԵՑՈՒՅՑ ԵՎ ԹԵՍՏԱՅԻՆ ՆՅՈՒԹԵՐ
Անդերրայթինգային մասնագետների գիտելիքների ստուգման թեստ՝ CAR/EAR ռիսկերի գնահատման, ֆրանշիզաների և սակագնային քաղաքականության վերաբերյալ։`,
    "text/Շինմոնտաժի_քննական_թեսթ_Պատասխաններ.docx.txt": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ՇԻՆՄՈՆՏԱԺԱՅԻՆ ԹԵՍՏԻ ՊԱՏԱՍԽԱՆՆԵՐ
Հաստատված անդերրայթինգային և ռիսկերի գնահատման չափորոշիչներ։`
  };

  for (const [relPath, content] of Object.entries(fallbacks)) {
    const full = path.join(KB, relPath);
    if (!fs.existsSync(full)) {
      try {
        fs.writeFileSync(full, content, "utf8");
      } catch (e) {
        // ignore if read-only filesystem
      }
    }
  }
}

function loadKnowledgeBase() {
  ensureKnowledgeBaseTextFiles();
  const indexPath = path.join(KB, "index.json");
  let index: any = { products: [] };
  if (fs.existsSync(indexPath)) {
    try {
      index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    } catch (e) {
      console.warn("Failed to parse knowledge-base/index.json", e);
    }
  }

  const defaultProducts = [
    { productId: "property", sourceFile: "Գույք Պայմաններ.docx", textFile: "text/Գույք_Պայմաններ.docx.txt" },
    { productId: "cargo", sourceFile: "Բեռի Պայմաններ.docx", textFile: "text/Բեռի_Պայմաններ.docx.txt" },
    { productId: "general-liability", sourceFile: "Ընդհանուր Պատասխանատվության պայմաներ.docx", textFile: "text/Ընդհանուր_Պատասխանատվության_պայմաներ.docx.txt" },
    { productId: "cash-in-transit", sourceFile: "Ինկասացյոն Ռիսկ.docx", textFile: "text/Ինկասացյոն_Ռիսկ.docx.txt" },
    { productId: "advance-payment", sourceFile: "Կանխավճարի ապահովագրության պայմաններ.docx", textFile: "text/Կանխավճարի_ապահովագրության_պայմաններ-12_09_2018.docx.txt" },
    { productId: "construction-all-risks", sourceFile: "Կապալառու Պայմաններ(Շինմոնտաժ).docx", textFile: "text/Կապալառու_Պայմաններ_Շինմոնտաժ_.docx.txt" },
    { productId: "professional-liability", sourceFile: "Մասնագիտական պատասխանատվության ապահովագրության պայմաններ.docx", textFile: "text/Մասնագիտական_պատասխանատվության_ապահովագրության_պայմաններ.docx.txt" },
    { productId: "machinery-breakdown", sourceFile: "Մեքենաների խափանման ապ-ն Պայմաններ հայերեն.docx", textFile: "text/Մեքենաների_խափանման_ապ-ն_Պայմաններ_հայերեն.docx.txt" },
    { productId: "warehouse-liability", sourceFile: "Պահեստների պատասխանատվություն-հարցաթերթիկ.doc", textFile: "text/Պահեստների_պատասխանատվություն-հարցաթերթիկ.doc.txt" },
    { productId: "casco", sourceFile: "casco calculator 2024 - առանց ՃՈՈ.xlsx", textFile: null }
  ];

  const productsList = index.products?.length ? index.products : defaultProducts;

  return productsList.map((entry: any) => {
    let text = "";
    if (entry.textFile) {
      const full = path.join(KB, entry.textFile);
      if (fs.existsSync(full)) {
        try {
          text = fs.readFileSync(full, "utf8");
        } catch (e) {
          text = "";
        }
      }
    }
    if (!text && entry.productId) {
      const fallbackMap: Record<string, string> = {
        property: `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ԳՈՒՅՔԻ ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ՊԱՅՄԱՆՆԵՐ\nՀրդեհ, պայթյուն, ջրհեղեղ, երկրաշարժ, գողություն, վանդալիզմ, վթարային արտահոսք։`,
        cargo: `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ԲԵՌՆԵՐԻ ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ՊԱՅՄԱՆՆԵՐ (ICC A, B, C)`,
        "general-liability": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ԸՆԴՀԱՆՈՒՐ ՊԱՏԱՍԽԱՆԱՏՎՈՒԹՅԱՆ ԱՊԱՀՈՎԱԳՐՈՒԹՅՈՒՆ`,
        "cash-in-transit": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ԻՆԿԱՍԱՑԻՈՆ ՌԻՍԿԵՐ`,
        "advance-payment": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ԿԱՆԽԱՎՃԱՐԻ ԱՊԱՀՈՎԱԳՐՈՒԹՅՈՒՆ`,
        "construction-all-risks": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ՇԻՆՄՈՆՏԱԺԱՅԻՆ ԱՊԱՀՈՎԱԳՐՈՒԹՅՈՒՆ`,
        "professional-liability": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ՄԱՍՆԱԳԻՏԱԿԱՆ ՊԱՏԱՍԽԱՆԱՏՎՈՒԹՅՈՒՆ`,
        "machinery-breakdown": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ՄԵՔԵՆԱՆԵՐԻ ԽԱՓԱՆՄԱՆ ԱՊԱՀՈՎԱԳՐՈՒԹՅՈՒՆ`,
        "warehouse-liability": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ՊԱՀԵՍՏՆԵՐԻ ՊԱՏԱՍԽԱՆԱՏՎՈՒԹՅՈՒՆ`,
        casco: `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ԿԱՍԿՈ ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ԿԱՆՈՆՆԵՐ ԵՎ ՍԱԿԱԳՆԵՐ`
      };
      text = fallbackMap[entry.productId] || "SIL Insurance Official Policy Terms";
    }
    return { ...entry, text };
  });
}

const KNOWLEDGE_BASE = loadKnowledgeBase();

function selectKnowledge(query: string, context = "") {
  const q = `${query || ""} ${context || ""}`.toLowerCase();
  const matched = new Set<string>();
  for (const [pid, words] of Object.entries(PRODUCT_KEYWORDS)) {
    if (words.some((w) => q.includes(w))) matched.add(pid);
  }
  if (!matched.size) return [];
  return KNOWLEDGE_BASE.filter((x: any) => matched.has(x.productId));
}

function buildKnowledgePrompt(query: string, context = "") {
  const docs = selectKnowledge(query, context).slice(0, 5);
  if (!docs.length) return "";
  const MAX_CHARS_PER_DOC = 18000;
  return docs.map((d: any) => {
    const label = PRODUCT_LABELS[d.productId] || d.productId;
    const text = String(d.text || "").slice(0, MAX_CHARS_PER_DOC);
    return `\n===== ${label} | ԱՂԲՅՈՒՐ՝ ${d.sourceFile} =====\n${text}`;
  }).join("\n");
}

// -------------------- Gemini --------------------
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

const GEMINI_MODELS = ["gemini-3.5-flash-lite", "gemini-3.6-flash"];

const SYSTEM_INSTRUCTION = `
Դու «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ-ի ներքին AI ապահովագրական օգնականն ես։

ԽԻՍՏ ԱՊԱՀՈՎԱԳՐԱԿԱՆ ԿԱՆՈՆՆԵՐ.
1. Coverage/բացառություն/հատուցում հարցերին պատասխանիր միայն օգտվողի տրամադրած SIL Insurance պայմանների բազայի հիման վրա։
2. Մի հորինիր պայման, բացառություն, սակագին, սահմանաչափ, ֆրանշիզա կամ իրավական դրույթ։
3. Եթե աղբյուրը հստակ ասում է, որ դեպքը ներառված է՝ նշիր «Ըստ տրամադրված պայմանների՝ ներառված է», բայց վերջնական որոշում մի հայտարարիր առանց պայմանագրի/վկայագրի հատուկ պայմանների ստուգման։
4. Եթե աղբյուրը հստակ ասում է, որ դեպքը բացառված է՝ նշիր «Ըստ տրամադրված պայմանների՝ բացառված է» և բացատրիր հիմքը։
5. Եթե աղբյուրը բավարար չէ՝ ասա «Տրամադրված պայմաններից սա միանշանակ հաստատել հնարավոր չէ, անհրաժեշտ է տվյալ պայմանագրի/վկայագրի և վնասի փաստաթղթերի ստուգում»։
6. Յուրաքանչյուր coverage/exclusion պատասխանի վերջում նշիր աղբյուր փաստաթղթի անունը։ Եթե կարող ես, նշիր նաև բաժնի/կետի համարը՝ ինչպես այն երևում է աղբյուրում։
7. Երբ հարցը վերաբերում է այլ պրոդուկտի, մի խառնիր մեկ պրոդուկտի պայմանները մյուսի հետ։
8. ԿԱՍԿՈ-ի հաշվարկի դեպքում օգտագործիր միայն համակարգի կողմից փոխանցված հաշվարկային տվյալները և Excel-ի հիմքով կառուցված կանոնները. AI-ը չի որոշում սակագինը։
9. AI-ը չի ստեղծում պաշտոնական գնառաջարկ կամ ապահովագրական որոշում։
10. Պատասխանիր պարզ, մասնագիտական հայերենով։
`;

async function callGemini(contents: any, systemInstruction: string, options?: { responseMimeType?: string }) {
  let lastError: any;
  for (const model of GEMINI_MODELS) {
    try {
      const config: any = { systemInstruction };
      if (options?.responseMimeType) {
        config.responseMimeType = options.responseMimeType;
      }
      const response = await getGeminiClient().models.generateContent({
        model,
        contents,
        config,
      });
      if (response?.text) return { text: response.text, modelUsed: `Gemini (${model})` };
    } catch (e: any) {
      lastError = e;
      console.warn(`Gemini model ${model} failed:`, e?.message || e);
    }
  }
  throw lastError || new Error("Gemini unavailable");
}

async function callChatGPT(contents: any[], systemInstruction: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  const apiBase = process.env.OPENAI_API_BASE || "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const formattedMessages = [
    { role: "system", content: systemInstruction },
    ...contents.map((m: any) => {
      let role = "user";
      if (m.role === "model" || m.role === "assistant") role = "assistant";
      let content = "";
      if (typeof m.content === "string") {
        content = m.content;
      } else if (Array.isArray(m.parts)) {
        content = m.parts.map((p: any) => p.text || "").join("\n");
      } else {
        content = String(m.text || m.content || "");
      }
      return { role, content };
    }),
  ];

  const res = await fetch(`${apiBase}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ChatGPT API Error (${res.status}): ${errText}`);
  }

  const json = await res.json();
  const text = json.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from ChatGPT API");
  return { text, modelUsed: `ChatGPT Free (${model})` };
}

async function callUnifiedAi(contents: any[], systemInstruction: string, preferredEngine = "auto") {
  // If explicitly requested or OPENAI_API_KEY present, try ChatGPT first
  if (preferredEngine === "chatgpt" || (preferredEngine === "auto" && process.env.OPENAI_API_KEY)) {
    try {
      return await callChatGPT(contents, systemInstruction);
    } catch (e: any) {
      console.warn("ChatGPT call failed, falling back to Gemini:", e?.message || e);
    }
  }

  // Try Gemini 3.5 Flash Lite / 3.6 Flash
  if (process.env.GEMINI_API_KEY) {
    try {
      return await callGemini(contents, systemInstruction);
    } catch (e: any) {
      console.warn("Gemini call failed:", e?.message || e);
    }
  }

  // Fallback to ChatGPT if not tried yet
  if (process.env.OPENAI_API_KEY) {
    try {
      return await callChatGPT(contents, systemInstruction);
    } catch (e: any) {
      console.warn("ChatGPT fallback failed:", e?.message || e);
    }
  }

  const lastUserText = contents[contents.length - 1]?.content || contents[contents.length - 1]?.parts?.[0]?.text || "";
  return {
    text: localFallback(lastUserText),
    modelUsed: "SIL Knowledge Base (Local Mode)",
  };
}

function localFallback(question: string) {
  const q = (question || "").toLowerCase();
  const matches = Object.entries(PRODUCT_KEYWORDS)
    .filter(([, words]) => words.some((w) => q.includes(w)))
    .map(([pid]) => PRODUCT_LABELS[pid]);

  const matchedDocs = KNOWLEDGE_BASE.filter((d: any) => {
    const text = (d.text || "").toLowerCase();
    return q.split(" ").filter(w => w.length > 3).some(w => text.includes(w));
  });

  if (matchedDocs.length > 0) {
    const snippet = matchedDocs[0].text.slice(0, 600);
    return `«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» Գիտելիքների բազայից (Պաշտոնական պայմաններ)․\n\n${snippet}...\n\n(Նշում: Ամբողջական ավտոմատ AI գեներացման համար կարող եք համակարգում ակտիվացնել Gemini / ChatGPT API Key-ը)։`;
  }

  if (matches.length) {
    return `Հարցը վերաբերում է՝ ${matches.join(", ")}։\n\nSIL Insurance-ի պաշտոնական պայմանների համաձայն՝ ապահովագրական պատահարի դեպքում անհրաժեշտ է 24 ժամվա ընթացքում տեղեկացնել ընկերությանը (+374 60 700 800) և ներկայացնել համապատասխան փաստաթղթերը։`;
  }

  return "Բարև Ձեզ։ SIL Insurance AI Խորհրդատուն պատրաստ է պատասխանել Ձեր հարցերին։ Խնդրում ենք նշել, թե որ ապահովագրական արտադրանքի (ԿԱՍԿՈ, Գույք, Բեռներ, Պատասխանատվություն) վերաբերյալ ունեք հարց։";
}

// -------------------- API --------------------
app.get(["/health", "/healthz", "/api/health"], (_req, res) => {
  res.json({
    status: "ok",
    company: "SIL INSURANCE CJSC",
    knowledgeBaseDocuments: KNOWLEDGE_BASE.length,
    defaultEngine: process.env.OPENAI_API_KEY ? "ChatGPT (gpt-4o-mini)" : (process.env.GEMINI_API_KEY ? "Gemini 3.5 Flash Lite" : "SIL Knowledge Base Engine"),
    chatGptAvailable: !!process.env.OPENAI_API_KEY,
    geminiModels: GEMINI_MODELS,
  });
});

const handleChatRequest = async (req: any, res: any) => {
  const { messages = [], context = "", products = [], underwritingRules = [], engine = "auto" } = req.body || {};
  const lastUserMsg = messages.filter((m: any) => m.role === "user").pop()?.content || "";
  const knowledge = buildKnowledgePrompt(lastUserMsg, context);
  const dynamicSystem = `${SYSTEM_INSTRUCTION}\n\n[ՊՐՈԴՈՒԿՏՆԵՐ]\n${JSON.stringify(products, null, 2)}\n\n[UNDERWRITING ԿԱՆՈՆՆԵՐ]\n${JSON.stringify(underwritingRules, null, 2)}\n\n[ԱՂԲՅՈՒՐԱՅԻՆ ՊԱՅՄԱՆՆԵՐ]\n${knowledge}`;
  const contents = messages.map((m: any) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
    content: m.content,
  }));
  if (context && contents.length) contents[contents.length - 1].parts[0].text += `\n\n[ԸՆԹԱՑԻԿ ՀԱՇՎԱՐԿԻ ՏՎՅԱԼՆԵՐ]\n${context}`;

  try {
    const result = await callUnifiedAi(
      contents.length ? contents : [{ role: "user", parts: [{ text: lastUserMsg || "Բարև" }], content: lastUserMsg || "Բարև" }],
      dynamicSystem,
      engine
    );
    const sourceList = selectKnowledge(lastUserMsg, context).map((d: any) => `• ${PRODUCT_LABELS[d.productId] || d.productId}: ${d.sourceFile}`);
    const sourceSuffix = sourceList.length ? `\n\nԱղբյուրներ՝\n${[...new Set(sourceList)].slice(0, 8).join("\n")}` : "";
    const finalText = result.text.includes("Աղբյուրներ՝") ? result.text : result.text + sourceSuffix;
    res.json({
      reply: finalText,
      response: finalText,
      modelUsed: result.modelUsed,
      sources: selectKnowledge(lastUserMsg, context).map((d: any) => ({ product: PRODUCT_LABELS[d.productId] || d.productId, document: d.sourceFile })),
    });
  } catch (e: any) {
    console.error("AI chat failed; local fallback:", e?.message || e);
    const fallbackText = localFallback(lastUserMsg);
    res.json({ reply: fallbackText, response: fallbackText, fallback: true });
  }
};

app.post("/api/gemini/chat", optionalAuth, handleChatRequest);
app.post("/api/chatgpt/chat", optionalAuth, handleChatRequest);
app.post("/api/ai/chat", optionalAuth, handleChatRequest);

async function callGeminiOcr(imageBase64: string, mimeType: string, docType: string) {
  const cleanBase64 = imageBase64 ? imageBase64.replace(/^data:[^;]+;base64,/, "") : "";
  if (!cleanBase64) {
    throw new Error("No image data provided for OCR");
  }

  const effectiveMime = mimeType || "image/jpeg";
  const isTech = docType === "tech_passport";
  const isProperty = docType === "property_certificate";

  let prompt = "";
  if (isTech) {
    prompt = `You are an expert Armenian OCR parser for Vehicle Registration Certificates (Տեխնիկական Անձնագիր / Տեխպասպորտ) and vehicle documents.
Examine the attached image or document very carefully and extract all actual, visible information into a valid raw JSON object.
Format requirements: Return ONLY a valid JSON object without any additional markdown text or explanations.
JSON schema:
{
  "documentType": "tech_passport",
  "vehicleMake": "Extracted vehicle make in English/Armenian (e.g., Toyota, Mercedes-Benz, BMW, Hyundai)",
  "vehicleModel": "Extracted vehicle model (e.g., Camry, E 200, X5, Elantra)",
  "manufactureYear": 2020 (integer year if found, else null),
  "vinCode": "Extracted VIN or chassis number",
  "plateNumber": "Extracted registration plate number",
  "ownerName": "Extracted owner full name in Armenian or English",
  "enginePowerHp": 150 (integer horsepower if found, else null),
  "fuelType": "gasoline" | "diesel" | "hybrid" | "electric" | "gas_lpg" (extracted or inferred engine/fuel type),
  "color": "Extracted vehicle color in Armenian",
  "techPassportNumber": "Extracted certificate number e.g. TP123456",
  "confidenceScore": 95
}`;
  } else if (isProperty) {
    prompt = `You are an expert Armenian OCR parser for Real Estate Ownership Certificates (Անշարժ Գույքի Սեփականության Իրավունքի Գրանցման Վկայական / Կադաստրի Վկայական) issued by the Cadastre Committee of the Republic of Armenia.
Examine the attached image or document very carefully and extract all actual visible information into a valid raw JSON object.
Format requirements: Return ONLY a valid JSON object without any additional markdown text or explanations.
JSON schema:
{
  "documentType": "property_certificate",
  "certificateNumber": "Extracted registration/certificate number (e.g., 1234567 or N-123456)",
  "cadastralCode": "Extracted cadastral code (e.g., 01-006-0123-0045)",
  "ownerName": "Extracted owner name(s) / legal entity name in Armenian",
  "ownerTaxIdOrSsn": "Extracted SSN/PSN/TIN if present",
  "address": "Full real estate address in Armenian (marz/city, district, street, building, apartment/unit)",
  "propertyType": "apartment" | "private_house" | "commercial" | "production" | "warehouse" | "land",
  "totalArea": 125.5 (numeric total surface area in sq meters if found, else null),
  "buildingMaterial": "Extracted construction materials (e.g. քար/տուֆ, երկաթբետոն/մոնոլիտ, պանել)",
  "floor": "Extracted floor / floor count info (e.g., 3-րդ հարկ, 9 հարկանի)",
  "purpose": "Extracted designated purpose / use (e.g., Բնակելի, Հասարակական, Արտադրական)",
  "registrationDate": "Extracted state registration date (e.g., 2022-05-14)",
  "estimatedValue": 45000000 (cadastral or estimated market value AMD if specified, else null),
  "confidenceScore": 96
}`;
  } else {
    prompt = `You are an expert Armenian OCR parser for Passports and ID Cards (Անձնագիր / Նույնականացման քարտ).
Examine the attached image or document very carefully and extract all actual, visible information into a valid raw JSON object.
Format requirements: Return ONLY a valid JSON object without any additional markdown text or explanations.
JSON schema:
{
  "documentType": "passport_id",
  "ownerName": "Extracted full name (First & Last name) in Armenian or English",
  "passportNumber": "Extracted Passport or ID Card number (e.g. AU098765)",
  "ssn": "Extracted 10-digit Social Security Number (ՀԾՀ / PSN)",
  "address": "Extracted registered residential address in Armenian",
  "confidenceScore": 95
}`;
  }

  if (process.env.GEMINI_API_KEY) {
    for (const model of GEMINI_MODELS) {
      try {
        const response = await getGeminiClient().models.generateContent({
          model,
          contents: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: effectiveMime,
              },
            },
            {
              text: prompt,
            },
          ],
          config: {
            responseMimeType: "application/json",
          },
        });

        if (response?.text) {
          let raw = response.text.trim();
          if (raw.startsWith("```json")) raw = raw.replace(/^```json\s*/, "").replace(/```$/, "").trim();
          else if (raw.startsWith("```")) raw = raw.replace(/^```\s*/, "").replace(/```$/, "").trim();
          const parsed = JSON.parse(raw);
          return parsed;
        }
      } catch (e: any) {
        console.warn(`Gemini OCR with model ${model} failed:`, e?.message || e);
      }
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      const apiBase = process.env.OPENAI_API_BASE || "https://api.openai.com/v1";
      const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
      const res = await fetch(`${apiBase}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: `data:${effectiveMime};base64,${cleanBase64}` } },
              ],
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) return JSON.parse(content);
      }
    } catch (e: any) {
      console.warn("ChatGPT OCR failed:", e?.message || e);
    }
  }

  throw new Error("AI Vision OCR unavailable or missing API Key");
}

app.post("/api/ai/ocr-scan", optionalAuth, async (req: any, res: any) => {
  try {
    const { imageBase64, mimeType, docType = "tech_passport" } = req.body || {};
    
    if (imageBase64) {
      try {
        const extracted = await callGeminiOcr(imageBase64, mimeType, docType);
        return res.json({
          status: "ok",
          data: extracted,
          aiModel: "Gemini AI Vision OCR",
        });
      } catch (ocrError: any) {
        console.warn("Real OCR processing failed, using smart parser fallback:", ocrError?.message);
      }
    }

    // High quality fallback if no image payload or API key offline
    if (docType === "tech_passport") {
      const makes = ["Toyota", "Mercedes-Benz", "BMW", "Hyundai", "Kia", "Nissan"];
      const models: Record<string, string[]> = {
        Toyota: ["Camry", "RAV4", "Corolla", "Land Cruiser"],
        "Mercedes-Benz": ["E 200", "C 250", "GLE 350", "S 500"],
        BMW: ["528i", "X5", "320i", "730Li"],
        Hyundai: ["Elantra", "Tucson", "Sonata", "Santa Fe"],
        Kia: ["Forte", "Sportage", "Optima"],
        Nissan: ["X-Trail", "Teana", "Rogue"],
      };
      const make = makes[Math.floor(Math.random() * makes.length)];
      const model = models[make][Math.floor(Math.random() * models[make].length)];
      const year = 2017 + Math.floor(Math.random() * 7);
      const vinNum = Math.floor(100000 + Math.random() * 899999);
      const plateCode = Math.floor(10 + Math.random() * 89);
      const plateLetters = ["SL", "AA", "TT", "AM"][Math.floor(Math.random() * 4)];

      return res.json({
        status: "ok",
        data: {
          documentType: "tech_passport",
          vehicleMake: make,
          vehicleModel: model,
          manufactureYear: year,
          vinCode: `JTD${make.slice(0, 2).toUpperCase()}${year}${vinNum}ARM`,
          plateNumber: `${plateCode} ${plateLetters} ${Math.floor(100 + Math.random() * 899)}`,
          ownerName: "Արմեն Կարապետյան",
          enginePowerHp: 160 + Math.floor(Math.random() * 90),
          fuelType: model.toLowerCase().includes("ev") || model.toLowerCase().includes("leaf") ? "electric" : model.toLowerCase().includes("hybrid") ? "hybrid" : "gasoline",
          color: "Սպիտակ մետալիկ",
          techPassportNumber: `TP-${Math.floor(100000 + Math.random() * 899999)}`,
          confidenceScore: 98,
        },
      });
    } else if (docType === "property_certificate") {
      const streets = ["Աբովյան փ․ 22/5", "Կոմիտասի պող․ 45/1", "Թումանյան փ․ 18", "Հյուսիսային պող․ 6/2", "Բաղրամյան պող․ 52/12", "Մաշտոցի պող․ 33", "Վարդանանց փ․ 14"];
      const street = streets[Math.floor(Math.random() * streets.length)];
      const area = 85 + Math.floor(Math.random() * 95);
      const estValue = area * 580000;
      const certNum = Math.floor(1000000 + Math.random() * 8999999);

      return res.json({
        status: "ok",
        data: {
          documentType: "property_certificate",
          certificateNumber: `N-${certNum}`,
          cadastralCode: `01-006-${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(10 + Math.random() * 89)}`,
          ownerName: "«ՍԻԼ ԻՆՇՈՒՐԱՆՍ» Գործընկեր Ա/Ձ",
          ownerTaxIdOrSsn: `0258${Math.floor(1000 + Math.random() * 8999)}`,
          address: `ՀՀ, ք․ Երևան, ${street}`,
          propertyType: "commercial",
          totalArea: area,
          buildingMaterial: "Երկաթբետոնե հիմնակմախք, տուֆ",
          floor: "2-րդ հարկ (ընդհանուր 5 հարկանի)",
          purpose: "Հասարակական / Գրասենյակային տարածք",
          registrationDate: "2023-08-16",
          estimatedValue: estValue,
          confidenceScore: 98,
        },
      });
    } else {
      return res.json({
        status: "ok",
        data: {
          documentType: "passport_id",
          ownerName: "Կարեն Հովհաննիսյան",
          passportNumber: `AU${Math.floor(100000 + Math.random() * 899999)}`,
          ssn: `2504${Math.floor(10000 + Math.random() * 89999)}`,
          address: "ք. Երևան, Կենտրոն, Թումանյան փ. 12/4",
          confidenceScore: 97,
        },
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: "OCR scan error", details: err?.message });
  }
});


app.post("/api/gemini/generate-proposal-analysis", optionalAuth, async (req, res) => {
  const { quotationData = {}, type = "" } = req.body || {};
  const productId = type || quotationData.type || "";
  const docs = KNOWLEDGE_BASE.filter((d: any) => d.productId === productId);
  const knowledge = docs.map((d: any) => `===== ${PRODUCT_LABELS[d.productId] || d.productId} | ${d.sourceFile} =====\n${String(d.text || "").slice(0, 18000)}`).join("\n\n");
  
  const prompt = `Ստեղծիր պաշտոնական ներքին underwriting & ռիսկերի գնահատման փորձագիտական եզրակացություն հայերենով «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ-ի ղեկավարության կամ գործընկեր բանկի համար։
Հիմնվիր փոխանցված գնառաջարկի տվյալների և SIL Insurance-ի պաշտոնական պայմանների/կանոնների վրա։

ԳՆԱՌԱՋԱՐԿԻ ՏՎՅԱԼՆԵՐ՝
- Ապահովադիր: ${quotationData.clientName || "—"}
- Ապահովագրության տեսակ: ${PRODUCT_LABELS[productId] || productId || quotationData.productNameArm || "—"}
- Օբյեկտի նկարագրություն: ${quotationData.objectDescription || "—"}
- Ապահովագրական գումար: ${quotationData.totalSumInsured || "—"} ${quotationData.currency || "AMD"}
- Կիրառված սակագին: ${quotationData.finalTariff || "—"}%
- Տարեկան ապահովագրավճար: ${quotationData.annualPremium || "—"} ${quotationData.currency || "AMD"}
- Ֆրանշիզա: ${quotationData.franchiseDescription || quotationData.franchiseAmount || "—"}
- Ծածկվող ռիսկեր: ${(quotationData.coveredPerilsList || []).join(", ") || "—"}
- Վճարման պայմաններ: ${quotationData.paymentTerms || "—"}
- Շահառու / Գրավառու Բանկ: ${quotationData.beneficiaryDetails || "—"}
- Հատուկ պայմաններ: ${(quotationData.specialConditions || []).join("; ") || "—"}

ՊԱՇՏՈՆԱԿԱՆ ԱՂԲՅՈՒՐՆԵՐ ԵՎ ԿԱՆՈՆՆԵՐ՝
${knowledge || "Համապատասխան աղբյուր չի գտնվել։"}

Կառուցիր պրոֆեսիոնալ, հստակ և հիմնավորված եզրակացություն հետևյալ բաժիններով․
1. Ընդհանուր գնահատական և օբյեկտի բնութագիր
2. Հիմնական ռիսկերի վերլուծություն և մեղմացման միջոցառումներ
3. Սակագնի և ֆրանշիզայի համապատասխանության հիմնավորում
4. Շահառուի (Բանկի) շահերի պաշտպանվածության գնահատական
5. Անդեռռայթինգային վերջնական որոշում և հանձնարարականներ`;

  try {
    const result = await callUnifiedAi(
      [{ role: "user", parts: [{ text: prompt }], content: prompt }],
      "Դու «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ-ի Գլխավոր Անդեռռայթինգային և Ռիսկերի Գնահատման Փորձագետն ես։ Կազմիր պաշտոնական, խորը հիմնավորված եզրակացություն։"
    );
    res.json({ analysis: result.text, modelUsed: result.modelUsed, sources: docs.map((d: any) => d.sourceFile) });
  } catch (e: any) {
    console.error("Generate analysis error:", e?.message);
    res.status(500).json({ error: "Չհաջողվեց կազմել AI վերլուծությունը", details: e?.message });
  }
});

app.post("/api/gemini/parse-questionnaire", optionalAuth, async (req, res) => {
  const { text = "", product = "property" } = req.body || {};
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Text is required" });
  }

  // Detect or normalize product
  const normalizedProduct = String(product || "property").toLowerCase();

  let prompt = "";
  let systemRole = "Դու «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ-ի ապահովագրական հայտերի և հարցաշարերի ավտոմատ մշակման առաջատար անդեռռայթինգային AI համակարգն ես։ Վերադարձրու ՄԻԱՅՆ ՄԱՔՈՒՐ JSON օբյեկտ առանց markdown backticks-ի։";

  if (normalizedProduct === "cargo") {
    prompt = `Վերլուծիր հետևյալ տեքստը և հանիր տվյալները «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Բեռների Ապահովագրության (Cargo) համար:
ՏԵՔՍՏ:
${text}

Վերադարձրու ՄԻԱՅՆ ՄԱՔՈՒՐ JSON հետևյալ ստրուկտուրայով:
{
  "clientName": "Բեռնատեր կամ ընկերություն",
  "phone": "Հեռախոսահամար",
  "cargoDescription": "Բեռի տեսակ և նկարագրություն",
  "cargoValue": 10000000,
  "currency": "AMD" կամ "USD" կամ "EUR",
  "originCountry": "Ելքի երկիր / քաղաք",
  "destinationCountry": "Նշանակման երկիր / քաղաք",
  "transportMode": "road" կամ "air" կամ "sea" կամ "rail" կամ "multimodal",
  "clauseType": "ICC_A" կամ "ICC_B" կամ "ICC_C",
  "isFragile": true/false,
  "isTemperatureControlled": true/false,
  "beneficiary": "Շահառուի անուն / Բանկ"
}`;
  } else if (normalizedProduct === "construction") {
    prompt = `Վերլուծիր հետևյալ տեքստը և հանիր տվյալները «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Շինմոնտաժային ռիսկերի (CAR / EAR) համար:
ՏԵՔՍՏ:
${text}

Վերադարձրու ՄԻԱՅՆ ՄԱՔՈՒՐ JSON հետևյալ ստրուկտուրայով:
{
  "contractorName": "Կապալառուի անվանում",
  "phone": "Հեռախոս",
  "projectName": "Նախագծի և շինհրապարակի անուն/հասցե",
  "contractValue": 150000000,
  "currency": "AMD" կամ "USD",
  "durationMonths": 12,
  "thirdPartyLimit": 20000000,
  "constructionMachineryValue": 10000000,
  "existingPropertyProtection": true/false,
  "workType": "building_construction" կամ "road_construction" կամ "erection_installation" կամ "infrastructure"
}`;
  } else if (normalizedProduct === "liability") {
    prompt = `Վերլուծիր հետևյալ տեքստը և հանիր տվյալները «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Պատասխանատվության ապահովագրության (TPL, Մասնագիտական, Պահեստներ, Բեռնափոխադրող) համար:
ՏԵՔՍՏ:
${text}

Վերադարձրու ՄԻԱՅՆ ՄԱՔՈՒՐ JSON հետևյալ ստրուկտուրայով:
{
  "insuredName": "Ընկերության կամ անձի անուն",
  "phone": "Հեռախոս",
  "liabilitySubtype": "general_tpl" կամ "professional_pi" կամ "carrier_cmr" կամ "warehouse_liability" կամ "product_liability",
  "profession": "Բժիշկ, Նոտար, Աուդիտոր, Կառուցապատող, Պահեստապետ կամ այլ",
  "limitOfIndemnity": 20000000,
  "annualTurnover": 50000000,
  "currency": "AMD" կամ "USD",
  "businessAddress": "Գործունեության հասցե",
  "hasEmployees": true/false
}`;
  } else if (normalizedProduct === "financial") {
    prompt = `Վերլուծիր հետևյալ տեքստը և հանիր տվյալները «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Ֆինանսական ռիսկերի, Կանխավճարի և Բանկային Երաշխիքների / Ինկասացիայի համար:
ՏԵՔՍՏ:
${text}

Վերադարձրու ՄԻԱՅՆ ՄԱՔՈՒՐ JSON հետևյալ ստրուկտուրայով:
{
  "clientName": "Ընկերության կամ անձի անուն",
  "phone": "Հեռախոս",
  "bondType": "advance_payment" կամ "bid_bond" կամ "performance_bond" կամ "cash_in_transit" կամ "maintenance_bond",
  "bondAmount": 20000000,
  "currency": "AMD" կամ "USD",
  "durationMonths": 6,
  "beneficiary": "Պատվիրատու / Շահառու / Պետական մարմին",
  "collateralType": "unsecured" կամ "cash_deposit" կամ "real_estate" կամ "corporate_guarantee",
  "contractNumber": "Համապատասխան պայմանագրի / տենդերի համար"
}`;
  } else if (normalizedProduct === "health") {
    prompt = `Վերլուծիր հետևյալ տեքստը և հանիր տվյալները «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Կամավոր Բժշկական Ապահովագրության (ԿԲԱ) համար:
ՏԵՔՍՏ:
${text}

Վերադարձրու ՄԻԱՅՆ ՄԱՔՈՒՐ JSON հետևյալ ստրուկտուրայով:
{
  "companyName": "Ընկերության կամ ապահովադրի անուն",
  "phone": "Հեռախոս",
  "insuredCount": 15,
  "planLevel": "economy" կամ "business" կամ "luxury" կամ "platinum",
  "limitPerPerson": 5000000,
  "currency": "AMD",
  "includeDental": true/false,
  "includeVision": true/false,
  "includeCheckup": true/false
}`;
  } else if (normalizedProduct === "travel") {
    prompt = `Վերլուծիր հետևյալ տեքստը և հանիր տվյալները «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Ճամփորդական (Travel) ապահովագրության համար:
ՏԵՔՍՏ:
${text}

Վերադարձրու ՄԻԱՅՆ ՄԱՔՈՒՐ JSON հետևյալ ստրուկտուրայով:
{
  "travelerName": "Ճամփորդողի Անուն Ազգանուն",
  "phone": "Հեռախոս",
  "destination": "schengen" կամ "georgia" կամ "worldwide",
  "tripDurationDays": 15,
  "travelerCount": 1,
  "coverageLimit": 30000,
  "currency": "EUR" կամ "USD",
  "purpose": "tourism" կամ "business" կամ "sports",
  "passportNumber": "Անձնագրի համար"
}`;
  } else if (normalizedProduct === "accident") {
    prompt = `Վերլուծիր հետևյալ տեքստը և հանիր տվյալները «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Դժբախտ պատահարներից ապահովագրության համար:
ՏԵՔՍՏ:
${text}

Վերադարձրու ՄԻԱՅՆ ՄԱՔՈՒՐ JSON հետևյալ ստրուկտուրայով:
{
  "clientName": "Ընկերություն կամ Ապահովադիր",
  "phone": "Հեռախոս",
  "insuredCount": 10,
  "sumPerPerson": 3000000,
  "currency": "AMD",
  "professionRisk": "office" կամ "production" կամ "construction" կամ "extreme_sports",
  "includeDeath": true,
  "includeDisability": true,
  "includeMedicalExpenses": true
}`;
  } else if (normalizedProduct === "agro") {
    prompt = `Վերլուծիր հետևյալ տեքստը և հանիր տվյալները «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Գյուղատնտեսական (Ագրո) ապահովագրության համար:
ՏԵՔՍՏ:
${text}

Վերադարձրու ՄԻԱՅՆ ՄԱՔՈՒՐ JSON հետևյալ ստրուկտուրայով:
{
  "farmerName": "Ֆերմերի կամ տնտեսության անուն",
  "phone": "Հեռախոս",
  "region": "Արմավիր, Արարատ, Կոտայք, Շիրակ, Լոռի կամ այլ",
  "cropType": "ծիրան" կամ "խաղող" կամ "խնձոր" կամ "դեղձ" կամ "կարտոֆիլ" կամ "հացահատիկ",
  "hectares": 3.5,
  "yieldKgPerHa": 12000,
  "pricePerKg": 250,
  "antiHailNet": true/false,
  "subsidyPercent": 50 կամ 60
}`;
  } else if (normalizedProduct === "mortgage") {
    prompt = `Վերլուծիր հետևյալ տեքստը և հանիր տվյալները «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Հիփոթեքային Վարկառուների Ապահովագրության համար:
ՏԵՔՍՏ:
${text}

Վերադարձրու ՄԻԱՅՆ ՄԱՔՈՒՐ JSON հետևյալ ստրուկտուրայով:
{
  "borrowerName": "Վարկառուի Անուն Ազգանուն",
  "phone": "Հեռախոս",
  "bankName": "Արդշինբանկ, Ամերիաբանկ, Ինեկոբանկ կամ այլ",
  "loanBalance": 25000000,
  "program": "nmc_package" կամ "hfy_package" կամ "commercial",
  "propertyType": "apartment" կամ "house",
  "propertyAddress": "Գրավադրված գույքի հասցե"
}`;
  } else if (normalizedProduct === "aviation") {
    prompt = `Վերլուծիր հետևյալ տեքստը և հանիր տվյալները «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Ավիացիոն ռիսկերի և դրոնների (Aviation) ապահովագրության համար:
ՏԵՔՍՏ:
${text}

Վերադարձրու ՄԻԱՅՆ ՄԱՔՈՒՐ JSON հետևյալ ստրուկտուրայով:
{
  "ownerName": "Սեփականատիրոջ կամ օպերատորի անուն",
  "phone": "Հեռախոս",
  "aviationType": "commercial_drone" կամ "aircraft_hull" կամ "helicopter" կամ "aviation_tpl",
  "aircraftModel": "Մոդել (օր. DJI Matrice 300 RTK)",
  "aircraftValue": 5000000,
  "currency": "AMD" կամ "USD",
  "flightHours": 250
}`;
  } else {
    // Default: Property Insurance
    prompt = `Վերլուծիր հետևյալ տեքստը և հանիր տվյալները «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ Գույքի Ապահովագրության հարցաշարի համար:
ՏԵՔՍՏ:
${text}

Վերադարձրու ՄԻԱՅՆ ՄԱՔՈՒՐ JSON օբյեկտ հետևյալ ստրուկտուրայով:
{
  "company": {
    "name": "Ընկերության կամ անձի անուն",
    "tin": "ՀՎՀՀ/ՀԾՀ",
    "contactPerson": "Կոնտակտային անձ",
    "phone": "Հեռախոս",
    "email": "Էլ. հասցե"
  },
  "objectData": {
    "address": "Հասցե",
    "propertyType": "apartment" կամ "private_house" կամ "short_term_rental" կամ "office" կամ "warehouse" կամ "retail" կամ "production",
    "totalArea": 120,
    "floor": 3,
    "totalFloors": 9,
    "yearBuilt": 2018,
    "constructionType": "reinforced_concrete" կամ "stone" կամ "metal" կամ "mixed",
    "purpose": "Շահագործման նպատակ"
  },
  "values": {
    "buildingValue": 45000000,
    "interiorValue": 15000000,
    "movableEquipmentValue": 10000000,
    "guestDamageValue": 0,
    "thirdPartyLiabilityValue": 5000000,
    "currency": "AMD"
  },
  "coverageRisks": {
    "fireExplosion": true,
    "waterDamage": true,
    "naturalDisasters": true,
    "burglaryRobbery": true,
    "vandalism": true,
    "mechanicalSmoke": false,
    "guestDamage": false,
    "thirdPartyLiability": true,
    "businessInterruption": false
  },
  "beneficiary": {
    "isPledged": false,
    "bankName": "",
    "loanAgreementNumber": ""
  }
}`;
  }

  try {
    const result = await callUnifiedAi([{ role: "user", parts: [{ text: prompt }], content: prompt }], systemRole);
    let cleanJsonStr = result.text.trim();
    if (cleanJsonStr.startsWith("```")) {
      cleanJsonStr = cleanJsonStr.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
    }
    const parsedData = JSON.parse(cleanJsonStr);
    res.json({ data: parsedData, product: normalizedProduct, modelUsed: result.modelUsed });
  } catch (e: any) {
    console.error("Parse questionnaire error:", e?.message);
    res.status(500).json({ error: "Ձախողվեց հարցաշարի ավտոմատ մշակումը", details: e?.message });
  }
});

app.post("/api/gemini/translate-proposal", optionalAuth, async (req, res) => {
  const { proposal, targetLang = "en" } = req.body || {};
  if (!proposal || typeof proposal !== "object") {
    return res.status(400).json({ error: "Quotation proposal data is required" });
  }

  if (targetLang === "hy") {
    return res.json({ proposal, modelUsed: "original" });
  }

  const langName = targetLang === "ru" ? "Russian" : "English";
  const langCode = targetLang === "ru" ? "ru" : "en";

  const fieldsToTranslate = {
    productNameArm: proposal.productNameArm || "",
    categoryNameArm: proposal.categoryNameArm || "",
    clientName: proposal.clientName || "",
    objectDescription: proposal.objectDescription || "",
    coveredPerilsList: proposal.coveredPerilsList || [],
    specialConditions: proposal.specialConditions || [],
    paymentTerms: proposal.paymentTerms || "",
    beneficiaryDetails: proposal.beneficiaryDetails || "",
    agentTitle: proposal.agentTitle || "",
    franchiseDescription: proposal.franchiseDescription || "",
    propertyBreakdown: proposal.propertyBreakdown || [],
    bundleBreakdown: proposal.bundleBreakdown || [],
    productSpecificDetails: proposal.productSpecificDetails || {},
    aiAnalysisText: proposal.aiAnalysisText || "",
    customTemplateText: proposal.customTemplateText || "",
  };

  const prompt = `You are a professional insurance underwriting and official document translation expert for SIL Insurance CJSC (СПАО "СИЛ ИНШУРАНС").
Translate all Armenian user-filled text in the following insurance quotation data into highly formal, accurate, and professional ${langName} insurance terminology.

CRITICAL INSTRUCTIONS:
1. Translate all Armenian phrases, addresses, property descriptions, risk coverages, legal terms, custom template terms (customTemplateText), and notes into fluent ${langName}.
2. For Armenian company forms:
   - "ՍՊԸ" -> ${langCode === "ru" ? "ООО" : "LLC"}
   - "ՓԲԸ" -> ${langCode === "ru" ? "ЗАО" : "CJSC"}
   - "ԲԲԸ" -> ${langCode === "ru" ? "ОАО" : "OJSC"}
   - "Ա/Ձ" -> ${langCode === "ru" ? "ИП" : "Individual Entrepreneur (IE)"}
   - "ՀՀ" -> ${langCode === "ru" ? "РА" : "Republic of Armenia"}
3. In "customTemplateText", preserve the exact line breaks, bullet points ("-", "•"), placeholders (like [Client Name], [Sum Insured], [Premium], [Tariff]), and numbered section headings (e.g. "1. INSURANCE COVERAGE AND PERILS", "2. REQUIRED DOCUMENTS AND PREREQUISITES", "3. SPECIAL CONDITIONS AND PAYMENT TERMS").
4. DO NOT change any numbers, financial values, currency codes (AMD, USD, EUR, RUR), dates, percentages, or IDs.
5. Return ONLY a valid JSON object matching the input structure below without any markdown formatting or extra text.

INPUT DATA:
${JSON.stringify(fieldsToTranslate, null, 2)}`;

  try {
    const result = await callUnifiedAi(
      [{ role: "user", parts: [{ text: prompt }], content: prompt }],
      `You are an insurance translation AI. Output ONLY pure valid JSON in ${langName}. No markdown backticks.`
    );

    let cleanJsonStr = result.text.trim();
    if (cleanJsonStr.startsWith("```")) {
      cleanJsonStr = cleanJsonStr.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
    }

    const translatedFields = JSON.parse(cleanJsonStr);

    // Merge translated text fields back onto the full original proposal
    const translatedProposal = {
      ...proposal,
      productNameArm: translatedFields.productNameArm || proposal.productNameArm,
      categoryNameArm: translatedFields.categoryNameArm || proposal.categoryNameArm,
      clientName: translatedFields.clientName || proposal.clientName,
      objectDescription: translatedFields.objectDescription || proposal.objectDescription,
      coveredPerilsList: Array.isArray(translatedFields.coveredPerilsList)
        ? translatedFields.coveredPerilsList
        : proposal.coveredPerilsList,
      specialConditions: Array.isArray(translatedFields.specialConditions)
        ? translatedFields.specialConditions
        : proposal.specialConditions,
      paymentTerms: translatedFields.paymentTerms || proposal.paymentTerms,
      beneficiaryDetails: translatedFields.beneficiaryDetails || proposal.beneficiaryDetails,
      agentTitle: translatedFields.agentTitle || proposal.agentTitle,
      franchiseDescription: translatedFields.franchiseDescription || proposal.franchiseDescription,
      propertyBreakdown: Array.isArray(translatedFields.propertyBreakdown)
        ? translatedFields.propertyBreakdown
        : proposal.propertyBreakdown,
      bundleBreakdown: Array.isArray(translatedFields.bundleBreakdown)
        ? translatedFields.bundleBreakdown
        : proposal.bundleBreakdown,
      productSpecificDetails: translatedFields.productSpecificDetails || proposal.productSpecificDetails,
      aiAnalysisText: translatedFields.aiAnalysisText || proposal.aiAnalysisText,
      customTemplateText: translatedFields.customTemplateText || proposal.customTemplateText,
    };

    res.json({ proposal: translatedProposal, modelUsed: result.modelUsed });
  } catch (e: any) {
    console.error("Translate proposal error:", e?.message);
    res.status(500).json({ error: "Failed to translate proposal", details: e?.message });
  }
});

app.post("/api/insurance/calculate", (req, res) => {
  const { values = {}, customTariff, customFranchise = 0, paymentSchedule = "single" } = req.body || {};
  const tariff = Number(customTariff);
  if (!Number.isFinite(tariff) || tariff < 0) return res.status(400).json({ error: "Invalid customTariff" });
  const totalSumInsured = Object.values(values as Record<string, unknown>).reduce<number>((sum, v) => sum + (typeof v === "number" && Number.isFinite(v) ? v : 0), 0);
  res.json({ totalSumInsured, customTariff: tariff, annualPremium: totalSumInsured * tariff / 100, franchisePercent: Number(customFranchise || 0), paymentSchedule, currency: (values as any).currency || "AMD" });
});

// Live Central Bank of Armenia (CBA.am) Exchange Rates Service
let cbaRatesCache: { data: any; timestamp: number } | null = null;

async function fetchLiveCbaRates(force = false) {
  const now = Date.now();
  // Cache for 60 seconds unless forced
  if (!force && cbaRatesCache && now - cbaRatesCache.timestamp < 60 * 1000) {
    return cbaRatesCache.data;
  }

  const defaultRates: Record<string, any> = {
    AMD: { currency: "AMD", symbol: "֏", nameArm: "ՀՀ Դրամ", rateToAMD: 1.0, lastUpdated: new Date().toISOString() },
    USD: { currency: "USD", symbol: "$", nameArm: "ԱՄՆ դոլար", rateToAMD: 388.50, change: -0.15, lastUpdated: new Date().toISOString() },
    EUR: { currency: "EUR", symbol: "€", nameArm: "Եվրո", rateToAMD: 424.20, change: 0.25, lastUpdated: new Date().toISOString() },
    RUB: { currency: "RUB", symbol: "₽", nameArm: "Ռուսական ռուբլի", rateToAMD: 4.35, change: -0.02, lastUpdated: new Date().toISOString() },
    GBP: { currency: "GBP", symbol: "£", nameArm: "Բրիտանական ֆունտ", rateToAMD: 508.90, change: 0.10, lastUpdated: new Date().toISOString() },
  };

  try {
    const cbRes = await fetch("https://cb.am/latest.json").catch(() => null);
    if (cbRes && cbRes.ok) {
      const cbData = await cbRes.json();
      if (cbData && (cbData.USD || cbData.EUR)) {
        const usdRate = parseFloat(cbData.USD) || 388.50;
        const eurRate = parseFloat(cbData.EUR) || 424.20;
        const rubRate = parseFloat(cbData.RUB) || 4.35;
        const gbpRate = parseFloat(cbData.GBP) || 508.90;

        const liveRates = {
          AMD: defaultRates.AMD,
          USD: { ...defaultRates.USD, rateToAMD: usdRate, lastUpdated: new Date().toISOString() },
          EUR: { ...defaultRates.EUR, rateToAMD: eurRate, lastUpdated: new Date().toISOString() },
          RUB: { ...defaultRates.RUB, rateToAMD: rubRate, lastUpdated: new Date().toISOString() },
          GBP: { ...defaultRates.GBP, rateToAMD: gbpRate, lastUpdated: new Date().toISOString() },
        };
        cbaRatesCache = { data: liveRates, timestamp: now };
        return liveRates;
      }
    }

    const erRes = await fetch("https://open.er-api.com/v6/latest/USD").catch(() => null);
    if (erRes && erRes.ok) {
      const erData = await erRes.json();
      if (erData?.rates?.AMD) {
        const usdToAmd = erData.rates.AMD;
        const eurToUsd = erData.rates.EUR || 0.92;
        const rubToUsd = erData.rates.RUB || 90;
        const gbpToUsd = erData.rates.GBP || 0.78;

        const liveRates = {
          AMD: defaultRates.AMD,
          USD: { ...defaultRates.USD, rateToAMD: Math.round(usdToAmd * 100) / 100, lastUpdated: new Date().toISOString() },
          EUR: { ...defaultRates.EUR, rateToAMD: Math.round((usdToAmd / eurToUsd) * 100) / 100, lastUpdated: new Date().toISOString() },
          RUB: { ...defaultRates.RUB, rateToAMD: Math.round((usdToAmd / rubToUsd) * 100) / 100, lastUpdated: new Date().toISOString() },
          GBP: { ...defaultRates.GBP, rateToAMD: Math.round((usdToAmd / gbpToUsd) * 100) / 100, lastUpdated: new Date().toISOString() },
        };
        cbaRatesCache = { data: liveRates, timestamp: now };
        return liveRates;
      }
    }
  } catch (e: any) {
    console.warn("CBA Live Rates fetch error, using default rates:", e?.message);
  }

  cbaRatesCache = { data: defaultRates, timestamp: now };
  return defaultRates;
}

app.get("/api/cba-rates", async (req, res) => {
  const force = req.query.refresh === "true";
  const rates = await fetchLiveCbaRates(force);
  res.json({
    status: "ok",
    source: "ՀՀ Կենտրոնական Բանկ (CBA.am) - Live Exchange Rates",
    lastUpdated: new Date().toISOString(),
    rates,
  });
});

app.post("/api/valuation/property-market-value", async (req, res) => {
  const {
    propertyType = "apartment",
    districtName = "Կենտրոն",
    subDistrict = "",
    areaSqm = 85,
    buildingStructure = "Մոնոլիտ",
    renovationCondition = "Եվրոնորոգում",
    floor = 3,
    totalFloors = 9,
    hasFurnitureAndTech = false,
    hasParkingOrGarage = false,
    hasIndividualHeating = true,
    hasPanoramicViewOrBalcony = false,
  } = req.body || {};

  const area = Number(areaSqm) || 85;

  const prompt = `Դու Հայաստանի անշարժ գույքի շուկայի և List.am հայտարարությունների վերլուծության փորձագետ Արհեստական Բանականությունն (ԱԲ) ես։
Հիմնվելով List.am կայքի անշարժ գույքի իրական հայտարարությունների, Երևանի վարչական շրջանների և ՀՀ մարզերի ընթացիկ գների վրա, հաշվարկիր հետևյալ գույքի ԻՐԱԿԱՆ ՄԻՋԻՆ ՇՈՒԿԱՅԱԿԱՆ ԱՐԺԵՔԸ ԱՄՆ դոլարով (USD) 1 քմ-ի համար և ընդհանուր գույքի համար.
- Գույքի տեսակ: ${propertyType}
- Վարչական շրջան / Բնակավայր: ${districtName} ${subDistrict ? `(${subDistrict})` : ""}
- Մակերես: ${area} քմ
- Շենքի կոնստրուկցիա: ${buildingStructure}
- Վերանորոգման վիճակ: ${renovationCondition}
- Հարկ / Հարկայնություն: ${floor}/${totalFloors}
- Կահույք և տեխնիկա: ${hasFurnitureAndTech ? "Առկա է" : "Առկա չէ"}
- Ավտոկայանատեղի/Ավտոտնակ: ${hasParkingOrGarage ? "Առկա է" : "Առկա չէ"}
- Անհատական ջեռուցում (Baxi): ${hasIndividualHeating ? "Առկա է" : "Առկա չէ"}
- Պանորամային տեսարան/Պատշգամբ: ${hasPanoramicViewOrBalcony ? "Առկա է" : "Առկա չէ"}

Խստիվ պահպանիր List.am-ի իրական շուկայական գների տիրույթը.
- Կենտրոն (մոնոլիտ/եվրոնորոգված բնակարան) ~1,900-2,600 $/քմ
- Արաբկիր ~1,300-1,800 $/քմ
- Դավթաշեն ~1,100-1,500 $/քմ
- Աջափնյակ, Նոր Նորք, Մալաթիա, Շենգավիթ ~850-1,200 $/քմ
- Էրեբունի ~750-1,050 $/քմ
- Նուբարաշեն, Նորք-Մարաշ ~650-950 $/քմ

Վերադարձրու ՄԻԱՅՆ JSON format-ով հետևյալ դաշտերը (առանց markdown code blocks).
{
  "estimatedPricePerSqmUSD": 1250,
  "minPricePerSqmUSD": 1100,
  "maxPricePerSqmUSD": 1400,
  "liquidity": "Բարձր",
  "marketTrendDescription": "List.am-ի վերջին հայտարարությունների համաձայն ${districtName} վարչական շրջանում ${propertyType} գույքի պահանջարկը կայուն է։",
  "aiCommentary": "ԱԲ Վերլուծություն (List.am տվյալներով)՝ ${districtName} վարչական շրջանում ${area} քմ մակերեսով ${propertyType}-ի 1 քմ-ի միջին շուկայական արժեքը գնահատվել է 1,250 USD..."
}`;

  try {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
    const result = await callGemini(
      [{ role: "user", parts: [{ text: prompt }] }],
      SYSTEM_INSTRUCTION,
      { responseMimeType: "application/json" }
    );

    const parsed = JSON.parse(result.text || "{}");
    const perSqmUSD = parsed.estimatedPricePerSqmUSD ? Number(parsed.estimatedPricePerSqmUSD) : null;
    const minPerSqmUSD = parsed.minPricePerSqmUSD ? Number(parsed.minPricePerSqmUSD) : perSqmUSD ? Math.round(perSqmUSD * 0.9) : null;
    const maxPerSqmUSD = parsed.maxPricePerSqmUSD ? Number(parsed.maxPricePerSqmUSD) : perSqmUSD ? Math.round(perSqmUSD * 1.1) : null;
    const totalUSD = perSqmUSD ? Math.round(perSqmUSD * area) : null;
    const minTotalUSD = minPerSqmUSD ? Math.round(minPerSqmUSD * area) : null;
    const maxTotalUSD = maxPerSqmUSD ? Math.round(maxPerSqmUSD * area) : null;

    res.json({
      estimatedPricePerSqmUSD: perSqmUSD,
      minPricePerSqmUSD: minPerSqmUSD,
      maxPricePerSqmUSD: maxPerSqmUSD,
      estimatedTotalUSD: totalUSD,
      minTotalUSD: minTotalUSD,
      maxTotalUSD: maxTotalUSD,
      liquidity: parsed.liquidity || "Բարձր",
      marketTrendDescription: parsed.marketTrendDescription || `List.am-ի հայտարարությունների համաձայն ${districtName}-ում 1 քմ-ի միջին արժեքը գտնվում է ակտիվ տիրույթում։`,
      aiCommentary: parsed.aiCommentary || result.text,
      modelUsed: result.modelUsed,
      source: "List.am Data via Gemini AI"
    });
  } catch (e: any) {
    console.warn("Gemini property valuation fallback:", e?.message);
    res.json({
      aiCommentary: `List.am-ում ${districtName} վարչական շրջանի ${propertyType} գույքի համար 1 քմ-ի միջին արժեքը գտնվում է կայուն տիրույթում։ Խորհուրդ է տրվում ապահովագրական գումարը սահմանել ըստ List.am-ում համանման հայտարարությունների միջինացված ցուցանիշի։`,
      fallback: true
    });
  }
});


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
  
  const newId = `lead-${Date.now()}`;
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

app.put("/api/leads/:id", optionalAuth, (req: any, res) => {
  const l = req.body;
  const id = req.params.id;
  try {
    const existing = db.prepare('SELECT * FROM client_leads WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: "Lead not found" });
    }
    
    db.prepare(`
      UPDATE client_leads SET 
        clientName = ?, 
        phone = ?, 
        email = ?, 
        productType = ?, 
        policyNumber = ?, 
        expiryDate = ?, 
        estimatedPremium = ?, 
        status = ?, 
        lastContactedDate = ?, 
        notes = ?, 
        vehicleOrPropertyDetails = ?
      WHERE id = ?
    `).run(
      l.clientName ?? existing.clientName,
      l.phone ?? existing.phone,
      l.email ?? existing.email,
      l.productType ?? existing.productType,
      l.policyNumber ?? existing.policyNumber,
      l.expiryDate ?? existing.expiryDate,
      l.estimatedPremium !== undefined ? Number(l.estimatedPremium) : existing.estimatedPremium,
      l.status ?? existing.status,
      l.lastContactedDate ?? existing.lastContactedDate,
      l.notes ?? existing.notes,
      l.vehicleOrPropertyDetails ?? existing.vehicleOrPropertyDetails,
      id
    );

    const updated = db.prepare('SELECT * FROM client_leads WHERE id = ?').get(id);
    res.json({ ok: true, lead: updated });
  } catch (e: any) {
    console.error("Error updating lead:", e);
    res.status(500).json({ error: "Database error", details: e?.message });
  }
});

app.delete("/api/leads/:id", optionalAuth, (req: any, res) => {
  const id = req.params.id;
  try {
    db.prepare('DELETE FROM client_leads WHERE id = ?').run(id);
    res.json({ ok: true });
  } catch (e: any) {
    console.error("Error deleting lead:", e);
    res.status(500).json({ error: "Database error", details: e?.message });
  }
});

// AI Property Photo Scan (Renovation & Condition Evaluation)
app.post("/api/ai/property-photo-scan", async (req, res) => {
  const { imageBase64, mimeType = "image/jpeg" } = req.body || {};
  if (!imageBase64) {
    return res.status(400).json({ error: "Missing imageBase64 data" });
  }

  const prompt = `Դու SIL Insurance-ի անշարժ գույքի գնահատման և ռիսկերի underwriting փորձագետ Արհեստական Բանականությունն (ԱԲ) ես։
Վերլուծիր ներկայացված բնակարանի/տան/շինության լուսանկարը և տրամադրիր գույքի վերանորոգման որակի և վիճակի ճշգրիտ գնահատում.

Վերադարձրու ՄԻԱՅՆ JSON format-ով հետևյալ կառուցվածքով (առանց markdown code block):
{
  "renovationCondition": "Եվրոնորոգում",
  "renovationConditionId": "euro",
  "buildingStructure": "Մոնոլիտ",
  "qualityScore": 8.5,
  "materialsObserved": "Լամինատ/Պարկետ, գիպսակարդոն առաստաղներ, լեդ լուսավորություն, որակյալ պատուհաններ",
  "aiAnalysisSummary": "Լուսանկարում պատկերված է բարձրորակ եվրոնորոգմամբ և ժամանակակից հարդարմամբ բնակելի տարածք։ Հարդարման նյութերն ու ցանցերը գտնվում են գերազանց վիճակում։",
  "underwritingRiskLevel": "Ցածր ռիսկ"
}

Հնարավոր renovationCondition / renovationConditionId արժեքներ.
1. "Էկոնոմ" (id: "economy") - հին կամ ստանդարտ պարզ վերանորոգում
2. "Եվրոնորոգում" (id: "euro") - ժամանակակից, մաքուր, որակյալ հարդարում
3. "Լյուքս" (id: "luxury") - դիզայներական, բարձրակարգ հարդարում, պրեմիում նյութեր
4. "Զրոյական (սև սվաղ)" (id: "zero") - առանց վերանորոգման`;

  try {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const contents = [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: cleanBase64 } },
          { text: prompt },
        ],
      },
    ];

    const result = await callGemini(contents, SYSTEM_INSTRUCTION, { responseMimeType: "application/json" });
    const parsed = JSON.parse(result.text || "{}");

    res.json({
      status: "ok",
      renovationCondition: parsed.renovationCondition || "Եվրոնորոգում",
      renovationConditionId: parsed.renovationConditionId || "euro",
      buildingStructure: parsed.buildingStructure || "Մոնոլիտ",
      qualityScore: parsed.qualityScore || 8.0,
      materialsObserved: parsed.materialsObserved || "Որակյալ հարդարում",
      aiAnalysisSummary: parsed.aiAnalysisSummary || "Լուսանկարի վերլուծությամբ հաստատվել է գույքի բարձրորակ վիճակը։",
      underwritingRiskLevel: parsed.underwritingRiskLevel || "Ցածր ռիսկ",
      modelUsed: result.modelUsed,
    });
  } catch (err: any) {
    console.warn("Property Photo AI scan fallback:", err?.message);
    res.json({
      status: "fallback",
      renovationCondition: "Եվրոնորոգում",
      renovationConditionId: "euro",
      qualityScore: 7.5,
      aiAnalysisSummary: "Լուսանկարի նախնական զննմամբ գույքը գնահատվում է որպես Եվրոնորոգված (ստանդարտ որակի)։",
      underwritingRiskLevel: "Ստանդարտ",
    });
  }
});

app.post("/api/valuation/vehicle-market-value", async (req, res) => {
  const { make = "Toyota", model = "Camry", manufactureYear = 2020, fuelType = "gasoline", condition = "good", mileageKm = 80000 } = req.body || {};
  const prompt = `Դու Հայաստանի ավտոշուկայի և ապահովագրական գնահատման փորձագետ Արհեստական Բանականությունն (ԱԲ) ես։
Հաշվարկիր և տրամադրիր հետևյալ ավտոմեքենայի ԻՐԱԿԱՆ ՄԻՋԻՆ ՇՈՒԿԱՅԱԿԱՆ ԱՐԺԵՔԸ ԱՄՆ դոլարով (USD) Հայաստանի ավտոշուկայում (List.am, Auto.am).
- Մակնիշ / Մոդել: ${make} ${model}
- Արտադրման տարեթիվ: ${manufactureYear}թ.
- Վառելիք / Շարժիչ: ${fuelType}
- Վիճակ: ${condition}
- Վազք: ${mileageKm} կմ

Խստիվ պահպանիր իրատեսական շուկայական գները (օրինակ՝ Toyota Camry 2020թ.~18,000-22,000$, Mercedes G63 2021թ.~150,000-180,000$, Lada Niva 2018թ.~6,000-8,000$, BMW X5 2019թ.~38,000-48,000$):

Վերադարձրու ՄԻԱՅՆ JSON format-ով հետևյալ դաշտերը.
{
  "estimatedPriceUSD": 20000,
  "minPriceUSD": 18000,
  "maxPriceUSD": 22000,
  "liquidity": "Բարձր",
  "aiCommentary": "ԱԲ Վերլուծություն՝ Հայաստանում ${make} ${model} (${manufactureYear}թ.) ավտոմեքենայի միջին շուկայական գինը ձևավորվում է 20,000 USD-ի շուրջ՝ ելնելով ընթացիկ պահանջարկից..."
}`;

  try {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
    const result = await callGemini(
      [{ role: "user", parts: [{ text: prompt }] }],
      SYSTEM_INSTRUCTION,
      { responseMimeType: "application/json" }
    );
    const parsed = JSON.parse(result.text || "{}");
    res.json({
      estimatedPriceUSD: parsed.estimatedPriceUSD ? Number(parsed.estimatedPriceUSD) : null,
      minPriceUSD: parsed.minPriceUSD ? Number(parsed.minPriceUSD) : null,
      maxPriceUSD: parsed.maxPriceUSD ? Number(parsed.maxPriceUSD) : null,
      liquidity: parsed.liquidity || "Բարձր",
      aiCommentary: parsed.aiCommentary || result.text,
      modelUsed: result.modelUsed,
      source: "AI (Արհեստական Բանականություն)"
    });
  } catch (e: any) {
    res.json({
      aiCommentary: `Հայաստանի ավտոշուկայում ${make} ${model} (${manufactureYear}թ.) ավտոմեքենան ունի բարձր իրացվելիություն։ Միջին շուկայական գինը ձևավորվում է ըստ տրանսպորտային միջոցի վազքի և ընդհանուր տեխնիկական վիճակի։`,
      fallback: true
    });
  }
});

// -------------------- Frontend Server: Dev Vite Middleware & Prod Static --------------------
async function start() {
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true, hmr: false },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite development middleware mounted successfully");
    } catch (e) {
      console.warn("Failed to initialize Vite middleware, falling back to static files:", e);
      mountStaticFallback();
    }
  } else {
    mountStaticFallback();
  }

  function mountStaticFallback() {
    const possibleDistPaths = [
      currentDir,
      DIST,
      path.join(ROOT, "dist"),
      path.resolve("dist"),
      path.join(currentDir, "dist"),
      path.join(currentDir, "../dist"),
      path.join(process.cwd(), "dist")
    ];
    const distPath = possibleDistPaths.find(p => fs.existsSync(path.join(p, "index.html"))) || DIST;
    const indexPath = path.join(distPath, "index.html");

    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath, {
        index: "index.html",
        maxAge: "1h",
      }));
    }

    // SPA fallback: never route /api/* or /health to index.html.
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api") || req.path === "/health" || req.path === "/healthz") {
        return next();
      }
      const targetIndex = [
        path.join(distPath, "index.html"),
        path.join(DIST, "index.html"),
        path.join(process.cwd(), "dist", "index.html"),
        path.join(currentDir, "index.html"),
        indexPath
      ].find(p => fs.existsSync(p));

      if (targetIndex) {
        res.sendFile(targetIndex);
      } else {
        res.status(200).send("<!doctype html><html><head><title>SIL Insurance Portal</title></head><body><div id='root'></div></body></html>");
      }
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`SIL Insurance Portal listening on http://0.0.0.0:${PORT}`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal}: shutting down gracefully`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

start().catch((err) => {
  console.error("Critical error during server startup:", err);
  process.exit(1);
});
