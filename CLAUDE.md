# CLAUDE.md — BigT Minimart

Project instructions for Claude Code. Loaded automatically every session.
Keep this file short: facts that live in `docs/` are **linked**, not copied.

## Where things are

| Need | Read |
|------|------|
| Current status, next task, tech debt | `docs/PROGRESS/STATUS.md` |
| Testing plan + results (MT/BP/SHARED, E2E) | `docs/PROGRESS/TESTING_PLAN.md` |
| Doc index | `docs/README.md` (completed/old docs → `docs/ARCHIVE/`, listed in `docs/ARCHIVE/README.md`) |
| Business workflows (FLOW 1–4) | `docs/REQUIREMENTS/WORKFLOWS.md` |
| API routes | `docs/TECHNICAL/API_ENDPOINTS.md` |
| Data layer | `server/repositories/README.md` |
| Git / release flow | `docs/DEVELOPMENT/GIT_WORKFLOW.md` |

## Stack (verify in package.json if in doubt)

- Nuxt 4 + Vue 3 `<script setup lang="ts">` + TypeScript strict, Pinia 3, Tailwind 3
- Firebase Auth (client) + Firebase Admin token verification (`server/utils/serverAuth.ts`)
- Data: JSON files in `public/data/` via `server/repositories/*-json.repository.ts` (Firestore repos exist but are not wired)
- Tests: Vitest (`npm test`) — CI does **not** run tests, so run them locally
- Checks: `npm run lint` (nuxt typecheck), `npm run type-check` (vue-tsc), `npm run build`

## Finance services (Money Transfer = FLOW 2, Bill Payment = FLOW 3)

- Single-page orchestrators: `pages/finance/{money-transfer,bill-payment}-service/index.vue`
  → role sections in `components/{money-transfer,bill-payment}/` (`ManagerRecordingSection`, `CashVerificationSection`, `AuditorReviewSection`, `OwnerApprovalSection`, `TransactionForm`)
- History pages: `pages/finance/{money-transfer,bill-payment}-history.vue`
- Shared components: `components/shared/` (WorkflowProgressBar, CashVerificationTable, OwnerDecisionCard, …)
- Statuses: `types/shared-workflow.ts` — `UnifiedWorkflowStatus` (`step1_in_progress` → `step1_completed` → `step2_completed[_with_notes]` → `audited[_with_issues]` → `approved[_with_notes]`, plus `needs_correction`) and `UnifiedTransactionStatus` (`completed` / `draft` / `on_hold` / `cancelled`). Balances count `completed` only.
- Stores `stores/money-transfer.ts` and `stores/bill-payment.ts` start with `// @ts-nocheck`.
  **Check the store file before calling a method** — names differ between the two stores, e.g. MT `deleteTransaction(id)` vs BP `deleteDraftTransaction(id)`.
  Shared: `initializeStore`, `fetchTransactionsByDate`, `fetchDailySummary`, `createTransaction`, `updateTransaction`, `completeDraftTransaction`, `changeTransactionStatus`, `setOpeningBalance`, `completeStep1(date)`, `completeStep2(date, data)`, `submitAudit(date, data)`, `submitOwnerApproval(date, data)` (no `completeAudit` / `rejectAudit`).
- Server auth: BP mutation routes call `requireServerAuth(event)`; BP store uses `getApiFetch()` (adds Firebase ID token via `plugins/apiFetch.client.ts`). MT routes do not yet (known tech debt).

## Coding conventions

- Design system components are auto-imported (`ui/*`, `layout/`, `shared/` without prefix; domain folders with path prefix, e.g. `<MoneyTransferAuditorReviewSection>`)
- RBAC: `<ActionButton :permission="PERMISSIONS.EDIT_FINANCE">`, or `const { can } = usePermissions()`; permissions in `types/permissions.ts`
- Icons: `@heroicons/vue/24/outline` — never emoji on action buttons
- Logging: `const logger = useLogger('ComponentName')` → `logger.log` / `logger.error`
- Async: try/catch, set `errorMessage.value = err.message`
- Destructive actions: `ConfirmDialog`
- Date pickers: `<input type="date">` in the `#actions` slot of `PageWrapper`
- TS pitfalls: `split('T')[0]` is `string | undefined` (use `?? ''`); v-for index is `string | number` (use `Number(idx) + 1`); type literal unions with `''` explicitly (`ref<'a' | 'b' | ''>('')`); remove unused computeds

## Keeping docs in sync (required)

Do these as part of the task, not as a follow-up:

1. **After a PR is merged** → update `docs/PROGRESS/STATUS.md` (header "Last Updated / latest merge / Next Up", Recent Work, Key Metrics).
2. **After a manual-test task or step is verified** → tick its checkboxes in `docs/PROGRESS/TESTING_PLAN.md` and fill the results table (date, result, bugs, PRs).
3. **When changing API routes, env vars, dependencies, stores, or CI** → update the matching doc (`API_ENDPOINTS.md`, `FIREBASE.md`, `TECHNOLOGY_STACK.md`, `STATE_MANAGEMENT_ARCHITECTURE.md`, `CI_CD.md`).
4. **When a plan/doc is finished or superseded** → move it to `docs/ARCHIVE/` with `git mv` and add a row to `docs/ARCHIVE/README.md`.
5. **When a fact in this file becomes wrong** → fix this file in the same PR.
6. Never put project facts in Claude's private memory — put them here or in `docs/`.

## Git

- Work on branches from `develop`; PR → `develop` (squash merge); release = PR `develop` → `main` titled `release: ...` (auto-deploys production)
- `public/data/*.json` changes during manual testing — commit them separately (`chore(data): ...`), never mix with code
- Do not merge code to `main` that has not passed its manual test in TESTING_PLAN.md
