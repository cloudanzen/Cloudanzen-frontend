import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const ROOT = process.cwd();
export const QUALITY_DIR = path.join(ROOT, '.quality');
export const SOURCE_DIRS = ['src', 'tests', 'e2e'].filter((dir) =>
  fs.existsSync(path.join(ROOT, dir)),
);

export function ensureQualityDir() {
  fs.mkdirSync(QUALITY_DIR, { recursive: true });
}

export function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

export function walkFiles(dir) {
  const absolute = path.join(ROOT, dir);
  if (!fs.existsSync(absolute)) return [];

  const out = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    if (
      entry.name === 'node_modules' ||
      entry.name === 'dist' ||
      entry.name === 'coverage'
    ) {
      continue;
    }

    const full = path.join(absolute, entry.name);
    const relative = toPosix(path.relative(ROOT, full));
    if (entry.isDirectory()) {
      out.push(...walkFiles(relative));
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      out.push(relative);
    }
  }
  return out.sort();
}

export function sourceFiles() {
  return SOURCE_DIRS.flatMap(walkFiles);
}

export function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

export function writeJson(relativePath, data) {
  ensureQualityDir();
  fs.writeFileSync(
    path.join(ROOT, relativePath),
    `${JSON.stringify(data, null, 2)}\n`,
  );
}

export function stagedSourceFiles() {
  const result = spawnSync(
    'git',
    ['diff', '--cached', '--name-only', '--diff-filter=ACMR'],
    {
      cwd: ROOT,
      encoding: 'utf8',
    },
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || 'Failed to list staged files');
  }

  return result.stdout
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean)
    .filter((file) => SOURCE_DIRS.some((dir) => file.startsWith(`${dir}/`)))
    .filter((file) => /\.(ts|tsx|js|jsx)$/.test(file))
    .filter((file) => fs.existsSync(path.join(ROOT, file)))
    .sort();
}

export function countDisables(files = sourceFiles()) {
  const perFile = {};
  const perRule = {};
  let totalDisables = 0;
  const disablePattern =
    /eslint-disable(?:-next-line|-line)?(?:\s+([^\n*]*?))?(?:\s+--[^\n]*)?(?=\n|\*\/|$)/g;

  for (const file of files) {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    let match;
    while ((match = disablePattern.exec(text))) {
      totalDisables += 1;
      perFile[file] = (perFile[file] || 0) + 1;
      const rules = (match[1] || 'all')
        .split(',')
        .map((rule) => rule.trim())
        .filter(Boolean);
      for (const rule of rules.length ? rules : ['all']) {
        perRule[rule] = (perRule[rule] || 0) + 1;
      }
    }
  }

  return { totalDisables, perFile, perRule };
}

function runEslintNoInlineConfig(targets = SOURCE_DIRS) {
  if (targets.length === 0) {
    return [];
  }

  const result = spawnSync(
    'npx',
    [
      'eslint',
      ...targets,
      '--config',
      'eslint.baseline.config.js',
      '--format',
      'json',
      '--no-warn-ignored',
    ],
    {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 40,
    },
  );

  if (!result.stdout.trim()) {
    throw new Error(result.stderr || 'ESLint produced no JSON output');
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(
      `Failed to parse ESLint JSON output: ${error.message}\n${result.stderr}`,
    );
  }
}

export function countSuppressedAny(files) {
  const results = runEslintNoInlineConfig(files);
  const perFile = {};
  let total = 0;

  for (const fileResult of results) {
    const relative = toPosix(path.relative(ROOT, fileResult.filePath));
    const count = fileResult.messages.filter(
      (message) => message.ruleId === '@typescript-eslint/no-explicit-any',
    ).length;
    if (count > 0) {
      perFile[relative] = count;
      total += count;
    }
  }

  return { total, perFile };
}

export function compareNoGrowth(label, current, baseline) {
  const failures = [];
  const currentTotal = current.total ?? current.totalDisables ?? 0;
  const baselineTotal = baseline.total ?? baseline.totalDisables ?? 0;

  if (currentTotal > baselineTotal) {
    failures.push(
      `${label} total grew from ${baselineTotal} to ${currentTotal}`,
    );
  }

  const currentPerFile = current.perFile || {};
  const baselinePerFile = baseline.perFile || {};
  for (const [file, count] of Object.entries(currentPerFile)) {
    const allowed = baselinePerFile[file] || 0;
    if (count > allowed) {
      failures.push(`${label} grew in ${file}: ${allowed} -> ${count}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(failures.join('\n'));
  }
}
