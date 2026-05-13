# Quality Baseline - 2026-05

Generated on 2026-05-13 from `main` after enabling the Phase 0/1 quality gates.

## Coverage

Command:

```bash
npx vitest run --coverage --coverage.thresholds.lines=0 --coverage.thresholds.functions=0 --coverage.thresholds.branches=0 --coverage.thresholds.statements=0 --coverage.reporter=json-summary --coverage.reporter=text-summary --coverage.reporter=lcov
```

Result:

| Metric     | Covered | Total | Percent | Threshold |
| ---------- | ------: | ----: | ------: | --------: |
| Statements |     295 |  1690 |  17.45% |       17% |
| Branches   |     165 |   793 |   20.8% |       20% |
| Functions  |     119 |   809 |   14.7% |       14% |
| Lines      |     278 |  1565 |  17.76% |       17% |

No per-file 70% overrides were added in this phase. The existing include map stays unchanged until Phase 3 adds tests alongside broader coverage paths.

## Suppression Debt

Command:

```bash
npm run quality:baseline
```

Result:

| Gate                                                       | Baseline |
| ---------------------------------------------------------- | -------: |
| `eslint-disable` directives                                |       53 |
| Suppressed `@typescript-eslint/no-explicit-any` violations |      190 |

The baseline files live in `.quality/eslint-disable-baseline.json` and `.quality/suppressed-any-baseline.json`. CI now fails if either total grows or any file grows beyond its baseline.
