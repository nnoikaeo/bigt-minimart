# FLOW 3: Bill Payment Service — Implementation Plan

> **Goal**: Implement FLOW 3 (Daily Bill Payment Service Income) mirroring the existing FLOW 2 (Money Transfer Service) architecture.
>
> **Spec**: [docs/REQUIREMENTS/WORKFLOWS.md](../REQUIREMENTS/WORKFLOWS.md) — FLOW 3 section (WF 3.0–3.3)
>
> **Reference implementation (FLOW 2)**:
> - Store: [stores/money-transfer.ts](../../stores/money-transfer.ts)
> - History page: [pages/finance/money-transfer-history.vue](../../pages/finance/money-transfer-history.vue)
> - Service page: [pages/finance/money-transfer-service/index.vue](../../pages/finance/money-transfer-service/index.vue)
> - Helpers: [composables/useMoneyTransferHelpers.ts](../../composables/useMoneyTransferHelpers.ts)
> - Seed data: `public/data/money-transfer-*.json`

## Convention
- **1 Task = 1 Chat** — each task is scoped to fit a single conversation end-to-end.
- Each task lists the **Skill** to invoke at the start of the chat (via `/skill-name` or Skill tool).
- Tasks are ordered; later tasks depend on earlier ones unless noted.
- After each task, commit with `/commit` (conventional commit) before opening the next chat.

## Key Differences from FLOW 2 (do not forget)
| Aspect | FLOW 2 (Money Transfer) | FLOW 3 (Bill Payment) |
|---|---|---|
| Balance accounts | 4 (bank, transferCash, serviceFeeCash, serviceFeeTransfer) | **3** (bank, billPaymentCash, serviceFeeCash) |
| Transaction types | transfer, withdrawal, owner_deposit | **bill_payment, owner_deposit** |
| Extra dimension on bill_payment | — | **billType**: utility / telecom / insurance / other |
| Commission method | cash OR transfer | **cash only** |
| Cash flow direction | bidirectional (in + out) | **one-way (in only)** for bill_payment |
| Workflow states | Same 5-state machine + needs_correction loop | **Identical** (reuse pattern) |

---

## Task 1 — Types & Seed Data
**Skill**: `/create-implementation-plan` → then implement directly (small scope, no sub-plan needed; use plain edits).

**Scope**:
1. Create `types/bill-payment.ts` with interfaces:
   - `BillPaymentTransaction` (fields: `id`, `date`, `timestamp`, `transactionType: 'bill_payment' | 'owner_deposit'`, `billType?: 'utility' | 'telecom' | 'insurance' | 'other'`, `amount`, `commission`, `customerName?`, `status: 'success' | 'failed'`, `notes?`, `recordedBy`, `recordedAt`)
   - `BillPaymentBalance` (fields: `id`, `date`, `bankAccount`, `billPaymentCash`, `serviceFeeCash`, `openingBalance`, `openingBalanceSetAt`, `openingBalanceSource`, `openingBalanceSetBy`, `history`, `updatedAt`)
   - `BillPaymentDailySummary` (fields: `id`, `date`, `workflowStatus`, `step1CompletedAt?`, `step2CompletedAt?`, `auditedAt?`, `approvedAt?`, actor ids, notes, expected vs actual counts, `needsCorrectionFrom?`)
   - `BillPaymentWorkflowStatus` union: `'step1_in_progress' | 'step2_completed' | 'step2_completed_with_notes' | 'audited' | 'audited_with_issues' | 'approved' | 'approved_with_notes' | 'needs_correction'`
2. Create seed data files in `public/data/`:
   - `bill-payment-balances.json` — 2-3 sample days following the shape of `money-transfer-balances.json`
   - `bill-payment-transactions.json` — 4 sample transactions matching the WORKFLOWS.md Real-World Example (Utility 2000, Telecom FAILED, Owner Deposit 5000, Telecom RETRY)
   - `bill-payment-summaries.json` — one summary per seed date with correct `workflowStatus`
   - `bill-payment-fee-config.json` — fee rate brackets per bill type (copy shape from money-transfer-fee-config.json)

**Acceptance**:
- [ ] Types compile (`nuxi typecheck` or `npx tsc --noEmit`)
- [ ] JSON files parse as valid JSON
- [ ] Numbers in seed data tie out to the FLOW 3 Real-World Example in WORKFLOWS.md

---

## Task 2 — Pinia Store (`stores/bill-payment.ts`)
**Skill**: `/refactor` (read [stores/money-transfer.ts](../../stores/money-transfer.ts), adapt for 3-balance model; keep `// @ts-nocheck` at top for parity).

**Scope**:
1. Mirror all state shape / actions / getters from `money-transfer.ts` but for Bill Payment:
   - State: `balances`, `transactions`, `summaries`, `currentBalance`, `currentSummary`
   - Actions: `initializeStore`, `fetchTransactionsByDate`, `fetchDailySummary`, `createTransaction`, `updateTransaction`, `deleteDraftTransaction`, `completeStep1`, `completeStep2`, `submitAudit`, `submitOwnerApproval`, `fetchCurrentBalanceAction`
   - Getters: `getTransactionsByDate`, `getDraftTransactions`, `isStep1Complete`, `isStep2Complete`, `isAudited`, `isApproved`, `currentBalance`, `currentSummary`
2. Balance recalculation logic — write new function that handles 3-account model:
   - `bill_payment` success: `bankAccount -= amount`, `billPaymentCash += amount`, `serviceFeeCash += commission`
   - `owner_deposit` success: `bankAccount += amount`
   - `failed` status: no balance change
3. Implement `needs_correction` loop handling in `submitAudit` (approach C): on correction request, clear Step 2 verification but preserve Step 1 transaction records so Manager can edit.

**Acceptance**:
- [ ] Store actions match method names declared above (needed for page wiring later)
- [ ] Balance recalc matches WORKFLOWS.md example: Day end = Bank 4,800 / BillPaymentCash 3,200 / ServiceFeeCash 40
- [ ] `needs_correction` → `step1_in_progress` transition works without losing transactions

---

## Task 3 — Helpers Composable (`composables/useBillPaymentHelpers.ts`)
**Skill**: `/refactor` (adapt [composables/useMoneyTransferHelpers.ts](../../composables/useMoneyTransferHelpers.ts)).

**Scope**:
1. Formatters: `formatBillType(type)` → Thai label, `formatTransactionType(type)`, `formatWorkflowStatus(status)` with color class, `formatAmount(n)`
2. Validators: `validateTransactionForm(form)` returning `{ valid, errors }`
3. Computed helpers: `calculateExpectedCash(transactions)`, `diffExpectedVsActual(expected, actual)`
4. Smart Navigation helper: `getSmartActionButton(role, workflowStatus)` returning `{ label, route, variant }` per WF 3.0 table in WORKFLOWS.md

**Acceptance**:
- [ ] All helpers unit-testable (pure functions)
- [ ] `getSmartActionButton` returns correct `(label, route)` for all 9 combinations in the WF 3.0 table

---

## Task 4 — History Page (WF 3.0)
**Skill**: `/refactor` (adapt [pages/finance/money-transfer-history.vue](../../pages/finance/money-transfer-history.vue)).

**Scope**:
1. Create `pages/finance/bill-payment-history.vue`
2. `middleware: 'auth'`, `PERMISSIONS.VIEW_FINANCE` required
3. Summary cards with Pending Inbox counts per role (Manager/AM, Auditor, Owner)
4. Table of daily records with Smart Action Button (uses `useBillPaymentHelpers.getSmartActionButton`)
5. "เพิ่มรายการ" button gated by `PERMISSIONS.EDIT_FINANCE` → opens date picker modal → navigates to `/finance/bill-payment-service?date=`
6. Back navigation from all sub-pages lands here
7. Verify sidebar menu item "บริการรับชำระบิล" already points here (per user's note); if not, update `public/data/sidebar-menu.json`

**Acceptance**:
- [x] Each role sees correct pending counts
- [x] Action button label/destination matches WF 3.0 table
- [x] Backdated entry warning shows when past date selected

---

## Task 5 — Service Page Shell + Step 1 (Record Transactions)
**Skill**: `/breakdown-feature-implementation` (the money-transfer service page is 3,300+ lines; break Step 1 UI into clear sub-sections before coding).

**Scope**:
1. Create `pages/finance/bill-payment-service/index.vue`
2. Query param driven: reads `?date=YYYY-MM-DD`
3. `PageWrapper` + `PageHeader` with back button → `/finance/bill-payment-history`
4. Backdated-entry warning banner if date < today
5. **Step 1 section** (`workflowStatus === 'step1_in_progress' || 'needs_correction'`):
   - 3 Balance cards (Bank, Bill Payment Cash, Service Fee Cash)
   - Transaction list (table) with edit/delete for drafts
   - "รายการใหม่" button → `BaseModal` form:
     - Type radio: bill_payment / owner_deposit
     - If bill_payment: billType select (utility/telecom/insurance/other)
     - Amount, commission (commission hidden for owner_deposit)
     - Customer name (optional), status (success/failed), notes
   - `ConfirmDialog` on destructive actions
   - Action button: "ไปขั้นตอนที่ 2 →" → calls `store.completeStep1(date)`
6. **If `needs_correction`**: show audit notes banner at top explaining what to fix

**Acceptance**:
- [x] Creating a bill_payment updates all 3 balances correctly in real time
- [x] Draft transactions can be edited/deleted before Step 1 completion
- [x] Transitioning to Step 2 requires at least 1 transaction

---

## Task 6 — Service Page Step 2 (Verify Cash Count)
**Status: ✅ Complete**
**Skill**: `/refactor` (reuse Step 2 pattern from money-transfer-service/index.vue).

**Scope**:
1. In same `bill-payment-service/index.vue`, add Step 2 section (shown when `workflowStatus === 'step2_in_progress'` after Step 1 completion, or read-only for later states)
2. Show 3 expected values from store (bankAccount, billPaymentCash, serviceFeeCash)
3. 3 input fields for actual counted cash (Bank not counted — read-only display)
4. Diff calculation: color-coded badge (green = match, red/amber = discrepancy)
5. Verification notes textarea
6. "ยืนยันข้อมูล" button → `store.completeStep2(date, step2Data)`
   - If all match → `workflowStatus = 'step2_completed'`
   - If any discrepancy → `workflowStatus = 'step2_completed_with_notes'`
7. Auto-navigate back to history page on success

**Acceptance**:
- [x] Diff calc matches (expected − actual) with correct sign
- [x] Discrepancy requires notes before submit
- [x] Read-only mode shown for step2_completed and later states

---

## Task 7 — Auditor Review Section (WF 3.2)
**Skill**: `/refactor` (mirror auditor-review UI from money-transfer-service/index.vue including needs_correction approach C flow).

**Scope**:
1. Route: `pages/finance/bill-payment-service/auditor-review.vue` (or as a section in `index.vue` if FLOW 2 does that — confirm by reading MT page first)
2. Middleware: `PERMISSIONS.VIEW_FINANCE` + role = auditor or owner
3. Per-transaction checklist (auditor checks each recorded bill payment vs bank statement)
4. Bank balance input (auditor enters observed bank statement balance)
5. Audit findings textarea
6. 3 action buttons:
   - "ยืนยันการตรวจสอบ" → `workflowStatus = 'audited'`
   - "ยืนยันพร้อมหมายเหตุ" → `workflowStatus = 'audited_with_issues'`
   - "ส่งกลับให้ Manager ปรับแก้" → `workflowStatus = 'needs_correction'` (requires notes)
7. Uses `store.submitAudit(date, auditData)` — make sure Task 2 store action supports all three outcomes

**Acceptance**:
- [x] All 3 audit outcomes tested manually
- [x] needs_correction round-trip: Auditor sends back → Manager sees banner → edits → resubmits → Auditor re-audits

**Completed**: 2026-04-08 — PR #105 merged into develop

---

## Task 8 — Owner Approval Section (WF 3.3)
**Skill**: `/refactor` (mirror owner-approval from FLOW 2).

**Scope**:
1. Route: `pages/finance/bill-payment-service/owner-approval.vue` (match FLOW 2 structure)
2. Middleware: role = owner only
3. Summary view (read-only): Step 1 transactions, Step 2 cash counts, Auditor findings
4. Expandable transaction detail rows
5. Decision radios:
   - Approve → `workflowStatus = 'approved'`
   - Approve with notes → `workflowStatus = 'approved_with_notes'` (requires notes)
   - Request correction → `workflowStatus = 'needs_correction'` (requires notes, only available if `audited_with_issues`)
6. Uses `store.submitOwnerApproval(date, approvalData)`

**Acceptance**:
- [x] All 3 decisions routed to correct status
- [x] Read-only view for already-approved records

**Completed**: 2026-04-08 — PR #106 merged into develop

---

## Task 9 — Unit Tests for Store & Helpers
**Status: ✅ Complete**
**Skill**: `/unit-test-vue-pinia`

**Scope**:
1. Test `stores/bill-payment.ts` with `createTestingPinia`:
   - Balance recalc: 4-transaction example from WORKFLOWS.md → expect final balances (4800 / 3200 / 40)
   - State transitions: step1 → step2 → audit → approval happy path
   - `needs_correction` loop: audit → needs_correction → manager edit → step2 → audit again
   - Failed transaction has no balance impact
2. Test `composables/useBillPaymentHelpers.ts`:
   - `getSmartActionButton` — all 9 combinations from WF 3.0 table
   - Formatters return correct Thai labels
   - Validators reject invalid forms

**Acceptance**:
- [x] All tests pass (`npm run test`)
- [x] Coverage of all 3 store transitions + needs_correction loop

**Completed**: 2026-04-08 — PR #107 merged into develop

---

## Task 10 — E2E Walkthrough & Polish
**Skill**: `/webapp-testing` (Playwright skill to drive the app).

**Scope**:
1. Start dev server
2. Walk through full happy path as 3 roles:
   - Manager: history → add entry → Step 1 (4 txns from example) → Step 2 (matching) → submit
   - Auditor: history → review → audited
   - Owner: history → approve → approved
3. Walk through needs_correction loop:
   - Auditor → needs_correction
   - Manager edits → resubmits
   - Auditor re-audits → audited
4. Capture screenshots at each state; verify:
   - Balance cards show correct numbers
   - Pending Inbox counts update per role
   - Sidebar menu link works
5. Fix any layout/label issues found; do NOT expand scope beyond polish

**Acceptance**:
- [ ] Happy path screenshot set captured
- [ ] needs_correction loop screenshot set captured
- [ ] No console errors during walkthrough

---

## Task 11 — Simplify & Security Review
**Skill**: `/simplify` then `/security-review`.

**Scope**:
1. `/simplify` on all new files from Task 1–8:
   - Remove duplication vs money-transfer code where safe via shared helpers (do NOT force premature abstraction)
   - Remove unused computed/refs
   - Fix lingering TS errors
2. `/security-review` on `stores/bill-payment.ts` and new pages:
   - Permission gating on all mutation actions
   - No XSS via `v-html`
   - No leaked user input in logs

**Acceptance**:
- [ ] `nuxi typecheck` clean
- [ ] No security findings above "info" level
- [ ] LOC reduction report from /simplify

---

## Task 12 — Commit, PR, and Memory Update
**Skill**: `/conventional-commit` → then `/commit` with full body → then manual PR creation.

**Scope**:
1. Stage all FLOW 3 files in logical groups:
   - `feat(bill-payment): add types, store, and seed data`
   - `feat(bill-payment): implement history page and smart navigation (WF 3.0)`
   - `feat(bill-payment): implement Manager Step 1/Step 2 pages (WF 3.1)`
   - `feat(bill-payment): implement Auditor review with needs_correction loop (WF 3.2)`
   - `feat(bill-payment): implement Owner approval (WF 3.3)`
   - `test(bill-payment): add store and helper unit tests`
2. Open PR against `develop` with:
   - Summary
   - Checklist of all 12 tasks
   - Screenshots from Task 10
3. Update `MEMORY.md` with any new conventions learned during FLOW 3 (e.g., if a new pattern emerged that differs from FLOW 2)

**Acceptance**:
- [ ] PR opened and linked here
- [ ] MEMORY.md updated if needed

---

## Progress Tracker

| # | Task | Skill | Status | Chat Link |
|---|---|---|---|---|
| 1 | Types & Seed Data | `/create-implementation-plan` | ✅ | #99 |
| 2 | Pinia Store | `/refactor` | ✅ | #feature/bill-payment-store |
| 3 | Helpers Composable | `/refactor` | ✅ | #101 |
| 4 | History Page (WF 3.0) | `/refactor` | ✅ | #102 |
| 5 | Service Shell + Step 1 | `/breakdown-feature-implementation` | ✅ | #feature/bill-payment-service-step1 |
| 6 | Step 2 Verify Cash | `/refactor` | ✅ | #feature/bill-payment-service-step2 |
| 7 | Auditor Review (WF 3.2) | `/refactor` | ☐ | — |
| 8 | Owner Approval (WF 3.3) | `/refactor` | ☐ | — |
| 9 | Unit Tests | `/unit-test-vue-pinia` | ✅ | #107 |
| 10 | E2E Walkthrough | `/webapp-testing` | ☐ | — |
| 11 | Simplify + Security Review | `/simplify` + `/security-review` | ☐ | — |
| 12 | Commit & PR | `/conventional-commit` | ☐ | — |

---

## Notes for Each New Chat

When starting a new chat for a task, paste this context:

> Working on FLOW 3 (Bill Payment Service). Read [docs/PROGRESS/FLOW3_IMPLEMENTATION_PLAN.md](docs/PROGRESS/FLOW3_IMPLEMENTATION_PLAN.md) and execute **Task N** only. Use the skill listed in the plan. Reference FLOW 2 files for patterns. Do not touch tasks outside N's scope.

Then invoke the skill listed for that task.
