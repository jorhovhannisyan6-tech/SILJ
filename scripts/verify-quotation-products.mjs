import fs from 'node:fs';
const root = process.cwd();
const template = fs.readFileSync('src/utils/quotationTemplate.ts','utf8');
const products = ['property','mortgage','casco','health','travel','cargo','liability','construction','accident','agro','financial','aviation','bundle'];
for (const p of products) {
  const re = new RegExp(`^\\s*${p}:\\s*\\{`, 'm');
  if (!re.test(template)) throw new Error(`Missing quotation label config for product: ${p}`);
}
if (template.includes('ԳՈՒՅՔԻ ԱՊԱՀՈՎԱԳՐՈՒԹՅԱՆ ԱՌԱՋԱՐԿ')) throw new Error('Hard-coded property-only quotation title remains');
if (template.includes('ԳՈՒՅՔԻ ԱՊԱՀՈՎԱԳՐՈՒԹՅՈՒՆ</h2>')) throw new Error('Hard-coded property-only section remains');
if (!template.includes('proposal.coveredPerilsList')) throw new Error('Quotation risks are not driven by selected proposal');
if (!template.includes('getProductLabels(proposal.type)')) throw new Error('Quotation is not driven by selected product type');
console.log(`Quotation product mapping PASS (${products.length} products)`);
