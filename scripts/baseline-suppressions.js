import { countSuppressedAny, writeJson } from './quality-utils.js';

const baseline = countSuppressedAny();
writeJson('.quality/suppressed-any-baseline.json', baseline);
console.log(`Captured ${baseline.total} suppressed explicit any violation(s).`);
