# i18n Remaining Translation Plan

> **Status**: Closed — 2026-08-08
> **Created**: 2026-04-12
> **Epic**: EPIC-010 | **Project**: PRJ-011
> **Closed by**: Phase 5 of `docs/CODE_QUALITY_PLAN.md` (backend repo)

This plan is finished. It is kept because the _decision_ it ends on is the
useful part, and because the numbers it quotes are the reason the obvious
metric will never read zero.

---

## The decision

**Every page reachable from a tenant hostname is translated. The platform
console is English-only, deliberately.**

`src/app/routes.ts` selects an entire route tree by hostname: `PLATFORM_HOSTS`
(from `VITE_PLATFORM_HOSTS`) picks `platformRoutes`, everything else gets
`tenantRoutes`. The two never mix in one page load, so they are separate i18n
scopes.

`src/app/pages/platform/*` — 10 files, ~2,900 lines — is CloudAnzen's own ops
console: dashboard, support sessions, the admin allowlist, the activity log,
content-catalog batches and versions, onboarding setup. Reaching it requires
all three of:

1. a hostname on the `VITE_PLATFORM_HOSTS` allowlist,
2. an email row in `PlatformAdminEmailAllowlist`,
3. a JWT carrying `aud: 'platform'` (`authenticatePlatform` rejects tenant
   tokens).

No customer can load it. The operators are English-speaking, and the console
has neither a language switcher nor a `preferredLocale` for platform admins —
both would have to be built before a translation could even be displayed.

Scope is decided by **which host serves the page**, not by how internal it
feels. `admin/FrameworkAccessRequestsPage` is SUPER_ADMIN-only and _is_
translated, because it is served on the tenant host.

Revisit this if the ops team stops being English-speaking. Nothing else about
it is likely to change.

---

## Where the numbers land

18 namespaces, `en` and `ja` in lockstep:

```
access · admin · ai · assets · auditor · auth · common · compliance ·
customerTrust · dashboard · integrations · onboarding · personnel ·
progress · risk · settings · tests · vendors
```

`grep -rL useTranslation src/app/pages` reports **24 files**. None of them is
work:

| Group                                                   | Count | Why it is not work                                                                           |
| ------------------------------------------------------- | ----: | -------------------------------------------------------------------------------------------- |
| `platform/*`                                            |    10 | English-only by the decision above                                                           |
| `shared.tsx`, `KpiCard`, `icons`, `StatCard`, `Section` |    10 | Badge renderers, Tailwind class maps, SVG paths — **zero** translatable strings              |
| `engineerACards.tsx` / `.data.tsx`, `staticCatalog.tsx` |     3 | Data modules; their strings are translated at the render site via `engineerA.<key>.subtitle` |
| `trustCenter/helpers.tsx`                               |     1 | Takes `t` as a parameter instead of calling the hook                                         |
| `__tests__/PlaybookPanel.test.tsx`                      |     1 | A test file. It should never have been counted.                                              |

Every one was checked for translatable content: all 14 non-platform files
score **0** on a string scan.

**So the metric is not a defect count and should not be driven to zero.** If it
moves, look at _which_ file moved.

---

## What the gates enforce now

The metric above is the weak check — it only asks whether a file imports the
hook. Four tests do the real work:

| Test                                             | Catches                                                                                                               |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `i18n-parity.test.ts` — key sync                 | A key in `en` missing from `ja`, or the reverse. All 18 namespaces, discovered from the filesystem.                   |
| `i18n-parity.test.ts` — placeholders             | A translation that drops `{{name}}` or invents `{{naem}}`. Invisible to a key diff.                                   |
| `i18n-key-existence.test.ts` — key existence     | A literal `t('a.b')` whose key exists in neither locale. Found **41** of these.                                       |
| `i18n-key-existence.test.ts` — no `defaultValue` | `t('a.b', { defaultValue: 'Text' })` on a **literal** key: renders English forever and passes every parity check.     |
| `i18n-key-existence.test.ts` — namespace preload | A locale file missing from the `ns` array in `src/i18n.ts`. It still resolves via lazy load, so nothing else notices. |
| `i18n-key-existence.test.ts` — card catalogue    | An integration card with no `engineerA.<key>.subtitle`. All 97 had none.                                              |

`defaultValue` stays legal on genuinely dynamic keys
(``t(`roles.${role}`, { defaultValue: fallback })``), where the key space is
open-ended and a fallback is the correct design.

---

## Known debt

**The Japanese is machine-generated and has never been read by a native
speaker.** Roughly 30 pages plus 97 integration-card subtitles. The
AI-governance and trust-center vocabulary is where it is least trustworthy —
terms like 統制 / 管理策 / 準拠 were chosen for consistency, not verified against
how a Japanese auditor actually writes.

This is the one outstanding item, and it is not a coding task.
