# Project Status Dashboard

**Last Updated**: Oct 19, 2026
**Updated By**: Claude Code
**Current Branch**: develop (latest merge: PR #152; main: docs synced via PR #150, code at release #148)
**Current Phase**: Testing — Service Harmonization (Manual Test → Bug Fix → E2E)
**Next Up**: PR 1 — Draft queue (MT + BP) on `feat/draft-queue` (local, not pushed) — MT-2 ✅ passed; BP-2 Step 6 ✅ passed (Oct 19; BUG-013 fix awaiting a quick re-check) → PR to develop; then history summary columns (MT + BP, see "Planned" below); then PR 2 — borrow/repay sales cash (spec: `docs/REQUIREMENTS/DRAFT_QUEUE_AND_CASH_LOAN.md`)

---

## Overall Progress

```
PHASE 1: Core Features
├─ Week 1: Setup + Auth                          ✅ COMPLETE (100%)
├─ Week 2: Layout + Navigation                   ✅ COMPLETE (100%)
├─ Week 3: Daily Sales CRUD                      ✅ COMPLETE (100%)
├─ Week 4: Access Control + Problem Types + Owner Approval ✅ COMPLETE (100%)
├─ Week 5: Money Transfer Service (Phase 1-8)    ✅ COMPLETE (100%)
├─ Week 6: Money Transfer Bug Fixes & Refactor   ✅ COMPLETE (100%)
├─ Week 7: Auditor/Owner Workflow (WF 2.0-2.3)   ✅ COMPLETE (100%)
├─ Week 8: UI Components & Layout Overhaul        ✅ COMPLETE (100%)
├─ Week 9: Layout Consistency & Polish            ✅ COMPLETE (100%)
├─ Week 5-6 (original plan): Dashboard + Reports ❌ NOT STARTED (0%)
├─ Week 10+: Bill Payment Service Harmonization               ✅ COMPLETE (100%)
├─ Testing: Service Harmonization Testing Plan                 🔄 IN PROGRESS (MT-1 ✅, MT-2 Step 1-7 ✅, Step 8 partial — 6 bugs logged)
└─ Overall: PHASE 1 CORE COMPLETE — Harmonization COMPLETE — Testing IN PROGRESS

Timeline Status: Money Transfer feature fully shipped ✓
```

---

## Recent Work (Weeks 5-9: Feb 26 — Mar 25, 2026)

### Week 5 (Feb 26-28): Money Transfer Service

**PRs**: #57, #58, #59, #60, #61, #62

```
✅ Money Transfer Service — Phase 1-8
   ├─ Transaction recording (deposit, withdrawal, transfer, owner_deposit)
   ├─ Balance tracking with carryover logic
   ├─ Favorite transfers system
   ├─ TransactionForm modal (unified for all types)
   ├─ ChannelSelector, PromptPayFields, BankAccountFields components
   ├─ Commission tracking (cash/transfer)
   ├─ Daily record settings page + fee config
   └─ UI Component System (design system)
       ├─ BaseButton, ActionButton, BaseBadge, BaseModal
       ├─ BaseInput, FormField, BaseSelect, BaseTextarea
       ├─ BaseAlert, ConfirmDialog, EmptyState, LoadingState
       ├─ BaseCard, BaseTable, DataTable, PaginationControl
       └─ PageWrapper, PageHeader
```

### Week 6 (Mar 4-5): Bug Fixes & Page Consolidation

**PRs**: #64, #65, #66

```
✅ Bug Fixes
   ├─ Fix carryover balance lookup and number type consistency
   └─ Merge transaction-recording & cash-counting into single index.vue
       └─ Deleted separate step pages (simpler navigation)
```

### Week 7 (Mar 9-13): Auditor/Owner Workflow

**PRs**: #67, #68, #69

```
✅ WF 2.0-2.3 Complete Workflow
   ├─ WF 2.0: History Page as entry point (money-transfer-history.vue)
   ├─ WF 2.1: Manager transaction recording + cash counting (index.vue)
   ├─ WF 2.2: Auditor review (per-txn checklist + bank balance + findings)
   ├─ WF 2.3: Owner approval (summary + decision radios)
   ├─ Shared components: BalanceSnapshot, CashVerificationTable, TransactionTable
   └─ All roles consolidated into single index.vue page
```

### Week 8 (Mar 16): UI Components & Layout Overhaul

**PRs**: #72, #73, #74, #75, #76, #77, #78, #79

```
✅ New Components
   ├─ CollapsibleSection — expandable/collapsible content sections
   ├─ WorkflowProgressBar — step indicator for workflow status
   ├─ QuickGlanceSummary — at-a-glance transaction/status summary
   └─ CompactBalanceSummary — condensed balance display

✅ Layout Improvements
   ├─ Integrated new components into money-transfer index page
   ├─ Wrapped Transaction, Cash Verification, Audit Result in CollapsibleSection
   ├─ Moved Owner Approval section up + added Status Banner
   ├─ Mobile responsive design + sticky action buttons
   └─ Compact View bugfixes (totalCommission field, balance refresh)
```

### Week 10+ (Apr 7-14): Bill Payment Service Harmonization

**PRs**: #127–#136

```
✅ Phase 3: Single-Page Architecture (PR #127)
   └─ รวม 3 หน้า BP เป็น single-page orchestrator

✅ Phase 4: Bill Payment Feature Parity (PRs #128–#133)
   ├─ Task 4.1: Opening Balance System
   ├─ Task 4.2: Transaction Status Model + Data Migration
   ├─ Task 4.3: Workflow Progress Bar + Quick Glance + Balance Cards
   ├─ Task 4.4: Filter Tabs + Pagination + Step 1 Checklist
   ├─ Task 4.5: Auto Commission (useCommission)
   └─ Task 4.6: Quick Actions + Favorites System

✅ Phase 5: Auditor + Owner Enhancements (PRs #134–#136)
   ├─ Task 5.1: Balance Snapshot + Auditor Cash Count + Bank Statement
   ├─ Task 5.2: step1_completed Status + Owner refactor (PR #135, #137)
   │     └─ OwnerApprovalSection → WorkflowStepSummaryCard ทั้ง 3 sections
   └─ Task 5.3: Cash Verification UI → shared CashVerificationTable + Notes always visible

✅ Phase 6: Testing + Migration (PRs #138, #139, #140)
   ├─ Task 6.1: Unit Tests — BP Sub-Components (PR #138)
   ├─ Task 6.2: Integration Tests — ทั้งสอง Service (PR #139)
   └─ Task 6.3: Data Migration Script + Final Review
         ├─ Migration endpoint: POST /api/admin/migrate-bill-payment-status (dry-run + apply)
         ├─ Fix outdated tests: legacy status values (success→completed, failed→cancelled)
         ├─ Fix outdated tests: route expectations (single-page architecture)
         ├─ Code Quality Review: 0 TypeScript errors, all imports verified
         └─ UX Consistency: both services share shared components + patterns
```

### Week 11 (Apr 14-21): Manual Testing — MT-1 + MT-2 Fixes

**PRs**: #142 (release → main), #143–#149

```
✅ MT-1: History Page — ผ่านทั้งหมด (PR #143, #144, #145, #146)
   ├─ Unify status labels + badge colors ระหว่าง MT / BP
   ├─ Pending Inbox card → filter รายการตาม role
   └─ แก้ column header ในตาราง

✅ MT-2 Step 1-6: Transaction Form UX (PR #147, release #148 → main)
   ├─ TransactionForm: lock type switcher, cash/transfer toggle เฉพาะ withdrawal
   ├─ Commission: บังคับ cash สำหรับ transfer/deposit, คง commission=0 (manual) ตอนแก้ไข
   ├─ Detail modal: แสดง commission เสมอ + Bank Reconciliation (before/after/delta)
   ├─ Server: เชื่อ status จาก client (ไม่ auto-draft), รองรับ "cancelled"
   └─ Workflow labels: Auditor → ตรวจสอบ, Owner → อนุมัติ

✅ MT-2 Step 7 + BP Status UX (PR #149)
   ├─ แก้ 401 error ใน BP (apiFetch plugin + summaries API)
   ├─ ลบปุ่ม ⋮ (Status Change Modal) → เปลี่ยนสถานะผ่าน Edit Modal เท่านั้น
   ├─ ช่อง "เหตุผล/หมายเหตุสถานะ" แสดงเมื่อเลือก draft/on_hold/cancelled (ไม่ required)
   └─ Workflow edit gate: แก้ไขรายการได้เฉพาะสถานะ workflow ที่อนุญาต
```

### Week 12 (Oct 16-17, 2026): Project Re-entry — Docs, Tooling & MT-2 Step 8

**PRs**: #150 (docs → main), #151, #152

```
✅ Documentation sync (commit 6f19509 + PR #150)
   ├─ All active .md files verified against code (Nuxt 4, 72 API routes, CI, Firebase config)
   ├─ Completed plans archived to docs/ARCHIVE/
   └─ main received docs only — PR #149 code + test data stay on develop until BP-2 passes

✅ CLAUDE.md + SessionStart hook (PR #151)
   ├─ CLAUDE.md = single source of project facts for Claude Code (replaces private memory)
   ├─ "Keeping docs in sync" rules (STATUS.md / TESTING_PLAN.md / tech docs)
   └─ .claude/hooks/session-status.mjs prints this file's header + testing progress at session start

🔄 MT-2 Step 8 manual test + design decision (PR #152, data 8b5dc73)
   ├─ Tabs / filter / badge passed; pagination not yet tested
   ├─ BUG-001~006 logged in TESTING_PLAN.md (Bug List)
   └─ Owner approved spec docs/REQUIREMENTS/DRAFT_QUEUE_AND_CASH_LOAN.md
       (draft queue for MT + BP, borrow/repay sales cash) — not implemented yet
```

### Week 9 (Mar 23-25): Layout Consistency & Polish

**PRs**: #80, #81, #82, #83, #84, #85

```
✅ Approved State Layout (PR #80)
   └─ All roles (Manager, Auditor, Owner) see consistent layout when approved

✅ Non-Approved States Consistency (PR #82, #83)
   ├─ Task 1: Status banners for step1_in_progress & step1_completed
   │  ├─ Auditor/Owner see blue "waiting" banner during step1
   │  └─ showStatusBanner + statusBannerContent computed fixed
   ├─ Task 2: Cash Count visibility + txnSectionBadge
   │  ├─ Owner can now see Cash Count results at step2_completed
   │  └─ txnSectionBadge shows "กำลังบันทึก" instead of false "สำเร็จ"
   └─ All 4 issues from PLAN_CONSISTENT_LAYOUT_NON_APPROVED resolved

✅ Verification & merge to main (PR #84, #85)
```

---

## Architecture Status

```
Frontend ✅
  ├─ Nuxt 4 + Vue 3 Composition API (<script setup lang="ts">)
  ├─ TypeScript (strict, @ts-nocheck on money-transfer + bill-payment stores)
  ├─ Tailwind CSS (BigT Red #EF3340)
  ├─ Pinia stores (8): auth, ui, sidebar, access-control, sales, money-transfer, bill-payment, daily-record-settings
  ├─ Design System: 14 ui/ + 4 layout/ + 8 shared/ components (auto-imported)
  └─ Composables (13): useLogger, usePermissions, useCommission, useMoneyTransferHelpers, useBillPaymentHelpers, ...

Backend ✅
  ├─ Nuxt Server API (Nitro, node-server preset)
  ├─ Firebase Admin SDK (token verification via requireServerAuth)
  ├─ Repository Pattern — all active repositories are JSON (public/data/); Firestore repos prepared, not wired
  └─ Zod validation (access-control routes)

Auth & RBAC ✅
  ├─ Firebase Auth (email/password)
  ├─ 5 roles: owner, manager, assistant_manager, cashier, auditor
  ├─ Permission-gated ActionButton component + v-can directive
  ├─ middleware/auth on all finance pages
  ├─ PERMISSIONS.EDIT_FINANCE / VIEW_FINANCE
  └─ ⚠️ requireServerAuth on Bill Payment mutations only (Money Transfer routes not yet)

Testing ✅
  ├─ Vitest: 18 files / 280 tests (unit: shared + BP components, store, helpers; integration: MT, BP, cross-service, daily-sales)
  ├─ ⚠️ CI (PR Check) does not run tests yet
  └─ E2E (Playwright): not installed yet

Money Transfer Workflow ✅
  ├─ step1_in_progress → Manager records transactions
  ├─ step1_completed → Manager verifies cash count (Step 2)
  ├─ step2_completed → Auditor reviews (checklist + findings)
  ├─ audited → Owner approves/rejects
  ├─ approved → All roles see consistent read-only layout
  └─ needs_correction → implemented ✅

Bill Payment Workflow ✅ COMPLETE
  ├─ step1_in_progress → Manager records bill payment transactions
  ├─ step1_completed → Manager verifies cash count (Step 2) ✅
  ├─ step2_completed → Auditor reviews + bank statement ✅
  ├─ audited / audited_with_issues → Owner approves ✅
  ├─ approved / approved_with_notes → Done ✅
  └─ needs_correction → Owner can request anytime ✅
```

---

## Key Pages & Components

```
Pages (26 total — 16 functional, 10 placeholders):
  ├─ finance/money-transfer-service/index.vue  — MT orchestrator (~290 lines, 4 role sub-components)
  ├─ finance/money-transfer-history.vue        — MT history & entry point
  ├─ finance/bill-payment-service/index.vue    — BP orchestrator (~215 lines, 4 role sub-components)
  ├─ finance/bill-payment-history.vue          — BP history & entry point
  ├─ sales/daily-sales.vue                     — Daily sales CRUD
  ├─ admin/access-control.vue                  — Roles & permissions
  ├─ admin/users.vue                           — User management
  ├─ settings/daily-record-settings.vue        — Fee/config settings
  ├─ index, login, setup, user/profile, user/account-settings, settings/system-settings
  └─ Placeholders: finance/cash-flow, daily-expenses, monthly-report, sales/sales-report,
     admin/audit-log, roles, system-logs, hr/attendance, overtime, settings/others

Components (49 total):
  ├─ money-transfer/ (10)  — FLOW 2 domain components
  ├─ bill-payment/ (5)     — FLOW 3 domain components
  ├─ shared/ (8)           — WorkflowProgressBar, QuickGlanceSummary, CompactBalanceSummary,
  │                          BalanceSnapshot, CashVerificationTable, TransactionTable,
  │                          WorkflowStepSummaryCard, OwnerDecisionCard
  ├─ ui/ (14)              — Design system components
  ├─ layout/ (4)           — PageWrapper, PageHeader, EmptyState, LoadingState
  └─ root (8)              — Header, Sidebar, Breadcrumb, DailySales* (3), ConfirmDialog, CollapsibleGroup
```

---

## Key Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Pages | 26 (16 functional, 10 placeholders) | ✅ |
| Components | 49 | ✅ |
| API routes | 72 | ✅ |
| PRs merged (latest) | #152 | ✅ |
| TypeScript errors (`nuxt typecheck`) | 0 | ✅ |
| Unit/Integration tests (`vitest run`) | 280/280 passed (18 files) | ✅ |
| Production build (`nuxt build`) | Success | ✅ |
| Money Transfer workflow | 9/9 statuses (unified) | ✅ |
| Bill Payment workflow | Phase 1-6 Complete (27 Tasks) | ✅ |
| Service Harmonization Testing | 1/17 tasks done + MT-2 in progress (Step 8 partial, 6 open bugs) | 🔄 |
| Design System components | 14 ui + 4 layout + 8 shared | ✅ |
| Mobile responsive | Yes | ✅ |
| CI (PR Check / Staging / Production) | All green (Oct 16, 2026) | ✅ |

---

## Remaining / Not Started

```
🔄 Service Harmonization Testing (17 Tasks)
   ├─ Manual Test: 10 tasks (MT-1~4, BP-1~4, SHARED-1~2) 🔄 IN PROGRESS
   │     ├─ MT-1 ✅ ผ่าน
   │     ├─ MT-2 ✅ ผ่าน Step 1-11 (17 ต.ค., บน `feat/draft-queue`) — BUG-007~011 แก้แล้ว; BUG-001~003 ยังเปิด; BUG-002 ยังไม่ได้ทดสอบ
   │     ├─ BP-2 🔄 Step 6 (คิว draft) ✅ ผ่าน 8/8 (19 ต.ค.) — BUG-012 ✅ ทดสอบผ่าน; BUG-013 (ฟอร์มฝากเงินมีช่องชื่อลูกค้า) แก้แล้วรอทดสอบ; ประเภทบิล "ประกัน" → "สินเชื่อ" (`loan`) — ค่าธรรมเนียมยังใช้อัตราเดิมของประกัน (15/25/35/50) รอ Owner ยืนยัน
   │     └─ MT-3, MT-4, BP-1~4, SHARED-1~2 ☐ NOT STARTED
   ├─ Bug Fix: 2 tasks (BugFix-1, BugFix-2)              ☐ WAITING FOR MANUAL TEST
   ├─ E2E Playwright: 5 tasks (E2E-1~5)                   ☐ WAITING FOR BUG FIX
   └─ Testing Plan: docs/PROGRESS/TESTING_PLAN.md ✅ CREATED

📋 Planned — History summary columns (Owner decided 17 ต.ค. 2569; separate PR after the draft-queue PR)
   ├─ Problem: history "ยอดรวม" = Σ amount of completed transfer + withdrawal + owner_deposit,
   │   and "จำนวนรายการ" counts every row (incl. cancelled/draft/deposit) → no picture of the day
   ├─ MT history (`pages/finance/money-transfer-history.vue`): replace จำนวนรายการ/ยอดรวม with
   │   "โอนเงิน N รายการ · ยอด" and "ถอนเงิน N รายการ · ยอด" (completed only; "–" when none) + ค่าบริการ
   ├─ BP history (`pages/finance/bill-payment-history.vue`): same idea — "รับชำระบิล N รายการ · ยอด" + ค่าบริการ
   └─ Owner deposits: NOT shown on history pages — only on that day's detail page

❌ Dashboard & Reports (original Week 5-6 plan)
   ├─ Analytics dashboard
   ├─ Reports page / cash flow reports
   ├─ Charts & graphs
   └─ Export functionality

✅ needs_correction workflow status (implemented in BP + MT)

✅ Dead code cleanup — no `v-if="false"` blocks left in pages/components (MT index.vue split into 4 sub-components, PR #123)

⚠️ Tech debt (found Oct 16, 2026)
   ├─ Money Transfer mutation APIs don't call requireServerAuth (Bill Payment does)
   ├─ PR Check workflow doesn't run `npm test`
   ├─ Firestore migration not started (all data in public/data/*.json)
   ├─ ⚠️ Unverified: production (Cloud Functions `nuxtServer`) may not persist JSON writes —
   │   repositories write to process.cwd()/public/data, and CI deploys Hosting only (not Functions).
   │   Verify on production before the next release.
   └─ Unused deps: vee-validate, radix-vue, @vueuse/core, dayjs, sass-embedded

Phase 2: Google Sheets integration
Phase 3: Monthly/Yearly expenses
Phase 4: HR (schedule, leave, overtime)
```

---

## Test Data Reference

> Snapshot from `public/data/*-summaries.json` on Oct 16, 2026 — changes as you test.

### Money Transfer

| Date | Status | Transactions |
|------|--------|-------------|
| 2026-03-11 | `step1_in_progress` | 3 (completed 3) |
| 2026-03-10 | `step2_completed` | 10 (completed 9, cancelled 1) |
| 2026-03-09 | `step2_completed` | 5 (completed 5) |
| 2026-03-08 | `step1_completed` | 5 (completed 5) |
| 2026-03-04 | `approved` | 2 (completed 2) |
| 2026-02-27 | `approved` | 6 (completed 6) |
| — | `audited` / `audited_with_issues` / `needs_correction` | No test data |

### Bill Payment

| Date | Status | Transactions |
|------|--------|-------------|
| 2026-04-01 | `step1_in_progress` | 1 (cancelled 1) |
| 2026-01-31 | `approved` | 4 (completed 3, cancelled 1) |
| 2026-01-30 | `step2_completed` | 1 (completed 1) |
| 2026-01-29 | `approved` | 4 (completed 3, cancelled 1) |
| — | `step1_completed` / `audited` / `needs_correction` | No test data |
