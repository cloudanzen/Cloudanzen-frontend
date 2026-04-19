# Role Workflow Bugs

Run: `npm run test:e2e -- e2e/role-workflows.spec.ts`

Initial result on 2026-04-18:
- Passed: 3
- Failed: 2

Post-fix result on 2026-04-18:
- Passed: 5
- Failed: 0

## BUG-1: Org Admin is blocked from Partner API workflow even though backend and page docs treat it as an admin surface

Severity: High

Status: Fixed

Failing automation:
- `org admin can access partner api workflow`

Observed behavior:
- An `ORG_ADMIN` can open `/integrations/partner-api`, but the page shows `Super Admin access required` and does not expose the `Issue API Key` action.

Expected behavior:
- `ORG_ADMIN` should be able to use the Partner API admin surface.

Why this is a bug:
- The frontend page comment says the page is `Admin-only` and explicitly says it lets org admins issue/revoke API keys and inspect partner results.
- The backend partner admin routes also describe this as an org-admin surface and allow `SUPER_ADMIN`, `ORG_ADMIN`, and `SECURITY_OWNER`.
- The current frontend blocks `ORG_ADMIN` by checking only `useHasRole('SUPER_ADMIN')` and the sidebar also hides the route from org admins.

Code references:
- Frontend page docs and guard: `Cloudanzen-frontend/src/app/pages/integrations/PartnerApiPage.tsx:3-12,56-58,169-187`
- Frontend sidebar visibility: `Cloudanzen-frontend/src/app/components/Sidebar.tsx:278-284`
- Backend role allowance: `Cloudanzen-backend/src/modules/partner/partner-admin-routes.ts:3-6,20,30-38,127-135`

Evidence:
- Playwright failure: `e2e/role-workflows.spec.ts:35-43`
- Failure snapshot: `test-results/role-workflows-Role-workfl-a20b7-access-partner-api-workflow-chromium/error-context.md`

Fix applied:
- Sidebar visibility now includes `SUPER_ADMIN`, `ORG_ADMIN`, and `SECURITY_OWNER`.
- Route access for `/integrations/partner-api` now uses a role-aware loader with the same admin-role set.
- `PartnerApiPage` access guard now matches backend role allowance instead of requiring only `SUPER_ADMIN`.

## BUG-2: Auditor can directly access the full User Management page via URL

Severity: Critical

Status: Fixed

Failing automation:
- `auditor is blocked from user management routes`

Observed behavior:
- An `AUDITOR` can navigate directly to `/settings/access/users`.
- The full `User Management` screen renders, including the complete user list and role distribution, even though the sidebar correctly hides the `Users` and `Roles` settings links for auditors.

Expected behavior:
- Auditors should be blocked from the user-management route entirely, with a redirect or explicit access-denied state.

Why this is a bug:
- Route protection only checks whether a token exists; it does not enforce role-based access.
- The route definition for `/settings/access/users` has no role loader/guard.
- `AccessUsersPage` uses permissions only to hide specific controls like `Invite User`, but still renders the management page and org user data for auditors.
- This creates a direct-URL authorization gap between navigation visibility and actual page access.

Code references:
- Token-only auth guard: `Cloudanzen-frontend/src/app/authGuard.ts:4-9`
- Unguarded settings route: `Cloudanzen-frontend/src/app/routes.ts:435-442`
- Page renders for any authenticated user; permission only affects buttons: `Cloudanzen-frontend/src/app/pages/access/AccessUsersPage.tsx:51-57,136-183`
- Auditor permissions still include only `USERS_READ`, not management: `Cloudanzen-frontend/src/lib/rbac/permissions.ts:167-182`

Evidence:
- Playwright failure: `e2e/role-workflows.spec.ts:58-64`
- Rendered auditor snapshot showing full user-management UI: `test-results/role-workflows-Role-workfl-f75fe-from-user-management-routes-chromium/error-context.md`

Fix applied:
- Added role-aware route loaders for `/settings/access/users` and `/settings/access/roles`.
- Unauthorized users are redirected to `/settings/access/requests` instead of being allowed to render the management pages.

## Audit workflow sweep (2026-04-18)

Run:
- `npm run test:e2e -- e2e/audit-workflows.spec.ts`

Initial result:
- Passed: 0
- Failed: 4

Post-fix result:
- Passed: 4
- Failed: 0

## BUG-3: Newly scheduled internal audits show `Internal` instead of the assigned auditor's name in the audits list

Severity: High

Status: Fixed

Observed behavior:
- After scheduling an audit with an internal auditor selected, the audits table shows `Internal` in the Auditor column rather than the actual assigned person.

Expected behavior:
- The Auditor column should display the assigned auditor's name, or at minimum a clear human-readable identity.

Why this is a bug:
- The column is labeled `Auditor`, but the list reduces all internal assignees to the generic text `Internal`.
- This makes the list unusable for quickly identifying ownership across multiple audits.

Code references:
- `Cloudanzen-frontend/src/app/pages/compliance/AuditsPage.tsx:234-238`

Evidence:
- Playwright failure: `Cloudanzen-frontend/e2e/audit-workflows.spec.ts:276-286`

Fix applied:
- Audit list now resolves `assignedAuditorId` against the users query and renders the assigned auditor's name/email.

## BUG-4: Audit detail page does not show the assigned auditor identity

Severity: High

Status: Fixed

Observed behavior:
- The audit detail page for an internal audit does not surface the assigned auditor's name anywhere in the visible overview content.

Expected behavior:
- The audit detail page should show who owns or conducts the audit.

Why this is a bug:
- Auditor identity is core audit metadata and is needed for admin and auditor handoffs.
- The detail page shows timeline and status information but omits the assigned auditor, making the page incomplete as an operational view.

Code references:
- `Cloudanzen-frontend/src/app/pages/compliance/AuditDetailPage.tsx:152-178`

Evidence:
- Playwright failure: `Cloudanzen-frontend/e2e/audit-workflows.spec.ts:289-296`
- Failure snapshot: `Cloudanzen-frontend/test-results/audit-workflows-Audit-work-4cf00-who-the-assigned-auditor-is-chromium/error-context.md`

Fix applied:
- Audit detail overview now shows an Auditor field resolved from the user list.

## BUG-5: Audit final report shows the raw `assignedAuditorId` instead of the auditor's name

Severity: High

Status: Fixed

Observed behavior:
- The final report displays `assignedAuditorId` directly for internal audits rather than resolving it to the user's name.

Expected behavior:
- The final report should show the assigned auditor's display name.

Why this is a bug:
- Final reports are user-facing audit artifacts; raw internal IDs are not meaningful and look broken.
- This leaks implementation detail into the report UX.

Code references:
- `Cloudanzen-frontend/src/app/pages/auditor/AuditFinalReportPage.tsx:411-414`

Evidence:
- Playwright failure: `Cloudanzen-frontend/e2e/audit-workflows.spec.ts:299-306`

Fix applied:
- Final report scope metadata now resolves the internal auditor id to a human-readable name/email.

## BUG-6: External audits can be created without any auditor contact details

Severity: Critical

Status: Fixed

Observed behavior:
- In the schedule-audit flow, switching to `External` auditor mode and clicking `Create Audit` with no external contact still submits the create request successfully.

Expected behavior:
- External audit creation should require auditor contact details before submission.

Why this is a bug:
- The UI presents an external-auditor path but does not validate that any external contact is actually provided.
- The frontend submits with no external auditor data, and the backend schema also accepts it.
- This allows creation of external audits with no accountable auditor identity.

Code references:
- Missing frontend validation: `Cloudanzen-frontend/src/app/pages/compliance/ScheduleAuditModal.tsx:84-111,375-383`
- Backend schema makes the field optional: `Cloudanzen-backend/src/modules/audits/audit-schemas.ts:10-21`

Evidence:
- Playwright failure: `Cloudanzen-frontend/e2e/audit-workflows.spec.ts:309-323`

Fix applied:
- Schedule-audit submission now validates internal and external auditor assignment before calling the create API.

## Proposed next regression tests

Status: Planned

Goal:
- Extend role and audit workflow coverage around direct-URL authorization, role-specific navigation, and auditor identity rendering edge cases.

Priority additions:

1. `security owner can access partner api workflow`
- Purpose: Confirm the third allowed admin role is covered, not just `SUPER_ADMIN` and `ORG_ADMIN`.
- Expected behavior: `SECURITY_OWNER` can load `/integrations/partner-api` and see the admin workflow, including `Issue Key`.

2. `auditor is blocked from partner api route by direct url`
- Purpose: Verify route-level protection on `/integrations/partner-api` for non-admin roles.
- Expected behavior: `AUDITOR` is redirected to `/integrations` and cannot see Partner API admin actions.

3. `employee is blocked from access admin routes`
- Purpose: Add a non-auditor negative case for `/settings/access/users` and `/settings/access/roles`.
- Expected behavior: `EMPLOYEE` is redirected to `/settings/access/requests` for both routes.

4. `security owner can access access roles page`
- Purpose: Ensure every allowed access-admin role can open `/settings/access/roles`.
- Expected behavior: `SECURITY_OWNER` reaches the roles page and sees role-management UI.

5. `org admin is blocked from super admin platform routes`
- Purpose: Guard the opposite boundary from the existing super-admin positive-path test.
- Expected behavior: `ORG_ADMIN` cannot access `/admin/organizations` and is redirected away from platform-admin content.

6. `sidebar only shows admin links to allowed roles`
- Purpose: Catch mismatches between navigation visibility and route-level authorization.
- Expected behavior: `Users`, `Roles`, and `Partner API` appear only for `SUPER_ADMIN`, `ORG_ADMIN`, and `SECURITY_OWNER`, and remain hidden for `AUDITOR` and `EMPLOYEE`.

7. `protected route does not flash privileged content before redirect`
- Purpose: Detect client-side regressions where restricted UI briefly renders before loader redirect completes.
- Expected behavior: Blocked users never see protected headings, tables, or action buttons during navigation.

Audit workflow additions:

8. `internal audit scheduling requires assigned internal auditor`
- Purpose: Add the missing positive complement to the existing assignment validation.
- Expected behavior: Internal audit creation is blocked until `assignedAuditorId` is selected.

9. `external audit scheduling succeeds when auditor email is provided`
- Purpose: Pair the validation regression test with a positive-path success case.
- Expected behavior: External audit creation submits successfully once a valid external auditor email is entered.

10. `audit list falls back to auditor email when user name is missing`
- Purpose: Verify human-readable fallback when an internal auditor record exists without a display name.
- Expected behavior: Auditor surfaces show the auditor email instead of `Internal` or a blank value.

11. `audit surfaces show external auditor email consistently`
- Purpose: Verify the same auditor label behavior across list, detail, and final report pages for external audits.
- Expected behavior: The external auditor email appears consistently on all three surfaces.

12. `missing internal auditor record shows safe fallback`
- Purpose: Document current fallback behavior when `assignedAuditorId` no longer resolves from the user query.
- Expected behavior: List, detail, and final report show the fallback label without crashing or leaking raw IDs.

13. `auditor dashboard only shows audits assigned to the current auditor`
- Purpose: Reduce risk of overexposing audit records across auditor accounts.
- Expected behavior: An `AUDITOR` only sees audits assigned to that user in dashboard workflow views.

14. `role change takes effect after re-login`
- Purpose: Catch stale cached-role issues in auth storage and client loaders.
- Expected behavior: After re-authentication with a changed role, route access and sidebar visibility update correctly.

Implementation order recommendation:
1. Add direct-URL authorization tests first (`#1`-`#5`).
2. Add sidebar visibility assertions (`#6`-`#7`).
3. Add audit validation and auditor-label consistency tests (`#8`-`#12`).
4. Add session/assignment isolation coverage (`#13`-`#14`).
