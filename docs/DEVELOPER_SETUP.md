# Developer Setup Guide — CloudAnzen Frontend (Manzen)

Get the SPA running locally against the backend, run the tests, and ship a
change. Read alongside [AI_CONTEXT.md](../AI_CONTEXT.md).

---

## 1. Prerequisites

| Tool                  | Version               | Notes                                                                               |
| --------------------- | --------------------- | ----------------------------------------------------------------------------------- |
| Node.js               | 20+ (`engines: >=20`) | `nvm use 20`                                                                        |
| npm                   | 10+                   | ships with Node 20                                                                  |
| A backend to point at | —                     | staging (`https://staging-api.cloudanzen.com`), prod, or a local backend on `:3000` |

No database, Redis, or Docker needed — this is a pure frontend. It talks to a
running backend over HTTP.

---

## 2. Installation

```bash
git clone git@github.com:cloudanzen/Cloudanzen-frontend.git
cd Cloudanzen-frontend
nvm use 20
npm install
cp .env.example .env.local   # then set VITE_API_URL (see below)
```

---

## 3. Environment

Vite env vars (must be prefixed `VITE_`), in `.env.local`:

```env
# Backend API base. Defaults to https://api.cloudanzen.com if unset.
VITE_API_URL=http://localhost:3000
# Optional
VITE_APP_URL=http://localhost:5173
VITE_PLATFORM_HOSTS=localhost
VITE_SENTRY_DSN=
```

- Point `VITE_API_URL` at whichever backend you want: a local backend (see the
  backend's `docs/DEVELOPER_SETUP.md`), staging, or prod.
- **Keep the value clean** — no trailing newline/space; the client trims
  defensively, but a bad URL breaks every call.

---

## 4. Running the app

```bash
npm run dev       # Vite dev server → http://localhost:5173 (HMR)
```

Log in with a user that exists on the backend you pointed at. If you run a local
backend, seed it (`npm run seed` there) to get a demo org + user.

```bash
npm run preview   # serve a production build locally (after `npm run build`)
```

---

## 5. Running tests

```bash
npm test               # Vitest unit suite (single run)
npm run test:watch     # watch mode
npm run test:coverage  # coverage — enforces the 17% global statement gate
npx vitest run src/tests/foo.test.ts   # a single file
```

- **Unit:** mock `apiClient` with `vi.mock('@/services/api/client', …)` to test
  service methods; use Testing Library for components.
- **E2E (Playwright):**
  ```bash
  npm run test:e2e          # headless
  npm run test:e2e:headed   # headed
  npm run test:e2e:report   # open last report
  ```

Before a PR, run what CI runs:

```bash
npm run typecheck    # tsc -p tsconfig.ci.json --noEmit
npm run lint         # eslint, --max-warnings 0
npm run build        # vite build
npm run test:coverage
```

> **Coverage gate is real (17% statements).** A big new untested page can push
> you under. Extract pure logic to a plain module + add a Vitest test (see
> [AI_CONTEXT §6](../AI_CONTEXT.md)).

---

## 6. Debugging

- **React DevTools** + **TanStack Query DevTools** for component + server-state
  inspection.
- **Network tab:** every backend call is `fetch` from `apiClient`; the request
  URL is `VITE_API_URL + endpoint`. A 401 → token missing/expired (re-login); a
  403 → RBAC or a product bundle the org doesn't have.
- **Sentry** is a no-op unless `VITE_SENTRY_DSN` is set.
- **Auth state:** JWT is in `sessionStorage` (`manzen.*` keys); clear it to
  simulate logout.
- **CORS errors:** the backend must allowlist your origin (`CORS_ORIGIN` on the
  backend); for local, run the backend with `CORS_ORIGIN=http://localhost:5173`.

---

## 7. Build & deploy

```bash
npm run build     # → dist/ (static assets)
npm run preview   # sanity-check the build locally
```

Deploy: Vercel auto-deploys previews per PR and `staging.app.cloudanzen.com` on
merge to `main`; production (`app.cloudanzen.com`) ships via `vercel --prod`
from CI on a GitHub Release. CI (`.github/workflows/ci.yml`) runs typecheck,
lint, test (coverage), build. Details in [CLAUDE.md](../CLAUDE.md).

---

## 8. Common first-run problems

| Symptom                          | Fix                                                           |
| -------------------------------- | ------------------------------------------------------------- |
| Every API call fails / weird URL | Check `VITE_API_URL` in `.env.local` (no stray whitespace)    |
| CORS blocked                     | Run the backend with your origin in `CORS_ORIGIN`             |
| 401 on load                      | No/expired token — log in again                               |
| 403 on a page                    | Missing RBAC permission or product bundle on the org          |
| Coverage CI fails                | Add a unit test / extract pure logic to lift statements ≥ 17% |
| Vercel check "Canceled"          | Account-side, not your diff — the gating check is `checks`    |
