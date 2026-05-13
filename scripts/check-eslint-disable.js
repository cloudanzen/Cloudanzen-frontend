import { compareNoGrowth, countDisables, readJson } from './quality-utils.js';

const baseline = readJson('.quality/eslint-disable-baseline.json');
const current = countDisables();
compareNoGrowth('eslint-disable directives', current, baseline);
console.log('eslint-disable baseline check passed.');
