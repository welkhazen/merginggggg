#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const excluded = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
  'package-lock.json',
  'bun.lockb',
]);

const trackedFiles = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .filter((file) => !file.split('/').some((part) => excluded.has(part)));

const patterns = [
  { name: 'OpenAI secret key', regex: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g },
  { name: 'Supabase JWT', regex: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g },
  { name: 'Resend API key', regex: /\bre_[A-Za-z0-9]{20,}\b/g },
  { name: 'Vercel token-like secret', regex: /\b[A-Za-z0-9]{24}_[A-Za-z0-9]{24}\b/g },
];

let findings = 0;

for (const file of trackedFiles) {
  const content = execFileSync('git', ['show', `:${file}`], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    for (const pattern of patterns) {
      pattern.regex.lastIndex = 0;
      if (pattern.regex.test(line)) {
        findings += 1;
        console.error(`${file}:${index + 1} potential ${pattern.name}`);
      }
    }
  });
}

if (findings > 0) {
  console.error(`\nFound ${findings} potential secret(s). Rotate exposed values and remove them before committing.`);
  process.exit(1);
}

console.log(`No common private key patterns found in ${trackedFiles.length} tracked files.`);
