#!/usr/bin/env node
/** Validate one compiled template, optionally resolving links. */
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate, checkLinksLive } from '../lib/validate.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const name = process.argv[2];
const resolveLinks = process.argv.includes('--links');
if (!name) throw new Error('Pass a compiled template name, for example: portugal-v15');

const [html, text] = await Promise.all([
  readFile(join(root, 'build_production', `${name}.html`), 'utf8'),
  readFile(join(root, 'build_production', `${name}.txt`), 'utf8')
]);
const findings = validate({ html, text, name });
if (resolveLinks) findings.push(...await checkLinksLive(html));
for (const finding of findings) console.log(`${finding.level.toUpperCase()}  ${finding.check}  ${finding.message}`);
const errors = findings.filter((finding) => finding.level === 'error').length;
const warnings = findings.filter((finding) => finding.level === 'warn' || finding.level === 'warning').length;
console.log(`${name}: ${errors} error(s), ${warnings} warning(s)`);
process.exitCode = errors ? 1 : 0;
