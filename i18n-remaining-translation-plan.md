# i18n Remaining Translation Plan

> **Status**: In Progress
> **Created**: 2026-04-12
> **Epic**: EPIC-010 | **Project**: PRJ-011
> **Total remaining files**: ~37 (after excluding skips)

---

## What's Already Done

122 out of 175 TSX page files already have `useTranslation`. All 15 locale namespaces exist in both `en/` and `ja/`:

```
access, admin, ai, assets, auditor, auth, common, compliance,
dashboard, integrations, personnel, risk, settings, tests, vendors
```

### Modules 100% Translated
- tests (all detail pages, panels, modals, sections)
- compliance (framework detail, policies, documents, audits, settings)
- controls (page, detail panel, filter, table, column selector)
- risk (overview, risks, detail, engine, snapshot, settings, action tracker, library)
- personnel (people, computers, access management, campaigns, settings)
- access (users, roles, requests, invite, detail panel)
- vendors (list, detail)
- customer-trust (trust center, tabs, modals, settings)
- auditor (dashboard, final report, add finding modal, helpers, control review panel)
- admin (templates, test templates, frameworks, policy templates, organizations)
- settings (profile/account, AI, MCP)
- notifications (list, settings)
- auth (login, callback, register)
- assets (inventory, code changes, vulnerabilities, security alerts, settings)
- privacy (settings, data inventory)
- ai (chat, documents, questionnaire assistant)
- dashboard, trust portal, not found, home, my work, tests page
- reports (ReportViewerPage)

### Files Intentionally Skipped (no translation needed)
| File | Reason |
|------|--------|
| `SimplePages.tsx` | Dead code — `createSimplePage` never called |
| `access/accessUsers/KpiCard.tsx` | Props-only — all strings from caller |
| `auditor/auditorDashboard/KpiCard.tsx` | Props-only — all strings from caller |
| `customer-trust/trustCenter/helpers.tsx` | Already uses `TFunction` pattern |
| `tests/testDetail/Section.tsx` | Generic layout wrapper — no user-facing text |
| `integrations/partnerApi/icons.tsx` | SVG icons only — no text |
| `integrations/partnerApi/StatCard.tsx` | Props-only — `label`, `value`, `sub` from caller |
| `integrations/engineerACards.tsx` | Barrel re-export only |
| `integrations/integrations/staticCatalog.tsx` | Utility functions only — `StaticIcon`, `redactConfigKeyLabel` |

---

## Remaining Work

### Task 1: Root Pages (3 files, ~1,435 lines)

These are standalone pages at the root of `src/app/pages/`.

#### 1a. MySecurityTasksPage.tsx (768 lines)
- **Namespace**: `common`
- **Key prefix**: `securityTasks`
- **Path**: `src/app/pages/MySecurityTasksPage.tsx`
- **What to translate**: Page title, description, column headers, status labels, filter labels, empty state messages, button text, tab labels, badges

```tsx
// Pattern:
import { useTranslation } from 'react-i18next';
// Inside component:
const { t } = useTranslation('common');
// Replace: "My Security Tasks" → t('securityTasks.title')
```

- **Locale files to update**:
  - `public/locales/en/common.json` — add `securityTasks` section
  - `public/locales/ja/common.json` — add `securityTasks` section with Japanese translations

#### 1b. ReportsPage.tsx (200 lines)
- **Namespace**: `common`
- **Key prefix**: `reports`
- **Path**: `src/app/pages/ReportsPage.tsx`
- **What to translate**: Page title, description, report type labels, button text, empty states

- **Locale files to update**: Same as above (`common.json`)

#### 1c. SetupFormPage.tsx (467 lines)
- **Namespace**: `common`
- **Key prefix**: `setup`
- **Path**: `src/app/pages/SetupFormPage.tsx`
- **What to translate**: Form field labels, step titles, descriptions, button text, validation messages, placeholder text

- **Locale files to update**: Same as above (`common.json`)

---

### Task 2: Integration Card Components (30 files, ~6,000 lines total)

All files are in `src/app/pages/integrations/integrations/`. Each card follows the same pattern:

#### Card Pattern
Each card typically has:
1. **An SVG icon component** (no translation needed)
2. **A connect/onboard modal** with form fields, labels, error messages
3. **A main card component** showing connection status, connected accounts, disconnect button

#### Common strings across all cards:
```
"Connected", "Not connected", "Connect", "Disconnect", "Cancel",
"Connecting...", "Disconnecting...", "Configure", "Label (optional)",
"Remove", "Copied!", "Copy", error fallback messages
```

#### Card-specific strings:
Each card has unique text like:
- Modal title: "Connect AWS Account", "Connect GCP", etc.
- Modal description: Setup instructions specific to the provider
- Form field labels: "Role ARN", "API Key", "Service Account Key JSON", etc.
- Error messages: Provider-specific failure messages
- Step indicators: "Step 1 of 2", etc.
- Info/warning boxes

#### Files to translate (sorted by line count):
| File | Lines | Provider |
|------|-------|----------|
| SlackCard.tsx | 387 | Slack |
| AwsCard.tsx | 354 | AWS |
| EngineerAIntegrationCard.tsx | 306 | Generic integration card |
| WorkspaceCard.tsx | 262 | Google Workspace |
| BambooHRCard.tsx | 245 | BambooHR |
| MdmCard.tsx | 237 | MDM/Fleet Management |
| FleetCard.tsx | 236 | Fleet |
| RedashCard.tsx | 235 | Redash |
| CloudflareCard.tsx | 232 | Cloudflare |
| BigIdCard.tsx | 215 | BigID |
| GitHubCard.tsx | 214 | GitHub |
| CertManagerCard.tsx | 209 | Cert Manager |
| ServiceNowCard.tsx | 195 | ServiceNow |
| DatadogCard.tsx | 176 | Datadog |
| AzureAdCard.tsx | 176 | Azure AD |
| SecretsManagerCard.tsx | 172 | AWS Secrets Manager |
| OktaCard.tsx | 170 | Okta |
| OpsgenieCard.tsx | 168 | Opsgenie |
| NewRelicCard.tsx | 168 | New Relic |
| AzureCard.tsx | 168 | Azure |
| VaultCard.tsx | 164 | HashiCorp Vault |
| WizCard.tsx | 163 | Wiz |
| LaceworkCard.tsx | 163 | Lacework |
| CheckmarxCard.tsx | 162 | Checkmarx |
| PagerDutyCard.tsx | 159 | PagerDuty |
| VeracodeCard.tsx | 157 | Veracode |
| SonarQubeCard.tsx | 157 | SonarQube |
| SnykCard.tsx | 157 | Snyk |
| GcpCard.tsx | 155 | GCP |
| JumpCloudCard.tsx | 153 | JumpCloud |
| IntercomCard.tsx | 138 | Intercom |
| NotionCard.tsx | 131 | Notion |
| GoogleDriveCard.tsx | 105 | Google Drive |

**Note**: `RequestToolModal.tsx` (167 lines) already has `useTranslation` — skip.

#### Namespace & key structure:
```json
// in public/locales/en/integrations.json — add under "cards" section
{
  "cards": {
    "shared": {
      "connected": "Connected",
      "notConnected": "Not connected",
      "connect": "Connect",
      "disconnect": "Disconnect",
      "cancel": "Cancel",
      "connecting": "Connecting...",
      "disconnecting": "Disconnecting...",
      "configure": "Configure",
      "labelOptional": "Label (optional)",
      "remove": "Remove",
      "copied": "Copied!",
      "copy": "Copy",
      "apiKey": "API Key",
      "save": "Save",
      "accounts": "accounts",
      "connectedAccount": "Connected account",
      "connectedAccounts": "Connected accounts",
      "failedToConnect": "Failed to connect",
      "failedToDisconnect": "Failed to disconnect"
    },
    "aws": {
      "title": "Connect AWS Account",
      "stepOf": "Step {{step}} of {{total}}",
      "trustPolicyDesc": "Create a cross-account IAM role in your AWS account with the trust policy below. This allows ISMS to assume the role using a unique External ID — no access keys are stored.",
      "generatingPolicy": "Generating trust policy…",
      "roleArn": "Role ARN",
      "awsAccountId": "AWS Account ID",
      "region": "Region",
      "roleCreatedNext": "I've created the role — Next",
      "trustPolicy": "1. Trust Policy (attach to IAM role)",
      "permissionPolicy": "2. Permission Policy (inline or managed)",
      "externalIdNote": "This ID is pre-filled in the trust policy above. Keep this page open while creating the role.",
      "connectError": "Failed to connect — check your Role ARN and trust policy",
      "policyError": "Failed to generate trust policy"
    },
    "gcp": {
      "title": "Connect GCP",
      "description": "Paste your GCP Service Account key JSON to enable cloud security scanning.",
      "keyJsonLabel": "Service Account Key JSON",
      "connectError": "Failed to connect to GCP. Check the service account key."
    }
  }
}
```

```json
// in public/locales/ja/integrations.json — add under "cards" section
{
  "cards": {
    "shared": {
      "connected": "接続済み",
      "notConnected": "未接続",
      "connect": "接続",
      "disconnect": "切断",
      "cancel": "キャンセル",
      "connecting": "接続中...",
      "disconnecting": "切断中...",
      "configure": "設定",
      "labelOptional": "ラベル（任意）",
      "remove": "削除",
      "copied": "コピーしました！",
      "copy": "コピー",
      "apiKey": "APIキー",
      "save": "保存",
      "accounts": "アカウント",
      "connectedAccount": "接続済みアカウント",
      "connectedAccounts": "接続済みアカウント",
      "failedToConnect": "接続に失敗しました",
      "failedToDisconnect": "切断に失敗しました"
    },
    "aws": {
      "title": "AWSアカウントを接続",
      "stepOf": "ステップ {{step}} / {{total}}",
      "trustPolicyDesc": "AWSアカウントにクロスアカウントIAMロールを作成し、以下の信頼ポリシーを設定してください。一意のExternal IDを使用してロールを引き受けます。アクセスキーは保存されません。",
      "generatingPolicy": "信頼ポリシーを生成中…",
      "roleArn": "ロールARN",
      "awsAccountId": "AWSアカウントID",
      "region": "リージョン",
      "roleCreatedNext": "ロールを作成しました — 次へ",
      "trustPolicy": "1. 信頼ポリシー（IAMロールに添付）",
      "permissionPolicy": "2. 権限ポリシー（インラインまたはマネージド）",
      "externalIdNote": "このIDは上記の信頼ポリシーに事前入力されています。ロール作成中はこのページを開いたままにしてください。",
      "connectError": "接続に失敗しました — ロールARNと信頼ポリシーを確認してください",
      "policyError": "信頼ポリシーの生成に失敗しました"
    },
    "gcp": {
      "title": "GCPを接続",
      "description": "GCPサービスアカウントキーのJSONを貼り付けて、クラウドセキュリティスキャンを有効にします。",
      "keyJsonLabel": "サービスアカウントキーJSON",
      "connectError": "GCPへの接続に失敗しました。サービスアカウントキーを確認してください。"
    }
  }
}
```

#### Implementation approach:
1. **Start with shared keys**: Extract common strings used across all cards into `cards.shared`
2. **Then per-card keys**: For each card, add card-specific keys under `cards.<provider>`
3. **Pattern for card components**:
```tsx
import { useTranslation } from 'react-i18next';
// In each component (both modal and card):
const { t } = useTranslation('integrations');
// Shared: t('cards.shared.connect')
// Card-specific: t('cards.aws.title')
```

4. **For each card file**, do the full translation. Follow the AWS/GCP examples above for all remaining cards. Each card's specific strings should be under `cards.<provider>`.

---

### Task 3: Integration Container Pages (2 files, ~1,551 lines)

#### 3a. IntegrationsCardGrid.tsx (799 lines)
- **Path**: `src/app/pages/integrations/IntegrationsCardGrid.tsx`
- **Namespace**: `integrations`
- **Key prefix**: `grid`
- **What to translate**: Category headers, search placeholder, "Show more" buttons, empty state text, loading states, tab labels, filter labels
- Already imports all card components — just needs `useTranslation` and string replacements

#### 3b. PartnerApiPage.tsx (752 lines)
- **Path**: `src/app/pages/integrations/PartnerApiPage.tsx`
- **Namespace**: `integrations`
- **Key prefix**: `partnerApi`
- **What to translate**: Page title, description, API key management labels, status badges, table headers, modal text, button labels

---

### Task 4: engineerACards.data.tsx (1,821 lines — DATA FILE)

- **Path**: `src/app/pages/integrations/engineerACards.data.tsx`
- **Namespace**: `integrations`
- **Key prefix**: `engineerA`

This is a **data configuration file**, not a React component. It contains ~60 integration card definitions with `name`, `description`, `category`, and field label strings.

#### Approach:
Since this is a data file (not a component), you **cannot** use `useTranslation` directly. Instead:

1. Add a `key` field to each card config (e.g., `key: 'workspace-directory'`) — check if one already exists
2. Store the English `name` and `description` as fallbacks
3. At render time (in `EngineerAIntegrationCard.tsx` and `IntegrationsCardGrid.tsx`), translate:
```tsx
const { t } = useTranslation('integrations');
// card.name → t(`engineerA.${card.key}.name`, card.name)
// card.description → t(`engineerA.${card.key}.description`, card.description)
```

4. Add all 60+ entries to locale files:
```json
{
  "engineerA": {
    "workspaceDirectory": {
      "name": "Google Workspace Directory",
      "description": "Verify MFA enforcement for admins..."
    },
    "onelogin": {
      "name": "OneLogin",
      "description": "Verify MFA policy coverage..."
    }
  }
}
```

**Also translate** the field labels in the card configs:
- `fields[].label` (e.g., "API Key", "Account ID", "Base URL")
- These are also rendered at runtime in `EngineerAIntegrationCard.tsx`

---

## Execution Guide

### Parallel execution
Tasks 1-4 can be worked on in parallel since they touch different files. However, **Tasks 2, 3, and 4** all share `integrations.json` locale files, so if running in parallel, coordinate the locale file updates — or assign them to a single agent.

### Recommended execution order (if serial):
1. **Task 1** (root pages) — fastest, ~1,435 lines, independent namespace (`common`)
2. **Task 3** (container pages) — sets up the `integrations` namespace structure
3. **Task 2** (card components) — largest volume, follows patterns from Task 3
4. **Task 4** (data file) — requires coordination with Task 2's render-time approach

### For each file, follow this checklist:
- [ ] Read the component file
- [ ] Identify ALL hardcoded user-facing strings (labels, placeholders, button text, error messages, headings, descriptions, tooltips, status labels, column headers, toast messages)
- [ ] Add `import { useTranslation } from 'react-i18next';` (if not already present)
- [ ] Add `const { t } = useTranslation('<namespace>');` in each component function
- [ ] Replace strings with `t('section.key')` or `{t('section.key')}` in JSX
- [ ] For interpolation: `t('key', { variable: value })`
- [ ] For config objects with labels: add `key` field, translate at render time with `t('section.${cfg.key}', cfg.label)`
- [ ] For helper functions outside components: accept `t: TFunction<'namespace'>` parameter and import `TFunction` from `i18next`
- [ ] Add keys to `public/locales/en/<namespace>.json`
- [ ] Add Japanese translations to `public/locales/ja/<namespace>.json`
- [ ] Avoid variable shadowing (`t` in `.map()` callbacks — rename callback param to `item`, `entry`, etc.)
- [ ] Don't translate props that come from parent components (props-only components)
- [ ] Don't duplicate imports if `useTranslation` is already imported
- [ ] Toast messages and error strings should also be translated

### Japanese translation quality guidelines:
- Use professional/formal tone (です/ます form)
- Technical terms can remain in English (AWS, API, GCP, OAuth, IAM, etc.)
- Provider names stay in English (Slack, GitHub, Azure, etc.)
- UI action words: 接続 (Connect), 切断 (Disconnect), キャンセル (Cancel), 保存 (Save), 削除 (Remove/Delete)
- Status words: 接続済み (Connected), 未接続 (Not connected), 読み込み中 (Loading), 処理中 (Processing)
- Error prefix: ～に失敗しました (Failed to ～)

---

## Post-Translation Verification

After all files are translated:

```bash
# 1. TypeScript check — must pass with zero errors
npx tsc --noEmit

# 2. Verify no remaining hardcoded strings (spot check)
grep -rn '"Connect"' src/app/pages/integrations/ --include="*.tsx" | grep -v import | grep -v '//' | grep -v 'className'

# 3. Verify all files have useTranslation (only intentional skips should remain)
comm -23 <(find src/app/pages -name "*.tsx" -type f | sort) \
         <(grep -rl "useTranslation" src/app/pages --include="*.tsx" | sort)

# Expected remaining (intentional skips):
# - SimplePages.tsx (dead code)
# - KpiCard.tsx (×2, props-only)
# - helpers.tsx (uses TFunction directly)
# - Section.tsx (generic wrapper)
# - icons.tsx (SVGs only)
# - StatCard.tsx (props-only)
# - engineerACards.tsx (barrel re-export)
# - staticCatalog.tsx (utility functions)
# - engineerACards.data.tsx (data file — translated at render time)

# 4. Lint check
npm run lint

# 5. Build check
npm run build
```
