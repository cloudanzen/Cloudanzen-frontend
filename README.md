# CloudAnzen Frontend

React/Vite web application for CloudAnzen, an AI-assisted governance, risk, compliance, audit, vendor, personnel, and customer trust platform.

- Live app: `https://app.cloudanzen.com`
- Backend API: `https://api.cloudanzen.com`
- Backend repo: `https://github.com/vinmnit159/isms-backend`

## What Runs Here

This repo builds a browser-only SPA. It talks to the backend API for auth, data, AI workflows, integrations, and file operations.

```text
CloudAnzen SPA
  - React Router protected routes
  - Role-aware sidebar/navigation
  - TanStack Query API cache
  - Typed service layer under src/services/api
  - Lazy-loaded route bundles
  - Vitest and Playwright coverage
        |
        v
CloudAnzen Backend API
  - REST API under /api/*
  - MCP endpoint under /api/mcp
  - Worker-backed scans and notifications
```

## Tech Stack

| Area          | Technology                                         |
| ------------- | -------------------------------------------------- |
| Runtime       | Node.js 20+ for tooling                            |
| UI            | React 18.3, TypeScript 5                           |
| Build         | Vite 6 with manual vendor chunks                   |
| Routing       | React Router 7                                     |
| Data fetching | TanStack Query 5                                   |
| Styling       | Tailwind CSS 4                                     |
| Components    | Radix UI primitives, shadcn-style local components |
| Forms         | React Hook Form, Zod                               |
| Editor        | TipTap                                             |
| Charts        | Recharts                                           |
| Icons         | Lucide React                                       |
| Toasts        | Sonner                                             |
| Unit tests    | Vitest 4, Testing Library, happy-dom               |
| E2E tests     | Playwright                                         |
| Quality       | ESLint flat config, Prettier, Husky, lint-staged   |

## Product Areas

| Area           | Routes/pages                                                             |
| -------------- | ------------------------------------------------------------------------ |
| Dashboard      | `/`, summary widgets, framework launchpad                                |
| ToDo           | `/todo`, assigned validations and onboarding tasks                       |
| Validations    | `/validations`, validation detail panels, runs, evidence, reassignment   |
| Compliance     | Frameworks, controls, policies, documents, audits                        |
| Risk           | Overview, risk register, risk detail, library, remediations, risk engine |
| Assets         | Inventory, findings, code changes, vulnerabilities, merge review         |
| Integrations   | 60+ provider cards and Partner API management                            |
| Vendors        | Vendor inventory, discovery, intake requests, reviews                    |
| Personnel      | Users, computers, access management, onboarding                          |
| Customer Trust | Trust center admin, commitments, settings, public portal                 |
| AI             | AI chat, questionnaire assistant, AI settings                            |
| Notifications  | Inbox and notification preferences                                       |
| Settings       | Profile, users/roles, integrations, MCP, module settings                 |

## Local Development

### Prerequisites

- Node.js 20+
- npm
- A running CloudAnzen backend, usually `http://localhost:3000`

### First Run

```bash
npm install
cp .env.example .env.local
```

Set the API URL:

```env
VITE_API_URL=http://localhost:3000
```

Only `VITE_*` variables are exposed to the browser build. If `VITE_API_URL` is unset, the client defaults to `https://api.cloudanzen.com`.

Start the dev server:

```bash
npm run dev
```

The app runs on `http://localhost:5173`.

## Scripts

| Script                         | Purpose                                    |
| ------------------------------ | ------------------------------------------ |
| `npm run dev`                  | Start Vite dev server                      |
| `npm run build`                | Production build to `dist/`                |
| `npm run preview`              | Serve the production build locally         |
| `npm run lint`                 | ESLint with `--max-warnings 0`             |
| `npm run typecheck`            | TypeScript check using `tsconfig.ci.json`  |
| `npm test`                     | Run Vitest                                 |
| `npm run test:watch`           | Run Vitest in watch mode                   |
| `npm run test:coverage`        | Run Vitest with coverage                   |
| `npm run test:e2e`             | Run Playwright suite                       |
| `npm run test:e2e:headed`      | Run Playwright headed                      |
| `npm run test:e2e:report`      | Open Playwright HTML report                |
| `npm run quality:baseline`     | Refresh local `.quality` baselines         |
| `npm run quality:check`        | Full suppression and `any` debt ratchet    |
| `npm run quality:check-staged` | Staged-file quality ratchet for pre-commit |

## Quality Gates

This repo uses ratcheted quality gates so legacy debt can be paid down without allowing new debt.

- ESLint runs with zero warnings.
- `eslint-comments/require-description` requires every `eslint-disable` to include a reason.
- `.quality/eslint-disable-baseline.json` stores the current disable count.
- `.quality/suppressed-any-baseline.json` stores the current `@typescript-eslint/no-explicit-any` count with inline directives ignored.
- `npm run quality:check` fails if total debt grows or if any file exceeds its baseline.
- Husky pre-commit runs `lint-staged` and `quality:check-staged`.

Coverage is enforced in CI with baseline thresholds in `vite.config.ts`. The current snapshot is documented in `docs/quality-baseline-2026-05.md`, and CI uploads `coverage/coverage-summary.json` and `coverage/lcov.info`.

## Testing

### Unit and Component Tests

```bash
npm test
npm run test:coverage
```

Vitest uses `happy-dom` and `src/tests/setup.ts`. Coverage currently focuses on API services, RBAC helpers, notification helpers, security quest logic, server-side utility code, and selected hooks/components.

### Playwright E2E

Install browsers once:

```bash
npx playwright install chromium
```

Run the full E2E suite:

```bash
npm run test:e2e
```

Run the PR smoke specs against the preview server:

```bash
npm run build
CI=1 BASE_URL=http://127.0.0.1:4173 npx playwright test --grep @smoke
```

The smoke specs use `page.route()` browser-side mocks for login and dashboard API calls, so they do not require a backend service.

## CI

The GitHub Actions workflow runs:

1. `npm ci`
2. `npm run lint`
3. `npm run quality:check`
4. `npm run typecheck`
5. `npm test -- --coverage --coverage.reporter=json-summary --coverage.reporter=lcov --coverage.reporter=text-summary`
6. Coverage artifact upload
7. Separate `Smoke E2E` job: install Chromium, build, run `npx playwright test --grep @smoke`

After the first green smoke run, add `Smoke E2E` to required branch protection checks in GitHub settings.

## Auth Model

- Auth token and cached user are stored in `sessionStorage`.
- Legacy `localStorage` tokens are migrated into `sessionStorage` on first read.
- Route loaders call `requireAuth()` and redirect unauthenticated users to `/login`.
- API requests send `credentials: 'include'` and attach `Authorization: Bearer <token>` while the backend transitions to cookie-first auth.
- A `401` response clears local session state.

## API Layer

- `src/services/api/client.ts` owns base URL resolution, auth headers, response parsing, and error normalization.
- Domain services live under `src/services/api/*`.
- Query keys live in `src/lib/queryKeys.ts`.
- Query stale times live in `src/lib/queryClient.ts`.
- Prefer service methods and centralized query keys over ad hoc `fetch` calls in pages.

## Project Layout

```text
src/
  main.tsx                       Browser entry point
  i18n.ts                        i18next setup
  app/
    App.tsx                      Root providers
    routes.ts                    React Router route tree and lazy imports
    authGuard.ts                 Protected-route loaders
    components/                  Layout, sidebar, header, UI primitives
    hooks/                       App-specific hooks
    pages/                       Route pages by product area
    features/                    Feature packages such as notifications/security quest
    theme/                       Shared UI tokens
  hooks/                         Shared hooks
  lib/                           Query client, RBAC, date formatting, constants
  services/
    api/                         Typed API service layer
  shared/                        Shared domain helpers
  styles/                        Global styles
  tests/                         Vitest setup and unit tests
public/
  locales/                       English and Japanese translation files
e2e/                             Playwright specs and helpers
docs/                            Quality baselines and repo docs
```

## Build and Deploy

Build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview -- --host 0.0.0.0 --port 4173
```

The Vite build outputs static assets to `dist/`. Railway deployment uses `npm run preview -- --host 0.0.0.0 --port $PORT` from `railway.toml`; other static hosts can serve the same `dist/` output.

## Pull Request Checklist

Before opening a PR, run:

```bash
npm run lint
npm run quality:check
npm run typecheck
npm test -- --coverage --coverage.reporter=json-summary --coverage.reporter=lcov --coverage.reporter=text-summary
npm run build
CI=1 BASE_URL=http://127.0.0.1:4173 npx playwright test --grep @smoke
```

Keep new `eslint-disable` comments rare and always include `-- reason`. Prefer typed API DTOs and service adapters over new `any`.
