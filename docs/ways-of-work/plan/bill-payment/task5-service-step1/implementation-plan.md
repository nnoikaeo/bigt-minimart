# Implementation Plan — Task 5: Bill Payment Service Page Shell + Step 1

## Goal

Create `pages/finance/bill-payment-service/index.vue` for FLOW 3.
This page is the Manager's workspace for recording bill payment transactions (Step 1) and verifying cash counts (Step 2). Task 5 covers the page shell and Step 1 only. The page is query-param driven (`?date=YYYY-MM-DD`) and mirrors the money-transfer-service page architecture, adapted for the 3-balance bill payment model.

---

## Requirements

- **Page shell**: `PageWrapper` + `PageHeader`, back button → `/finance/bill-payment-history`, date picker in `#actions` slot
- **Query param**: `?date=YYYY-MM-DD` drives all data fetching on mount and date change
- **Backdated warning**: `BaseAlert` banner when `selectedDate < today`
- **`needs_correction` banner**: red `BaseAlert` showing `currentSummary.correctionNotes` when status is `needs_correction`
- **Step 1 section** (visible when `workflowStatus === 'step1_in_progress' || 'needs_correction'`):
  - 3 balance cards: Bank Account, Bill Payment Cash, Service Fee Cash
  - Transaction table with edit/delete per row (drafts only)
  - "รายการใหม่" → `BaseModal` form
  - `ConfirmDialog` for delete
  - "ไปขั้นตอนที่ 2 →" button (requires ≥1 transaction) → `store.completeStep1(date)`
- **Read-only view** when Step 1 is already complete (later workflow states)
- **Auth**: `middleware: 'auth'`, `PERMISSIONS.EDIT_FINANCE` for mutations

---

## Technical Considerations

### System Architecture Overview

```mermaid
graph TD
  subgraph Frontend
    Page[bill-payment-service/index.vue]
    Store[stores/bill-payment.ts]
    Helpers[composables/useBillPaymentHelpers.ts]
    Page --> Store
    Page --> Helpers
  end
  subgraph API
    TxnAPI[/api/bill-payment/transactions]
    SummaryAPI[/api/bill-payment/summaries/:date]
    BalanceAPI[/api/bill-payment/balances/:date]
  end
  Store --> TxnAPI
  Store --> SummaryAPI
  Store --> BalanceAPI
```

### Frontend Architecture

#### Component Hierarchy

```
pages/finance/bill-payment-service/index.vue
├── PageWrapper (title, loading, error, #actions slot)
│   ├── #actions: BaseButton (back) + input[type=date]
│   └── default:
│       ├── BaseAlert (success)
│       ├── BaseAlert (error)
│       ├── BaseAlert (backdated warning) — conditional
│       ├── BaseAlert (needs_correction banner) — conditional
│       │
│       ├── [STEP 1 SECTION] v-if="isStep1Active"
│       │   ├── Balance Cards (3x div.grid)
│       │   │   ├── Card: Bank Account (store.currentBalance?.bankAccount)
│       │   │   ├── Card: Bill Payment Cash (store.currentBalance?.billPaymentCash)
│       │   │   └── Card: Service Fee Cash (store.currentBalance?.serviceFeeCash)
│       │   │
│       │   ├── Transaction Table section
│       │   │   ├── Header: title + "รายการใหม่" ActionButton
│       │   │   ├── EmptyState (v-if no transactions)
│       │   │   └── table > tbody > tr (v-for transactions)
│       │   │       ├── #: index
│       │   │       ├── ประเภท: formatTransactionType + formatBillType badge
│       │   │       ├── ลูกค้า: customerName or '-'
│       │   │       ├── จำนวนเงิน: formatAmount(amount)
│       │   │       ├── ค่าธรรมเนียม: formatAmount(commission) or '-'
│       │   │       ├── สถานะ: BaseBadge (success/failed)
│       │   │       ├── เวลา: formatTime(timestamp)
│       │   │       └── Actions: PencilIcon (edit) + TrashIcon (delete)
│       │   │
│       │   └── Footer: "ไปขั้นตอนที่ 2 →" BaseButton
│       │
│       └── [READ-ONLY SECTION] v-else (step1 complete)
│           └── Summary of completed Step 1 transactions (table, no edit)
│
├── BaseModal (showTransactionModal) — Add/Edit form
│   ├── Type radio: bill_payment / owner_deposit
│   ├── BillType select (v-if bill_payment)
│   ├── FormField: amount (BaseInput number)
│   ├── FormField: commission (v-if bill_payment, BaseInput number)
│   ├── FormField: customerName (BaseInput text, optional)
│   ├── Status radio: success / failed
│   └── FormField: notes (BaseTextarea, optional)
│
└── ConfirmDialog (showDeleteConfirm) — Delete transaction
```

#### Key Reactive State Variables

```ts
// ─── Page state ───────────────────────────────────────────────────────────────
const selectedDate = ref<string>(route.query.date as string || today)
const successMessage = ref('')
const errorMessage = ref('')

// ─── Modal state ─────────────────────────────────────────────────────────────
const showTransactionModal = ref(false)
const editingTransaction = ref<BillPaymentTransaction | null>(null)
const showDeleteConfirm = ref(false)
const deletingTransactionId = ref('')

// ─── Form state ───────────────────────────────────────────────────────────────
const form = reactive({
  transactionType: '' as 'bill_payment' | 'owner_deposit' | '',
  billType: '' as 'utility' | 'telecom' | 'insurance' | 'other' | '',
  amount: '' as number | '',
  commission: '' as number | '',
  customerName: '',
  status: 'success' as 'success' | 'failed',
  notes: '',
})
const formErrors = ref<string[]>([])
const isSubmittingForm = ref(false)

// ─── Step 1 completion ────────────────────────────────────────────────────────
const isCompletingStep1 = ref(false)
```

#### Key Computed Values

```ts
const today = new Date().toISOString().split('T')[0] ?? ''
const isBackdated = computed(() => selectedDate.value < today)
const workflowStatus = computed(() => store.getCurrentWorkflowStatus)
const isStep1Active = computed(() =>
  workflowStatus.value === 'step1_in_progress' ||
  workflowStatus.value === 'needs_correction'
)
const isNeedsCorrection = computed(() => workflowStatus.value === 'needs_correction')
const dateTransactions = computed(() => store.getTransactionsByDate(selectedDate.value))
const canCompleteStep1 = computed(() => dateTransactions.value.length > 0 && !isCompletingStep1.value)
```

#### Sequence of Implementation Steps

1. **Page scaffolding**: `definePageMeta`, imports, `useLogger`, `usePermissions`, store, helpers
2. **Reactive state**: all refs/reactives listed above
3. **Computed values**: workflow status, transactions, canCompleteStep1, isBackdated
4. **`onMounted` data loading**: `fetchTransactionsByDate` + `fetchDailySummary` + `fetchBalanceByDate`
5. **`handleDateChange`**: update URL query param, re-fetch data
6. **Form open/close**: `openNewTransaction()`, `openEditTransaction(txn)`, `closeModal()`, `resetForm()`
7. **`handleFormSubmit()`**: validate → `createTransaction` or `updateTransaction` → success message
8. **`handleDeleteConfirm(id)`**: set `deletingTransactionId`, show confirm dialog
9. **`handleDeleteExecute()`**: `deleteDraftTransaction` → success message → close confirm
10. **`handleCompleteStep1()`**: guard (≥1 txn), call `store.completeStep1(date)` → navigate to history on success
11. **Template**: render all sections per hierarchy above

---

## Security

- All mutation buttons wrapped in `<ActionButton :permission="PERMISSIONS.EDIT_FINANCE">`
- No `v-html` usage
- Form data sanitized via `validateTransactionForm` before submission
