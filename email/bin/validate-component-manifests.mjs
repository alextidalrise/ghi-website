#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadComponentRegistry, resolveManifestSource, validateCampaignManifest, validateManifestFilename, validateCampaignTemplateSource } from '../lib/component-registry.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const registry = await loadComponentRegistry(join(root, 'component-library', 'v1', 'registry.json'));
const manifestDir = join(root, 'src', 'manifests');
const files = (await readdir(manifestDir)).filter((file) => file.endsWith('.json')).sort();
const errors = [];

for (const file of files) {
  const manifest = JSON.parse(await readFile(join(manifestDir, file), 'utf8'));
  let source = '';
  try {
    source = await readFile(resolveManifestSource(root, manifest), 'utf8');
  } catch (error) {
    errors.push(`${file}: ${error.message}`);
    continue;
  }
  const findings = [
    ...validateManifestFilename(file, manifest),
    ...validateCampaignManifest(manifest, registry),
    ...validateCampaignTemplateSource(source, manifest, registry)
  ];
  if (findings.length) {
    for (const finding of findings) errors.push(`${file}: ${finding}`);
  } else {
    console.log(`  ok    ${manifest.campaignId} -> ${manifest.library.id}@${manifest.library.version}`);
  }
}

const campaignTemplates = (await readdir(join(root, 'src', 'templates')))
  .filter((file) => file.endsWith('.html') && file !== 'component-library-v1.html')
  .sort();
const manifested = new Set(files.map((file) => file.replace(/\.json$/, '.html')));
for (const template of campaignTemplates) {
  if (!manifested.has(template)) errors.push(`${template}: mandatory campaign component manifest is missing.`);
}

if (errors.length) {
  for (const error of errors) console.error(`  FAIL  ${error}`);
  process.exit(1);
}
console.log(`\n  ${files.length} campaign component manifest(s): PASS`);
