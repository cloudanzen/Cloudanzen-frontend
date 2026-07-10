# AI_CONTEXT — CloudAnzen Frontend (Manzen)

> Onboarding context for engineers and AI assistants continuing work in this
> repo. Read this before writing code. Pair with
> [ARCHITECTURE.md](ARCHITECTURE.md),
> [docs/REPOSITORY_WALKTHROUGH.md](docs/REPOSITORY_WALKTHROUGH.md), and
> [docs/DEVELOPER_SETUP.md](docs/DEVELOPER_SETUP.md).

---

## 1. What this repo is

A **frontend-only React SPA** — the web app at `app.cloudanzen.com` for the
CloudAnzen GRC + AI TrustOps platform. It renders UI and talks to the backend
over HTTP. It holds **no** server logic.

Stack: **React 18, TypeScript 5, Vite 6, React Router 7, TanStack Query 5,
Tailwind CSS 4, Radix UI, Recharts, i18next, Zod 4, Vitest + Playwright**.

---

## 2. Non-negotiable constraints

Enforced by lint, CI, and the boundary rule.

1. **Frontend-only.** Never add HTTP servers, DB/ORM clients (`pg`, `prisma`),
   queue clients, workers, or email services. If you need server-side work, it
   goes in the backend repo (`Cloudanzen-backend`). ESLint/CI guard this.
2. **All backend calls go through `apiClient`** (`src/services/api/client.ts`) —
   never raw `fetch()` to the API. One typed service file per domain under
   `src/services/api/`.
3. **Server state lives in TanStack Query, not local state.** Use `useQuery` /
   `useMutation`. Invalidate with the **typed key factory** `QK`
   (`src/lib/queryKeys.ts`) — never inline magic-string keys.
4. **Coverage gate: 17% global statement threshold** (`vitest run --coverage`).
   Big new untested pages can drop it below — extract pure logic into a testable
   module and add a unit test (see §6).
5. **Quality baselines only shrink** (suppressed `any` etc.), same no-growth
   pre-commit gate as the backend.
6. **Conventional commits**, feature branches + PRs, never push to `main`.

---

## 3. App composition (how it boots)

```
main.tsx
  → Sentry init (no-op without DSN) + early theme class
  → <App/>  (src/app/App.tsx)
       QueryClientProvider (src/lib/queryClient.ts)
         ConfirmDialogProvider
           RouterProvider(router)   ← createBrowserRouter(routes)
           <Toaster/> (sonner)
```

- **Routing:** `src/app/routes.ts` — a `createBrowserRouter` tree. Most pages
  are `lazy()`-loaded `Component`s under a `Layout` shell. Public routes
  (`/login`, `/trust/:orgSlug`, auditor invites, support-session exchange) sit
  outside the authed shell.
- **Auth guards:** route `loader`s call `requireAuth` / `requireRoles([...])`
  (`src/app/authGuard.ts`). A tab is "authenticated" if it has a token **or** an
  impersonation session marker.
- **Platform (super-admin) routes** live in `src/app/platform-routes.ts` behind
  `platformAuthGuard.ts`.

---

## 4. Data + auth flow

```
Component → useQuery/useMutation → services/api/<domain>.ts → apiClient → VITE_API_URL → backend
```

- **`apiClient`** (`src/services/api/client.ts`) is a singleton wrapping `fetch`:
  base URL from `VITE_API_URL` (default `https://api.cloudanzen.com`), attaches
  the JWT, parses the `{ success, data }` envelope, and normalizes errors into
  `ApiError`. Service methods return `res.data` (unwrapped).
- **Auth token:** JWT in `sessionStorage` (`src/services/authStorage.ts`), with
  an HttpOnly-cookie fallback for impersonation. `useCurrentUser` /
  `useOrgProfile` read the cached `/me`.
- **Bundle/role gating in the UI:** the sidebar and some routes gate on the
  org's `enabledBundles` (from `/me`) and the user's role — e.g. the AI TrustOps
  nav shows only when `AI_GOVERNANCE` is enabled. Gating is defense-in-depth;
  the backend is authoritative.

---

## 5. Conventions & patterns (copy these)

**Service file.** One per backend domain: typed request/response interfaces +
enum constant arrays (`as const`) + a `<domain>Service` object of async methods
that call `apiClient` and return `res.data`. Example template: any
`src/services/api/ai*.ts`.

**Page.** Under `src/app/pages/<area>/`. Uses `PageTemplate` (title +
description + actions), `useQuery` for reads, `useMutation` (with query
invalidation) for writes, Radix `Dialog` for create/edit forms, `ui/*`
primitives, `lucide-react` icons, Tailwind classes. Empty/loading/error states
are expected.

**UI primitives.** `src/app/components/ui/` — Radix-based shadcn-style
components (`button`, `dialog`, `select`, `switch`, `input`, `badge`, `card`,
`textarea`, …). Compose these; don't hand-roll form controls.

**Query keys.** Always from `QK` in `src/lib/queryKeys.ts`. Prefix-based
invalidation depends on it (e.g. invalidate all `['policies', …]`). AI TrustOps
mutations also invalidate `['ai-trust', 'dashboard']` so the dashboard reflects
changes.

**i18n.** User-facing strings go through `react-i18next` (`useTranslation`).
See `i18n-translation-plan.md`. Newer AI TrustOps pages use inline English copy;
follow the surrounding page's convention.

**Status-style rendering.** Backend cards/records may carry a `label` + `tone`
(`positive|warning|critical|neutral`) instead of a numeric value — render the
colored label (see `AiTrustDashboardPage` `MetricCard`).

---

## 6. Testing & the coverage gate

- **Unit:** Vitest, tests in `src/tests/`. Mock `apiClient` with `vi.mock` to
  test service methods; render components with Testing Library where useful.
- **E2E:** Playwright in `e2e/` (`npm run test:e2e`).
- **The 17% global statement gate is real.** When you add a large page, its
  untested lines can push coverage under the threshold. Mitigation used across
  this repo: extract pure logic (parsers, mappers) into a plain module and unit
  test it, and add a service-client test. Example: CSV parsing lives in
  `src/app/pages/ai/aiSystemsCsv.ts` with `src/tests/aiSystemsCsv.test.ts`.
- Run before a PR: `npm run typecheck`, `npm run lint`, `npm run build`,
  `npm run test:coverage`.

---

## 7. Common workflows

**Add a page backed by a new backend endpoint:**

1. Add/extend the service in `src/services/api/<domain>.ts` (typed method →
   `apiClient` → `res.data`).
2. Build the page in `src/app/pages/<area>/` with `PageTemplate` + `useQuery` /
   `useMutation` + `QK` invalidation.
3. Register a lazy route in `src/app/routes.ts` (under `Layout`, with the right
   guard).
4. If it's a big page, extract pure logic + add a Vitest test to hold coverage.

**Gate a nav item behind a bundle/role:** thread `enabledBundles` from
`useOrgProfile` / role from `useCurrentUser` into the sidebar/route filter
(`src/app/components/Sidebar.tsx`, `src/app/hooks/useOrgProfile.ts`).

**Add a shared UI component:** put primitives in `src/app/components/ui/`,
feature components in `src/app/features/` or the page's folder.

---

## 8. Assumptions & gotchas

- `VITE_API_URL` must be clean (a stray newline once corrupted every URL — the
  client trims defensively).
- Server state is Query's job; avoid duplicating it in `useState`/context.
- The SPA "redirects" for legacy paths (e.g. `/ai/*` → `/ai-trust/*`) are
  loader-based client redirects, **not** HTTP 301s.
- The Vercel CI check sometimes shows "Canceled from the Vercel Dashboard" —
  that's account-side, not your diff; the gating check is `checks`.
- Two risk models exist on the backend; the risk UI (`pages/risk/*`) edits the
  **register-entry** model via `risk-library` / `riskCenter` services, not the
  raw Prisma `Risk`. Keep that in mind when wiring risk features.
- Never put backend logic here.

---

## 9. Pointers

- Routes: `src/app/routes.ts` (+ `platform-routes.ts`).
- API layer: `src/services/api/` (180 files) + `client.ts`.
- Query keys: `src/lib/queryKeys.ts`. Query client: `src/lib/queryClient.ts`.
- Auth: `authGuard.ts`, `services/authStorage.ts`, `hooks/useCurrentUser.ts`.
- Deep dives: [ARCHITECTURE.md](ARCHITECTURE.md),
  [docs/REPOSITORY_WALKTHROUGH.md](docs/REPOSITORY_WALKTHROUGH.md),
  [docs/DEVELOPER_SETUP.md](docs/DEVELOPER_SETUP.md).
- Backend contract: Swagger at `https://api.cloudanzen.com/docs`.
