#!/usr/bin/env node
import { safeOutputName } from '../lib/safe-output-name.mjs';

const accepted = ['portugal-v15', 'stored-preview', 'component_library-v1'];
const rejected = ['../escape', '../../../', '/tmp/escape', 'name/child', '.', '..', 'https://example.com'];
let failures = 0;
for (const value of accepted) {
  try {
    if (safeOutputName(value) !== value) throw new Error('name changed');
    console.log(`  ok    accepted ${value}`);
  } catch (error) {
    console.error(`  FAIL  rejected safe name ${value}: ${error.message}`);
    failures += 1;
  }
}
for (const value of rejected) {
  try {
    safeOutputName(value);
    console.error(`  FAIL  accepted unsafe name ${value}`);
    failures += 1;
  } catch {
    console.log(`  ok    rejected ${value}`);
  }
}
if (failures) process.exit(1);
