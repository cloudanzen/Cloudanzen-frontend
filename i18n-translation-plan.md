# i18n Translation Plan — CloudAnzen Frontend

## Overview
We are adding react-i18next support across the entire frontend. The pattern is consistent across all files.

## Translation Pattern

### For every component file:
1. Add `import { useTranslation } from 'react-i18next';`
2. Add `const { t } = useTranslation('<namespace>');` inside the component
3. Replace every hardcoded English string with `t('section.key')` or `t('section.key', { variable: value })` for interpolation
4. For helper functions defined OUTSIDE components (can't use hooks), add a `t: TFunction` parameter (from `i18next`) and pass `t` from the call site

### Variable shadowing pitfall
If a `.map()` callback uses `t` as its parameter name (e.g., `.map((t) => ...)`), rename it to avoid shadowing the translation `t`. Example: `.map((aType) => ...)` instead of `.map((t) => ...)`.

### STATUS_CONFIG / label constants pattern
When a file has constants like `STATUS_CONFIG` with `label: 'Draft'`, add a `key` field (`key: 'DRAFT'`) and translate at render time: `t('section.statusLabels.${cfg.key}')`. Keep the `label` as fallback.

### Namespace convention
| Directory | Namespace | Locale file |
|-----------|-----------|-------------|
| `src/app/pages/compliance/` | `compliance` | `public/locales/{en,ja}/compliance.json` |
| `src/app/pages/tests/` | `tests` | `public/locales/{en,ja}/tests.json` |
| `src/app/pages/access/` | `access` | `public/locales/{en,ja}/access.json` |
| `src/app/pages/personnel/` | `personnel` | `public/locales/{en,ja}/personnel.json` |
| `src/app/pages/controls/` | `compliance` | (already in compliance.json under `controls` section) |
| `src/app/pages/vendors/` | `vendors` | `public/locales/{en,ja}/vendors.json` |
| `src/app/pages/integrations/` | `integrations` | `public/locales/{en,ja}/integrations.json` |
| `src/app/pages/settings/` | `settings` | `public/locales/{en,ja}/settings.json` |
| `src/app/pages/reports/` | `common` | `public/locales/{en,ja}/common.json` |
| `src/app/pages/admin/` | `admin` | `public/locales/{en,ja}/admin.json` |
| `src/app/pages/assets/` | `assets` | `public/locales/{en,ja}/assets.json` |
| `src/app/pages/ai/` | `ai` | `public/locales/{en,ja}/ai.json` |
| `src/app/pages/auth/` | `auth` | `public/locales/{en,ja}/auth.json` |

Some locale files already exist with partial keys. Check before creating new ones.

---

## Completed (DO NOT touch these files)

### Compliance module — fully translated:
- `DocumentDetailPage.tsx`, `ScheduleAuditModal.tsx`, `ActivationSummaryPage.tsx`
- `AuditDetailPanel.tsx`, `AuditDetailPage.tsx`, `AuditsPage.tsx`
- `SettingsPage.tsx`, `EvidenceDetailPanel.tsx`, `UploadEvidenceModal.tsx`
- `frameworkDetail/OverviewTab.tsx`, `ControlsTab.tsx`, `GapsTab.tsx`
- `frameworkDetail/RequirementsTab.tsx`, `ExclusionsTab.tsx`, `ExportsTab.tsx`
- `frameworkDetail/PoliciesTab.tsx`, `TestsTab.tsx`, `shared.tsx`, `CoverageChart.tsx`
- `policies/CreatePolicyModal.tsx`, `FilterPanel.tsx`, `PoliciesTable.tsx`
- `policies/StateComponents.tsx`, `TemplatesModal.tsx`, `UploadModal.tsx`
- `policies/types.ts` (STATUS_CONFIG updated with `key` field)

### Other modules translated in earlier sessions:
- Sidebar, Home, Dashboard pages
- Task pages
- Compliance list pages (FrameworksPage, PoliciesPage, DocumentsPage, etc.)
- Risk list + detail pages
- Auth, Settings, Notifications, Personnel pages
- `FrameworkDetailPage.tsx`

---

## YOUR ASSIGNMENT — Tests module

### Locale files: ALREADY CREATED
- `public/locales/en/tests.json` — all keys are defined
- `public/locales/ja/tests.json` — all Japanese translations defined

### Files to translate (12 files, ~2854 lines total):

#### Small files (start here):
1. **`src/app/pages/tests/TestDetailPage.tsx`** (16 lines)
   - Namespace: `tests`
   - Strings: "No test ID provided."

2. **`src/app/pages/tests/TestLibraryPage.tsx`** (10 lines)
   - Namespace: `tests`
   - Strings: "Available Frameworks", "Pre-built compliance test suites..."

3. **`src/app/pages/tests/testDetail/StatusBadge.tsx`** (22 lines)
   - Uses `STATUS_CONFIG` and `LAST_RESULT_CONFIG` from `constants.ts`
   - Both have `label` fields — add `key` field, translate at render: `t('statusBadge.${cfg.key}')`
   - Update `constants.ts` to add `key` field to both configs

4. **`src/app/pages/tests/testDetail/HistorySection.tsx`** (38 lines)
   - Strings: "Loading history...", "No history recorded yet."

5. **`src/app/pages/tests/testDetail/RiskContextSection.tsx`** (41 lines)
   - Strings: "Loading linked risk context...", "No linked risk engine evaluation found.", "Linked risk engine test", "Not linked"

6. **`src/app/pages/tests/testDetail/Section.tsx`** (59 lines)
   - Generic component — title/label are passed as props, no hardcoded strings to translate
   - SKIP this file

7. **`src/app/pages/tests/testDetail/RunsSection.tsx`** (121 lines)
   - Table headers: "Run At", "Result", "Source", "Summary", "Duration"
   - States: "Loading scan history...", "No scan runs recorded yet..."
   - TrendSparkline: "No trend data yet.", "Last N execution result(s)."

#### Medium files:
8. **`src/app/pages/tests/testDetail/CreateNotionTaskModal.tsx`** (108 lines)
   - Keys under `notionTask.*`
   - Strings: "Create Notion Task", "Task Title", "Notion Database", form labels, error messages

9. **`src/app/pages/tests/testDetail/DocumentUploadModal.tsx`** (294 lines)
   - Keys under `documentUpload.*`
   - Tab labels, file selection UI, error messages

#### Large files:
10. **`src/app/pages/tests/testDetail/AttachSections.tsx`** (562 lines)
    - Keys under `attachSections.*` and `testDetail.evidenceTab.*`
    - Multiple exported components: `UploadEvidenceSection`, `MarkAsPassedPrompt`, `AttachEvidenceSection`, `AttachControlSection`, `AttachAuditSection`, `AddFrameworkSection`, `PolicyDocumentsSection`
    - Watch for variable shadowing in `.map()` callbacks

11. **`src/app/pages/tests/testDetail/RemediationGuide.tsx`** (410 lines)
    - Keys under `remediation.*`
    - `statusLabel()` function — convert to use `t('remediation.statusLabels.${status}')`
    - Multiple sub-components: `LiveRemediationPanel`, `RemediationGuide`

12. **`src/app/pages/tests/TestDetailPanel.tsx`** (1173 lines) — THE BIG ONE
    - Keys under `testDetail.*`
    - Contains `EvidenceSynthesisPanel` (inline) + main `TestDetailPanel`
    - Tab labels, section titles, stat card labels, button labels, toast messages
    - Attestation section, scan controls, evidence listing, mapping listing
    - Many interpolated strings

### How to verify:
After translating all files, run:
```bash
cd /Users/vineetsingh/Cloudanzen-frontend
npx tsc --noEmit
```
Must pass with zero errors.

### i18n initialization
The i18n setup is already configured at `src/i18n.ts`. The `tests` namespace should already be loadable — if not, check `src/i18n.ts` to ensure it's listed in the `ns` array.

---

## What the other agent (me) is working on — DO NOT touch:
- Remaining compliance module files not yet translated
- Controls pages
- Access/personnel pages
- Other modules

If in doubt about whether a file is already translated, check for `useTranslation` import.
