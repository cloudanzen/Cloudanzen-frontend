import {
  compareNoGrowth,
  countDisables,
  countSuppressedAny,
  readJson,
  stagedSourceFiles,
} from './quality-utils.js';

const files = stagedSourceFiles();

if (files.length === 0) {
  console.log('No staged source files to quality-check.');
  process.exit(0);
}

compareNoGrowth(
  'eslint-disable directives',
  countDisables(files),
  readJson('.quality/eslint-disable-baseline.json'),
);

compareNoGrowth(
  'suppressed explicit any violations',
  countSuppressedAny(files),
  readJson('.quality/suppressed-any-baseline.json'),
);

console.log(
  `staged quality baseline check passed for ${files.length} file(s).`,
);
