import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function collectTsFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
    } else if (entry.isFile() && fullPath.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('Arsitektur Bagian 4 — Kemurnian Lapisan Domain', () => {
  it('src/domain tidak meng-import React, three.js, atau API browser', () => {
    const domainDir = path.resolve(process.cwd(), 'src/domain');
    const files = collectTsFiles(domainDir);
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8');
      expect(source).not.toMatch(/from\s+['"]react['"]/);
      expect(source).not.toMatch(/from\s+['"]three['"]/);
      expect(source).not.toMatch(/from\s+['"]@react-three/);
      expect(source).not.toMatch(/\b(window|document|localStorage|sessionStorage)\b/);
    }
  });
});
