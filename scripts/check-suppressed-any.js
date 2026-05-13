import {
  compareNoGrowth,
  countSuppressedAny,
  readJson,
} from './quality-utils.js';

const baseline = readJson('.quality/suppressed-any-baseline.json');
const current = countSuppressedAny();
compareNoGrowth('suppressed explicit any violations', current, baseline);
console.log('suppressed explicit any baseline check passed.');
