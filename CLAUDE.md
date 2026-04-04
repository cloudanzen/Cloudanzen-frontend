# CloudAnzen Frontend

## Stack
- **Runtime**: Node.js 20+
- **Framework**: React 19 + Vite
- **Routing**: React Router
- **UI**: Radix UI + MUI + Tailwind CSS (shadcn/ui pattern)
- **Forms**: React Hook Form + Zod
- **State**: TanStack Query (React Query)

## Package Manager
**pnpm** (not npm)

## Key Commands
| Command | Purpose |
|---------|---------|
| `pnpm test` | Run Vitest suite |
| `pnpm test:coverage` | Vitest with coverage |
| `pnpm test:e2e` | Playwright end-to-end tests |
| `pnpm lint` | ESLint (zero warnings) |
| `pnpm typecheck` | TypeScript type check (`tsconfig.ci.json`) |
| `pnpm build` | Vite production build |
| `pnpm dev` | Dev server |

## CI Workflows
| Workflow | Trigger | Steps |
|----------|---------|-------|
| `ci.yml` | Push/PR to main | lint, typecheck, test, build |
| `deploy.yml` | Push to main / Release published | CI → Vercel deploy |

## Deploy Targets
| Environment | Platform | URL |
|-------------|----------|-----|
| Staging | Vercel | `staging.app.cloudanzen.com` |
| Production | Vercel | `app.cloudanzen.com` |

## Repo-Specific Rules
- API base URL configured via `VITE_API_URL` env var
- Sentry DSN configured via `VITE_SENTRY_DSN` env var
- No `.env.local` in git — use Vercel env vars
- Source maps are hidden (generated for Sentry upload only)
- Use existing shadcn/ui components before adding new ones
- All API calls should go through TanStack Query hooks

## Versioning
- Current: `v1.0.0` (baseline set 2026-04-04)
- Versioned independently from backend
- Coordinated MINOR bumps when features span both frontend + backend
