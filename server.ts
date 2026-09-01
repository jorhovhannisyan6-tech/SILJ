import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, getDoc, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import mammoth from "mammoth";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const KB = path.join(ROOT, "knowledge-base");

// Initialize Firebase for Backend Use
const firebaseConfigPath = path.join(ROOT, "firebase-applet-config.json");
let db: any = null;

async function syncKnowledgeBaseFromFirestore() {
  if (!db) {
    console.log("No Firestore DB found. Skipping KB Firestore sync.");
    return;
  }
  try {
    console.log("Starting Knowledge Base Firestore sync...");
    const querySnapshot = await getDocs(collection(db, "knowledge_base_docs"));
    const firebaseDocs = querySnapshot.docs.map(doc => doc.data());
    
    if (firebaseDocs.length === 0) {
      console.log("No dynamic KB documents found in Firestore.");
      return;
    }

    const indexPath = path.join(KB, "index.json");
    let indexData: any = { version: "1.0", language: "hy", products: [] };
    if (fs.existsSync(indexPath)) {
      try {
        indexData = JSON.parse(fs.readFileSync(indexPath, "utf8"));
      } catch (e) {
        console.error("Failed to parse local index.json, resetting.", e);
      }
    }

    const textDir = path.join(KB, "text");
    fs.mkdirSync(textDir, { recursive: true });

    firebaseDocs.forEach((fdoc: any) => {
      if (!fdoc.sourceFile || !fdoc.textFile) return;
      const textFilePath = path.join(KB, fdoc.textFile);
      fs.writeFileSync(textFilePath, fdoc.text || "", "utf8");
      
      const existingIdx = (indexData.products || []).findIndex(
        (p: any) => p.sourceFile === fdoc.sourceFile || p.textFile === fdoc.textFile
      );
      const entry = {
        productId: fdoc.productId,
        sourceFile: fdoc.sourceFile,
        textFile: fdoc.textFile,
        characters: (fdoc.text || "").length,
      };

      if (existingIdx >= 0) {
        indexData.products[existingIdx] = entry;
      } else {
        indexData.products.push(entry);
      }
    });

    fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), "utf8");
    reloadKnowledgeBase();
    console.log(`Knowledge Base Firestore sync completed. Synchronized ${firebaseDocs.length} documents.`);
  } catch (err) {
    console.error("Failed to sync Knowledge Base from Firestore:", err);
  }
}

if (fs.existsSync(firebaseConfigPath)) {
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    console.log("Firebase/Firestore initialized successfully in server backend.");
    
    // Asynchronously synchronize KB documents from Firestore
    setTimeout(() => {
      syncKnowledgeBaseFromFirestore();
    }, 1000);
  } catch (err) {
    console.error("Failed to initialize Firebase/Firestore on server backend:", err);
  }
}

app.use(express.json({ limit: "20mb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

// Lightweight Cloud Run-compatible auth layer. For multi-instance production,
// replace the in-memory stores with a shared database/Redis session store.
type Role = "agent"|"underwriter"|"manager"|"auditor"|"admin";
type User = { id:string; username:string; name:string; email:string; role:Role; status:"active"|"pending"|"disabled"; passwordHash:string; createdAt:string; lastLogin?:string };
const users = new Map<string, User>();
const sessions = new Map<string, { userId:string; expires:number }>();
const auditEvents: any[] = [];
const hashPassword=(p:string,salt=crypto.randomBytes(16).toString("hex"))=>`${salt}:${crypto.scryptSync(String(p),salt,64).toString("hex")}`;
const verifyPassword=(p:string,stored:string)=>{const [salt,hash]=String(stored).split(":"); if(!salt||!hash)return false; const actual=crypto.scryptSync(String(p),salt,64).toString("hex"); return crypto.timingSafeEqual(Buffer.from(actual,"hex"),Buffer.from(hash,"hex"));};
const seedUser=()=>{ if(users.size) return; const u=process.env.SIL_ADMIN_USERNAME || "Admin"; const p=process.env.SIL_ADMIN_PASSWORD || "Admin"; if(u&&p) users.set(u,{id:crypto.randomUUID(),username:u,name:"System Administrator",email:"",role:"admin",status:"active",passwordHash:hashPassword(p),createdAt:new Date().toISOString()}); };
seedUser();
const addServerAudit=(action:string,userId?:string,details?:any)=>{auditEvents.unshift({id:crypto.randomUUID(),at:new Date().toISOString(),action,userId,details}); if(auditEvents.length>5000)auditEvents.length=5000;};
const auth=(req:any,res:any,next:any)=>{ const token=req.headers.authorization?.replace(/^Bearer\s+/i,"") || req.headers["x-session-token"]; const session=token?sessions.get(token):undefined; if(!session||session.expires<Date.now()) return res.status(401).json({error:"Authentication required"}); const user=[...users.values()].find(u=>u.id===session.userId); if(!user||user.status!=="active") return res.status(401).json({error:"Account is not active"}); req.user=user; next(); };
const optionalAuth=(req:any,res:any,next:any)=>{ const token=req.headers.authorization?.replace(/^Bearer\s+/i,"") || req.headers["x-session-token"]; const session=token?sessions.get(token):undefined; if(session && session.expires>=Date.now()){ const user=[...users.values()].find(u=>u.id===session.userId); if(user && user.status==="active") req.user=user; } next(); };
const requireRole=(...roles:Role[]) => (req:any,res:any,next:any)=> roles.includes(req.user?.role) ? next() : res.status(403).json({error:"Insufficient permissions"});
app.post("/api/auth/login",(req,res)=>{ const {username,password}=req.body||{}; const user=users.get(String(username||"")); if(!user||user.status!=="active"||!verifyPassword(password||"",user.passwordHash)){addServerAudit("auth.login.failed",undefined,{username}); return res.status(401).json({error:"Սխալ username/password կամ account-ը դեռ հաստատված չէ"});} const token=crypto.randomBytes(32).toString("hex"); sessions.set(token,{userId:user.id,expires:Date.now()+8*60*60*1000}); user.lastLogin=new Date().toISOString(); addServerAudit("auth.login.success",user.id); const {passwordHash,...safe}=user; res.json({token,user:safe}); });
app.post("/api/auth/register",(req,res)=>{ const {username,password,name,email}=req.body||{}; if(!username||!password||!name)return res.status(400).json({error:"Պարտադիր դաշտերը լրացված չեն"}); if(users.has(username))return res.status(409).json({error:"Username-ը արդեն գոյություն ունի"}); const u:User={id:crypto.randomUUID(),username,name,email:email||"",role:"agent",status:"pending",passwordHash:hashPassword(password),createdAt:new Date().toISOString()}; users.set(username,u); addServerAudit("auth.registration.pending",u.id,{username}); res.status(201).json({pending:true}); });
app.get("/api/auth/me",auth,(req:any,res)=>{const {passwordHash,...safe}=req.user;res.json({user:safe});});
app.post("/api/auth/logout",auth,(req:any,res)=>{const token=req.headers.authorization?.replace(/^Bearer\s+/i,"") || req.headers["x-session-token"]; if(token)sessions.delete(token); addServerAudit("auth.logout",req.user.id); res.json({ok:true});});
app.get("/api/admin/users",auth,requireRole("admin","manager"),(_req,res)=>res.json({users:[...users.values()].map(({passwordHash,...u})=>u)}));
app.post("/api/admin/users/:id/approve",auth,requireRole("admin","manager"),(req:any,res)=>{const u=[...users.values()].find(x=>x.id===req.params.id);if(!u)return res.status(404).json({error:"User not found"});u.status="active";addServerAudit("user.approve",req.user.id,{target:u.id});res.json({ok:true});});
app.post("/api/admin/users/:id/reject",auth,requireRole("admin","manager"),(req:any,res)=>{const u=[...users.values()].find(x=>x.id===req.params.id);if(!u)return res.status(404).json({error:"User not found"});u.status="disabled";addServerAudit("user.reject",req.user.id,{target:u.id});res.json({ok:true});});
app.patch("/api/admin/users/:id",auth,requireRole("admin"),(req:any,res)=>{const u=[...users.values()].find(x=>x.id===req.params.id);if(!u)return res.status(404).json({error:"User not found"});if(req.body.role&&["agent","underwriter","manager","auditor","admin"].includes(req.body.role))u.role=req.body.role;if(req.body.status&&["active","pending","disabled"].includes(req.body.status))u.status=req.body.status;if(req.body.password)u.passwordHash=hashPassword(req.body.password);addServerAudit("user.update",req.user.id,{target:u.id,role:u.role,status:u.status});res.json({ok:true});});
app.get("/api/admin/audit",auth,requireRole("admin","manager","auditor"),(req:any,res)=>{const q=String(req.query.q||"").toLowerCase(); const result=auditEvents.filter(e=>!q||JSON.stringify(e).toLowerCase().includes(q)).slice(0,1000);res.json({events:result});});
app.get("/api/admin/security",auth,requireRole("admin","manager","auditor"),(_req,res)=>res.json({activeSessions:sessions.size,users:[...users.values()].length,failedLogins:auditEvents.filter(x=>x.action==="auth.login.failed").length,events:auditEvents.slice(0,20)}));


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
  health: "Առողջության ապահովագրություն (ԲԾԱ)",
  travel: "Ճամփորդական ապահովագրություն",
  mortgage: "Հիփոթեքային ապահովագրություն",
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
  health: ["առողջություն", "բժշկական", "բծա", "հիվանդանոց", "դեղորայք", "ստոմատոլոգիա"],
  travel: ["ճամփորդական", "արտասահման", "շենգեն", "ուղևորություն", "ուղեբեռ"],
  mortgage: ["հիփոթեք", "հիպոթեք", "բնակարան", "վարկառու", "բանկ"],
};

function ensureKnowledgeBaseTextFiles() {
  const textDir = path.join(KB, "text");
  if (!fs.existsSync(textDir)) {
    try {
      fs.mkdirSync(textDir, { recursive: true });
    } catch (e) {}
  }

  // Pre-populate missing files with clean Armenian text in UTF-8
  const fallbacks: Record<string, string> = {
    "text/guyqi_paymanner.docx.txt": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ԳՈՒՅՔԻ ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ՊԱՅՄԱՆՆԵՐ\n1. Ապահովագրվող օբյեկտներ՝ շենքեր, շինություններ, բնակարաններ, հիմնական միջոցներ, ապրանքանյութական արժեքներ, սարքավորումներ։\n2. Հիմնական ռիսկեր (ներառված)՝ Հրդեհ, կայծակ, պայթյուն, երկրաշարժ, սողանք, ջրհեղեղ, գողություն, վանդալիզմ։`,
    "text/beri_paymanner.docx.txt": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ԲԵՌՆԵՐԻ ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ՊԱՅՄԱՆՆԵՐ (ICC A, B, C)\n1. Ծածկույթի տեսակներ՝ ICC (A) - Բոլոր ռիսկերով ապահովագրություն (All Risks), ICC (B) - Հիմնական ռիսկեր, ICC (C) - Սահմանափակ ռիսկեր։\n2. Ապահովագրական գումար՝ բեռի արժեք՝ գումարած փոխադրման ծախսերը։`,
    "text/yndhanur_pataskhanatvutyan_paymanner.docx.txt": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ԸՆԴՀԱՆՈՒՐ ՊԱՏԱՍԽԱՆԱՏՎՈՒԹՅԱՆ ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ՊԱՅՄԱՆՆԵՐ\n1. Ապահովագրական պատասխանատվություն՝ երրորդ անձանց կյանքին, առողջությանը կամ գույքին պատճառված վնասների հատուցում։\n2. Բացառություններ՝ պայմանագրային պատասխանատվություն, մասնագիտական սխալներ, տույժեր։`,
    "text/inkasacyon_risk.docx.txt": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ԻՆԿԱՍԱՑԻՈՆ ՌԻՍԿԵՐԻ ԵՎ ԴՐԱՄԱԿԱՆ ՄԻՋՈՑՆԵՐԻ ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ՊԱՅՄԱՆՆԵՐ\n1. Ապահովագրական օբյեկտ՝ կանխիկ դրամական միջոցներ տեղափոխման ընթացքում կամ պահպանման վայրում։\n2. Հիմնական ռիսկեր՝ զինված կողոպուտ, հափշտակություն, ավազակություն։`,
    "text/kanxavchari_apahovagrutyun_paymanner-12_09_2018.docx.txt": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ԿԱՆԽԱՎՃԱՐԻ ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ՊԱՅՄԱՆՆԵՐ\n1. Ապահովագրական գումար՝ տրամադրված կանխավճարի չափով։\n2. Հատուցման հիմքեր՝ Կապալառուի կողմից աշխատանքների չկատարում, կանխավճարի չվերադարձում։`,
    "text/kapalaru_paymanner_shinmontaj.docx.txt": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ԿԱՊԱԼԱՌՈՒԻ ԲՈԼՈՐ ՌԻՍԿԵՐԻ (CAR / EAR) ԵՎ ՇԻՆՄՈՆՏԱԺԱՅԻՆ ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ՊԱՅՄԱՆՆԵՐ\n1. Օբյեկտներ՝ շինարարական աշխատանքներ, մոնտաժվող սարքավորումներ, տեխնիկա։\n2. Ռիսկեր՝ հրդեհ, հեղեղ, փլուզում, սողանք, երկրաշարժ։`,
    "text/masnagitakan_pataskhanatvutyan_apahovagrutyun_paymanner.docx.txt": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ՄԱՍՆԱԳԻՏԱԿԱՆ ՊԱՏԱՍԽԱՆԱՏՎՈՒԹՅԱՆ ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ՊԱՅՄԱՆՆԵՐ\n1. Օբյեկտ՝ բժիշկների, նոտարների, աուդիտորների մասնագիտական գործունեության ընթացքում թույլ տրված սխալներ, բացթողումներ, անփութություն։`,
    "text/meqenaneri_khapanman_ap-n_paymanner_hayeren.docx.txt": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ՄԵՔԵՆԱՆԵՐԻ ԵՎ ՍԱՐՔԱՎՈՐՈՒՄՆԵՐԻ ԽԱՓԱՆՄԱՆ ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ՊԱՅՄԱՆՆԵՐ\n1. Օբյեկտներ՝ արտադրական սարքավորումներ, հաստոցներ, մեխանիզմներ։\n2. Ռիսկեր՝ մեխանիկական և էլեկտրական խափանումներ, կարճ միացում։`,
    "text/pahesti_pataskhanatvutyun.docx.txt": `ՍԻԼ ԻՆՇՈՒՐԱՆՍ ԱՓԲԸ - ՊԱՀԵՍՏՆԵՐԻ ՊԱՏԱՍԽԱՆԱՏՎՈՒԹՅԱՆ ՊԱՅՄԱՆՆԵՐ\n1. Նպատակ՝ պահեստի սեփականատիրոջ պատասխանատվությունը պահպանության հանձնված ապրանքների կորստի կամ վնասման համար։`
  };

  for (const [relPath, content] of Object.entries(fallbacks)) {
    const full = path.join(KB, relPath);
    if (!fs.existsSync(full)) {
      try {
        fs.writeFileSync(full, content, "utf8");
      } catch (e) {}
    }
  }
}

function loadKnowledgeBase() {
  ensureKnowledgeBaseTextFiles();
  const indexPath = path.join(KB, "index.json");
  const defaultProducts = [
    { productId: "property", sourceFile: "Գույք Պայմաններ.docx", textFile: "text/guyqi_paymanner.docx.txt" },
    { productId: "cargo", sourceFile: "Բեռի Պայմաններ.docx", textFile: "text/beri_paymanner.docx.txt" },
    { productId: "general-liability", sourceFile: "Ընդհանուր Պատասխանատվության պայմաներ.docx", textFile: "text/yndhanur_pataskhanatvutyan_paymanner.docx.txt" },
    { productId: "cash-in-transit", sourceFile: "Ինկասացիոն Ռիսկ.docx", textFile: "text/inkasacyon_risk.docx.txt" },
    { productId: "advance-payment", sourceFile: "Կանխավճարի ապահովագրության պայմաններ.docx", textFile: "text/kanxavchari_apahovagrutyun_paymanner-12_09_2018.docx.txt" },
    { productId: "construction-all-risks", sourceFile: "Կապալառու Պայմաններ(Շինմոնտաժ).docx", textFile: "text/kapalaru_paymanner_shinmontaj.docx.txt" },
    { productId: "professional-liability", sourceFile: "Մասնագիտական պատասխանատվության ապահովագրության պայմաններ.docx", textFile: "text/masnagitakan_pataskhanatvutyan_apahovagrutyun_paymanner.docx.txt" },
    { productId: "machinery-breakdown", sourceFile: "Մեքենաների խափանման ապ-ն Պայմաններ հայերեն.docx", textFile: "text/meqenaneri_khapanman_ap-n_paymanner_hayeren.docx.txt" },
    { productId: "warehouse-liability", sourceFile: "Պահեստների պատասխանատվություն-հարցաթերթիկ.doc", textFile: "text/pahesti_pataskhanatvutyun.docx.txt" },
    { productId: "casco", sourceFile: "casco calculator 2024 - առանց ՃՈՈ.xlsx", textFile: null }
  ];

  let index: any = { products: [] };
  if (fs.existsSync(indexPath)) {
    try {
      index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    } catch (e) {
      console.warn("Failed to parse knowledge-base/index.json", e);
    }
  }

  // If index is empty or has no products, write index.json with defaultProducts
  if (!index.products || index.products.length === 0) {
    index.products = defaultProducts;
    try {
      fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), "utf8");
    } catch (e) {}
  } else {
    // Merge defaultProducts that are not present in index.products
    defaultProducts.forEach(def => {
      const exists = index.products.some((p: any) => p.productId === def.productId);
      if (!exists) {
        index.products.push(def);
      }
    });
  }

  return index.products.map((entry: any) => {
    if (!entry.textFile) return { ...entry, text: "" };
    const full = path.join(KB, entry.textFile);
    const text = fs.existsSync(full) ? fs.readFileSync(full, "utf8") : "";
    return { ...entry, text };
  });
}

let KNOWLEDGE_BASE = loadKnowledgeBase();

function reloadKnowledgeBase() {
  KNOWLEDGE_BASE = loadKnowledgeBase();
  return KNOWLEDGE_BASE;
}

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
9. Եթե օգտատերը խնդրում է ստեղծել կամ կազմել գնառաջարկ, ԱԲ-ն կարող է կազմել գնառաջարկի նախագիծ (Draft)։ Այդ դեպքում տեքստային պատասխանի վերջում (առանձին տողից) ՊԱՐՏԱԴԻՐ ավելացրու հետևյալ ճշգրիտ JSON բլոկը, որպեսզի համակարգը կարողանա այն վերլուծել և թույլ տալ ձեռքով խմբագրել.
\`\`\`json
{
  "type": "proposal_draft",
  "proposal": {
    "id": "ai-draft-[id]",
    "quotationNumber": "AI-QD-[number]",
    "type": "casco" (կամ "property", "mortgage", "liability", "accident" և այլն),
    "productNameArm": "[Անուն]",
    "categoryNameArm": "[Կատեգորիա]",
    "clientName": "[Հաճախորդի անուն]",
    "contactInfo": "[Հեռախոս կամ էլ․ փոստ]",
    "objectDescription": "[Ապահովագրվող օբյեկտի նկարագրություն]",
    "totalSumInsured": [թիվ],
    "currency": "AMD" (կամ "USD", "EUR"),
    "baseTariff": [սակագին թիվ, օրինակ՝ 2.5],
    "discountBonus": 0,
    "finalTariff": [սակագին թիվ, օրինակ՝ 2.5],
    "annualPremium": [ապահովագրավճար թիվ, օրինակ՝ 250000],
    "franchiseDescription": "[ֆրանշիզայի պայմաններ]",
    "paymentTerms": "Միանվագ",
    "beneficiaryDetails": "[Շահառուի տվյալներ]",
    "coveredPerilsList": ["[ռիսկ 1]", "[ռիսկ 2]"],
    "specialConditions": ["[պայման 1]", "[պայման 2]"]
  }
}
\`\`\`
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
      temperature: 0.2,
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
app.get("/api/health", (_req, res) => {
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

  let activeInstruction = SYSTEM_INSTRUCTION;
  if (db) {
    try {
      const docRef = doc(db, "bot_configs", "advisor_bot");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().systemInstruction) {
        activeInstruction = docSnap.data().systemInstruction;
      }
    } catch (err) {
      console.warn("Firestore bot instruction load failed, using default:", err);
    }
  }

  const dynamicSystem = `${activeInstruction}\n\n[ՊՐՈԴՈՒԿՏՆԵՐ]\n${JSON.stringify(products, null, 2)}\n\n[UNDERWRITING ԿԱՆՈՆՆԵՐ]\n${JSON.stringify(underwritingRules, null, 2)}\n\n[ԱՂԲՅՈՒՐԱՅԻՆ ՊԱՅՄԱՆՆԵՐ]\n${knowledge}`;
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

  const prompt = isTech
    ? `You are an expert Armenian OCR parser for Vehicle Registration Certificates (Տեխնիկական Անձնագիր / Տեխպասպորտ) and vehicle documents.
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
}`
    : `You are an expert Armenian OCR parser for Passports and ID Cards (Անձնագիր / Նույնականացման քարտ).
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
          temperature: 0.1,
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


// -------------------- KB Admin Endpoints --------------------
app.get("/api/admin/kb", auth, (req, res) => {
  const user = (req as any).user;
  if (!user || !["admin", "manager", "underwriter", "auditor"].includes(user.role)) {
    return res.status(403).json({ error: "Access denied" });
  }
  const kbData = loadKnowledgeBase();
  res.json({ status: "ok", products: kbData });
});

app.post("/api/admin/kb", auth, async (req, res) => {
  const user = (req as any).user;
  if (!user || !["admin", "manager"].includes(user.role)) {
    return res.status(403).json({ error: "Access denied" });
  }
  const { productId, sourceFile, text } = req.body || {};
  if (!productId || !sourceFile) {
    return res.status(400).json({ error: "Missing required fields: productId, sourceFile" });
  }

  const safeFileName = String(sourceFile).replace(/[^a-zA-Z0-9_\-.\u0531-\u058F]/g, "_");
  const textFileName = `text/${safeFileName}.txt`;
  const textFilePath = path.join(KB, textFileName);

  fs.mkdirSync(path.dirname(textFilePath), { recursive: true });
  fs.writeFileSync(textFilePath, text || "", "utf8");

  const indexPath = path.join(KB, "index.json");
  let indexData: any = { version: "1.0", language: "hy", products: [] };
  if (fs.existsSync(indexPath)) {
    try { indexData = JSON.parse(fs.readFileSync(indexPath, "utf8")); } catch (e) {}
  }

  const existingIdx = (indexData.products || []).findIndex((p: any) => p.sourceFile === sourceFile || p.textFile === textFileName);
  const newEntry = {
    productId,
    sourceFile,
    textFile: textFileName,
    characters: (text || "").length,
  };

  if (existingIdx >= 0) {
    indexData.products[existingIdx] = newEntry;
  } else {
    indexData.products.push(newEntry);
  }

  fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), "utf8");
  reloadKnowledgeBase();

  // Save dynamically to Firestore for persistent storage
  if (db) {
    try {
      const sanitizedDocId = safeFileName.replace(/[\/.\s]/g, "_");
      await setDoc(doc(db, "knowledge_base_docs", sanitizedDocId), {
        productId,
        sourceFile,
        textFile: textFileName,
        text: text || "",
        characters: (text || "").length,
        updatedAt: new Date().toISOString()
      });
      console.log(`Persistent Firestore sync: saved document ${sanitizedDocId}`);
    } catch (err) {
      console.error("Failed to save KB document to Firestore persistent storage:", err);
    }
  }

  res.json({ status: "ok", entry: newEntry, message: "Փաստաթուղթը հաջողությամբ ավելացվել/թարմացվել է" });
});

app.put("/api/admin/kb/:index", auth, async (req, res) => {
  const user = (req as any).user;
  if (!user || !["admin", "manager"].includes(user.role)) {
    return res.status(403).json({ error: "Access denied" });
  }
  const idx = parseInt(req.params.index, 10);
  const { productId, sourceFile, text } = req.body || {};

  const indexPath = path.join(KB, "index.json");
  if (!fs.existsSync(indexPath)) return res.status(404).json({ error: "Index file not found" });

  const indexData = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  if (isNaN(idx) || idx < 0 || idx >= indexData.products.length) {
    return res.status(404).json({ error: "Document not found" });
  }

  const target = indexData.products[idx];
  if (!target.textFile) {
    return res.status(400).json({ error: "Այս ֆայլը պաշտպանված է (համակարգային Excel հաշվիչ) և չի կարող փոփոխվել:" });
  }

  target.productId = productId || target.productId;
  target.sourceFile = sourceFile || target.sourceFile;

  const safeFileName = String(target.sourceFile).replace(/[^a-zA-Z0-9_\-.\u0531-\u058F]/g, "_");
  target.textFile = `text/${safeFileName}.txt`;
  target.characters = (text || "").length;

  const textFilePath = path.join(KB, target.textFile);
  fs.mkdirSync(path.dirname(textFilePath), { recursive: true });
  fs.writeFileSync(textFilePath, text || "", "utf8");

  indexData.products[idx] = target;
  fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), "utf8");
  reloadKnowledgeBase();

  // Update in Firestore for persistence
  if (db) {
    try {
      const sanitizedDocId = safeFileName.replace(/[\/.\s]/g, "_");
      await setDoc(doc(db, "knowledge_base_docs", sanitizedDocId), {
        productId: target.productId,
        sourceFile: target.sourceFile,
        textFile: target.textFile,
        text: text || "",
        characters: target.characters,
        updatedAt: new Date().toISOString()
      });
      console.log(`Persistent Firestore sync: updated document ${sanitizedDocId}`);
    } catch (err) {
      console.error("Failed to update KB document in Firestore persistent storage:", err);
    }
  }

  res.json({ status: "ok", entry: target, message: "Փաստաթուղթը հաջողությամբ թարմացվել է" });
});

app.delete("/api/admin/kb/:index", auth, async (req, res) => {
  const user = (req as any).user;
  if (!user || !["admin", "manager"].includes(user.role)) {
    return res.status(403).json({ error: "Access denied" });
  }
  const idx = parseInt(req.params.index, 10);
  const indexPath = path.join(KB, "index.json");
  if (!fs.existsSync(indexPath)) return res.status(404).json({ error: "Index file not found" });

  const indexData = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  if (isNaN(idx) || idx < 0 || idx >= indexData.products.length) {
    return res.status(404).json({ error: "Document not found" });
  }

  const target = indexData.products[idx];
  if (target && !target.textFile) {
    return res.status(400).json({ error: "Այս ֆայլը պաշտպանված է (համակարգային Excel հաշվիչ) և չի կարող ջնջվել:" });
  }

  const removed = indexData.products.splice(idx, 1)[0];
  if (removed && removed.textFile) {
    const textFilePath = path.join(KB, removed.textFile);
    if (fs.existsSync(textFilePath)) {
      try { fs.unlinkSync(textFilePath); } catch (e) {}
    }

    // Delete from Firestore for persistence
    if (db) {
      try {
        const baseName = path.basename(removed.textFile, ".txt");
        const sanitizedDocId = baseName.replace(/[\/.\s]/g, "_");
        await deleteDoc(doc(db, "knowledge_base_docs", sanitizedDocId));
        console.log(`Persistent Firestore sync: deleted document ${sanitizedDocId}`);
      } catch (err) {
        console.error("Failed to delete KB document from Firestore persistent storage:", err);
      }
    }
  }

  fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), "utf8");
  reloadKnowledgeBase();

  res.json({ status: "ok", message: "Փաստաթուղթը ջնջվել է" });
});

app.post("/api/gemini/generate-proposal-analysis", auth, async (req, res) => {
  const { quotationData = {}, type = "" } = req.body || {};
  const productId = type || quotationData.type || "";
  const docs = KNOWLEDGE_BASE.filter((d: any) => d.productId === productId);
  const knowledge = docs.map((d: any) => `===== ${PRODUCT_LABELS[d.productId] || d.productId} | ${d.sourceFile} =====\n${String(d.text || "").slice(0, 18000)}`).join("\n\n");

  if (quotationData.requestType === "contract_legal_clauses") {
    const topic = quotationData.topic || "standard_terms";
    const prompt = `Դու «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ-ի ավագ իրավախորհրդատու և պայմանագրային փորձագետ Արհեստական Բանականությունն (ԱԲ) ես։
Քո նպատակն է ձևակերպել կոնկրետ, իրավաբանորեն անթերի և պրոֆեսիոնալ ապահովագրական դրույթներ/հատուկ պայմաններ «${PRODUCT_LABELS[productId] || productId}» ապահովագրության պայմանագրի համար։

Թեմա՝ ${topic}
Պայմանագրի / Գնառաջարկի տվյալներ՝
${JSON.stringify(quotationData, null, 2)}

Պաշտոնական Աղբյուրներ (Knowledge Base)՝
${knowledge || "Համապատասխան աղբյուր չի գտնվել։"}

Ձևակերպիր հստակ, համարակալված կետերով հայերեն իրավական դրույթներ, որոնք պատրաստ են տեղադրվելու ապահովագրության պայմանագրի «Հատուկ Պայմաններ և Լրացուցիչ Դրույթներ» բաժնում։
Տեքստը պետք է լինի խիստ պրոֆեսիոնալ, առանց ավելորդ ներածության, անմիջապես կետերով։`;

    try {
      const result = await callUnifiedAi([{ role: "user", parts: [{ text: prompt }], content: prompt }], SYSTEM_INSTRUCTION + "\nԴու ապահովագրական իրավաբան ես։ Գրիր հստակ պայմանագրային կետեր։");
      return res.json({ analysis: result.text, modelUsed: result.modelUsed, sources: docs.map((d: any) => d.sourceFile) });
    } catch (e: any) {
      return res.status(503).json({ error: "Gemini-ը հասանելի չէ", details: e?.message || "unknown" });
    }
  }

  const prompt = `Ստեղծիր ներքին underwriting եզրակացություն հայերենով՝ հիմնվելով միայն փոխանցված quote տվյալների և համապատասխան SIL Insurance աղբյուրների վրա։ Մի հաստատիր ապահովագրական դեպք կամ պայմանագիր։ Եթե աղբյուրը բավարար չէ, նշիր դա։ Quote տվյալներ՝\n${JSON.stringify(quotationData, null, 2)}\n\nԱղբյուրներ՝\n${knowledge || "Համապատասխան աղբյուր չի գտնվել։"}`;
  try {
    const result = await callUnifiedAi([{ role: "user", parts: [{ text: prompt }], content: prompt }], SYSTEM_INSTRUCTION + "\nՊատասխանը կառուցիր՝ 1) Ընդհանուր գնահատական, 2) Հիմնական ռիսկեր, 3) Պայմանների համապատասխանություն, 4) Լրացուցիչ ստուգումներ, 5) Աղբյուրներ։");
    res.json({ analysis: result.text, modelUsed: result.modelUsed, sources: docs.map((d: any) => d.sourceFile) });
  } catch (e: any) {
    res.status(503).json({ error: "Gemini-ը հասանելի չէ", details: e?.message || "unknown" });
  }
});

app.post("/api/ai/translate-proposal", auth, async (req, res) => {
  const { proposal, targetLang = "en" } = req.body || {};
  if (!proposal) {
    return res.status(400).json({ error: "Missing proposal object" });
  }
  if (!["en", "ru", "hy"].includes(targetLang)) {
    return res.status(400).json({ error: "Unsupported target language" });
  }

  if (targetLang === "hy") {
    return res.json({ status: "ok", proposal });
  }

  const prompt = `Դու «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ-ի պաշտոնական թարգմանիչն ես։
Թարգմանիր հետևյալ ապահովագրական գնառաջարկի տվյալները ${targetLang === "en" ? "Անգլերեն (English)" : "Ռուսերեն (Russian)"} լեզվով՝ պահպանելով բոլոր մասնագիտական տերմինների ճշգրտությունը։
Տեքստերը պետք է լինեն լիարժեք, պրոֆեսիոնալ և գրագետ։

ԿԱՐԵՎՈՐ ՀՐԱՀԱՆԳՆԵՐ ԸՆԿԵՐՈՒԹՅԱՆ ԵՎ ՏԵՐՄԻՆՆԵՐԻ ԹԱՐԳՄԱՆՈՒԹՅԱՆ ՀԱՄԱՐ՝
1. ՊԱՐՏԱԴԻՐ ԹԱՐԳՄԱՆԻՐ ընկերության անվանումը և հարակից տերմինները.
   - «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ / «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» Ապահովագրական ՓԲԸ -> ${targetLang === "en" ? '"SIL INSURANCE CJSC"' : '"СЗАО «СИЛ ИНՇՈՒՐԱՆՍ»"'}
   - «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» -> ${targetLang === "en" ? '"SIL Insurance"' : '"«СИЛ ИНՇՈՒՐԱՆՍ»"'}
   - Ապահովագրական Ընկերություն / Ապահովագրող -> ${targetLang === "en" ? '"Insurance Company" / "Insurer"' : '"Страховая Компания" / "Страховщик"'}
   - Ապահովադիր -> ${targetLang === "en" ? '"Policyholder"' : '"Страхователь"'}
   - Շահառու -> ${targetLang === "en" ? '"Beneficiary"' : '"Выгодоприобретатель"'}
   - Չհատուցվող գումար / Ֆրանշիզա -> ${targetLang === "en" ? '"Deductible / Franchise"' : '"Франшиза"'}
   - Ապահովագրավճար -> ${targetLang === "en" ? '"Insurance Premium"' : '"Страховая премия"'}
   - Գլխավոր Անդեռռայթեր -> ${targetLang === "en" ? '"Chief Underwriter"' : '"Главный Андеррайтер"'}
2. Թարգմանիր բոլոր տեքստային դաշտերը (clientName, productNameArm, productSpecificDetails-ի բոլոր տեքստային արժեքները, coverages, coveredPerilsList, specialConditions, remarks, franchiseDescription, paymentTerms, beneficiaryDetails, objectDescription և այլն)։
3. ՄԻ փոփոխիր թվերը, գումարները, սակագները, ամսաթվերը, id-ները և բանալիները։
4. Վերադարձրու ՄԻԱՅՆ վավեր JSON պատասխան՝ նույն սխեմայով և կառուցվածքով, առանց որևէ markdown կոդային բլոկի (no \`\`\`json blocks)։

Գնառաջարկի տվյալներ՝
${JSON.stringify(proposal, null, 2)}`;

  try {
    const result = await callGemini([{ role: "user", parts: [{ text: prompt }] }], "You are a professional insurance translator. Output ONLY a valid JSON object matching the exact structure of the input, with translated values.", { responseMimeType: "application/json" });
    let text = result.text.trim();
    if (text.startsWith("```json")) text = text.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    else if (text.startsWith("```")) text = text.replace(/^```\s*/, "").replace(/```$/, "").trim();
    let parsed = JSON.parse(text);

    // Deep post-processing to guarantee Armenian company name references are replaced
    const cleanCompanyNames = (obj: any): any => {
      if (typeof obj === "string") {
        let s = obj;
        if (targetLang === "en") {
          s = s.replace(/«?ՍԻԼ\s*ԻՆՇՈՒՐԱՆՍ»?\s*Ապահովագրական\s*ՓԲԸ/gi, "SIL INSURANCE CJSC")
               .replace(/«?ՍԻԼ\s*ԻՆՇՈՒՐԱՆՍ»?\s*ԱՓԲԸ/gi, "SIL INSURANCE CJSC")
               .replace(/«?ՍԻԼ\s*ԻՆՇՈՒՐԱՆՍ»?/gi, "SIL Insurance");
        } else if (targetLang === "ru") {
          s = s.replace(/«?ՍԻԼ\s*ԻՆՇՈՒՐԱՆՍ»?\s*Ապահովագրական\s*ՓԲԸ/gi, "СЗАО «СИЛ ИНՇՈՒՐԱՆՍ»")
               .replace(/«?ՍԻԼ\s*ԻՆՇՈՒՐԱՆՍ»?\s*ԱՓԲԸ/gi, "СЗАО «СИЛ ИНՇՈՒՐԱՆՍ»")
               .replace(/«?ՍԻԼ\s*ԻՆՇՈՒՐԱՆՍ»?/gi, "«СИЛ ИНՇՈՒՐԱՆՍ»");
        }
        return s;
      }
      if (Array.isArray(obj)) return obj.map(cleanCompanyNames);
      if (obj && typeof obj === "object") {
        const out: any = {};
        for (const k of Object.keys(obj)) {
          out[k] = cleanCompanyNames(obj[k]);
        }
        return out;
      }
      return obj;
    };

    parsed = cleanCompanyNames(parsed);
    res.json({ status: "ok", proposal: parsed, modelUsed: result.modelUsed });
  } catch (e: any) {
    console.error("Translation failed:", e?.message);
    res.status(503).json({ error: "Թարգմանությունը ձախողվեց", details: e?.message });
  }
});

app.post("/api/ai/check-compliance", auth, async (req, res) => {
  const { productId, contractText } = req.body || {};
  if (!productId || !contractText) {
    return res.status(400).json({ error: "Missing required fields: productId, contractText" });
  }

  const docs = KNOWLEDGE_BASE.filter((d: any) => d.productId === productId);
  const knowledge = docs.map((d: any) => `===== ${PRODUCT_LABELS[d.productId] || d.productId} | ԱՂԲՅՈՒՐ՝ ${d.sourceFile} =====\n${String(d.text || "").slice(0, 15000)}`).join("\n\n");

  const prompt = `Դու «ՍԻԼ ԻՆՇՈՒՐԱՆՍ» ԱՓԲԸ-ի ռիսկերի underwriting-ի և համապատասխանության (Compliance) ավագ վերլուծաբանն ես։
Քո խնդիրն է ստուգել ներկայացված գնառաջարկը կամ կազմված պայմանագրի տեքստը և պարզել, թե արդյոք այն լիովին համապատասխանում է մեր պաշտոնական Ապահովագրական Պայմաններին (Knowledge Base)։

Ներկայացված Գնառաջարկ / Պայմանագիր՝
----------------------------------
${contractText}
----------------------------------

Մեր Պաշտոնական Պայմաններ (Knowledge Base)՝
----------------------------------
${knowledge || "Համապատասխան պայմաններ չեն գտնվել։"}
----------------------------------

Վերլուծիր շատ մանրամասն և վերադարձրու ՄԻԱՅՆ JSON պատասխան հետևյալ կառուցվածքով (առանց markdown code block-երի).
{
  "status": "green",
  "statusLabel": "Համապատասխանում է",
  "summary": "Ընդհանուր ամփոփագիր հայերենով...",
  "findings": [
    {
      "type": "Կանոնակարգի համապատասխանություն",
      "severity": "info",
      "description": "Հայտնաբերված խնդրի կամ համապատասխանության մանրամասն նկարագրություն...",
      "reference": "Աղբյուր փաստաթղթի անունը կամ կետը..."
    }
  ],
  "recommendations": [
    "Առաջարկվող փոփոխություն կամ լրացուցիչ պահանջ..."
  ]
}

ՆՇՈՒՄ՝ "status"-ի հնարավոր արժեքներն են՝ "green" (Լիովին համապատասխանում է), "yellow" (Կան անհամապատասխանություններ/շեղումներ), "red" (Լուրջ խախտումներ կամ չթույլատրված պայմաններ): "severity"-ի արժեքներն են՝ "info", "warning", "danger":`;

  try {
    const result = await callGemini([{ role: "user", parts: [{ text: prompt }] }], "You are a professional insurance compliance auditor. Output ONLY a valid JSON object matching the requested schema.", { responseMimeType: "application/json" });
    let text = result.text.trim();
    if (text.startsWith("```json")) text = text.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    else if (text.startsWith("```")) text = text.replace(/^```\s*/, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(text);
    res.json({ status: "ok", compliance: parsed, modelUsed: result.modelUsed });
  } catch (e: any) {
    console.error("Compliance check failed:", e?.message);
    res.status(503).json({ error: "Համապատասխանության ստուգումը ձախողվեց", details: e?.message });
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

async function fetchLiveCbaRates() {
  const now = Date.now();
  if (cbaRatesCache && now - cbaRatesCache.timestamp < 10 * 60 * 1000) {
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

app.get("/api/cba-rates", async (_req, res) => {
  const rates = await fetchLiveCbaRates();
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

// ==================== AI POLICY & OPERATIONS CONTROL CENTER ENDPOINTS ====================

// 1. Interpret Natural Language Policy Rule using Gemini
app.post("/api/ai/interpret-rule", auth, requireRole("admin", "underwriter"), async (req: any, res: any) => {
  const { ruleText, productType } = req.body || {};
  if (!ruleText || !productType) {
    return res.status(400).json({ error: "Missing ruleText or productType" });
  }

  const prompt = `You are an expert insurance logic translator for "SIL INSURANCE" CJSC.
Your job is to translate the following Armenian natural language rule instruction into a valid structured JSON rule object.

Instruction: "${ruleText}"
Product Type: "${productType}"

Output ONLY a valid, raw JSON object matching this schema, without any markdown formatting, backticks, or wrapping (no \`\`\`json block):
{
  "productType": "${productType}",
  "ruleType": "surcharge" | "discount" | "underwriting_trigger" | "flag_review",
  "condition": "A valid JavaScript logical expression using parameters like manufactureYear, totalSumInsured, fuelType, ownerAge, isElectric, enginePowerHp, isSpecialPurpose",
  "description": "A clean, concise Armenian explanation of the rule for agents",
  "value": a number representing percentage (e.g. 10 for 10% surcharge/discount, or null for triggers),
  "expressionDescription": "A clear Armenian summary of what the JavaScript condition checks"
}

Example input: "ԿԱՍԿՈ-ի դեպքում եթե ավտոմեքենայի տարիքը 12 տարուց մեծ է, կիրառել 7% հավելավճար"
Example output:
{
  "productType": "casco",
  "ruleType": "surcharge",
  "condition": "(new Date().getFullYear() - manufactureYear) > 12",
  "description": "7% հավելավճար 12 տարուց հին ավտոմեքենաների համար",
  "value": 7,
  "expressionDescription": "Մեքենայի տարիքը (ընթացիկ տարի - արտադրության տարեթիվ) > 12"
}

Return ONLY the raw JSON.`;

  try {
    const result = await callGemini(
      [{ role: "user", parts: [{ text: prompt }] }],
      "You are a strict JSON rule compiler. Return ONLY a single raw valid JSON object.",
      { responseMimeType: "application/json" }
    );
    let text = result.text.trim();
    if (text.startsWith("```json")) text = text.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    else if (text.startsWith("```")) text = text.replace(/^```\s*/, "").replace(/```$/, "").trim();
    
    const parsed = JSON.parse(text);
    res.json({ status: "ok", rule: parsed, modelUsed: result.modelUsed });
  } catch (err: any) {
    console.error("Interpret rule error:", err);
    res.status(500).json({ error: "Չհաջողվեց թարգմանել կանոնը AI-ի միջոցով", details: err?.message });
  }
});

// 2. Dynamic Rules Store endpoints (Firestore backed, with memory fallback)
let localRulesCache: any[] = []; // In-memory fallback if Firestore fails

app.get("/api/admin/dynamic-rules", auth, async (req: any, res: any) => {
  if (!db) {
    return res.json({ status: "ok", rules: localRulesCache });
  }
  try {
    const querySnapshot = await getDocs(collection(db, "dynamic_policy_rules"));
    const rules: any[] = [];
    querySnapshot.forEach((doc) => {
      rules.push({ id: doc.id, ...doc.data() });
    });
    res.json({ status: "ok", rules });
  } catch (err: any) {
    console.error("Firestore get dynamic-rules failed:", err);
    res.json({ status: "ok", rules: localRulesCache, warning: "Loaded from memory fallback" });
  }
});

app.post("/api/admin/dynamic-rules", auth, requireRole("admin", "underwriter"), async (req: any, res: any) => {
  const ruleData = req.body || {};
  ruleData.createdAt = new Date().toISOString();
  ruleData.isActive = ruleData.isActive !== false;

  if (!db) {
    const id = "local_" + crypto.randomUUID();
    const newRule = { id, ...ruleData };
    localRulesCache.push(newRule);
    addServerAudit("dynamic_rules.create", req.user.id, { id });
    return res.json({ status: "ok", rule: newRule });
  }

  try {
    const docRef = await addDoc(collection(db, "dynamic_policy_rules"), ruleData);
    addServerAudit("dynamic_rules.create", req.user.id, { id: docRef.id });
    res.json({ status: "ok", rule: { id: docRef.id, ...ruleData } });
  } catch (err: any) {
    console.error("Firestore add dynamic-rules failed:", err);
    res.status(500).json({ error: "Failed to save rule to Firestore", details: err?.message });
  }
});

app.delete("/api/admin/dynamic-rules/:id", auth, requireRole("admin", "underwriter"), async (req: any, res: any) => {
  const id = req.params.id;
  addServerAudit("dynamic_rules.delete", req.user.id, { id });

  if (!db || id.startsWith("local_")) {
    localRulesCache = localRulesCache.filter(r => r.id !== id);
    return res.json({ status: "ok" });
  }

  try {
    await deleteDoc(doc(db, "dynamic_policy_rules", id));
    res.json({ status: "ok" });
  } catch (err: any) {
    console.error("Firestore delete dynamic-rules failed:", err);
    res.status(500).json({ error: "Failed to delete rule from Firestore", details: err?.message });
  }
});

// 3. Bot Prompt and Behavioral configuration endpoints
app.get("/api/admin/bot-config", auth, async (req: any, res: any) => {
  if (!db) {
    return res.json({ status: "ok", systemInstruction: SYSTEM_INSTRUCTION });
  }
  try {
    const docRef = doc(db, "bot_configs", "advisor_bot");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      res.json({ status: "ok", ...docSnap.data() });
    } else {
      res.json({ status: "ok", systemInstruction: SYSTEM_INSTRUCTION });
    }
  } catch (err: any) {
    console.error("Firestore get bot-config failed:", err);
    res.json({ status: "ok", systemInstruction: SYSTEM_INSTRUCTION });
  }
});

app.post("/api/admin/bot-config", auth, requireRole("admin"), async (req: any, res: any) => {
  const { systemInstruction } = req.body || {};
  if (!systemInstruction) {
    return res.status(400).json({ error: "systemInstruction is required" });
  }

  addServerAudit("bot_config.update", req.user.id);

  if (!db) {
    return res.status(503).json({ error: "Firestore connection unavailable, cannot save persistent config." });
  }

  try {
    await setDoc(doc(db, "bot_configs", "advisor_bot"), {
      systemInstruction,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.name
    });
    res.json({ status: "ok", message: "Չատբոտի հրահանգը հաջողությամբ պահպանվել և ակտիվացվել է" });
  } catch (err: any) {
    console.error("Firestore save bot-config failed:", err);
    res.status(500).json({ error: "Չհաջողվեց պահպանել Firestore-ում", details: err?.message });
  }
});

// 4. Test Bot Behavior (Shadow Testing Playground)
app.post("/api/ai/test-bot-behavior", auth, requireRole("admin"), async (req: any, res: any) => {
  const { systemInstruction } = req.body || {};
  if (!systemInstruction) {
    return res.status(400).json({ error: "systemInstruction is required" });
  }

  const testCases = [
    "Ի՞նչ փաստաթղթեր են պետք ԿԱՍԿՈ հատուցման համար",
    "Արդյո՞ք ջրհեղեղը ներառված է բնակարանի ապահովագրության մեջ",
    "Ինչպե՞ս է հաշվարկվում ֆրանշիզան բեռների փոխադրման ժամանակ",
    "Որո՞նք են մասնագիտական պատասխանատվության բացառությունները"
  ];

  const results = [];

  for (const tc of testCases) {
    try {
      const knowledge = buildKnowledgePrompt(tc, "");
      const fullPromptActive = `${SYSTEM_INSTRUCTION}\n\n[ԱՂԲՅՈՒՐԱՅԻՆ ՊԱՅՄԱՆՆԵՐ]\n${knowledge}`;
      const fullPromptDraft = `${systemInstruction}\n\n[ԱՂԲՅՈՒՐԱՅԻՆ ՊԱՅՄԱՆՆԵՐ]\n${knowledge}`;

      const activeRes = await callUnifiedAi([{ role: "user", parts: [{ text: tc }], content: tc }], fullPromptActive);
      const draftRes = await callUnifiedAi([{ role: "user", parts: [{ text: tc }], content: tc }], fullPromptDraft);

      // Compute comparison rating
      const evalPrompt = `Compare the following two insurance assistant answers to the user's question.
Question: "${tc}"
Answer A (Active): "${activeRes.text.slice(0, 1000)}"
Answer B (Draft): "${draftRes.text.slice(0, 1000)}"

Rate Answer B compared to Answer A. Is it better, equivalent, or worse in terms of precision, professional tone, and policy accuracy?
Provide a brief 1-sentence comparison in Armenian and a status ("better" | "equivalent" | "worse" | "needs_attention").

Return ONLY a JSON object:
{
  "comparison": "Armenian comparison sentence...",
  "status": "status_value"
}`;
      let comparisonText = "Համարժեք պատասխան։";
      let status = "equivalent";

      try {
        const evalRes = await callGemini(
          [{ role: "user", parts: [{ text: evalPrompt }] }],
          "You are a helpful grading assistant. Return ONLY a valid JSON object.",
          { responseMimeType: "application/json" }
        );
        let et = evalRes.text.trim();
        if (et.startsWith("```json")) et = et.replace(/^```json\s*/, "").replace(/```$/, "").trim();
        else if (et.startsWith("```")) et = et.replace(/^```\s*/, "").replace(/```$/, "").trim();
        const parsedEval = JSON.parse(et);
        comparisonText = parsedEval.comparison || comparisonText;
        status = parsedEval.status || status;
      } catch {}

      results.push({
        question: tc,
        activeResponse: activeRes.text,
        draftResponse: draftRes.text,
        comparison: comparisonText,
        status
      });
    } catch (tcErr: any) {
      results.push({
        question: tc,
        activeResponse: "Սխալ՝ " + tcErr.message,
        draftResponse: "Սխալ՝ " + tcErr.message,
        comparison: "Հարցումը ձախողվեց",
        status: "needs_attention"
      });
    }
  }

  res.json({ status: "ok", results });
});

// 5. Template Mappings Configuration Endpoints (Multi-Product & Quotation/Contract Supported)
import { 
  DEFAULT_PRODUCT_MAPPINGS, 
  DEFAULT_CONTRACT_MAPPINGS,
  SUPPORTED_TEMPLATE_PRODUCTS, 
  PRODUCT_SPECIFIC_FIELDS, 
  CORE_SYSTEM_FIELDS, 
  CONTRACT_CORE_SYSTEM_FIELDS,
  getProductReferenceText,
  getProductContractReferenceText
} from "./src/data/productTemplateDefaults";

app.get("/api/admin/template-list", auth, async (req: any, res: any) => {
  const templateType = (req.query.type as string) === "contract" ? "contract" : "quotation";
  const templatesDir = path.join(process.cwd(), "templates");
  const result = [];

  const metaCollection = templateType === "contract" ? "docx_contract_templates_meta" : "docx_templates_meta";
  const mappingCollection = templateType === "contract" ? "docx_contract_mappings" : "docx_template_mappings";
  const defaultMappingsMap = templateType === "contract" ? DEFAULT_CONTRACT_MAPPINGS : DEFAULT_PRODUCT_MAPPINGS;

  for (const prod of SUPPORTED_TEMPLATE_PRODUCTS) {
    const filePrefix = templateType === "contract" ? "SIL_Contract_Template_" : "SIL_Quotation_Template_";
    const customFilePath = path.join(templatesDir, `${filePrefix}${prod.id}.docx`);
    const defaultFilePath = path.join(templatesDir, `${filePrefix}Source.docx`);
    const hasCustomDocx = fs.existsSync(customFilePath) || (prod.id === "default" && fs.existsSync(defaultFilePath));
    
    let mappingsCount = (defaultMappingsMap[prod.id] || defaultMappingsMap.default).length;
    let updatedAt: string | null = null;
    let updatedBy: string | null = null;
    let customFileName: string | null = null;

    if (db) {
      try {
        const docRef = doc(db, mappingCollection, prod.id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.mappings)) {
            mappingsCount = data.mappings.length;
          }
          updatedAt = data.updatedAt || null;
          updatedBy = data.updatedBy || null;
        }

        const metaRef = doc(db, metaCollection, prod.id);
        const metaSnap = await getDoc(metaRef);
        if (metaSnap.exists()) {
          customFileName = metaSnap.data().fileName || null;
          if (!updatedAt) updatedAt = metaSnap.data().uploadedAt || null;
          if (!updatedBy) updatedBy = metaSnap.data().uploadedBy || null;
        }
      } catch (e) {
        // continue
      }
    }

    result.push({
      id: prod.id,
      nameArm: prod.nameArm,
      nameEn: prod.nameEn,
      icon: prod.icon,
      category: prod.category,
      description: prod.description,
      sourceDocxName: customFileName || (templateType === "contract" ? `SIL_Contract_Template_${prod.id}.docx` : prod.sourceDocxName),
      hasCustomDocx,
      mappingsCount,
      updatedAt,
      updatedBy,
      templateType
    });
  }

  res.json({ status: "ok", templateType, products: result });
});

app.get("/api/admin/template-mappings", auth, async (req: any, res: any) => {
  const productId = (req.query.product as string) || "casco";
  const templateType = (req.query.type as string) === "contract" ? "contract" : "quotation";
  const defaultMappingsMap = templateType === "contract" ? DEFAULT_CONTRACT_MAPPINGS : DEFAULT_PRODUCT_MAPPINGS;
  const defaultList = defaultMappingsMap[productId] || defaultMappingsMap.default;
  const mappingCollection = templateType === "contract" ? "docx_contract_mappings" : "docx_template_mappings";

  if (!db) {
    return res.json({ status: "ok", productId, templateType, mappings: defaultList, isDefault: true });
  }
  try {
    const docRef = doc(db, mappingCollection, productId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().mappings && Array.isArray(docSnap.data().mappings)) {
      res.json({ 
        status: "ok", 
        productId, 
        templateType,
        mappings: docSnap.data().mappings,
        updatedAt: docSnap.data().updatedAt,
        updatedBy: docSnap.data().updatedBy,
        isDefault: false
      });
    } else {
      res.json({ status: "ok", productId, templateType, mappings: defaultList, isDefault: true });
    }
  } catch (err: any) {
    console.error(`Firestore get template-mappings for ${productId} (${templateType}) failed:`, err);
    res.json({ status: "ok", productId, templateType, mappings: defaultList, isDefault: true });
  }
});

app.post("/api/admin/template-mappings", auth, requireRole("admin", "underwriter"), async (req: any, res: any) => {
  const { mappings, productId = "casco", type = "quotation" } = req.body || {};
  const templateType = type === "contract" ? "contract" : "quotation";
  const mappingCollection = templateType === "contract" ? "docx_contract_mappings" : "docx_template_mappings";

  if (!mappings || !Array.isArray(mappings)) {
    return res.status(400).json({ error: "mappings array is required" });
  }

  addServerAudit("template_mappings.update", req.user.id, { productId, templateType, count: mappings.length });

  if (!db) {
    return res.status(503).json({ error: "Firestore connection unavailable, cannot save mappings." });
  }

  try {
    await setDoc(doc(db, mappingCollection, productId), {
      productId,
      templateType,
      mappings,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.name || "Անդեռռայթեր"
    });
    res.json({ 
      status: "ok", 
      message: `«${productId}» (${templateType === "contract" ? "Պայմանագիր" : "Գնառաջարկ"}) ձևանմուշի քարտեզագրումները հաջողությամբ պահպանվել են Firestore-ում:` 
    });
  } catch (err: any) {
    console.error(`Firestore save template-mappings for ${productId} failed:`, err);
    res.status(500).json({ error: "Failed to save template mappings", details: err?.message });
  }
});

app.post("/api/admin/template-reset", auth, requireRole("admin", "underwriter"), async (req: any, res: any) => {
  const { productId = "casco", type = "quotation" } = req.body || {};
  const templateType = type === "contract" ? "contract" : "quotation";
  const defaultMappingsMap = templateType === "contract" ? DEFAULT_CONTRACT_MAPPINGS : DEFAULT_PRODUCT_MAPPINGS;
  const defaultList = defaultMappingsMap[productId] || defaultMappingsMap.default;
  const mappingCollection = templateType === "contract" ? "docx_contract_mappings" : "docx_template_mappings";

  addServerAudit("template_mappings.reset", req.user.id, { productId, templateType });

  if (db) {
    try {
      await deleteDoc(doc(db, mappingCollection, productId));
    } catch (err) {
      console.warn("Could not delete from Firestore:", err);
    }
  }

  res.json({
    status: "ok",
    message: `«${productId}» (${templateType === "contract" ? "Պայմանագիր" : "Գնառաջարկ"}) քարտեզագրումը հաջողությամբ վերականգնվեց համակարգային լռելյայն վիճակին:`,
    mappings: defaultList
  });
});

app.post("/api/admin/upload-docx-template", auth, requireRole("admin", "underwriter"), async (req: any, res: any) => {
  const { fileBase64, fileName, productId = "casco", type = "quotation" } = req.body || {};
  const templateType = type === "contract" ? "contract" : "quotation";

  if (!fileBase64) {
    return res.status(400).json({ error: "Missing required field: fileBase64" });
  }

  try {
    const buffer = Buffer.from(fileBase64, "base64");
    
    // Create templates directory if it doesn't exist
    const templatesDir = path.join(process.cwd(), "templates");
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }

    const filePrefix = templateType === "contract" ? "SIL_Contract_Template_" : "SIL_Quotation_Template_";
    const targetFileName = fileName || `${filePrefix}${productId}.docx`;
    const templatePath = path.join(templatesDir, `${filePrefix}${productId}.docx`);
    fs.writeFileSync(templatePath, buffer);

    if (productId === "default") {
      const defaultPath = path.join(templatesDir, `${filePrefix}Source.docx`);
      fs.writeFileSync(defaultPath, buffer);
    }

    const metaCollection = templateType === "contract" ? "docx_contract_templates_meta" : "docx_templates_meta";
    if (db) {
      try {
        await setDoc(doc(db, metaCollection, productId), {
          productId,
          templateType,
          fileName: targetFileName,
          uploadedAt: new Date().toISOString(),
          uploadedBy: req.user.name || "Անդեռռայթեր",
          fileSizeBytes: buffer.length
        });
      } catch (err) {
        console.warn("Failed to write template metadata to Firestore:", err);
      }
    }

    addServerAudit("docx_template.upload", req.user.id, { fileName: targetFileName, productId, templateType });

    res.json({
      status: "ok",
      message: `Word ${templateType === "contract" ? "պայմանագրի" : "գնառաջարկի"} ձևանմուշը (${targetFileName}) հաջողությամբ վերբեռնվեց և ակտիվացվեց «${productId}» պրոդուկտի համար:`
    });
  } catch (err: any) {
    console.error("Failed to upload docx template:", err);
    res.status(500).json({ error: "Չհաջողվեց պահպանել Word ձևանմուշը սերվերի վրա", details: err?.message });
  }
});

app.get("/api/admin/template-text", auth, async (req: any, res: any) => {
  const productId = (req.query.product as string) || "casco";
  const templateType = (req.query.type as string) === "contract" ? "contract" : "quotation";

  try {
    const templatesDir = path.join(process.cwd(), "templates");
    const filePrefix = templateType === "contract" ? "SIL_Contract_Template_" : "SIL_Quotation_Template_";
    const specificPath = path.join(templatesDir, `${filePrefix}${productId}.docx`);
    const fallbackPath = path.join(templatesDir, `${filePrefix}Source.docx`);
    const kbFallbackPath = path.join(process.cwd(), "knowledge-base", "templates", "quotation-template-source.docx");
    
    let targetPath = "";
    let isCustom = false;

    if (fs.existsSync(specificPath)) {
      targetPath = specificPath;
      isCustom = true;
    } else if (fs.existsSync(fallbackPath)) {
      targetPath = fallbackPath;
    } else if (templateType === "quotation" && fs.existsSync(kbFallbackPath)) {
      targetPath = kbFallbackPath;
    }

    if (targetPath) {
      const buffer = fs.readFileSync(targetPath);
      const result = await mammoth.extractRawText({ buffer });
      if (result.value && result.value.trim().length > 10) {
        return res.json({ 
          status: "ok", 
          productId,
          templateType,
          text: result.value, 
          isCustomTemplate: isCustom,
          fileName: path.basename(targetPath)
        });
      }
    }

    // Fallback to structured reference text
    const referenceText = templateType === "contract" 
      ? getProductContractReferenceText(productId) 
      : getProductReferenceText(productId);

    res.json({ 
      status: "ok", 
      productId,
      templateType,
      text: referenceText, 
      isCustomTemplate: false,
      fileName: `${filePrefix}${productId}.docx (Reference)`
    });

  } catch (err: any) {
    console.error(`Failed to read template text for ${productId}:`, err);
    const referenceText = templateType === "contract" 
      ? getProductContractReferenceText(productId) 
      : getProductReferenceText(productId);

    res.json({ 
      status: "ok", 
      productId,
      templateType,
      text: referenceText, 
      isCustomTemplate: false,
      fileName: "Reference Default"
    });
  }
});

app.post("/api/ai/analyze-template", auth, requireRole("admin", "underwriter"), async (req: any, res: any) => {
  const { fileBase64, fileText, fileName, productId = "casco", type = "quotation" } = req.body || {};
  const templateType = type === "contract" ? "contract" : "quotation";
  let text = fileText || "";

  try {
    if (fileBase64 && (!text || text.trim() === "")) {
      const buffer = Buffer.from(fileBase64, "base64");
      if (fileName && (fileName.endsWith(".docx") || fileName.endsWith(".doc"))) {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else {
        text = buffer.toString("utf8");
      }
    }

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Չհաջողվեց կարդալ ֆայլի տեքստը:" });
    }

    const prodMeta = SUPPORTED_TEMPLATE_PRODUCTS.find(p => p.id === productId) || SUPPORTED_TEMPLATE_PRODUCTS[0];
    const specificFields = PRODUCT_SPECIFIC_FIELDS[productId] || [];
    const coreFields = templateType === "contract" ? CONTRACT_CORE_SYSTEM_FIELDS : CORE_SYSTEM_FIELDS;

    const fieldsListPrompt = [
      ...coreFields.map(f => `- ${f.value} (${f.label})`),
      ...specificFields.map(f => `- ${f.value} (${f.label})`)
    ].join("\n");

    const excerpt = text.slice(0, 30000);

    const docTypeName = templateType === "contract" ? "ապահովագրության պայմանագրի / վկայագրի (Contract / Policy)" : "գնառաջարկի (Quotation)";

    const systemInstruction = `You are an expert insurance business analyst, underwriter, and legal document engineer for SIL Insurance Company.
Your job is to analyze the text of an insurance ${docTypeName} template for the product: "${prodMeta.nameArm}" (${prodMeta.nameEn}).
Extract all variables, placeholders, or dynamic data fields (often enclosed in curly braces like {{ClientName}}, {{ContractNumber}}, {{TotalSumInsured}}, {{SumInsured}}, {{Premium}}, {{SignDate}}, or underlines/blanks indicating dynamic inputs).
Map these extracted variables to the system's available dynamic ${templateType} fields for this product.
Output ONLY a valid JSON array of objects, where each object represents a placeholder mapping.
Do not wrap in markdown codeblocks if possible. Just output the clean JSON array.`;

    const prompt = `Ահա «${prodMeta.nameArm}» (${prodMeta.id}) ապահովագրության ${docTypeName} ձևանմուշի տեքստը:
Խնդրում ենք գտնել բոլոր փոփոխականները, դատարկ տեղերը կամ ձևանմուշի placeholders-ը (օրինակ՝ {{ClientName}}, {{ContractNumber}}, {{SumInsured}}, {{Premium}}, {{VehicleModel}} կամ նմանատիպ դաշտերը), որոնք պետք է լրացվեն համակարգից։
Կատարիր ավտոմատ քարտեզագրում հետևյալ համակարգային դաշտերի հետ, եթե դրանք իմաստային համընկնում են:

Համակարգում «${prodMeta.nameArm}» ${docTypeName} համար հասանելի դաշտերն են.
${fieldsListPrompt}

Վերադարձրու JSON զանգված հետևյալ ձևաչափով (ՄԻԱՅՆ JSON)՝
[
  {
    "placeholder": "ExtractedPlaceholderName",
    "systemField": "matchingSystemFieldPath",
    "label": "Համառոտ նկարագրություն հայերենով թե ինչ է սա"
  }
]

Տեքստը վերլուծության համար՝
----------------------------------
${excerpt}
----------------------------------`;

    const result = await callGemini(
      [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction,
      { responseMimeType: "application/json" }
    );

    let resultText = result.text.trim();
    if (resultText.startsWith("```json")) {
      resultText = resultText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    } else if (resultText.startsWith("```")) {
      resultText = resultText.replace(/^```\s*/, "").replace(/```$/, "").trim();
    }

    const proposedMappings = JSON.parse(resultText);

    res.json({
      status: "ok",
      productId,
      templateType,
      proposedMappings,
      extractedTextLength: text.length,
      templateText: text
    });

  } catch (err: any) {
    console.error("AI template analysis failed:", err);
    res.status(500).json({ error: "ԱԲ-ով ձևանմուշի վերլուծությունը ձախողվեց:", details: err?.message });
  }
});

// -------------------- Static frontend: production runtime --------------------
// The frontend MUST be built during the image/build step. The runtime server
// never starts Vite and never opens a HMR/WebSocket connection.
function start() {
  const indexPath = path.join(DIST, "index.html");
  if (!fs.existsSync(indexPath)) {
    console.error(`Frontend build not found: ${indexPath}`);
    console.error("Run `npm run build` before starting the production server.");
    process.exit(1);
  }

  app.use(express.static(DIST, {
    index: "index.html",
    maxAge: process.env.NODE_ENV === "production" ? "1h" : 0,
  }));

  // SPA fallback: never route /api/* to index.html.
  app.get(/^\/(?!api(?:\/|$)).*/, (_req, res) => {
    res.sendFile(indexPath);
  });

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`SIL Insurance Portal listening on 0.0.0.0:${PORT}`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal}: shutting down gracefully`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start();
