import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = ['package.json','index.html','server.ts','src/main.tsx','src/App.tsx','knowledge-base/index.json'];
const missing = required.filter(f => !fs.existsSync(path.join(root,f)));
if (missing.length) throw new Error(`Missing required files: ${missing.join(', ')}`);
const pkg = JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
if (!pkg.scripts?.build || !pkg.dependencies?.react || !pkg.dependencies?.vite) throw new Error('package.json is incomplete');
const server = fs.readFileSync(path.join(root,'server.ts'),'utf8');
if (/gemini-2\.5-flash/i.test(server)) throw new Error('Legacy Gemini 2.5 model reference found');
if (/return KNOWLEDGE_BASE;/i.test(server)) throw new Error('Unsafe all-products knowledge fallback found');
if (!server.includes('gemini-3.6-flash')) throw new Error('Expected Gemini 3.6 Flash model not configured');

if (/temperature\s*:|top_p\s*:|top_k\s*:/i.test(server)) throw new Error('Deprecated Gemini sampling parameters found');
const app = fs.readFileSync(path.join(root,'src/App.tsx'),'utf8');
if (!app.includes('assertQuotationReady')) throw new Error('Quotation validation guard missing');
const kbIndex = JSON.parse(fs.readFileSync(path.join(root,'knowledge-base/index.json'),'utf8'));
for (const entry of kbIndex.products || []) {
  if (entry.textFile && !fs.existsSync(path.join(root,'knowledge-base',entry.textFile))) throw new Error(`Missing knowledge-base text file: ${entry.textFile}`);
}
console.log(`Knowledge base QA: PASS (${(kbIndex.products || []).length} indexed entries)`);
const logos = fs.readdirSync(path.join(root,'src/assets/images')).filter(f => /logo/i.test(f));
if (logos.length !== 2) throw new Error(`Expected exactly 2 logo assets, found ${logos.length}`);
console.log('STATIC QA PASS');
console.log(`Required files: ${required.length}`);
console.log(`Logo assets: ${logos.join(', ')}`);
console.log('Legacy Gemini model check: PASS');
console.log('Cross-product KB fallback check: PASS');
console.log('Quotation validation guard: PASS');

const template = fs.readFileSync(path.join(root, "src/utils/quotationTemplate.ts"), "utf8");
if (!template.includes("PRODUCT_LABELS") || !template.includes("title:") || !template.includes("getProductLabels")) throw new Error("Dynamic product quotation titles missing");
if (!template.includes("ՀԱԿԻՐՃ ՏԵՂԵԿՈՒԹՅՈՒՆՆԵՐ ԾԱՌԱՅՈՒԹՅԱՆ ՄԱՍԻՆ")) throw new Error("Quotation service section missing");
if (!template.includes("Ապահովագրական հատուցման վճարումը")) throw new Error("Quotation claims section missing");
if (!template.includes(".quote-page")) throw new Error("A4 page template CSS missing");
console.log("Quotation template QA: PASS");
