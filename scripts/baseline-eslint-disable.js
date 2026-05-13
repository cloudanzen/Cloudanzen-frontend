import { countDisables, writeJson } from './quality-utils.js';

const baseline = countDisables();
writeJson('.quality/eslint-disable-baseline.json', baseline);
console.log(`Captured ${baseline.totalDisables} eslint-disable directive(s).`);
