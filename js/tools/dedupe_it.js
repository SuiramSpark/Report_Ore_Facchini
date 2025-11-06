const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '..', 'locales', 'it.json');
const backupPath = filePath + '.bak';

console.log('Reading', filePath);
let text = fs.readFileSync(filePath, 'utf8');

// Make a backup
fs.writeFileSync(backupPath, text, 'utf8');
console.log('Backup written to', backupPath);

const lines = text.split(/\r?\n/);
const obj = {};
const seen = new Set();
const kvRegex = /^\s*"([^"\\]+)"\s*:\s*("(?:[^"\\]|\\.)*"|\d+|true|false|null)\s*,?\s*$/;

for (const line of lines) {
  const m = line.match(kvRegex);
  if (m) {
    const key = m[1];
    const rawVal = m[2];
    if (!seen.has(key)) {
      try {
        // Parse the value safely
        const value = JSON.parse(rawVal);
        obj[key] = value;
      } catch (e) {
        // fallback: strip quotes
        obj[key] = rawVal.replace(/^"|"$/g, '');
      }
      seen.add(key);
    }
  }
}

// Write cleaned JSON
const out = JSON.stringify(obj, null, 2) + '\n';
fs.writeFileSync(filePath, out, 'utf8');
console.log('Wrote cleaned JSON to', filePath);
console.log('Keys kept:', Object.keys(obj).length);

// Quick validation: try to parse
try {
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log('Validation OK. First keys:', Object.keys(parsed).slice(0,10));
} catch (e) {
  console.error('Validation failed:', e.message);
}
