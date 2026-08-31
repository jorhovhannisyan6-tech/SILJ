import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'package.json',
  'server.ts',
  'vite.config.ts',
  'Dockerfile',
  '.dockerignore',
];
const missing = required.filter((p) => !fs.existsSync(path.join(root, p)));
if (missing.length) {
  console.error('Runtime check failed. Missing:', missing.join(', '));
  process.exit(1);
}
const server = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
const forbidden = [
  'viteBuild(',
  'FORCE_FRONTEND_BUILD',
  'server.hmr',
  'server.ws',
];
const found = forbidden.filter((x) => server.includes(x));
if (found.length) {
  console.error('Runtime check failed. Production server still contains:', found.join(', '));
  process.exit(1);
}
if (!server.includes('app.listen(PORT, "0.0.0.0"')) {
  console.error('Runtime check failed. Server is not bound to 0.0.0.0.');
  process.exit(1);
}
console.log('Cloud Run runtime check: PASS');
