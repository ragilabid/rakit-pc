import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const idPath = path.join(root, 'src/i18n/id.json');
const enPath = path.join(root, 'src/i18n/en.json');
const lessonsPath = path.join(root, 'src/content/lessons.json');

function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flattenKeys(v, full));
    } else {
      keys.push({ key: full, value: v });
    }
  }
  return keys;
}

const idData = JSON.parse(fs.readFileSync(idPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const lessonsData = JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));

const idEntries = flattenKeys(idData);
const enEntries = flattenKeys(enData);

const idMap = new Map(idEntries.map((e) => [e.key, e.value]));
const enMap = new Map(enEntries.map((e) => [e.key, e.value]));

const errors = [];

for (const [key, val] of idMap.entries()) {
  if (typeof val !== 'string' || val.trim() === '') {
    errors.push(`Kunci kosong di id.json: ${key}`);
  }
  if (!enMap.has(key)) {
    errors.push(`Kunci hilang di en.json: ${key}`);
  }
}

for (const [key, val] of enMap.entries()) {
  if (typeof val !== 'string' || val.trim() === '') {
    errors.push(`Kunci kosong di en.json: ${key}`);
  }
  if (!idMap.has(key)) {
    errors.push(`Kunci ada di en.json tetapi hilang di id.json: ${key}`);
  }
}

function collectLessonKeys(node) {
  const keys = [];
  if (Array.isArray(node)) {
    for (const item of node) keys.push(...collectLessonKeys(item));
  } else if (node !== null && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k.endsWith('Key') && typeof v === 'string') {
        keys.push(v);
      } else if (k.endsWith('Keys') && Array.isArray(v)) {
        keys.push(...v);
      } else {
        keys.push(...collectLessonKeys(v));
      }
    }
  }
  return keys;
}

for (const refKey of collectLessonKeys(lessonsData)) {
  if (!idMap.has(refKey)) {
    errors.push(`Kunci referensi lessons.json tidak ditemukan di id.json: ${refKey}`);
  }
  if (!enMap.has(refKey)) {
    errors.push(`Kunci referensi lessons.json tidak ditemukan di en.json: ${refKey}`);
  }
}

if (errors.length > 0) {
  console.error('Pemeriksaan i18n GAGAL:');
  for (const err of errors) {
    console.error(` - ${err}`);
  }
  process.exit(1);
}

console.log(`Pemeriksaan i18n LULUS (${idMap.size} kunci terverifikasi di id.json & en.json).`);
