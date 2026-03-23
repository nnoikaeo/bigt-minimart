<script setup lang="ts">
import { useMoneyTransferStore } from '~/stores/money-transfer'
import { useDailyRecordSettingsStore } from '~/stores/daily-record-settings'
import { useLogger } from '~/composables/useLogger'
import { usePermissions } from '~/composables/usePermissions'
import { PERMISSIONS, ROLES } from '~/types/permissions'
import { BANK_LIST } from '~/constants/banks'
import {
  PlusIcon,
  StarIcon,
  BanknotesIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline'

definePageMeta({
  middleware: 'auth',
})

const logger = useLogger('MoneyTransferStep1')
const store = useMoneyTransferStore()
const settingsStore = useDailyRecordSettingsStore()
const router = useRouter()
const route = useRoute()
const { can, hasAnyRole } = usePermissions()

// true = ยังไม่เคยตั้งค่าค่าบริการ (ใช้ค่าเริ่มต้น)
const usingDefaultFees = computed(() => settingsStore.moneyTransferFees.updatedAt === null)

// ─── Auth ────────────────────────────────────────────────────────────────────
const { currentUser } = useCurrentUser()

// ─── State ───────────────────────────────────────────────────────────────────
const selectedDate = ref<string>(
  (route.query.date as string) || (new Date().toISOString().split('T')[0] ?? '')
)
const activeFilter = ref<'all' | 'completed' | 'draft' | 'failed'>('all')
const successMessage = ref('')
const errorMessage = ref('')
// Modal visibility
const showTransactionModal = ref(false)
const showFavoriteModal = ref(false)
const showOwnerDepositModal = ref(false)
const showDetailModal = ref(false)
const showDeleteConfirm = ref(false)

// Modal data
const editingTransaction = ref<any>(null)
const viewingTransaction = ref<any>(null)
const deletingTransactionId = ref<string>('')
const presetType = ref<'transfer' | 'withdrawal' | 'owner_deposit' | ''>('')

// Favorite Transfer modal state
const favStep = ref<1 | 2>(1)
const selectedFavorite = ref<any>(null)
const favAmount = ref<number>(0)
const favCommissionType = ref<'cash' | 'transfer'>('cash')
const {
  isManual: favIsCommissionManual,
  manualValue: favManualCommission,
  effectiveCommission: favEffectiveCommission,
  reset: resetFavCommission,
} = useCommission(favAmount)

// Owner Deposit modal state
const ownerDepositAmount = ref<number>(0)
const ownerDepositNotes = ref('')
const ownerDepositTime = ref(new Date().toTimeString().slice(0, 5))
const isOwnerDepositSubmitting = ref(false)

// Completing step 1
const isCompletingStep1 = ref(false)

// ─── Shared submitting flag (auditor + owner actions) ─────────────────────────
const isSubmittingAction = ref(false)

// ─── Auditor State ────────────────────────────────────────────────────────────
const txnIssueStatus = ref<Record<string, true>>({})
const auditorCashTransferWithdrawal = ref<number | null>(null)
const auditorCashServiceFee = ref<number | null>(null)
const bankStatementAmount = ref<number>(0)
const issueDetails = ref('')
const showAuditorTransactions = ref(false)
const showAuditorTxnsReadonly = ref(false)
const showAuditApproveConfirm = ref(false)
const showAuditRejectConfirm = ref(false)
const showVerifyModal = ref(false)
const verifyingTransaction = ref<any>(null)

// ─── Owner State ──────────────────────────────────────────────────────────────
const expandStep1Owner = ref(false)
const expandStep2Owner = ref(false)
const expandAuditOwner = ref(false)
const decision = ref<'approve' | 'approve_with_notes' | 'request_correction' | ''>('')
const ownerNotes = ref('')
const correctionReason = ref('')
const showOwnerApproveConfirm = ref(false)
const showOwnerRejectConfirm = ref(false)

// ─── Sticky Action Buttons (mobile) ──────────────────────────────────────────
const auditorActionsRef = ref<HTMLElement | null>(null)
const ownerActionsRef = ref<HTMLElement | null>(null)
const isAuditorActionsVisible = ref(true)
const isOwnerActionsVisible = ref(true)
let stickyObserver: IntersectionObserver | null = null

// ─── Step 2: Cash Counting ────────────────────────────────────────────────────
const actualTransferWithdrawal = ref<number>(0)
const actualServiceFee = ref<number>(0)
const verificationStatus = ref<'match' | 'discrepancy' | ''>('')
const verificationNotes = ref('')
const followUpAction = ref('')
const isSubmittingStep2 = ref(false)

// ─── Opening Balance ──────────────────────────────────────────────────────────
const showOpeningBalanceModal = ref(false)
const openingSource = ref<'carryover' | 'manual'>('carryover')
const manualOpeningAmount = ref<number>(0)
const isSettingOpeningBalance = ref(false)

// ─── Favorite Transfer: tab / manage / form state ──────────────────────────
const favTab = ref<1 | 2 | 3 | 4 | 5>(1)
const favMode = ref<'select' | 'manage' | 'add' | 'edit'>('select')
const favFormData = ref({ name: '', channel: 'promptpay' as 'promptpay' | 'bank', identifier: '', identifierType: 'phone' as string, bankName: '' })
const editingFavoriteId = ref<string>('')
const deletingFavoriteId = ref<string>('')
const isSavingFavorite = ref(false)

// ─── Filter Tabs ─────────────────────────────────────────────────────────────
const filterTabs = [
  { label: 'ทั้งหมด', value: 'all' as const },
  { label: 'สำเร็จ', value: 'completed' as const },
  { label: 'รอดำเนินการ', value: 'draft' as const },
  { label: 'ล้มเหลว', value: 'failed' as const },
]

// ─── Computed ─────────────────────────────────────────────────────────────────
const canEdit = computed(() => can(PERMISSIONS.EDIT_FINANCE))

// ─── Role & Workflow ───────────────────────────────────────────────────────────
const isManagerOrAsst = computed(() =>
  hasAnyRole([ROLES.MANAGER, ROLES.ASSISTANT_MANAGER])
)
const isAuditor = computed(() => hasAnyRole([ROLES.AUDITOR]))
const isOwner = computed(() => hasAnyRole([ROLES.OWNER]))
const isApproved = computed(() => store.isApproved)
const workflowStatus = computed(() => store.getCurrentWorkflowStatus)
/** Transaction table collapsed by default for Owner (always) and Auditor (when step2 complete — they have their own txn list in audit form) */
const shouldCollapseTxnTable = computed(() => isOwner.value || (isAuditor.value && store.isStep2Complete))
const isStep1InProgress = computed(() => workflowStatus.value === 'step1_in_progress')

/** Quick Actions: เฉพาะ Manager/AM ขณะ step1_in_progress */
const showQuickActions = computed(() => isManagerOrAsst.value && isStep1InProgress.value)
/** Section 6: แสดงเมื่อ workflow ผ่าน step1_in_progress แล้ว */
const showCashCountSection = computed(() => !isStep1InProgress.value)
/** Step 2 form: Manager/AM + step2 ยังไม่เสร็จ */
const canEditCashCount = computed(() => isManagerOrAsst.value && !store.isStep2Complete)

/** Opening balance has been set for the selected date */
const isOpeningSet = computed(() => store.currentBalance?.openingBalanceSource != null)

/** Can add transactions: opening set AND Step 1 not yet completed */
const canAddTransaction = computed(() => isOpeningSet.value && !store.isStep1Complete)

/** All prerequisites met — user should click the complete button */
const canCompleteStep1 = computed(
  () => isOpeningSet.value && todayStats.value.total > 0 && !hasDrafts.value
)

/** bankAccount from previous day (pre-fills carry-over option) */
const carryoverAmount = computed(() => store.previousDayBalance?.bankAccount ?? 0)

const dateTransactions = computed(() =>
  store.getTransactionsByDate(selectedDate.value)
)

// ─── Balance breakdown computed ────────────────────────────────────────────────
const totalDeposits = computed(() =>
  dateTransactions.value
    .filter((t: any) => t.transactionType === 'owner_deposit' && t.status === 'completed')
    .reduce((sum: number, t: any) => sum + t.amount, 0)
)
const totalTransfers = computed(() =>
  dateTransactions.value
    .filter((t: any) => t.transactionType === 'transfer' && t.status === 'completed')
    .reduce((sum: number, t: any) => sum + t.amount, 0)
)
const totalWithdrawals = computed(() =>
  dateTransactions.value
    .filter((t: any) => t.transactionType === 'withdrawal' && t.status === 'completed')
    .reduce((sum: number, t: any) => sum + t.amount, 0)
)
/** รวมเงินสด = โอน - ถอน + ค่าบริการ(เงินสด) */
const totalCash = computed(() =>
  totalTransfers.value - totalWithdrawals.value + (store.currentBalance?.serviceFeeCash ?? 0)
)

const filteredTransactions = computed(() => {
  if (activeFilter.value === 'all') return dateTransactions.value
  return dateTransactions.value.filter((t: any) => t.status === activeFilter.value)
})

// ─── Pagination ────────────────────────────────────────────────────────────────
const currentPage = ref(1)
const PAGE_SIZE = 10
const totalPages = computed(() => Math.max(1, Math.ceil(filteredTransactions.value.length / PAGE_SIZE)))
const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredTransactions.value.slice(start, start + PAGE_SIZE)
})
watch([activeFilter, selectedDate], () => { currentPage.value = 1 })

const draftTransactions = computed(() =>
  dateTransactions.value.filter((t: any) => t.status === 'draft')
)

const hasDrafts = computed(() => draftTransactions.value.length > 0)

const todayStats = computed(() => {
  const txns = dateTransactions.value
  return {
    total: txns.length,
    completed: txns.filter((t: any) => t.status === 'completed').length,
    drafts: txns.filter((t: any) => t.status === 'draft').length,
    totalCommission: txns
      .filter((t: any) => t.status === 'completed' && t.transactionType !== 'owner_deposit')
      .reduce((sum: number, t: any) => sum + (t.commission || 0), 0),
  }
})

function getTabCount(status: string): number {
  if (status === 'all') return dateTransactions.value.length
  return dateTransactions.value.filter((t: any) => t.status === status).length
}

// ─── Step 2 Computed ──────────────────────────────────────────────────────────
const completedTransactions = computed(() =>
  dateTransactions.value.filter((t: any) => t.status === 'completed')
)

const expectedTransferWithdrawal = computed(() =>
  completedTransactions.value
    .filter((t: any) => t.transactionType !== 'owner_deposit')
    .reduce((sum: number, t: any) => {
      if (t.transactionType === 'transfer') return sum + t.amount
      if (t.transactionType === 'withdrawal') return sum - t.amount
      return sum
    }, 0)
)

const expectedServiceFee = computed(() =>
  completedTransactions.value
    .filter((t: any) => t.commission && t.commissionType === 'cash')
    .reduce((sum: number, t: any) => sum + (t.commission || 0), 0)
)

const expectedServiceFeeTransfer = computed(() =>
  completedTransactions.value
    .filter((t: any) => t.commission && t.commissionType === 'transfer')
    .reduce((sum: number, t: any) => sum + (t.commission || 0), 0)
)

const expectedTotal = computed(() => expectedTransferWithdrawal.value + expectedServiceFee.value)
const actualTotal = computed(() => Number(actualTransferWithdrawal.value) + Number(actualServiceFee.value))
const diffTransferWithdrawal = computed(() => Number(actualTransferWithdrawal.value) - expectedTransferWithdrawal.value)
const diffServiceFee = computed(() => Number(actualServiceFee.value) - expectedServiceFee.value)
const diffTotal = computed(() => actualTotal.value - expectedTotal.value)
const hasDiscrepancy = computed(() => diffTotal.value !== 0)

const isStep2FormValid = computed(() =>
  Number(actualTransferWithdrawal.value) >= 0 &&
  Number(actualServiceFee.value) >= 0 &&
  verificationStatus.value !== ''
)

// Auto-set verificationStatus when actual values change
watch(hasDiscrepancy, (val) => {
  if (actualTotal.value > 0) {
    verificationStatus.value = val ? 'discrepancy' : 'match'
  }
})

/** Favorites for the currently selected tab, sorted by order */
const favTabItems = computed(() =>
  (store.favorites as any[])
    .filter(f => f.tab === favTab.value)
    .sort((a: any, b: any) => a.order - b.order)
)

/** True when the current tab already has 10 favorites */
const favTabFull = computed(() => favTabItems.value.length >= 10)


/** Banner info สำหรับ Favorite Transfer — mirror pattern เดียวกับ bannerInfo ใน TransactionForm */
const favBannerInfo = computed(() => {
  const balance = store.currentBalance?.bankAccount ?? 0
  const amount = Number(favAmount.value)
  return {
    balanceLabel: 'ยอดเงินในบัญชี',
    current: balance,
    after: balance - amount,
    ok: balance >= amount,
  }
})

const isInsufficientFunds = computed(() => Number(favAmount.value) > 0 && !favBannerInfo.value.ok)

const ownerDepositBalanceAfter = computed(() => {
  const balance = store.currentBalance?.bankAccount ?? 0
  return balance + ownerDepositAmount.value
})

// ─── Auditor Computed ─────────────────────────────────────────────────────────
/** Transactions visible to auditor (completed + failed) */
const auditTransactionList = computed(() =>
  dateTransactions.value.filter((t: any) => t.status === 'completed' || t.status === 'failed')
)
const txnsWithIssues = computed(() => Object.keys(txnIssueStatus.value).length)
const canSubmitAudit = computed(() =>
  auditorCashTransferWithdrawal.value !== null && auditorCashServiceFee.value !== null
)
const openingBalance = computed(() => store.currentBalance?.openingBalance ?? 0)
const closingBalance = computed(() =>
  store.currentSummary?.step1?.finalBalances?.bankAccount ?? store.currentBalance?.bankAccount ?? 0
)
const closingTransferCash = computed(() =>
  store.currentSummary?.step1?.finalBalances?.transferCash ?? store.currentBalance?.transferCash ?? 0
)
const closingServiceFeeCash = computed(() =>
  store.currentSummary?.step1?.finalBalances?.serviceFeeCash ?? store.currentBalance?.serviceFeeCash ?? 0
)
const step2Data = computed(() => store.currentSummary?.step2)
const managerStep1Data = computed(() => store.currentSummary?.step1)
const auditData = computed(() => store.currentSummary?.auditorVerification)
const auditorDiffTransferWithdrawal = computed(() =>
  auditorCashTransferWithdrawal.value !== null
    ? auditorCashTransferWithdrawal.value - expectedTransferWithdrawal.value
    : null
)
const auditorDiffServiceFee = computed(() =>
  auditorCashServiceFee.value !== null
    ? auditorCashServiceFee.value - expectedServiceFee.value
    : null
)
const auditorCashTotal = computed(() =>
  (auditorCashTransferWithdrawal.value ?? 0) + (auditorCashServiceFee.value ?? 0)
)
const auditorDiffTotal = computed(() =>
  auditorDiffTransferWithdrawal.value !== null || auditorDiffServiceFee.value !== null
    ? (auditorDiffTransferWithdrawal.value ?? 0) + (auditorDiffServiceFee.value ?? 0)
    : null
)
const bankBalanceDiff = computed(() => bankStatementAmount.value - closingBalance.value)

// ─── Owner Computed ───────────────────────────────────────────────────────────
const step1FinalBalances = computed(() => store.currentSummary?.step1?.finalBalances)
const auditResultLabel = computed(() => {
  const result = auditData.value?.auditResult
  if (result === 'no_issues') return { text: 'ไม่พบปัญหา', colorClass: 'text-green-700', containerClass: 'bg-green-50 border-green-200 text-green-700' }
  if (result === 'minor_issues') return { text: 'พบปัญหาเล็กน้อย', colorClass: 'text-yellow-700', containerClass: 'bg-yellow-50 border-yellow-200 text-yellow-700' }
  if (result === 'major_issues') return { text: 'พบปัญหาสำคัญ', colorClass: 'text-red-700', containerClass: 'bg-red-50 border-red-200 text-red-700' }
  return { text: 'ตรวจสอบแล้ว', colorClass: 'text-blue-700', containerClass: 'bg-blue-50 border-blue-200 text-blue-700' }
})
const canApprove = computed(() =>
  decision.value !== '' &&
  (decision.value !== 'approve_with_notes' || ownerNotes.value.trim() !== '') &&
  (decision.value !== 'request_correction' || correctionReason.value.trim() !== '')
)
const totalCommission = computed(() =>
  dateTransactions.value
    .filter((t: any) => t.status === 'completed' && t.transactionType !== 'owner_deposit')
    .reduce((sum: number, t: any) => sum + (t.commission || 0), 0)
)
const successCount = computed(() =>
  dateTransactions.value.filter((t: any) => t.status === 'completed').length
)
const failedCount = computed(() =>
  dateTransactions.value.filter((t: any) => t.status === 'failed').length
)

// ─── Helpers ─────────────────────────────────────────────────────────────────
const {
  formatCurrency,
  formatTime,
  formatDatetime,
  getTransactionTypeLabel,
  getChannelLabel,
  getStatusBadgeVariant,
  getStatusLabel,
  getAccountName,
  getChannelSubtitle,
  formatDiff,
} = useMoneyTransferHelpers()

// ─── CollapsibleSection Summary Computed ──────────────────────────────────────
const txnSectionBadge = computed(() => ({
  label: hasDrafts.value ? '⚠️ มี Draft' : '✅ สำเร็จ',
  variant: hasDrafts.value ? 'warning' as const : 'success' as const,
}))

const txnSectionSummary = computed(() =>
  `${todayStats.value.total} รายการ · สำเร็จ ${todayStats.value.completed} · ค่าบริการ ${formatCurrency(totalCommission.value)}`
)

const cashVerificationSummary = computed(() => {
  const expected = expectedTotal.value
  const hasDiscrep = store.currentSummary?.step2?.hasDiscrepancies
  return `คาดไว้ ${formatCurrency(expected)} · ${hasDiscrep ? 'มีผลต่าง' : 'ตรงกัน'}`
})

const auditResultSummary = computed(() => {
  const issues = store.currentSummary?.auditorVerification?.transactionsWithIssues ?? 0
  return issues > 0 ? `${issues} รายการมีปัญหา` : 'ไม่พบปัญหา · ยอดตรงกัน'
})

// ─── Status Banner Computed ──────────────────────────────────────────────────
const showStatusBanner = computed(() => {
  if (isApproved.value) return false
  if (isManagerOrAsst.value && !isStep1InProgress.value && !canEditCashCount.value) return true
  if (isAuditor.value && (store.isAudited || !store.isStep2Complete)) return true
  if (isOwner.value && !store.isAudited) return true
  return false
})

const statusBannerContent = computed(() => {
  const ws = workflowStatus.value
  if (ws === 'step1_in_progress') return {
    title: '⏳ Manager กำลังบันทึกรายการ',
    description: 'Manager/AM กำลังบันทึกรายการโอนเงินประจำวัน',
    classes: 'border-blue-200 bg-blue-50 text-blue-800',
    icon: ClockIcon,
  }
  if (ws === 'step1_completed') return {
    title: '⏳ รอ Manager ตรวจนับเงินสด',
    description: 'Manager/AM กำลังดำเนินการตรวจนับเงินสด (Step 2)',
    classes: 'border-blue-200 bg-blue-50 text-blue-800',
    icon: ClockIcon,
  }
  if (ws === 'step2_completed') return {
    title: '⏳ รอ Auditor ตรวจสอบ',
    description: 'รายการนี้อยู่ระหว่างรอการตรวจสอบจาก Auditor',
    classes: 'border-orange-200 bg-orange-50 text-orange-800',
    icon: ClockIcon,
  }
  if (ws === 'audited' && !isOwner.value) return {
    title: '⏳ รอ Owner อนุมัติ',
    description: 'รายการนี้ผ่านการตรวจสอบแล้ว อยู่ระหว่างรอ Owner อนุมัติ',
    classes: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    icon: ClockIcon,
  }
  if (ws === 'approved') return {
    title: '✅ อนุมัติแล้ว',
    description: 'อนุมัติโดย Owner',
    classes: 'border-green-200 bg-green-50 text-green-800',
    icon: CheckCircleIcon,
  }
  return null
})

// ─── Sticky Action Bar (mobile) ─────────────────────────────────────────────
const showStickyAuditorActions = computed(() =>
  isAuditor.value && store.isStep2Complete && !store.isAudited && !isAuditorActionsVisible.value
)
const showStickyOwnerActions = computed(() =>
  isOwner.value && store.isAudited && !store.isApproved && !isOwnerActionsVisible.value
)

function canCompleteDraft(draft: any): boolean {
  return (store.currentBalance?.bankAccount ?? 0) >= draft.amount
}

function getShortfall(draft: any): number {
  return Math.max(0, draft.amount - (store.currentBalance?.bankAccount ?? 0))
}

function diffClass(diff: number): string {
  if (diff === 0) return 'text-green-700'
  if (diff > 0) return 'text-blue-700'
  return 'text-red-700'
}

function diffSign(diff: number): string {
  if (diff > 0) return '+' + formatCurrency(diff)
  if (diff < 0) return formatCurrency(diff)
  return '✓ ตรง'
}

// ─── Actions ──────────────────────────────────────────────────────────────────
async function handleDateChange() {
  // Reset auditor state
  txnIssueStatus.value = {}
  auditorCashTransferWithdrawal.value = null
  auditorCashServiceFee.value = null
  bankStatementAmount.value = 0
  issueDetails.value = ''
  showAuditorTransactions.value = false
  showAuditorTxnsReadonly.value = false
  // Reset owner state
  decision.value = ''
  ownerNotes.value = ''
  correctionReason.value = ''
  expandStep1Owner.value = false
  try {
    await store.fetchTransactionsByDate(selectedDate.value)
    await store.fetchBalanceByDate(selectedDate.value)
    await store.fetchPreviousDayBalance(selectedDate.value)
    await store.initDailySummary(selectedDate.value)
    await store.fetchDailySummary(selectedDate.value)
    loadExistingStep2Data()
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล'
  }
}

function openNewTransactionModal(preset: 'transfer' | 'withdrawal' | 'owner_deposit' | '' = '') {
  editingTransaction.value = null
  presetType.value = preset
  showTransactionModal.value = true
}

function openEditModal(transaction: any) {
  editingTransaction.value = transaction
  presetType.value = ''
  showTransactionModal.value = true
}

function openDetailModal(transaction: any) {
  viewingTransaction.value = transaction
  showDetailModal.value = true
}

async function openFavoriteModal() {
  favStep.value = 1
  selectedFavorite.value = null
  favAmount.value = 0
  resetFavCommission()
  favCommissionType.value = 'cash'
  favTab.value = 1
  favMode.value = 'select'
  deletingFavoriteId.value = ''
  showFavoriteModal.value = true
  await store.loadFavorites()
}

function openOpeningBalanceModal() {
  openingSource.value = 'carryover'
  manualOpeningAmount.value = 0
  showOpeningBalanceModal.value = true
}

async function handleSetOpeningBalance() {
  const amount = Number(
    openingSource.value === 'carryover' ? carryoverAmount.value : manualOpeningAmount.value
  )
  isSettingOpeningBalance.value = true
  try {
    await store.setOpeningBalance(selectedDate.value, amount, openingSource.value, currentUser.value.uid)
    showOpeningBalanceModal.value = false
    successMessage.value = `กำหนดยอดเงินเริ่มต้น ${formatCurrency(amount)} สำเร็จ`
    logger.log('Opening balance set', { amount, source: openingSource.value })
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to set opening balance', err)
  } finally {
    isSettingOpeningBalance.value = false
  }
}

function openOwnerDepositModal() {
  ownerDepositAmount.value = 0
  ownerDepositNotes.value = ''
  ownerDepositTime.value = new Date().toTimeString().slice(0, 5)
  showOwnerDepositModal.value = true
}

function selectFavorite(fav: any) {
  selectedFavorite.value = fav
  favStep.value = 2
  favAmount.value = 0
  resetFavCommission()
  favCommissionType.value = 'cash'
}

function openAddFavoriteForm() {
  favFormData.value = { name: '', channel: 'bank', identifier: '', identifierType: 'phone', bankName: '' }
  editingFavoriteId.value = ''
  favMode.value = 'add'
}

function openEditFavoriteForm(fav: any) {
  favFormData.value = {
    name: fav.name,
    channel: fav.channel,
    identifier: fav.identifier,
    identifierType: fav.identifierType ?? 'phone',
    bankName: fav.bankName ?? '',
  }
  editingFavoriteId.value = fav.id
  favMode.value = 'edit'
}

async function handleSaveFavorite() {
  if (!favFormData.value.name.trim() || !favFormData.value.identifier.trim()) return
  isSavingFavorite.value = true
  try {
    if (favMode.value === 'edit' && editingFavoriteId.value) {
      await store.updateFavorite(editingFavoriteId.value, {
        name: favFormData.value.name.trim(),
        channel: favFormData.value.channel,
        identifier: favFormData.value.identifier.trim(),
        identifierType: favFormData.value.identifierType as any,
        bankName: favFormData.value.bankName?.trim() || undefined,
      })
      successMessage.value = 'แก้ไขบัญชีโปรดสำเร็จ'
    } else {
      await store.addFavorite({
        tab: favTab.value,
        order: favTabItems.value.length + 1,
        name: favFormData.value.name.trim(),
        channel: favFormData.value.channel,
        identifier: favFormData.value.identifier.trim(),
        identifierType: favFormData.value.identifierType as any,
        bankName: favFormData.value.bankName?.trim() || undefined,
      })
      successMessage.value = 'เพิ่มบัญชีโปรดสำเร็จ'
    }
    favMode.value = 'manage'
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
  } finally {
    isSavingFavorite.value = false
  }
}

async function confirmDeleteFavorite() {
  if (!deletingFavoriteId.value) return
  isSavingFavorite.value = true
  try {
    await store.deleteFavorite(deletingFavoriteId.value)
    deletingFavoriteId.value = ''
    successMessage.value = 'ลบบัญชีโปรดสำเร็จ'
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
  } finally {
    isSavingFavorite.value = false
  }
}

async function handleSubmitFavorite() {
  if (!selectedFavorite.value || favAmount.value <= 0) return
  try {
    const fav = selectedFavorite.value
    const data: Record<string, any> = {
      date: selectedDate.value,
      datetime: new Date().toISOString(),
      transactionType: 'transfer',
      channel: fav.channel,
      amount: Number(favAmount.value),
      commission: favEffectiveCommission.value,
      commissionType: favCommissionType.value,
      destinationName: fav.name,
      destinationIdentifier: fav.identifier,
      accountName: fav.name,
      recordedBy: currentUser.value.uid,
      recordedByName: currentUser.value.displayName,
      status: isInsufficientFunds.value ? 'draft' : 'completed',
      draftReason: isInsufficientFunds.value ? 'insufficient_funds' : undefined,
    }
    if (fav.channel === 'bank') {
      data.bankName = fav.bankName ?? ''
      data.accountNumber = fav.identifier
    } else if (fav.channel === 'promptpay') {
      data.promptpayIdentifier = fav.identifier
      data.promptpayIdentifierType = fav.identifierType ?? 'phone'
    }
    await store.createTransaction(data)
    successMessage.value = isInsufficientFunds.value
      ? 'บันทึกเป็น Draft (ยอดเงินไม่เพียงพอ)'
      : 'บันทึกรายการโอนเงินสำเร็จ'
    showFavoriteModal.value = false
    await store.fetchTransactionsByDate(selectedDate.value)
    logger.log('Favorite transfer created')
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to create favorite transfer', err)
  }
}

async function handleSubmitOwnerDeposit() {
  if (ownerDepositAmount.value <= 0) return
  isOwnerDepositSubmitting.value = true
  try {
    const data = {
      date: selectedDate.value,
      datetime: new Date(`${selectedDate.value}T${ownerDepositTime.value}`).toISOString(),
      transactionType: 'owner_deposit',
      amount: ownerDepositAmount.value,
      commission: 0,
      notes: ownerDepositNotes.value,
      recordedBy: currentUser.value.uid,
      recordedByName: currentUser.value.displayName,
      status: 'completed',
    }
    await store.createTransaction(data)
    successMessage.value = 'บันทึกการฝากเงินของเจ้าของสำเร็จ'
    showOwnerDepositModal.value = false
    await store.fetchTransactionsByDate(selectedDate.value)
    logger.log('Owner deposit created')
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to create owner deposit', err)
  } finally {
    isOwnerDepositSubmitting.value = false
  }
}

async function handleSubmitTransaction(transactionData: any) {
  try {
    if (editingTransaction.value?.id) {
      await store.updateTransaction(editingTransaction.value.id, transactionData)
      successMessage.value = 'อัปเดตรายการสำเร็จ'
    } else {
      await store.createTransaction({
        ...transactionData,
        date: selectedDate.value,
        recordedBy: currentUser.value.uid,
        recordedByName: currentUser.value.displayName,
      })
      successMessage.value = 'บันทึกรายการใหม่สำเร็จ'
    }
    showTransactionModal.value = false
    await store.fetchTransactionsByDate(selectedDate.value)
    logger.log('Transaction saved')
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to save transaction', err)
  }
}

async function handleCompleteDraft(transactionId: string) {
  try {
    await store.completeDraftTransaction(transactionId)
    successMessage.value = 'ดำเนินการ Draft Transaction สำเร็จ'
    await store.fetchTransactionsByDate(selectedDate.value)
    logger.log('Draft completed:', transactionId)
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to complete draft', err)
  }
}

function confirmDelete(transactionId: string) {
  deletingTransactionId.value = transactionId
  showDeleteConfirm.value = true
}

async function handleDeleteTransaction() {
  try {
    await store.deleteTransaction(deletingTransactionId.value)
    successMessage.value = 'ลบรายการสำเร็จ'
    showDeleteConfirm.value = false
    await store.fetchTransactionsByDate(selectedDate.value)
    logger.log('Transaction deleted:', deletingTransactionId.value)
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to delete transaction', err)
  }
}

async function handleCompleteStep1() {
  if (hasDrafts.value) {
    errorMessage.value = 'กรุณาดำเนินการหรือลบ Draft Transaction ทั้งหมดก่อน'
    return
  }
  if (todayStats.value.total === 0) {
    errorMessage.value = 'กรุณาบันทึกรายการอย่างน้อย 1 รายการก่อน'
    return
  }
  isCompletingStep1.value = true
  try {
    await store.completeStep1(selectedDate.value)
    successMessage.value = 'บันทึกรายการเสร็จสมบูรณ์ — ดำเนินการตรวจนับเงินสดได้เลย'
    logger.log('Step 1 completed')
    // Scroll to cash-counting section
    setTimeout(() => {
      document.getElementById('cash-counting-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 300)
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to complete Step 1', err)
  } finally {
    isCompletingStep1.value = false
  }
}

function loadExistingStep2Data() {
  if (store.currentSummary?.step2) {
    const step2 = store.currentSummary.step2
    actualTransferWithdrawal.value = step2.actualCash?.transferWithdrawal ?? 0
    actualServiceFee.value = step2.actualCash?.serviceFee ?? 0
    verificationNotes.value = step2.verificationNotes ?? ''
    verificationStatus.value = step2.hasDiscrepancies ? 'discrepancy' : 'match'
  }
}

async function handleConfirmVerification() {
  if (!isStep2FormValid.value) return
  isSubmittingStep2.value = true
  try {
    await store.completeStep2(selectedDate.value, {
      actualCash: {
        transferWithdrawal: Number(actualTransferWithdrawal.value),
        serviceFee: Number(actualServiceFee.value),
      },
      verificationNotes: verificationNotes.value
        ? `${verificationNotes.value}${followUpAction.value ? '\n\nการดำเนินการต่อ: ' + followUpAction.value : ''}`
        : followUpAction.value ? `การดำเนินการต่อ: ${followUpAction.value}` : '',
    })
    logger.log('Step 2 completed')
    router.push('/finance/money-transfer-history')
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to complete Step 2', err)
  } finally {
    isSubmittingStep2.value = false
  }
}

function goToAuditReview() {
  router.push('/finance/money-transfer-history')
}

// ─── Auditor Actions ──────────────────────────────────────────────────────────
function toggleTxnIssue(txnId: string) {
  if (txnIssueStatus.value[txnId]) {
    const copy = { ...txnIssueStatus.value }
    delete copy[txnId]
    txnIssueStatus.value = copy
  } else {
    txnIssueStatus.value = { ...txnIssueStatus.value, [txnId]: true }
  }
}

function openVerifyModal(txn: any) {
  verifyingTransaction.value = txn
  showVerifyModal.value = true
}

async function handleApproveAudit() {
  if (!canSubmitAudit.value) return
  isSubmittingAction.value = true
  try {
    const hasIssues = issueDetails.value.trim() !== '' || txnsWithIssues.value > 0
    await store.submitAudit(selectedDate.value, {
      transactionsVerified: auditTransactionList.value.length,
      transactionsWithIssues: txnsWithIssues.value,
      bankStatementVerified: bankStatementAmount.value > 0,
      bankStatementAmount: bankStatementAmount.value || undefined,
      auditorCash: (auditorCashTransferWithdrawal.value !== null && auditorCashServiceFee.value !== null)
        ? {
            transferWithdrawal: auditorCashTransferWithdrawal.value,
            serviceFee: auditorCashServiceFee.value,
            total: auditorCashTransferWithdrawal.value + auditorCashServiceFee.value,
          }
        : undefined,
      auditResult: hasIssues ? 'minor_issues' : 'no_issues',
      auditNotes: issueDetails.value || '',
      issuesFound: issueDetails.value || undefined,
      txnIssueStatus: Object.keys(txnIssueStatus.value).length > 0 ? { ...txnIssueStatus.value } : undefined,
    })
    successMessage.value = 'Audit เสร็จสมบูรณ์ — ส่งให้ Owner อนุมัติได้เลย'
    showAuditApproveConfirm.value = false
    logger.log('Audit completed')
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to complete audit', err)
  } finally {
    isSubmittingAction.value = false
  }
}

async function handleRejectAudit() {
  isSubmittingAction.value = true
  try {
    await store.submitAudit(selectedDate.value, {
      transactionsVerified: auditTransactionList.value.length,
      transactionsWithIssues: txnsWithIssues.value,
      bankStatementVerified: bankStatementAmount.value > 0,
      auditResult: 'rejected',
      auditNotes: issueDetails.value || 'ส่งคืน Manager เพื่อแก้ไข',
      issuesFound: issueDetails.value || 'ส่งคืนแก้ไข',
    })
    successMessage.value = 'ส่งคืน Manager เพื่อแก้ไขแล้ว'
    showAuditRejectConfirm.value = false
    logger.log('Audit rejected')
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to reject audit', err)
  } finally {
    isSubmittingAction.value = false
  }
}

// ─── Owner Actions ────────────────────────────────────────────────────────────
async function handleSubmitApproval() {
  if (!canApprove.value) return
  isSubmittingAction.value = true
  try {
    await store.submitOwnerApproval(selectedDate.value, {
      decision: decision.value,
      ownerNotes: ownerNotes.value,
      correctionReason: correctionReason.value,
    })
    successMessage.value = decision.value === 'request_correction' ? 'ส่งคืนแก้ไขเรียบร้อย' : 'อนุมัติเรียบร้อยแล้ว ✅'
    showOwnerApproveConfirm.value = false
    logger.log('Owner approval submitted', { decision: decision.value })
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to submit owner approval', err)
  } finally {
    isSubmittingAction.value = false
  }
}

async function handleRequestCorrection() {
  isSubmittingAction.value = true
  try {
    await store.submitOwnerApproval(selectedDate.value, {
      decision: 'request_correction',
      correctionReason: correctionReason.value || 'ขอให้แก้ไข',
      ownerNotes: ownerNotes.value,
    })
    successMessage.value = 'ส่งคืนแก้ไขเรียบร้อย'
    showOwnerRejectConfirm.value = false
    logger.log('Owner requested correction')
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to request correction', err)
  } finally {
    isSubmittingAction.value = false
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    await store.initializeStore()
    if (selectedDate.value) {
      await store.fetchTransactionsByDate(selectedDate.value)
      await store.fetchBalanceByDate(selectedDate.value)
      await store.fetchPreviousDayBalance(selectedDate.value)
      await store.initDailySummary(selectedDate.value)
      await store.fetchDailySummary(selectedDate.value)
      loadExistingStep2Data()
    }
    await settingsStore.fetchMoneyTransferFees()
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล'
  }

  // Sticky action buttons — observe visibility of original buttons
  stickyObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === auditorActionsRef.value) {
        isAuditorActionsVisible.value = entry.isIntersecting
      } else if (entry.target === ownerActionsRef.value) {
        isOwnerActionsVisible.value = entry.isIntersecting
      }
    }
  }, { threshold: 0.1 })
})

watch([auditorActionsRef, ownerActionsRef], ([auditorEl, ownerEl], [oldAuditorEl, oldOwnerEl]) => {
  if (oldAuditorEl) stickyObserver?.unobserve(oldAuditorEl)
  if (oldOwnerEl) stickyObserver?.unobserve(oldOwnerEl)
  if (auditorEl) stickyObserver?.observe(auditorEl)
  if (ownerEl) stickyObserver?.observe(ownerEl)
})

onBeforeUnmount(() => {
  stickyObserver?.disconnect()
  stickyObserver = null
})
</script>

<template>
  <PageWrapper
    title="บริการโอนเงิน"
    description="บันทึกรายการและตรวจนับเงินสด"
    icon="🏦"
    :loading="store.isLoading"
    :error="store.error"
  >
    <template #actions>
      <!-- Back to history -->
      <BaseButton variant="secondary" size="sm" @click="router.push('/finance/money-transfer-history')">
        ← ประวัติ
      </BaseButton>
      <!-- Date Picker -->
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-gray-700">วันที่:</label>
        <input
          v-model="selectedDate"
          type="date"
          class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500"
          @change="handleDateChange"
        />
      </div>
    </template>

    <!-- Success/Error alerts -->
    <BaseAlert
      v-if="successMessage"
      variant="success"
      :message="successMessage"
      :auto-close="true"
      class="mb-4"
      @close="successMessage = ''"
    />
    <BaseAlert
      v-if="errorMessage"
      variant="error"
      :message="errorMessage"
      class="mb-4"
      @close="errorMessage = ''"
    />

    <!-- ── Workflow Progress Bar ────────────────────────────────────────── -->
    <WorkflowProgressBar
      v-if="!(isManagerOrAsst && isStep1InProgress) && !isApproved"
      :status="workflowStatus"
      class="mb-4"
    />

    <!-- ── Quick Glance Summary ─────────────────────────────────────────── -->
    <QuickGlanceSummary
      v-if="!(isManagerOrAsst && isStep1InProgress)"
      :date="selectedDate"
      :total-transactions="todayStats.total"
      :success-count="todayStats.completed"
      :total-commission="totalCommission"
      :workflow-status="workflowStatus"
      class="mb-4"
    />

    <!-- ── Opening Balance ──────────────────────────────────────────────── -->
    <!-- แสดงเฉพาะ Manager/AM และยังไม่ได้ตั้งค่า -->
    <section v-if="isManagerOrAsst && !isOpeningSet" class="mb-4">
      <div class="flex items-center justify-between gap-4 bg-blue-50 border border-blue-300 rounded-xl px-5 py-4">
        <div>
          <div class="font-semibold text-blue-900">💳 กำหนดยอดเงินในบัญชีเริ่มต้น</div>
          <div class="text-sm text-blue-700 mt-0.5">กรุณากำหนดยอดเงินก่อนเริ่มบันทึกรายการ</div>
        </div>
        <BaseButton variant="primary" @click="openOpeningBalanceModal">
          กำหนดยอดเงินเริ่มต้น
        </BaseButton>
      </div>
    </section>

    <!-- ── Balance Cards — full 8 cards (Manager step1 active) ────────── -->
    <section v-if="isManagerOrAsst && isStep1InProgress" class="mb-6">
      <h2 class="text-base font-semibold text-gray-700 mb-3">📊 ยอดเงินปัจจุบัน</h2>
      <!-- แถวที่ 1: รายละเอียดรายการ -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <BaseCard class="text-center">
          <div class="text-xs text-gray-500 mb-1">เงินในบัญชีเริ่มต้น</div>
          <div class="text-lg font-bold text-gray-700">
            {{ formatCurrency(store.currentBalance?.openingBalance ?? 0) }}
          </div>
          <div class="text-xs text-gray-400 mt-0.5">
            {{ store.currentBalance?.openingBalanceSource === 'carryover' ? 'จากเมื่อวาน' : store.currentBalance?.openingBalanceSource === 'manual' ? 'กำหนดเอง' : '—' }}
          </div>
        </BaseCard>
        <BaseCard class="text-center">
          <div class="text-xs text-gray-500 mb-1">รวมเงินฝาก</div>
          <div class="text-lg font-bold text-blue-700">
            {{ formatCurrency(totalDeposits) }}
          </div>
        </BaseCard>
        <BaseCard class="text-center">
          <div class="text-xs text-gray-500 mb-1">รวมเงินโอน</div>
          <div class="text-lg font-bold text-red-600">
            {{ formatCurrency(totalTransfers) }}
          </div>
        </BaseCard>
        <BaseCard class="text-center">
          <div class="text-xs text-gray-500 mb-1">รวมเงินถอน</div>
          <div class="text-lg font-bold text-purple-700">
            {{ formatCurrency(totalWithdrawals) }}
          </div>
        </BaseCard>
      </div>
      <!-- แถวที่ 2: สรุปยอด -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <BaseCard class="text-center">
          <div class="text-xs text-gray-500 mb-1">รวมค่าบริการ (เงินสด)</div>
          <div class="text-lg font-bold text-green-700">
            {{ formatCurrency(store.currentBalance?.serviceFeeCash ?? 0) }}
          </div>
        </BaseCard>
        <BaseCard class="text-center">
          <div class="text-xs text-gray-500 mb-1">รวมค่าบริการ (เงินโอน)</div>
          <div class="text-lg font-bold text-green-700">
            {{ formatCurrency(store.currentBalance?.serviceFeeTransfer ?? 0) }}
          </div>
        </BaseCard>
        <BaseCard class="text-center border-gray-300 bg-gray-50">
          <div class="text-xs text-gray-600 mb-1 font-medium">เงินในบัญชีคงเหลือ</div>
          <div class="text-xl font-bold text-gray-900">
            {{ formatCurrency(store.currentBalance?.bankAccount ?? 0) }}
          </div>
        </BaseCard>
        <BaseCard class="text-center border-blue-200 bg-blue-50/40">
          <div class="text-xs text-blue-600 mb-1 font-medium">เงินสดคงเหลือ</div>
          <div class="text-lg font-bold text-blue-800">
            {{ formatCurrency(totalCash) }}
          </div>
        </BaseCard>
      </div>
    </section>

    <!-- ── Balance Cards — compact 4 cards + expandable (ทุกกรณีอื่น) ──── -->
    <CompactBalanceSummary
      v-else
      :opening-balance="openingBalance"
      :total-deposit="totalDeposits"
      :total-transfer="totalTransfers"
      :total-withdrawal="totalWithdrawals"
      :service-fee-cash="store.currentBalance?.serviceFeeCash ?? 0"
      :service-fee-transfer="store.currentBalance?.serviceFeeTransfer ?? 0"
      :bank-account-balance="store.currentBalance?.bankAccount ?? 0"
      :cash-balance="totalCash"
      :opening-source="store.currentBalance?.openingBalanceSource ?? ''"
      class="mb-6"
    />

    <!-- ══════════════════════════════════════════════════════════════════ -->
    <!-- Section 6C: Owner Approval (moved up — before Audit/Txn/Cash)    -->
    <!-- Visible: Owner role + audited                                     -->
    <!-- ══════════════════════════════════════════════════════════════════ -->
    <section v-if="(isOwner && store.isAudited) || isApproved" class="mb-4">
      <div class="flex items-center gap-3 mb-4">
        <h2 class="text-base font-semibold text-gray-700">✅ การอนุมัติ Owner</h2>
        <BaseBadge v-if="store.isApproved" variant="success" size="sm">✅ อนุมัติแล้ว</BaseBadge>
        <BaseBadge v-else variant="warning" size="sm">⏳ รออนุมัติ</BaseBadge>
      </div>

      <!-- Already Approved Banner -->
      <div v-if="store.isApproved" class="rounded-xl border border-green-200 bg-green-50 p-6 mb-6 flex items-start gap-4">
        <CheckCircleIcon class="w-8 h-8 text-green-600 shrink-0 mt-0.5" />
        <div>
          <p class="font-semibold text-green-800 text-lg">อนุมัติแล้ว ✅</p>
          <p class="text-sm text-green-700 mt-1">วันที่ {{ selectedDate }} — ได้รับการอนุมัติจาก Owner เรียบร้อยแล้ว</p>
          <p v-if="store.currentSummary?.ownerApproval?.ownerNotes" class="text-sm text-green-700 mt-1">
            หมายเหตุ: {{ store.currentSummary?.ownerApproval?.ownerNotes }}
          </p>
        </div>
      </div>

      <!-- Transaction Summary Card -->
      <section v-if="false" class="bg-white border border-gray-200 rounded-xl mb-6 overflow-hidden">
        <div class="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
          <DocumentTextIcon class="w-5 h-5 text-gray-600" />
          <h3 class="font-semibold text-gray-900">สรุปรายการ</h3>
          <span class="ml-auto text-sm text-gray-500">{{ selectedDate }}</span>
        </div>
        <div class="p-6 space-y-6">
          <!-- Balance Snapshot -->
          <div>
            <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">ยอดเงินในบัญชี Bank</h4>
            <MoneyTransferBalanceSnapshot :opening-balance="openingBalance" :closing-balance="closingBalance">
              <div class="flex gap-6 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                <span>เงินสดในมือ (โอน/ถอน): <strong>{{ formatCurrency(step1FinalBalances?.transferCash ?? 0) }}</strong></span>
                <span>ค่าบริการสะสม: <strong class="text-green-700">{{ formatCurrency(step1FinalBalances?.serviceFeeCash ?? 0) }}</strong></span>
              </div>
            </MoneyTransferBalanceSnapshot>
          </div>
          <hr class="border-gray-100" />

          <!-- Step 1 Summary -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">1</span>
                <h4 class="font-medium text-gray-900">Step 1: Manager บันทึกรายการ</h4>
              </div>
              <div class="flex items-center gap-3 text-sm">
                <span class="text-gray-500">{{ dateTransactions.length }} รายการ</span>
                <span class="text-green-700">{{ successCount }} สำเร็จ</span>
                <span v-if="failedCount" class="text-red-600">{{ failedCount }} ล้มเหลว</span>
              </div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="bg-blue-50 rounded-lg p-3 text-center">
                <p class="text-xs text-blue-600 mb-1">ยอดปิดบัญชี Bank</p>
                <p class="font-semibold text-blue-900">{{ formatCurrency(step1FinalBalances?.bankAccount ?? 0) }}</p>
              </div>
              <div class="bg-green-50 rounded-lg p-3 text-center">
                <p class="text-xs text-green-600 mb-1">เงินสดโอน/ถอน</p>
                <p class="font-semibold text-green-900">{{ formatCurrency(step1FinalBalances?.transferCash ?? 0) }}</p>
              </div>
              <div class="bg-yellow-50 rounded-lg p-3 text-center">
                <p class="text-xs text-yellow-600 mb-1">ค่าบริการ (เงินสด)</p>
                <p class="font-semibold text-yellow-900">{{ formatCurrency(step1FinalBalances?.serviceFeeCash ?? 0) }}</p>
              </div>
              <div class="bg-purple-50 rounded-lg p-3 text-center">
                <p class="text-xs text-purple-600 mb-1">ค่าบริการ (โอน)</p>
                <p class="font-semibold text-purple-900">{{ formatCurrency(step1FinalBalances?.serviceFeeTransfer ?? 0) }}</p>
              </div>
            </div>
            <div class="mt-3 flex items-center gap-2 text-sm text-gray-700">
              <BanknotesIcon class="w-4 h-4 text-gray-500" />
              <span>ค่าบริการรวม: <span class="font-semibold text-gray-900">{{ formatCurrency(totalCommission) }}</span></span>
            </div>
          </div>
          <hr class="border-gray-100" />

          <!-- Step 2 Summary -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <span class="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold">2</span>
              <h4 class="font-medium text-gray-900">Step 2: Manager ตรวจนับเงิน</h4>
            </div>
            <div v-if="step2Data" class="space-y-2 text-sm">
              <div class="flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-50">
                <span class="text-gray-600">เงินสดโอน/ถอน (นับจริง A)</span>
                <span class="font-medium">{{ formatCurrency(step2Data?.actualCash?.transferWithdrawal ?? 0) }}</span>
              </div>
              <div class="flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-50">
                <span class="text-gray-600">ค่าบริการเงินสด (นับจริง B)</span>
                <span class="font-medium">{{ formatCurrency(step2Data?.actualCash?.serviceFee ?? 0) }}</span>
              </div>
              <div class="flex items-center justify-between py-1.5 px-3 rounded-lg" :class="step2Data?.hasDiscrepancies ? 'bg-yellow-50' : 'bg-green-50'">
                <span class="text-gray-600">ผลการตรวจนับ</span>
                <BaseBadge :variant="step2Data?.hasDiscrepancies ? 'warning' : 'success'" size="sm">
                  {{ step2Data?.hasDiscrepancies ? 'มีส่วนต่าง ⚠️' : 'ตรงกัน ✅' }}
                </BaseBadge>
              </div>
            </div>
          </div>
          <hr class="border-gray-100" />

          <!-- Auditor Summary -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <ShieldCheckIcon class="w-5 h-5 text-indigo-600" />
              <h4 class="font-medium text-gray-900">Auditor Verification</h4>
            </div>
            <div v-if="auditData" class="space-y-3 text-sm">
              <div class="flex items-center gap-3 p-3 rounded-lg border" :class="auditResultLabel.containerClass">
                <CheckCircleIcon class="w-5 h-5 shrink-0" />
                <div>
                  <p class="font-semibold">{{ auditResultLabel.text }}</p>
                  <p class="text-xs opacity-80 mt-0.5">ตรวจสอบโดย {{ auditData?.completedByName ?? '-' }}<template v-if="auditData?.completedAt"> · {{ formatDatetime(auditData?.completedAt as string) }}</template></p>
                </div>
              </div>
              <div v-if="auditData?.bankStatementAmount" class="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50 flex-wrap">
                <span class="text-gray-600">รายการเดินบัญชี:</span>
                <span class="font-semibold text-blue-800">{{ formatCurrency(auditData?.bankStatementAmount ?? 0) }}</span>
                <BaseBadge :variant="auditData?.bankStatementVerified ? 'success' : 'warning'" size="sm">
                  {{ auditData?.bankStatementVerified ? '✅ ตรวจสอบแล้ว' : '⚠️ ไม่ได้ตรวจสอบ' }}
                </BaseBadge>
              </div>
              <div v-if="auditData?.auditNotes" class="py-2 px-3 rounded-lg bg-gray-50">
                <span class="text-gray-500 text-xs">หมายเหตุ Auditor:</span>
                <p class="text-gray-700 mt-0.5 whitespace-pre-wrap">{{ auditData?.auditNotes }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Expandable detail sections -->
      <section v-if="false" class="bg-white border border-gray-200 rounded-xl mb-6 overflow-hidden">
        <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 class="font-semibold text-gray-900">รายละเอียดเพิ่มเติม</h3>
        </div>
        <!-- Step 1 Transaction List -->
        <div class="border-b border-gray-100">
          <button
            class="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
            @click="expandStep1Owner = !expandStep1Owner"
          >
            <div class="flex items-center gap-2">
              <DocumentTextIcon class="w-4 h-4 text-gray-500" />
              <span class="font-medium text-gray-900">Step 1 — รายการธุรกรรมทั้งหมด</span>
              <BaseBadge variant="default" size="sm">{{ dateTransactions.length }} รายการ</BaseBadge>
            </div>
            <ChevronUpIcon v-if="expandStep1Owner" class="w-4 h-4 text-gray-500" />
            <ChevronDownIcon v-else class="w-4 h-4 text-gray-500" />
          </button>
          <div v-if="expandStep1Owner" class="px-6 pb-4">
            <MoneyTransferTransactionTable
              :transactions="dateTransactions"
              empty-message="ไม่มีรายการ"
              @row-click="openDetailModal"
            >
              <template #action-header>ดู</template>
            </MoneyTransferTransactionTable>
          </div>
        </div>
        <!-- Step 2 Detail -->
        <div class="border-b border-gray-100">
          <button
            class="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
            @click="expandStep2Owner = !expandStep2Owner"
          >
            <div class="flex items-center gap-2">
              <BanknotesIcon class="w-4 h-4 text-gray-500" />
              <span class="font-medium text-gray-900">Step 2 — รายละเอียดการตรวจนับ</span>
            </div>
            <ChevronUpIcon v-if="expandStep2Owner" class="w-4 h-4 text-gray-500" />
            <ChevronDownIcon v-else class="w-4 h-4 text-gray-500" />
          </button>
          <div v-if="expandStep2Owner && step2Data" class="px-6 pb-4 space-y-3 text-sm">
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">ยอดที่ควรจะมี (A)</p>
                <p class="font-medium">{{ formatCurrency(step2Data?.expectedCash?.transferWithdrawal ?? 0) }}</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">นับจริง (A)</p>
                <p class="font-medium">{{ formatCurrency(step2Data?.actualCash?.transferWithdrawal ?? 0) }}</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">ยอดที่ควรจะมี (B)</p>
                <p class="font-medium">{{ formatCurrency(step2Data?.expectedCash?.serviceFee ?? 0) }}</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">นับจริง (B)</p>
                <p class="font-medium">{{ formatCurrency(step2Data?.actualCash?.serviceFee ?? 0) }}</p>
              </div>
            </div>
          </div>
        </div>
        <!-- Audit Detail -->
        <div>
          <button
            class="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
            @click="expandAuditOwner = !expandAuditOwner"
          >
            <div class="flex items-center gap-2">
              <ShieldCheckIcon class="w-4 h-4 text-gray-500" />
              <span class="font-medium text-gray-900">Auditor — รายละเอียดการตรวจสอบ</span>
            </div>
            <ChevronUpIcon v-if="expandAuditOwner" class="w-4 h-4 text-gray-500" />
            <ChevronDownIcon v-else class="w-4 h-4 text-gray-500" />
          </button>
          <div v-if="expandAuditOwner && auditData" class="px-6 pb-4 space-y-3 text-sm">
            <div class="bg-gray-50 rounded-lg p-3 space-y-1.5">
              <div class="flex justify-between">
                <span class="text-gray-500">ผล Audit</span>
                <span class="font-medium" :class="auditResultLabel.colorClass">{{ auditResultLabel.text }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Bank Statement Verified</span>
                <span class="font-medium">{{ auditData?.bankStatementVerified ? 'ใช่ ✅' : 'ไม่ใช่' }}</span>
              </div>
              <div v-if="auditData?.completedAt" class="flex justify-between">
                <span class="text-gray-500">เวลา Audit</span>
                <span>{{ formatDatetime(auditData?.completedAt as string) }}</span>
              </div>
            </div>
            <div v-if="auditData?.auditNotes" class="bg-gray-50 rounded-lg p-3">
              <p class="text-xs text-gray-500 mb-1">Audit Notes</p>
              <p class="text-gray-700 whitespace-pre-wrap">{{ auditData?.auditNotes }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Owner Decision Card (only when not yet approved) -->
      <section v-if="!store.isApproved" class="bg-white border border-gray-200 rounded-xl mb-6 overflow-hidden">
        <div class="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
          <ExclamationTriangleIcon class="w-5 h-5 text-yellow-600" />
          <h3 class="font-semibold text-gray-900">การตัดสินใจของ Owner</h3>
        </div>
        <div class="p-4 space-y-3">
          <div class="grid grid-cols-3 gap-2">
            <label
              class="flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition-colors"
              :class="decision === 'approve' ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'"
            >
              <div class="flex items-center gap-2">
                <input v-model="decision" type="radio" value="approve" class="accent-green-600 shrink-0" />
                <p class="font-medium text-sm text-gray-900">อนุมัติ ✅</p>
              </div>
              <p class="text-xs text-gray-500 pl-5">บันทึกเป็นที่สิ้นสุด</p>
            </label>
            <label
              class="flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition-colors"
              :class="decision === 'approve_with_notes' ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'"
            >
              <div class="flex items-center gap-2">
                <input v-model="decision" type="radio" value="approve_with_notes" class="accent-blue-600 shrink-0" />
                <p class="font-medium text-sm text-gray-900">อนุมัติพร้อมหมายเหตุ</p>
              </div>
              <p class="text-xs text-gray-500 pl-5">มีข้อสังเกตเพิ่มเติม</p>
            </label>
            <label
              class="flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition-colors"
              :class="decision === 'request_correction' ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'"
            >
              <div class="flex items-center gap-2">
                <input v-model="decision" type="radio" value="request_correction" class="accent-red-600 shrink-0" />
                <p class="font-medium text-sm text-gray-900">ขอให้แก้ไข</p>
              </div>
              <p class="text-xs text-gray-500 pl-5">ส่งคืน Auditor/Manager</p>
            </label>
          </div>
          <div v-if="decision === 'approve_with_notes'">
            <BaseTextarea v-model="ownerNotes" placeholder="ระบุหมายเหตุหรือข้อสังเกต..." :rows="2" />
          </div>
          <div v-if="decision === 'request_correction'">
            <BaseTextarea v-model="correctionReason" placeholder="ระบุสิ่งที่ต้องแก้ไข..." :rows="2" />
          </div>
        </div>
      </section>

      <!-- Owner Action Buttons -->
      <div v-if="!store.isApproved" ref="ownerActionsRef" class="flex flex-col sm:flex-row items-center justify-between gap-3 py-4">
        <BaseButton variant="danger" :disabled="isSubmittingAction" @click="showOwnerRejectConfirm = true">
          <XCircleIcon class="w-4 h-4" />
          ส่งคืนแก้ไข
        </BaseButton>
        <ActionButton
          :permission="PERMISSIONS.EDIT_FINANCE"
          variant="primary"
          :loading="isSubmittingAction"
          :disabled="!canApprove || isSubmittingAction"
          @click="showOwnerApproveConfirm = true"
        >
          <CheckCircleIcon class="w-4 h-4" />
          {{ decision === 'request_correction' ? 'ส่งคืน' : 'อนุมัติ ✅' }}
        </ActionButton>
      </div>
    </section>

    <!-- ── Default Fee Banner ──────────────────────────────────────────── -->
    <div v-if="usingDefaultFees && !isOwner" class="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
      <span class="shrink-0 text-base">⚙️</span>
      <div class="flex-1 text-amber-800">
        ยังใช้<strong>อัตราค่าบริการเริ่มต้น</strong> (10 / 20 / 30 / 40 บาท) —
        <NuxtLink
          to="/settings/daily-record-settings"
          class="underline font-semibold hover:text-amber-900"
        >
          ตั้งค่าได้ที่ ตั้งค่า › ตั้งค่าการบันทึกรายวัน
        </NuxtLink>
      </div>
    </div>

    <!-- ── Quick Actions: Manager/AM + step1_in_progress เท่านั้น ──────── -->
    <section v-if="showQuickActions" class="mb-6">
      <h2 class="text-base font-semibold text-gray-700 mb-3">⚡ รายการด่วน</h2>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          :disabled="!canAddTransaction"
          :class="[
            'flex flex-col items-center gap-2 p-4 border rounded-xl font-medium text-sm transition-colors',
            canAddTransaction
              ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 text-yellow-800 cursor-pointer'
              : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-50',
          ]"
          @click="canAddTransaction && openFavoriteModal()"
        >
          <StarIcon class="w-6 h-6" />
          รายการโปรด
        </button>
        <button
          :disabled="!canAddTransaction"
          :class="[
            'flex flex-col items-center gap-2 p-4 border rounded-xl font-medium text-sm transition-colors',
            canAddTransaction
              ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-800 cursor-pointer'
              : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-50',
          ]"
          @click="canAddTransaction && openNewTransactionModal('transfer')"
        >
          <ArrowUpTrayIcon class="w-6 h-6" />
          โอนเงิน
        </button>
        <button
          :disabled="!canAddTransaction"
          :class="[
            'flex flex-col items-center gap-2 p-4 border rounded-xl font-medium text-sm transition-colors',
            canAddTransaction
              ? 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-800 cursor-pointer'
              : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-50',
          ]"
          @click="canAddTransaction && openNewTransactionModal('withdrawal')"
        >
          <ArrowDownTrayIcon class="w-6 h-6" />
          ถอนเงิน
        </button>
        <button
          :disabled="!canAddTransaction"
          :class="[
            'flex flex-col items-center gap-2 p-4 border rounded-xl font-medium text-sm transition-colors',
            canAddTransaction
              ? 'bg-green-50 border-green-200 hover:bg-green-100 text-green-800 cursor-pointer'
              : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-50',
          ]"
          @click="canAddTransaction && openNewTransactionModal('owner_deposit')"
        >
          <BanknotesIcon class="w-6 h-6" />
          ฝากเงิน
        </button>
      </div>
    </section>

    <!-- ── Draft Transactions Alert: Manager/AM เท่านั้น ─────────────── -->
    <section v-if="isManagerOrAsst && hasDrafts" class="mb-6">
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-amber-600 font-semibold">⚠️ Draft Transactions ({{ draftTransactions.length }} รายการ)</span>
        </div>
        <div class="space-y-3">
          <div
            v-for="draft in draftTransactions"
            :key="draft.id"
            class="bg-white border border-amber-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-3"
          >
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <BaseBadge variant="warning" size="sm">DRAFT</BaseBadge>
                <span class="font-medium text-gray-900">{{ getTransactionTypeLabel(draft.transactionType) }}</span>
                <span class="text-gray-500 text-sm">{{ formatTime(draft.datetime) }}</span>
              </div>
              <div class="text-sm text-gray-600">
                จำนวน: <strong>{{ formatCurrency(draft.amount) }}</strong>
                <span v-if="!canCompleteDraft(draft)" class="text-red-600 ml-2">
                  (ขาด {{ formatCurrency(getShortfall(draft)) }})
                </span>
              </div>
              <div v-if="draft.draftReason" class="text-xs text-gray-500 mt-0.5">
                {{ draft.draftReason === 'insufficient_funds' ? 'ยอดเงินในบัญชีไม่เพียงพอ' : draft.draftReason }}
              </div>
            </div>
            <div class="flex gap-2">
              <ActionButton
                v-if="canCompleteDraft(draft)"
                :permission="PERMISSIONS.EDIT_FINANCE"
                variant="success"
                size="sm"
                @click="handleCompleteDraft(draft.id)"
              >
                <CheckCircleIcon class="w-4 h-4" />
                ดำเนินการ
              </ActionButton>
              <BaseButton
                v-else
                variant="secondary"
                size="sm"
                disabled
                aria-label="ยอดเงินไม่พอ"
              >
                ยอดไม่พอ
              </BaseButton>
              <ActionButton
                :permission="PERMISSIONS.EDIT_FINANCE"
                variant="danger"
                size="sm"
                aria-label="ลบรายการ Draft"
                @click="confirmDelete(draft.id)"
              >
                <TrashIcon class="w-4 h-4" />
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Transactions Table ─────────────────────────────────────────── -->
    <!-- Manager step1 active → original layout with add button -->
    <section v-if="isManagerOrAsst && isStep1InProgress" class="mb-6">
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <!-- Table Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-gray-100">
          <h2 class="text-base font-semibold text-gray-700">📋 รายการธุรกรรมวันนี้</h2>
          <div class="flex items-center gap-2">
            <ActionButton
              v-if="canAddTransaction"
              :permission="PERMISSIONS.EDIT_FINANCE"
              variant="primary"
              size="sm"
              @click.stop="openNewTransactionModal()"
            >
              <PlusIcon class="w-4 h-4" />
              รายการใหม่
            </ActionButton>
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="flex border-b border-gray-100 overflow-x-auto">
          <button
            v-for="tab in filterTabs"
            :key="tab.value"
            :class="[
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
              activeFilter === tab.value
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ]"
            @click="activeFilter = tab.value"
          >
            {{ tab.label }}
            <span
              :class="[
                'ml-1.5 px-1.5 py-0.5 rounded-full text-xs',
                activeFilter === tab.value ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600',
              ]"
            >
              {{ getTabCount(tab.value) }}
            </span>
          </button>
        </div>

        <!-- Table -->
        <MoneyTransferTransactionTable
          :transactions="paginatedTransactions"
          :index-offset="(currentPage - 1) * PAGE_SIZE"
          :empty-message="activeFilter === 'all' ? 'กด Quick Actions หรือ [รายการใหม่] เพื่อเริ่มบันทึก' : `ไม่มีรายการที่มีสถานะ ${filterTabs.find(t => t.value === activeFilter)?.label}`"
          @row-click="openDetailModal"
        >
          <template #actions="{ txn }">
            <button
              aria-label="ดูรายละเอียด"
              class="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              @click="openDetailModal(txn)"
            >
              <EyeIcon class="w-4 h-4" />
            </button>
            <ActionButton
              v-if="isManagerOrAsst && txn.status === 'draft'"
              :permission="PERMISSIONS.EDIT_FINANCE"
              variant="ghost"
              size="sm"
              aria-label="แก้ไขรายการ"
              @click="openEditModal(txn)"
            >
              <PencilIcon class="w-4 h-4" />
            </ActionButton>
            <ActionButton
              v-if="isManagerOrAsst && txn.status === 'draft'"
              :permission="PERMISSIONS.EDIT_FINANCE"
              variant="ghost"
              size="sm"
              aria-label="ลบรายการ"
              class="text-red-500 hover:text-red-600 hover:bg-red-50"
              @click="confirmDelete(txn.id)"
            >
              <TrashIcon class="w-4 h-4" />
            </ActionButton>
          </template>
        </MoneyTransferTransactionTable>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
          <button
            class="px-3 py-1.5 text-sm rounded-lg border transition-colors"
            :class="currentPage === 1 ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 text-gray-700 hover:bg-white'"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            &lt; ก่อนหน้า
          </button>
          <span class="text-sm text-gray-600">หน้า {{ currentPage }} จาก {{ totalPages }}</span>
          <button
            class="px-3 py-1.5 text-sm rounded-lg border transition-colors"
            :class="currentPage === totalPages ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 text-gray-700 hover:bg-white'"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            ถัดไป &gt;
          </button>
        </div>

        <!-- Summary Row -->
        <div v-if="filteredTransactions.length > 0" class="px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-4 text-sm text-gray-600">
          <span>รวม {{ todayStats.total }} รายการ</span>
          <span>สำเร็จ {{ todayStats.completed }} รายการ</span>
          <span v-if="hasDrafts" class="text-amber-700">Draft {{ todayStats.drafts }} รายการ</span>
          <span class="font-medium text-green-700">รวมค่าบริการทั้งหมด: {{ formatCurrency(todayStats.totalCommission) }}</span>
        </div>
      </div>
    </section>

    <!-- All other visible cases → CollapsibleSection (collapsed by default) -->
    <CollapsibleSection
      v-else-if="!isApproved && !(isAuditor && store.isStep2Complete) && !(isOwner && store.isAudited)"
      icon="📋"
      title="ธุรกรรมวันนี้"
      :badge="txnSectionBadge"
      :summary="txnSectionSummary"
      class="mb-4"
    >
      <div class="-mx-6 -my-4">
        <!-- Filter Tabs -->
        <div class="flex border-b border-gray-100 overflow-x-auto">
          <button
            v-for="tab in filterTabs"
            :key="tab.value"
            :class="[
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
              activeFilter === tab.value
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ]"
            @click="activeFilter = tab.value"
          >
            {{ tab.label }}
            <span
              :class="[
                'ml-1.5 px-1.5 py-0.5 rounded-full text-xs',
                activeFilter === tab.value ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600',
              ]"
            >
              {{ getTabCount(tab.value) }}
            </span>
          </button>
        </div>

        <!-- Table -->
        <MoneyTransferTransactionTable
          :transactions="paginatedTransactions"
          :index-offset="(currentPage - 1) * PAGE_SIZE"
          :empty-message="activeFilter === 'all' ? 'กด Quick Actions หรือ [รายการใหม่] เพื่อเริ่มบันทึก' : `ไม่มีรายการที่มีสถานะ ${filterTabs.find(t => t.value === activeFilter)?.label}`"
          @row-click="openDetailModal"
        >
          <template #actions="{ txn }">
            <button
              aria-label="ดูรายละเอียด"
              class="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              @click="openDetailModal(txn)"
            >
              <EyeIcon class="w-4 h-4" />
            </button>
            <ActionButton
              v-if="isManagerOrAsst && txn.status === 'draft'"
              :permission="PERMISSIONS.EDIT_FINANCE"
              variant="ghost"
              size="sm"
              aria-label="แก้ไขรายการ"
              @click="openEditModal(txn)"
            >
              <PencilIcon class="w-4 h-4" />
            </ActionButton>
            <ActionButton
              v-if="isManagerOrAsst && txn.status === 'draft'"
              :permission="PERMISSIONS.EDIT_FINANCE"
              variant="ghost"
              size="sm"
              aria-label="ลบรายการ"
              class="text-red-500 hover:text-red-600 hover:bg-red-50"
              @click="confirmDelete(txn.id)"
            >
              <TrashIcon class="w-4 h-4" />
            </ActionButton>
          </template>
        </MoneyTransferTransactionTable>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
          <button
            class="px-3 py-1.5 text-sm rounded-lg border transition-colors"
            :class="currentPage === 1 ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 text-gray-700 hover:bg-white'"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            &lt; ก่อนหน้า
          </button>
          <span class="text-sm text-gray-600">หน้า {{ currentPage }} จาก {{ totalPages }}</span>
          <button
            class="px-3 py-1.5 text-sm rounded-lg border transition-colors"
            :class="currentPage === totalPages ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 text-gray-700 hover:bg-white'"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            ถัดไป &gt;
          </button>
        </div>

        <!-- Summary Row -->
        <div v-if="filteredTransactions.length > 0" class="px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-4 text-sm text-gray-600">
          <span>รวม {{ todayStats.total }} รายการ</span>
          <span>สำเร็จ {{ todayStats.completed }} รายการ</span>
          <span v-if="hasDrafts" class="text-amber-700">Draft {{ todayStats.drafts }} รายการ</span>
          <span class="font-medium text-green-700">รวมค่าบริการทั้งหมด: {{ formatCurrency(todayStats.totalCommission) }}</span>
        </div>
      </div>
    </CollapsibleSection>

    <!-- ── Step 1 Completion: Manager/AM เท่านั้น ──────────────────────── -->
    <section v-if="isManagerOrAsst && !store.isStep1Complete" class="py-4">

      <!-- Prerequisite checklist card -->
      <div
        class="max-w-lg mx-auto border-2 rounded-2xl p-5 mb-5 transition-colors duration-300"
        :class="canCompleteStep1 ? 'border-green-400 bg-green-50' : 'border-amber-300 bg-amber-50'"
      >
        <h3
          class="font-semibold text-sm mb-3"
          :class="canCompleteStep1 ? 'text-green-800' : 'text-amber-800'"
        >
          {{ canCompleteStep1 ? '✅ พร้อมยืนยันบันทึกรายการแล้ว — กดปุ่มด้านล่างได้เลย' : '📋 เงื่อนไขก่อนยืนยันบันทึกรายการ' }}
        </h3>
        <ul class="space-y-2 text-sm">
          <li class="flex items-center gap-2" :class="isOpeningSet ? 'text-green-700' : 'text-gray-500'">
            <span class="text-base">{{ isOpeningSet ? '✅' : '⬜' }}</span>
            กำหนดยอดเงินเริ่มต้นแล้ว
          </li>
          <li class="flex items-center gap-2" :class="todayStats.total > 0 ? 'text-green-700' : 'text-gray-500'">
            <span class="text-base">{{ todayStats.total > 0 ? '✅' : '⬜' }}</span>
            มีรายการอย่างน้อย 1 รายการ
            <span class="text-gray-400">(ปัจจุบัน: {{ todayStats.total }} รายการ)</span>
          </li>
          <li class="flex items-center gap-2" :class="!hasDrafts ? 'text-green-700' : 'text-red-600'">
            <span class="text-base">{{ !hasDrafts ? '✅' : '❌' }}</span>
            {{ hasDrafts ? 'มีดราฟต์ค้างอยู่' : 'ไม่มีดราฟต์ค้างอยู่' }}
            <span v-if="hasDrafts" class="font-medium text-red-600">({{ todayStats.drafts }} รายการ)</span>
          </li>
        </ul>
      </div>

      <!-- Draft warning -->
      <div class="flex justify-center mb-3">
        <BaseAlert
          v-if="hasDrafts"
          variant="warning"
          message="กรุณาดำเนินการหรือลบ Draft Transaction ทั้งหมดก่อนไปขั้นตอนถัดไป"
          :dismissible="false"
          class="w-full max-w-lg"
        />
      </div>

      <!-- Complete button -->
      <div class="flex justify-center">
        <div
          class="rounded-xl transition-all duration-300"
          :class="canCompleteStep1 ? 'ring-4 ring-green-400 ring-offset-2 shadow-lg shadow-green-200' : ''"
        >
          <ActionButton
            :permission="PERMISSIONS.EDIT_FINANCE"
            variant="primary"
            size="lg"
            :disabled="hasDrafts || todayStats.total === 0 || !isOpeningSet"
            :loading="isCompletingStep1"
            @click="handleCompleteStep1"
          >
            <CheckCircleIcon class="w-5 h-5" />
            ยืนยันบันทึกรายการ → ตรวจนับเงินสด
          </ActionButton>
        </div>
      </div>
    </section>

    <!-- ── ส่วนที่ 6: ผลการตรวจนับเงินสด ────────────────────────────────── -->
    <!-- CASE A: Editable form (Manager/Asst.Mgr when step2 not done) -->
    <section
      v-if="showCashCountSection && canEditCashCount && !isOwner && !(isAuditor && store.isStep2Complete)"
      id="cash-counting-section"
      class="mt-2"
    >
      <div class="flex items-center gap-3 mb-4">
        <h2 class="text-base font-semibold text-gray-700">💵 ผลการตรวจนับเงินสด</h2>
        <BaseBadge variant="warning" size="sm">⏳ รอตรวจนับ</BaseBadge>
      </div>
        <div class="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 mb-4">
          <!-- A: Transfer/Withdrawal -->
          <div class="p-4">
            <div class="flex flex-col sm:flex-row sm:items-center gap-4">
              <div class="flex-1">
                <div class="font-medium text-gray-900 mb-0.5">A. เงินสดจากโอน/ถอนเงิน</div>
                <div class="text-sm text-gray-500">คาดหวัง: {{ formatCurrency(expectedTransferWithdrawal) }}</div>
              </div>
              <div class="flex items-center gap-3">
                <FormField>
                  <div class="relative w-40">
                    <BaseInput v-model="actualTransferWithdrawal" type="number" placeholder="0" />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">บาท</span>
                  </div>
                </FormField>
                <div :class="['text-sm font-semibold min-w-20 text-right', diffClass(diffTransferWithdrawal)]">
                  {{ diffSign(diffTransferWithdrawal) }}
                </div>
              </div>
            </div>
          </div>

          <!-- B: Service Fee -->
          <div class="p-4">
            <div class="flex flex-col sm:flex-row sm:items-center gap-4">
              <div class="flex-1">
                <div class="font-medium text-gray-900 mb-0.5">B. ค่าบริการ (เงินสด)</div>
                <div class="text-sm text-gray-500">คาดหวัง: {{ formatCurrency(expectedServiceFee) }}</div>
              </div>
              <div class="flex items-center gap-3">
                <FormField>
                  <div class="relative w-40">
                    <BaseInput v-model="actualServiceFee" type="number" placeholder="0" />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">บาท</span>
                  </div>
                </FormField>
                <div :class="['text-sm font-semibold min-w-20 text-right', diffClass(diffServiceFee)]">
                  {{ diffSign(diffServiceFee) }}
                </div>
              </div>
            </div>
          </div>

          <!-- C: Service Fee Transfer (info only) -->
          <div class="p-4 bg-gray-50">
            <div class="flex flex-col sm:flex-row sm:items-center gap-4">
              <div class="flex-1">
                <div class="font-medium text-gray-600 mb-0.5">C. ค่าบริการ (โอน)</div>
                <div class="text-sm text-gray-500">ตรวจสอบเงินในบัญชี</div>
              </div>
              <div class="text-sm font-semibold text-gray-700">คาดหวัง: {{ formatCurrency(expectedServiceFeeTransfer) }}</div>
            </div>
          </div>

          <!-- Total Row -->
          <div class="p-4 bg-gray-50">
            <div class="flex flex-col sm:flex-row sm:items-center gap-4">
              <div class="flex-1 font-semibold text-gray-900">รวมเงินสดทั้งหมด</div>
              <div class="flex items-center gap-3">
                <div class="w-40 px-3 py-2 bg-gray-100 rounded-lg text-right font-bold text-gray-900">
                  {{ formatCurrency(actualTotal) }}
                </div>
                <div :class="['text-sm font-bold min-w-20 text-right', diffClass(diffTotal)]">
                  {{ diffSign(diffTotal) }}
                </div>
              </div>
            </div>
          </div>
        </div>



        <!-- Notes (only when there's a discrepancy or already typed) -->
        <div v-if="verificationStatus === 'discrepancy' || verificationNotes" class="bg-white border border-gray-200 rounded-xl p-4 space-y-3 mb-4">
          <FormField
            label="หมายเหตุ/สาเหตุ"
            :hint="verificationStatus === 'discrepancy' ? 'กรุณาระบุสาเหตุของผลต่างที่พบ' : ''"
          >
            <BaseTextarea
              v-model="verificationNotes"
              :placeholder="verificationStatus === 'discrepancy' ? 'ระบุสาเหตุของผลต่าง เช่น เงินสดขาด X บาท เนื่องจาก...' : 'หมายเหตุเพิ่มเติม (ไม่บังคับ)'"
              :rows="3"
            />
          </FormField>
          <FormField v-if="verificationStatus === 'discrepancy'" label="การดำเนินการต่อ">
            <BaseTextarea
              v-model="followUpAction"
              placeholder="แผนการดำเนินการต่อ เช่น ตรวจสอบเพิ่มเติมในรอบถัดไป..."
              :rows="2"
            />
          </FormField>
        </div>

        <!-- Confirm Button -->
        <div class="flex justify-center pb-6">
          <ActionButton
            :permission="PERMISSIONS.EDIT_FINANCE"
            variant="primary"
            size="lg"
            :disabled="!isStep2FormValid"
            :loading="isSubmittingStep2"
            @click="handleConfirmVerification"
          >
            <CheckCircleIcon class="w-5 h-5" />
            ยืนยัน
          </ActionButton>
        </div>
    </section>

    <!-- CASE B: Read-only → CollapsibleSection (collapsed) -->
    <CollapsibleSection
      v-if="showCashCountSection && !canEditCashCount && !isOwner && !(isAuditor && store.isStep2Complete) && !isApproved"
      icon="💵"
      title="ผลการตรวจนับเงินสด"
      :badge="{ label: '✅ เสร็จสมบูรณ์', variant: 'success' }"
      :summary="cashVerificationSummary"
      class="mt-2"
    >
      <div class="-mx-6 -my-4">
        <MoneyTransferCashVerificationTable
          :expected-transfer-withdrawal="expectedTransferWithdrawal"
          :expected-service-fee="expectedServiceFee"
          :manager-actual="store.currentSummary?.step2?.actualCash ?? null"
          :has-discrepancies="store.currentSummary?.step2?.hasDiscrepancies"
          :verification-notes="store.currentSummary?.step2?.verificationNotes"
        />
      </div>
    </CollapsibleSection>

    <!-- ══════════════════════════════════════════════════════════════════ -->
    <!-- Section 6B: Auditor Review — Active Form                          -->
    <!-- Visible: Auditor role + step2 complete + NOT yet audited          -->
    <!-- ══════════════════════════════════════════════════════════════════ -->
    <section v-if="isAuditor && store.isStep2Complete && !store.isAudited" class="mt-6">
      <div class="flex items-center gap-3 mb-4">
        <h2 class="text-base font-semibold text-gray-700">🔍 ตรวจสอบบริการโอนเงิน</h2>
        <BaseBadge variant="warning" size="sm">⏳ รอตรวจสอบ</BaseBadge>
      </div>

      <!-- Balance Snapshot + Bank Statement input -->
      <div class="mb-5">
        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">ยอดเงินในบัญชี Bank</h3>
        <MoneyTransferBalanceSnapshot :opening-balance="openingBalance" :closing-balance="closingBalance">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <FormField label="Bank Statement แสดง">
              <div class="relative">
                <BaseInput v-model="bankStatementAmount" type="number" placeholder="0" />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">บาท</span>
              </div>
            </FormField>
            <div class="bg-gray-50 rounded-lg p-3 flex items-center self-end mb-1">
              <div>
                <div class="text-xs text-gray-500 mb-1">ผลต่าง (Bank Statement − ยอดปิด)</div>
                <div :class="['font-bold text-base', bankBalanceDiff === 0 ? 'text-green-700' : 'text-red-700']">
                  {{ bankBalanceDiff === 0 ? '✅ ตรงกัน' : (bankBalanceDiff > 0 ? '+' : '') + formatCurrency(bankBalanceDiff) }}
                </div>
              </div>
            </div>
          </div>
        </MoneyTransferBalanceSnapshot>
      </div>

      <!-- Transaction List (Collapsible) -->
      <div class="mb-5">
        <button
          class="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50 transition-colors"
          :class="showAuditorTransactions ? 'rounded-b-none border-b-0' : ''"
          @click="showAuditorTransactions = !showAuditorTransactions"
        >
          <div class="flex items-center gap-3">
            <component :is="showAuditorTransactions ? ChevronDownIcon : ChevronRightIcon" class="w-4 h-4 text-gray-500" />
            <span class="text-sm font-semibold text-gray-700">รายการธุรกรรม</span>
            <span class="text-sm text-gray-400">{{ auditTransactionList.length }} รายการ</span>
          </div>
          <BaseBadge :variant="txnsWithIssues > 0 ? 'warning' : 'success'" size="sm">
            {{ txnsWithIssues > 0 ? `⚠️ ${txnsWithIssues} รายการมีปัญหา` : '✅ ไม่พบปัญหา' }}
          </BaseBadge>
        </button>
        <div v-if="showAuditorTransactions" class="bg-white border border-gray-200 border-t-0 rounded-b-xl overflow-hidden">
          <MoneyTransferTransactionTable
            :transactions="auditTransactionList"
            :issued-ids="txnIssueStatus"
            empty-message="ยังไม่มีรายการธุรกรรมสำหรับวันนี้"
            @row-click="openVerifyModal"
          >
            <template #action-header>จัดการ</template>
            <template #actions="{ txn }">
              <button
                class="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                aria-label="ดูรายละเอียด"
                @click="openVerifyModal(txn)"
              >
                <EyeIcon class="w-4 h-4" />
              </button>
              <button
                :class="[
                  'px-2 py-1 rounded-lg text-xs font-medium transition-colors border',
                  txnIssueStatus[txn.id]
                    ? 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50',
                ]"
                @click="toggleTxnIssue(txn.id)"
              >
                <template v-if="txnIssueStatus[txn.id]">ยกเลิก</template>
                <template v-else>
                  <ExclamationTriangleIcon class="w-3.5 h-3.5 inline mr-0.5" />
                  มีปัญหา
                </template>
              </button>
            </template>
          </MoneyTransferTransactionTable>
          <div v-if="auditTransactionList.length > 0" class="px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-4 text-sm text-gray-600">
            <span>รวม {{ auditTransactionList.length }} รายการ</span>
            <span v-if="txnsWithIssues > 0" class="text-amber-700 font-medium">⚠️ พบปัญหา {{ txnsWithIssues }} รายการ</span>
            <span v-else class="text-green-700">✅ ไม่พบปัญหา</span>
          </div>
        </div>
      </div>

      <!-- Auditor Cash Count Table -->
      <div class="mb-5">
        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">ตรวจสอบยอดเงินสด</h3>
        <div class="bg-white border border-gray-200 rounded-xl p-4">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-xs text-gray-500 border-b border-gray-100">
                  <th class="text-left py-2 pr-4 font-medium">รายการ</th>
                  <th class="text-right py-2 px-4 font-medium">คาดหวัง</th>
                  <th class="text-right py-2 px-4 font-medium text-gray-600">Manager นับ</th>
                  <th class="text-right py-2 px-4 font-medium text-red-700">Auditor นับ</th>
                  <th class="text-right py-2 pl-4 font-medium">ผลต่าง</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr>
                  <td class="py-2 pr-4 font-medium text-gray-700">เงินสดโอน/ถอน</td>
                  <td class="py-2 px-4 text-right text-gray-700">{{ formatCurrency(expectedTransferWithdrawal) }}</td>
                  <td class="py-2 px-4 text-right text-gray-500">{{ formatCurrency(step2Data?.actualCash?.transferWithdrawal ?? 0) }}</td>
                  <td class="py-2 px-4 text-right">
                    <input
                      v-model.number="auditorCashTransferWithdrawal"
                      type="number"
                      min="0"
                      placeholder="0"
                      class="w-28 text-right px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-300 focus:border-red-500"
                    />
                  </td>
                  <td class="py-2 pl-4 text-right">
                    <span :class="['font-medium text-sm', auditorDiffTransferWithdrawal === null ? 'text-gray-400' : auditorDiffTransferWithdrawal === 0 ? 'text-green-700' : 'text-red-700']">
                      {{ formatDiff(auditorDiffTransferWithdrawal) }}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td class="py-2 pr-4 font-medium text-gray-700">ค่าบริการเงินสด</td>
                  <td class="py-2 px-4 text-right text-gray-700">{{ formatCurrency(expectedServiceFee) }}</td>
                  <td class="py-2 px-4 text-right text-gray-500">{{ formatCurrency(step2Data?.actualCash?.serviceFee ?? 0) }}</td>
                  <td class="py-2 px-4 text-right">
                    <input
                      v-model.number="auditorCashServiceFee"
                      type="number"
                      min="0"
                      placeholder="0"
                      class="w-28 text-right px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-300 focus:border-red-500"
                    />
                  </td>
                  <td class="py-2 pl-4 text-right">
                    <span :class="['font-medium text-sm', auditorDiffServiceFee === null ? 'text-gray-400' : auditorDiffServiceFee === 0 ? 'text-green-700' : 'text-red-700']">
                      {{ formatDiff(auditorDiffServiceFee) }}
                    </span>
                  </td>
                </tr>
                <tr class="bg-gray-50 font-semibold border-t border-gray-200">
                  <td class="py-2 pr-4 text-gray-800">รวม</td>
                  <td class="py-2 px-4 text-right text-gray-800">{{ formatCurrency(step2Data?.expectedCash?.total ?? 0) }}</td>
                  <td class="py-2 px-4 text-right text-gray-500">{{ formatCurrency(step2Data?.actualCash?.total ?? 0) }}</td>
                  <td class="py-2 px-4 text-right text-gray-700">{{ formatCurrency(auditorCashTotal) }}</td>
                  <td class="py-2 pl-4 text-right">
                    <span :class="['font-medium text-sm', auditorDiffTotal === null ? 'text-gray-400' : auditorDiffTotal === 0 ? 'text-green-700' : 'text-red-700 font-bold']">
                      {{ formatDiff(auditorDiffTotal) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Issue Details -->
      <div class="mb-6">
        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">รายละเอียดปัญหาที่พบ (ถ้ามี)</h3>
        <div class="bg-white border border-gray-200 rounded-xl p-4">
          <BaseTextarea
            v-model="issueDetails"
            placeholder="ระบุปัญหาที่พบ เช่น รายการที่ X ยอดเงินไม่ตรงกับ Bank Statement... (ว่างได้ถ้าไม่พบปัญหา)"
            :rows="3"
          />
        </div>
      </div>

      <div v-if="txnsWithIssues > 0" class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-medium">
        ⚠️ พบ {{ txnsWithIssues }} รายการมีปัญหาในรายการธุรกรรม
      </div>
      <div ref="auditorActionsRef" class="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <BaseButton variant="danger" @click="showAuditRejectConfirm = true">
          <XCircleIcon class="w-4 h-4" />
          ส่งคืนแก้ไข
        </BaseButton>
        <BaseButton variant="success" :disabled="!canSubmitAudit" @click="showAuditApproveConfirm = true">
          <CheckCircleIcon class="w-4 h-4" />
          ยืนยันการตรวจสอบ
        </BaseButton>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════════════ -->
    <!-- Section 6B: Audit Result — Read-only (ALL roles when audited)     -->
    <!-- ══════════════════════════════════════════════════════════════════ -->
    <CollapsibleSection
      v-if="store.isAudited"
      icon="🔍"
      title="ผลตรวจสอบ Auditor"
      :badge="{ label: '✅ ตรวจสอบแล้ว', variant: 'success' }"
      :summary="auditResultSummary"
      :expanded="isAuditor"
      class="mt-4"
    >

      <!-- Balance Snapshot read-only -->
      <div class="mb-5">
        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">ยอดเงินในบัญชี Bank</h3>
        <MoneyTransferBalanceSnapshot :opening-balance="openingBalance" :closing-balance="closingBalance">
          <div class="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg flex-wrap">
            <span class="text-sm text-gray-600">รายการเดินบัญชี:</span>
            <template v-if="auditData?.bankStatementAmount">
              <span class="text-sm font-semibold text-blue-800">{{ formatCurrency(auditData.bankStatementAmount) }}</span>
              <span class="text-gray-400 text-xs">(Auditor กรอก)</span>
            </template>
            <BaseBadge :variant="auditData?.bankStatementVerified ? 'success' : 'warning'" size="sm">
              {{ auditData?.bankStatementVerified ? '✅ ตรวจสอบแล้ว' : '⚠️ ไม่ได้ตรวจสอบ' }}
            </BaseBadge>
          </div>
        </MoneyTransferBalanceSnapshot>
      </div>

      <!-- Transaction List (read-only, with Auditor issue flags + summary footer) -->
      <div class="mb-5">
        <button
          class="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50 transition-colors"
          :class="showAuditorTxnsReadonly ? 'rounded-b-none border-b-0' : ''"
          @click="showAuditorTxnsReadonly = !showAuditorTxnsReadonly"
        >
          <div class="flex items-center gap-3">
            <component :is="showAuditorTxnsReadonly ? ChevronDownIcon : ChevronRightIcon" class="w-4 h-4 text-gray-500" />
            <span class="text-sm font-semibold text-gray-700">รายการธุรกรรม</span>
            <span class="text-sm text-gray-400">{{ auditTransactionList.length }} รายการ</span>
          </div>
          <BaseBadge :variant="(auditData?.transactionsWithIssues ?? 0) > 0 ? 'warning' : 'success'" size="sm">
            {{ (auditData?.transactionsWithIssues ?? 0) > 0 ? `⚠️ ${auditData?.transactionsWithIssues} รายการมีปัญหา` : '✅ ไม่พบปัญหา' }}
          </BaseBadge>
        </button>
        <div v-if="showAuditorTxnsReadonly" class="bg-white border border-gray-200 border-t-0 rounded-b-xl overflow-hidden">
          <MoneyTransferTransactionTable
            :transactions="auditTransactionList"
            :issued-ids="auditData?.txnIssueStatus"
            empty-message="ยังไม่มีรายการธุรกรรมสำหรับวันนี้"
            @row-click="openDetailModal"
          />
          <!-- Summary footer -->
          <div class="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-2">
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
              <span>ตรวจสอบ <strong class="text-gray-900">{{ auditData?.transactionsVerified ?? 0 }}</strong> รายการ</span>
              <span :class="(auditData?.transactionsWithIssues ?? 0) > 0 ? 'text-amber-700 font-medium' : ''">
                มีปัญหา <strong>{{ auditData?.transactionsWithIssues ?? 0 }}</strong> รายการ
              </span>
              <span class="text-gray-400">·</span>
              <span class="text-xs text-gray-500">
                โดย <strong class="text-gray-700">{{ auditData?.completedByName ?? '-' }}</strong>
                <template v-if="auditData?.completedAt"> · {{ formatDatetime(auditData?.completedAt as string) }}</template>
              </span>
            </div>
            <div v-if="auditData?.auditNotes" class="text-xs text-gray-500">
              หมายเหตุ: <span class="text-gray-700">{{ auditData.auditNotes }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Cash Verification (Manager + Auditor columns) -->
      <div class="mb-5">
        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">ตรวจสอบยอดเงินสด</h3>
        <MoneyTransferCashVerificationTable
          :expected-transfer-withdrawal="expectedTransferWithdrawal"
          :expected-service-fee="expectedServiceFee"
          :manager-actual="step2Data?.actualCash ?? null"
          :auditor-actual="auditData?.auditorCash ?? null"
        />
      </div>
    </CollapsibleSection>

    <!-- ══════════════════════════════════════════════════════════════════ -->
    <!-- Status Banner — No Action Available                               -->
    <!-- ══════════════════════════════════════════════════════════════════ -->
    <div
      v-if="showStatusBanner && statusBannerContent"
      class="rounded-xl border px-5 py-4 flex items-start gap-3 mb-4"
      :class="statusBannerContent.classes"
    >
      <component :is="statusBannerContent.icon" class="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        <p class="font-semibold">{{ statusBannerContent.title }}</p>
        <p class="text-sm mt-0.5 opacity-80">{{ statusBannerContent.description }}</p>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════ -->
    <!-- Sticky Action Bar (mobile only)                                   -->
    <!-- ══════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <!-- Auditor sticky actions -->
      <div
        v-if="showStickyAuditorActions"
        class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg px-4 py-3 flex items-center justify-between z-50 sm:hidden"
      >
        <BaseButton variant="danger" size="sm" @click="showAuditRejectConfirm = true">
          <XCircleIcon class="w-4 h-4" />
          ส่งคืนแก้ไข
        </BaseButton>
        <BaseButton variant="success" size="sm" :disabled="!canSubmitAudit" @click="showAuditApproveConfirm = true">
          <CheckCircleIcon class="w-4 h-4" />
          ยืนยันการตรวจสอบ
        </BaseButton>
      </div>
      <!-- Owner sticky actions -->
      <div
        v-if="showStickyOwnerActions"
        class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg px-4 py-3 flex items-center justify-between z-50 sm:hidden"
      >
        <BaseButton variant="danger" size="sm" :disabled="isSubmittingAction" @click="showOwnerRejectConfirm = true">
          <XCircleIcon class="w-4 h-4" />
          ส่งคืนแก้ไข
        </BaseButton>
        <ActionButton
          :permission="PERMISSIONS.EDIT_FINANCE"
          variant="primary"
          size="sm"
          :loading="isSubmittingAction"
          :disabled="!canApprove || isSubmittingAction"
          @click="showOwnerApproveConfirm = true"
        >
          <CheckCircleIcon class="w-4 h-4" />
          {{ decision === 'request_correction' ? 'ส่งคืน' : 'อนุมัติ ✅' }}
        </ActionButton>
      </div>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════════════ -->
    <!-- Modal O: Opening Balance -->
    <!-- ══════════════════════════════════════════════════════════════════ -->
    <BaseModal
      :open="showOpeningBalanceModal"
      title="💳 กำหนดยอดเงินในบัญชีเริ่มต้น"
      size="md"
      @close="showOpeningBalanceModal = false"
    >
      <div class="space-y-4">
        <!-- Carry-over option -->
        <label
          :class="[
            'flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors',
            openingSource === 'carryover' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300',
          ]"
        >
          <input v-model="openingSource" type="radio" value="carryover" class="mt-0.5 accent-blue-600" />
          <div class="flex-1">
            <div class="font-semibold text-gray-900">🔄 ใช้ยอดคงเหลือจากเมื่อวาน (Carry-over)</div>
            <div class="text-sm text-gray-500 mt-0.5">ยอดเงินคงเหลือ ณ สิ้นวันเมื่อวาน</div>
            <div class="mt-2 font-bold text-lg text-blue-700">
              <span v-if="store.previousDayBalance">{{ formatCurrency(carryoverAmount) }}</span>
              <span v-else class="text-sm font-normal text-gray-400">ไม่พบข้อมูลวันก่อนหน้า</span>
            </div>
          </div>
        </label>

        <!-- Manual option -->
        <label
          :class="[
            'flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors',
            openingSource === 'manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300',
          ]"
        >
          <input v-model="openingSource" type="radio" value="manual" class="mt-0.5 accent-blue-600" />
          <div class="flex-1">
            <div class="font-semibold text-gray-900">✏️ กำหนดเอง</div>
            <div class="text-sm text-gray-500 mt-0.5">ระบุยอดเงินเริ่มต้นด้วยตนเอง</div>
            <div v-if="openingSource === 'manual'" class="mt-3">
              <div class="relative" @click.stop>
                <BaseInput v-model="manualOpeningAmount" type="number" placeholder="0" min="0" />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">บาท</span>
              </div>
            </div>
          </div>
        </label>

        <!-- Preview -->
        <div class="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600">
          ยอดเงินในบัญชีที่จะตั้งต้น ({{ selectedDate }}):
          <strong class="text-gray-900 ml-1">
            {{ openingSource === 'carryover' ? formatCurrency(carryoverAmount) : formatCurrency(manualOpeningAmount) }}
          </strong>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton variant="secondary" @click="showOpeningBalanceModal = false">ยกเลิก</BaseButton>
          <BaseButton
            variant="primary"
            :disabled="openingSource === 'manual' && manualOpeningAmount < 0"
            :loading="isSettingOpeningBalance"
            @click="handleSetOpeningBalance"
          >
            💾 ยืนยันยอดเงินเริ่มต้น
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- ══════════════════════════════════════════════════════════════════ -->
    <!-- Modal A: Favorite Transfer -->
    <!-- ══════════════════════════════════════════════════════════════════ -->
    <BaseModal
      :open="showFavoriteModal"
      size="lg"
      @close="showFavoriteModal = false"
    >
      <template #header>
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div class="flex items-center gap-2">
            <StarIcon class="w-5 h-5 text-yellow-500" />
            <h2 class="text-lg font-bold text-gray-900">
              <span v-if="favStep === 1 && favMode === 'select'">รายการโปรด</span>
              <span v-else-if="favStep === 1 && favMode === 'manage'">⚙️ จัดการบัญชีโปรด</span>
              <span v-else-if="favStep === 1 && favMode === 'add'">➕ เพิ่มบัญชีโปรด</span>
              <span v-else-if="favStep === 1 && favMode === 'edit'">✏️ แก้ไขบัญชีโปรด</span>
              <span v-else>กรอกจำนวนเงิน</span>
            </h2>
          </div>
          <div class="text-sm text-gray-500">
            ยอดเงินในบัญชี:
            <span :class="isInsufficientFunds ? 'text-red-600 font-bold' : 'text-green-700 font-bold'">
              {{ formatCurrency(store.currentBalance?.bankAccount ?? 0) }}
            </span>
          </div>
        </div>
      </template>

      <!-- ── Step 1: เลือก / จัดการ / เพิ่ม / แก้ไข ─────────────────── -->
      <div v-if="favStep === 1">

        <!-- Tab Bar (#1 – #5) — visible in select & manage modes -->
        <div v-if="favMode === 'select' || favMode === 'manage'" class="flex border-b border-gray-200 mb-4 -mx-1">
          <button
            v-for="t in ([1,2,3,4,5] as const)"
            :key="t"
            class="flex-1 py-2 text-sm font-medium transition-colors"
            :class="favTab === t
              ? 'border-b-2 border-red-500 text-red-600'
              : 'text-gray-500 hover:text-gray-700'"
            @click="favTab = t; deletingFavoriteId = ''"
          >
            Tab #{{ t }}
            <span
              class="ml-1 text-xs rounded-full px-1.5 py-0.5"
              :class="favTab === t ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'"
            >
              {{ (store.favorites as any[]).filter((f: any) => f.tab === t).length }}
            </span>
          </button>
        </div>

        <!-- SELECT MODE: scrollable clickable list -->
        <div v-if="favMode === 'select'">
          <p class="text-sm text-gray-500 mb-3">คลิกชื่อเพื่อเลือกบัญชีปลายทาง</p>
          <div class="h-72 overflow-y-auto space-y-2 pr-1">
            <template v-if="favTabItems.length > 0">
              <button
                v-for="(fav, i) in favTabItems"
                :key="fav.id"
                class="w-full flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-colors text-left"
                @click="selectFavorite(fav)"
              >
                <div class="flex items-center gap-3">
                  <span class="text-yellow-500 font-bold text-sm w-6 text-center">★{{ i + 1 }}</span>
                  <div>
                    <div class="font-medium text-gray-900">{{ fav.name }}</div>
                    <div class="text-sm text-gray-500">
                      {{ fav.channel === 'promptpay' ? `พร้อมเพย์ · ${fav.identifierType === 'phone' ? 'เบอร์โทร' : 'บัตรประชาชน'}` : fav.bankName }} · {{ fav.identifier }}
                    </div>
                  </div>
                </div>
                <span class="text-gray-300 text-lg">›</span>
              </button>
            </template>
            <div v-else class="text-center py-12 text-gray-400">
              <p class="text-4xl mb-2">☆</p>
              <p class="text-sm">Tab #{{ favTab }} ยังไม่มีบัญชีโปรด</p>
              <p class="text-xs mt-1">กด ⚙️ จัดการ เพื่อเพิ่ม</p>
            </div>
          </div>
        </div>

        <!-- MANAGE MODE: list with edit/delete + delete confirm strip + add button -->
        <div v-else-if="favMode === 'manage'">
          <div class="h-64 overflow-y-auto space-y-2 pr-1">
            <template v-if="favTabItems.length > 0">
              <div v-for="(fav, i) in favTabItems" :key="fav.id">
                <!-- Item row -->
                <div
                  class="flex items-center justify-between p-3 border border-gray-200 rounded-xl"
                  :class="deletingFavoriteId === fav.id ? 'border-red-300 bg-red-50' : ''"
                >
                  <div class="flex items-center gap-3">
                    <span class="text-yellow-500 font-bold text-sm w-6 text-center">★{{ i + 1 }}</span>
                    <div>
                      <div class="font-medium text-gray-900 text-sm">{{ fav.name }}</div>
                      <div class="text-xs text-gray-500">
                        {{ fav.channel === 'promptpay' ? `พร้อมเพย์ · ${fav.identifierType === 'phone' ? 'เบอร์โทร' : 'บัตรประชาชน'}` : fav.bankName }} · {{ fav.identifier }}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      class="text-blue-500 hover:text-blue-700 text-sm p-1"
                      @click="openEditFavoriteForm(fav)"
                    >✏️</button>
                    <button
                      class="text-red-500 hover:text-red-700 text-sm p-1"
                      @click="deletingFavoriteId = deletingFavoriteId === fav.id ? '' : fav.id"
                    >🗑️</button>
                  </div>
                </div>
                <!-- Inline delete confirm -->
                <div v-if="deletingFavoriteId === fav.id" class="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-1">
                  <span class="text-sm text-red-700">ยืนยันลบ "{{ fav.name }}" ?</span>
                  <div class="flex gap-2">
                    <button class="text-sm text-gray-500 hover:text-gray-700" @click="deletingFavoriteId = ''">ยกเลิก</button>
                    <BaseButton size="sm" variant="danger" :loading="isSavingFavorite" @click="confirmDeleteFavorite">ลบ</BaseButton>
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="text-center py-10 text-gray-400">
              <p class="text-sm">Tab #{{ favTab }} ยังไม่มีบัญชีโปรด</p>
            </div>
          </div>
          <!-- Add button -->
          <div class="mt-3 pt-3 border-t border-gray-100">
            <button
              v-if="!favTabFull"
              class="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors"
              @click="openAddFavoriteForm"
            >
              ➕ เพิ่มบัญชีโปรดใน Tab #{{ favTab }}
            </button>
            <p v-else class="text-center text-sm text-gray-400 py-2">
              Tab #{{ favTab }} เต็มแล้ว (สูงสุด 10 รายการ)
            </p>
          </div>
        </div>

        <!-- ADD / EDIT FORM -->
        <div v-else-if="favMode === 'add' || favMode === 'edit'" class="space-y-4">
          <FormField label="ชื่อ / ฉายา" required>
            <BaseInput v-model="favFormData.name" placeholder="เช่น สมชาย, บ. ABC จำกัด" />
          </FormField>

          <FormField label="ช่องทาง" required>
            <div class="flex gap-6">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="favFormData.channel" value="bank" class="accent-red-500" />
                <span class="text-sm">ธนาคาร</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="favFormData.channel" value="promptpay" class="accent-red-500" />
                <span class="text-sm">พร้อมเพย์</span>
              </label>
            </div>
          </FormField>

          <!-- Bank: ชื่อธนาคาร dropdown + เลขบัญชี -->
          <template v-if="favFormData.channel === 'bank'">
            <FormField label="ชื่อธนาคาร" required>
              <select v-model="favFormData.bankName" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300">
                <option value="" disabled>-- เลือกธนาคาร --</option>
                <option v-for="bank in BANK_LIST" :key="bank" :value="bank">{{ bank }}</option>
              </select>
            </FormField>
            <FormField label="เลขบัญชีธนาคาร" required>
              <BaseInput v-model="favFormData.identifier" placeholder="เช่น 123-4-56789-0" />
            </FormField>
          </template>

          <!-- พร้อมเพย์: ประเภท radio + หมายเลข -->
          <template v-else-if="favFormData.channel === 'promptpay'">
            <FormField label="ประเภทพร้อมเพย์" required>
              <div class="flex gap-6">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" v-model="favFormData.identifierType" value="phone" class="accent-red-500" />
                  <span class="text-sm">หมายเลขโทรศัพท์</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" v-model="favFormData.identifierType" value="idcard" class="accent-red-500" />
                  <span class="text-sm">หมายเลขบัตรประชาชน</span>
                </label>
              </div>
            </FormField>
            <FormField :label="favFormData.identifierType === 'idcard' ? 'เลขบัตรประชาชน' : 'เบอร์โทรศัพท์'" required>
              <BaseInput
                v-model="favFormData.identifier"
                :placeholder="favFormData.identifierType === 'idcard' ? 'เช่น 1-2345-67890-12-3' : 'เช่น 081-234-5678'"
              />
            </FormField>
          </template>
        </div>
      </div>

      <!-- ── Step 2: กรอกจำนวนเงิน ─────────────────────────────────── -->
      <div v-else-if="favStep === 2 && selectedFavorite">
        <div class="bg-gray-50 rounded-xl p-4 mb-4">
          <div class="font-semibold text-gray-900">★ {{ selectedFavorite.name }}</div>
          <div class="text-sm text-gray-500 mt-0.5">
            {{ selectedFavorite.channel === 'promptpay' ? `พร้อมเพย์ · ${selectedFavorite.identifierType === 'phone' ? 'เบอร์โทร' : 'บัตรประชาชน'}` : selectedFavorite.bankName }} · {{ selectedFavorite.identifier }}
          </div>
        </div>

        <div class="space-y-4">
          <FormField label="จำนวนเงิน" required>
            <div class="relative">
              <BaseInput
                v-model="favAmount"
                type="number"
                placeholder="0"
                :error="isInsufficientFunds"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">บาท</span>
            </div>
            <div v-if="isInsufficientFunds" class="text-red-600 text-sm mt-1">
              ❌ ยอดเงินไม่เพียงพอ (ขาด {{ formatCurrency(favAmount - (store.currentBalance?.bankAccount ?? 0)) }})
            </div>
          </FormField>

          <FormField label="ค่าบริการ (บาท)">
            <template #label>
              <span class="flex items-center gap-1 text-sm font-medium text-gray-700">
                ค่าบริการ (บาท)
                <button
                  type="button"
                  :title="favIsCommissionManual ? 'รีเซ็ตเป็นอัตโนมัติ' : 'คำนวณอัตโนมัติ'"
                  class="transition-colors leading-none"
                  :class="favIsCommissionManual ? 'text-gray-400 hover:text-blue-500' : 'text-blue-500'"
                  @click="favIsCommissionManual = false"
                >🔄</button>
              </span>
            </template>
            <div
              class="flex rounded-lg border overflow-hidden focus-within:ring-2 focus-within:ring-primary"
              :class="favIsCommissionManual ? 'border-amber-400' : 'border-gray-300'"
            >
              <input
                :value="favEffectiveCommission"
                type="number"
                inputmode="numeric"
                placeholder="0"
                min="0"
                step="1"
                class="flex-1 px-3 py-2 text-sm outline-none min-w-0"
                @input="favManualCommission = Number(($event.target as HTMLInputElement).value); favIsCommissionManual = true"
              />
              <template v-if="favEffectiveCommission > 0">
                <button
                  type="button"
                  class="px-3 py-2 text-xs font-medium transition-colors border-l"
                  :class="[
                    favIsCommissionManual ? 'border-amber-400' : 'border-gray-300',
                    favCommissionType === 'cash' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  ]"
                  @click="favCommissionType = 'cash'"
                >สด</button>
                <button
                  type="button"
                  class="px-3 py-2 text-xs font-medium transition-colors border-l"
                  :class="[
                    favIsCommissionManual ? 'border-amber-400' : 'border-gray-300',
                    favCommissionType === 'transfer' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  ]"
                  @click="favCommissionType = 'transfer'"
                >โอน</button>
              </template>
            </div>
          </FormField>

          <div
            v-if="Number(favAmount) > 0"
            class="rounded-lg px-3 py-2.5 text-sm flex items-center justify-between gap-2"
            :class="favBannerInfo.ok
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-amber-50 border border-amber-200 text-amber-800'"
          >
            <div class="flex items-center gap-2 font-medium">
              <span>{{ favBannerInfo.ok ? '✅' : '⚠️' }}</span>
              <span class="text-xs opacity-70">{{ favBannerInfo.balanceLabel }}</span>
              <span>{{ formatCurrency(favBannerInfo.current) }}</span>
              <span class="opacity-50">→</span>
              <span :class="favBannerInfo.ok ? 'text-green-700 font-semibold' : 'text-amber-700 font-semibold'">
                {{ formatCurrency(favBannerInfo.after) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Footer ────────────────────────────────────────────────── -->
      <template #footer>
        <!-- Step 1 footers -->
        <div v-if="favStep === 1">
          <!-- select mode -->
          <div v-if="favMode === 'select'" class="flex items-center justify-between">
            <BaseButton variant="secondary" @click="showFavoriteModal = false">ยกเลิก</BaseButton>
            <BaseButton variant="ghost" @click="favMode = 'manage'">⚙️ จัดการ</BaseButton>
          </div>
          <!-- manage mode -->
          <div v-else-if="favMode === 'manage'" class="flex items-center justify-between">
            <BaseButton variant="secondary" @click="showFavoriteModal = false">ปิด</BaseButton>
            <BaseButton variant="primary" @click="favMode = 'select'">✓ เสร็จสิ้น</BaseButton>
          </div>
          <!-- add / edit form -->
          <div v-else class="flex items-center justify-between">
            <BaseButton variant="ghost" @click="favMode = 'manage'">← ย้อนกลับ</BaseButton>
            <BaseButton
              variant="primary"
              :loading="isSavingFavorite"
              :disabled="!favFormData.name.trim() || !favFormData.identifier.trim() || (favFormData.channel === 'bank' && !favFormData.bankName.trim())"
              @click="handleSaveFavorite"
            >
              {{ favMode === 'edit' ? '💾 บันทึกการแก้ไข' : '➕ เพิ่มบัญชีโปรด' }}
            </BaseButton>
          </div>
        </div>
        <!-- Step 2 footer -->
        <div v-else class="flex items-center justify-between">
          <BaseButton variant="ghost" @click="favStep = 1">← เลือกบัญชีอื่น</BaseButton>
          <div class="flex gap-2">
            <BaseButton variant="secondary" @click="showFavoriteModal = false">ยกเลิก</BaseButton>
            <BaseButton
              :variant="isInsufficientFunds ? 'secondary' : 'primary'"
              :disabled="favAmount <= 0"
              @click="handleSubmitFavorite"
            >
              {{ isInsufficientFunds ? '⏸️ บันทึกเป็น Draft' : '💾 โอนเงิน' }}
            </BaseButton>
          </div>
        </div>
      </template>
    </BaseModal>

    <!-- ══════════════════════════════════════════════════════════════════ -->
    <!-- Modal B: New / Edit Transaction -->
    <!-- ══════════════════════════════════════════════════════════════════ -->
    <BaseModal
      :open="showTransactionModal"
      :title="editingTransaction ? '✏️ แก้ไขรายการ' : '📝 รายการใหม่'"
      size="xl"
      @close="showTransactionModal = false"
    >
      <TransactionForm
        v-if="showTransactionModal && store.currentBalance"
        :current-balance="store.currentBalance"
        :recorded-by="currentUser.uid"
        :recorded-by-name="currentUser.displayName"
        :editing-data="editingTransaction"
        :preset-type="presetType || undefined"
        @submit="handleSubmitTransaction"
        @cancel="showTransactionModal = false"
      />
    </BaseModal>

    <!-- ══════════════════════════════════════════════════════════════════ -->
    <!-- Transaction Detail Modal -->
    <!-- ══════════════════════════════════════════════════════════════════ -->
    <BaseModal
      :open="showDetailModal"
      size="md"
      @close="showDetailModal = false"
    >
      <template #header>
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-bold text-gray-900">รายละเอียดรายการ</h2>
          <BaseBadge
            v-if="viewingTransaction"
            :variant="getStatusBadgeVariant(viewingTransaction.status)"
            size="md"
            dot
          >
            {{ getStatusLabel(viewingTransaction.status) }}
          </BaseBadge>
        </div>
      </template>

      <div v-if="viewingTransaction" class="space-y-3 text-sm">
        <div v-if="viewingTransaction.status === 'draft'" class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800">
          ⚠️ รายการนี้อยู่ในสถานะ Draft — รอดำเนินการ
        </div>

        <div class="grid grid-cols-2 gap-x-4 gap-y-3">
          <!-- Bank channel -->
          <template v-if="viewingTransaction.channel === 'bank' || viewingTransaction.channel === 'other'">
            <div class="col-span-2">
              <div class="text-gray-500">ธนาคาร</div>
              <div class="font-medium text-gray-900">{{ viewingTransaction.bankName || '-' }}</div>
            </div>
            <div>
              <div class="text-gray-500">เลขบัญชี</div>
              <div class="font-medium text-gray-900">{{ viewingTransaction.accountNumber || '-' }}</div>
            </div>
            <div>
              <div class="text-gray-500">ชื่อบัญชี</div>
              <div class="font-medium text-gray-900">{{ viewingTransaction.accountName || '-' }}</div>
            </div>
          </template>

          <!-- PromptPay channel -->
          <template v-else-if="viewingTransaction.channel === 'promptpay'">
            <div class="col-span-2">
              <div class="text-gray-500">ช่องทาง</div>
              <div class="font-medium text-gray-900">พร้อมเพย์</div>
            </div>
            <div>
              <div class="text-gray-500">{{ viewingTransaction.promptpayIdentifierType === 'id_card' ? 'เลขบัตรประชาชน' : 'หมายเลขโทรศัพท์' }}</div>
              <div class="font-medium text-gray-900">{{ viewingTransaction.promptpayIdentifier || '-' }}</div>
            </div>
            <div>
              <div class="text-gray-500">ชื่อบัญชี</div>
              <div class="font-medium text-gray-900">{{ viewingTransaction.promptpayAccountName || viewingTransaction.accountName || '-' }}</div>
            </div>
          </template>

          <div>
            <div class="text-gray-500">ประเภท</div>
            <div class="font-medium text-gray-900">{{ getTransactionTypeLabel(viewingTransaction.transactionType) }}</div>
          </div>
          <div v-if="viewingTransaction.transactionType === 'owner_deposit'">
            <div class="text-gray-500">ช่องทาง</div>
            <div class="font-medium text-gray-900">{{ getChannelLabel(viewingTransaction.channel) }}</div>
          </div>
          <div>
            <div class="text-gray-500">วันที่/เวลา</div>
            <div class="font-medium text-gray-900">{{ formatDatetime(viewingTransaction.datetime) }}</div>
          </div>
          <div>
            <div class="text-gray-500">จำนวนเงิน</div>
            <div class="font-bold text-gray-900 text-base">{{ formatCurrency(viewingTransaction.amount) }}</div>
          </div>
          <div v-if="viewingTransaction.commission && viewingTransaction.transactionType !== 'owner_deposit'">
            <div class="text-gray-500">ค่าบริการ</div>
            <div class="font-medium text-green-700">{{ formatCurrency(viewingTransaction.commission) }}
              <span class="text-xs text-gray-400">({{ viewingTransaction.commissionType === 'cash' ? 'เงินสด' : 'โอน' }})</span>
            </div>
          </div>
          <div v-if="viewingTransaction.destinationName">
            <div class="text-gray-500">ชื่อปลายทาง</div>
            <div class="font-medium text-gray-900">{{ viewingTransaction.destinationName }}</div>
          </div>
          <div v-if="viewingTransaction.destinationIdentifier">
            <div class="text-gray-500">หมายเลขบัญชี</div>
            <div class="font-medium text-gray-900">{{ viewingTransaction.destinationIdentifier }}</div>
          </div>
          <div v-if="viewingTransaction.customerName">
            <div class="text-gray-500">ชื่อลูกค้า</div>
            <div class="font-medium text-gray-900">{{ viewingTransaction.customerName }}</div>
          </div>
        </div>

        <div v-if="viewingTransaction.notes" class="bg-gray-50 rounded-lg p-3">
          <div class="text-gray-500 mb-1">หมายเหตุ</div>
          <div class="text-gray-900">{{ viewingTransaction.notes }}</div>
        </div>

        <!-- Balance Impact -->
        <div v-if="viewingTransaction.balanceImpact && viewingTransaction.status === 'completed'" class="border-t border-gray-100 pt-3">
          <div class="text-gray-500 text-xs font-medium mb-2 uppercase tracking-wide">ผลกระทบต่อยอดเงิน</div>
          <div class="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
            <div class="grid grid-cols-3 gap-2 text-xs text-gray-400 font-medium pb-1 border-b border-gray-200">
              <span>บัญชี</span>
              <span class="text-right">ก่อน</span>
              <span class="text-right">หลัง</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-gray-600">เงินในบัญชี</span>
              <span class="text-right text-gray-700">{{ formatCurrency(viewingTransaction.balanceImpact.bankAccountBefore) }}</span>
              <span class="text-right font-semibold" :class="viewingTransaction.balanceImpact.bankAccountAfter === viewingTransaction.balanceImpact.bankAccountBefore ? 'text-gray-900' : viewingTransaction.balanceImpact.bankAccountAfter > viewingTransaction.balanceImpact.bankAccountBefore ? 'text-green-700' : 'text-red-600'">
                {{ formatCurrency(viewingTransaction.balanceImpact.bankAccountAfter) }}
              </span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-gray-600">เงินสด (โอน/ถอน)</span>
              <span class="text-right text-gray-700">{{ formatCurrency(viewingTransaction.balanceImpact.transferCashBefore) }}</span>
              <span class="text-right font-semibold" :class="viewingTransaction.balanceImpact.transferCashAfter === viewingTransaction.balanceImpact.transferCashBefore ? 'text-gray-900' : viewingTransaction.balanceImpact.transferCashAfter > viewingTransaction.balanceImpact.transferCashBefore ? 'text-green-700' : 'text-red-600'">
                {{ formatCurrency(viewingTransaction.balanceImpact.transferCashAfter) }}
              </span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-gray-600">ค่าบริการ (เงินสด)</span>
              <span class="text-right text-gray-700">{{ formatCurrency(viewingTransaction.balanceImpact.serviceFeeBeforeCash) }}</span>
              <span class="text-right font-semibold" :class="viewingTransaction.balanceImpact.serviceFeeAfterCash === viewingTransaction.balanceImpact.serviceFeeBeforeCash ? 'text-gray-900' : 'text-green-700'">{{ formatCurrency(viewingTransaction.balanceImpact.serviceFeeAfterCash) }}</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-gray-600">ค่าบริการ (โอน)</span>
              <span class="text-right text-gray-700">{{ formatCurrency(viewingTransaction.balanceImpact.serviceFeeBeforeTransfer) }}</span>
              <span class="text-right font-semibold" :class="viewingTransaction.balanceImpact.serviceFeeAfterTransfer === viewingTransaction.balanceImpact.serviceFeeBeforeTransfer ? 'text-gray-900' : 'text-green-700'">{{ formatCurrency(viewingTransaction.balanceImpact.serviceFeeAfterTransfer) }}</span>
            </div>
          </div>
        </div>

        <div v-if="viewingTransaction.status === 'draft'" class="border-t border-gray-100 pt-3 flex gap-2 justify-end">
          <ActionButton
            :permission="PERMISSIONS.EDIT_FINANCE"
            variant="secondary"
            size="sm"
            @click="openEditModal(viewingTransaction); showDetailModal = false"
          >
            <PencilIcon class="w-4 h-4" />
            แก้ไข
          </ActionButton>
          <ActionButton
            v-if="canCompleteDraft(viewingTransaction)"
            :permission="PERMISSIONS.EDIT_FINANCE"
            variant="success"
            size="sm"
            @click="handleCompleteDraft(viewingTransaction.id); showDetailModal = false"
          >
            <CheckCircleIcon class="w-4 h-4" />
            ดำเนินการ
          </ActionButton>
          <ActionButton
            :permission="PERMISSIONS.EDIT_FINANCE"
            variant="danger"
            size="sm"
            @click="confirmDelete(viewingTransaction.id); showDetailModal = false"
          >
            <TrashIcon class="w-4 h-4" />
            ลบ
          </ActionButton>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <BaseButton variant="secondary" @click="showDetailModal = false">ปิด</BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- ══════════════════════════════════════════════════════════════════ -->
    <!-- Delete Confirm Dialog -->
    <!-- ══════════════════════════════════════════════════════════════════ -->
    <ConfirmDialog
      :open="showDeleteConfirm"
      title="ยืนยันการลบ"
      message="ต้องการลบรายการนี้หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้"
      confirm-text="ลบรายการ"
      cancel-text="ยกเลิก"
      variant="danger"
      @confirm="handleDeleteTransaction"
      @cancel="showDeleteConfirm = false"
    />

    <!-- ══════════════════════════════════════════════════════════════════ -->
    <!-- Verify Transaction Modal (Auditor)                                -->
    <!-- ══════════════════════════════════════════════════════════════════ -->
    <BaseModal :open="showVerifyModal" size="md" @close="showVerifyModal = false">
      <template #header>
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-bold text-gray-900">รายละเอียดรายการ</h2>
          <BaseBadge
            v-if="verifyingTransaction"
            :variant="getStatusBadgeVariant(verifyingTransaction.status)"
            size="md"
            dot
          >
            {{ getStatusLabel(verifyingTransaction.status) }}
          </BaseBadge>
        </div>
      </template>

      <div v-if="verifyingTransaction" class="space-y-3 text-sm">
        <div class="grid grid-cols-2 gap-x-4 gap-y-3">
          <template v-if="verifyingTransaction.channel === 'bank' || verifyingTransaction.channel === 'other'">
            <div class="col-span-2">
              <div class="text-gray-500">ธนาคาร</div>
              <div class="font-medium text-gray-900">{{ verifyingTransaction.bankName || '-' }}</div>
            </div>
            <div>
              <div class="text-gray-500">เลขบัญชี</div>
              <div class="font-medium text-gray-900">{{ verifyingTransaction.accountNumber || '-' }}</div>
            </div>
            <div>
              <div class="text-gray-500">ชื่อบัญชี</div>
              <div class="font-medium text-gray-900">{{ verifyingTransaction.accountName || '-' }}</div>
            </div>
          </template>
          <template v-else-if="verifyingTransaction.channel === 'promptpay'">
            <div class="col-span-2">
              <div class="text-gray-500">ช่องทาง</div>
              <div class="font-medium text-gray-900">พร้อมเพย์</div>
            </div>
            <div>
              <div class="text-gray-500">{{ verifyingTransaction.promptpayIdentifierType === 'idcard' ? 'เลขบัตรประชาชน' : 'หมายเลขโทรศัพท์' }}</div>
              <div class="font-medium text-gray-900">{{ verifyingTransaction.promptpayIdentifier || '-' }}</div>
            </div>
            <div>
              <div class="text-gray-500">ชื่อบัญชี</div>
              <div class="font-medium text-gray-900">{{ verifyingTransaction.promptpayAccountName || verifyingTransaction.accountName || '-' }}</div>
            </div>
          </template>
          <div>
            <div class="text-gray-500">ประเภท</div>
            <div class="font-medium text-gray-900">{{ getTransactionTypeLabel(verifyingTransaction.transactionType) }}</div>
          </div>
          <div>
            <div class="text-gray-500">วันที่/เวลา</div>
            <div class="font-medium text-gray-900">{{ formatDatetime(verifyingTransaction.datetime) }}</div>
          </div>
          <div>
            <div class="text-gray-500">จำนวนเงิน</div>
            <div class="font-bold text-gray-900 text-base">{{ formatCurrency(verifyingTransaction.amount) }}</div>
          </div>
          <div v-if="verifyingTransaction.commission && verifyingTransaction.transactionType !== 'owner_deposit'">
            <div class="text-gray-500">ค่าบริการ</div>
            <div class="font-medium text-green-700">
              {{ formatCurrency(verifyingTransaction.commission) }}
              <span class="text-xs text-gray-400">({{ verifyingTransaction.commissionType === 'cash' ? 'เงินสด' : 'โอน' }})</span>
            </div>
          </div>
        </div>

        <div v-if="verifyingTransaction.notes" class="bg-gray-50 rounded-lg p-3">
          <div class="text-gray-500 mb-1">หมายเหตุ</div>
          <div class="text-gray-900">{{ verifyingTransaction.notes }}</div>
        </div>

        <!-- Balance Impact -->
        <div v-if="verifyingTransaction.balanceImpact && verifyingTransaction.status === 'completed'" class="border-t border-gray-100 pt-3">
          <div class="text-gray-500 text-xs font-medium mb-2 uppercase tracking-wide">ผลกระทบต่อยอดเงิน</div>
          <div class="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
            <div class="grid grid-cols-3 gap-2 text-xs text-gray-400 font-medium pb-1 border-b border-gray-200">
              <span>บัญชี</span>
              <span class="text-right">ก่อน</span>
              <span class="text-right">หลัง</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-gray-600">เงินในบัญชี</span>
              <span class="text-right text-gray-700">{{ formatCurrency(verifyingTransaction.balanceImpact.bankAccountBefore) }}</span>
              <span class="text-right font-semibold" :class="verifyingTransaction.balanceImpact.bankAccountAfter === verifyingTransaction.balanceImpact.bankAccountBefore ? 'text-gray-900' : verifyingTransaction.balanceImpact.bankAccountAfter > verifyingTransaction.balanceImpact.bankAccountBefore ? 'text-green-700' : 'text-red-600'">
                {{ formatCurrency(verifyingTransaction.balanceImpact.bankAccountAfter) }}
              </span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-gray-600">เงินสด (โอน/ถอน)</span>
              <span class="text-right text-gray-700">{{ formatCurrency(verifyingTransaction.balanceImpact.transferCashBefore) }}</span>
              <span class="text-right font-semibold" :class="verifyingTransaction.balanceImpact.transferCashAfter === verifyingTransaction.balanceImpact.transferCashBefore ? 'text-gray-900' : verifyingTransaction.balanceImpact.transferCashAfter > verifyingTransaction.balanceImpact.transferCashBefore ? 'text-green-700' : 'text-red-600'">
                {{ formatCurrency(verifyingTransaction.balanceImpact.transferCashAfter) }}
              </span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-gray-600">ค่าบริการ (เงินสด)</span>
              <span class="text-right text-gray-700">{{ formatCurrency(verifyingTransaction.balanceImpact.serviceFeeBeforeCash) }}</span>
              <span class="text-right font-semibold" :class="verifyingTransaction.balanceImpact.serviceFeeAfterCash === verifyingTransaction.balanceImpact.serviceFeeBeforeCash ? 'text-gray-900' : 'text-green-700'">{{ formatCurrency(verifyingTransaction.balanceImpact.serviceFeeAfterCash) }}</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-gray-600">ค่าบริการ (โอน)</span>
              <span class="text-right text-gray-700">{{ formatCurrency(verifyingTransaction.balanceImpact.serviceFeeBeforeTransfer) }}</span>
              <span class="text-right font-semibold" :class="verifyingTransaction.balanceImpact.serviceFeeAfterTransfer === verifyingTransaction.balanceImpact.serviceFeeBeforeTransfer ? 'text-gray-900' : 'text-green-700'">{{ formatCurrency(verifyingTransaction.balanceImpact.serviceFeeAfterTransfer) }}</span>
            </div>
          </div>
        </div>

        <!-- Issue toggle (only when not yet audited) -->
        <div v-if="!store.isAudited && isAuditor" class="border-t border-gray-100 pt-3">
          <div class="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">ผลการตรวจสอบ</div>
          <div class="flex gap-2">
            <button
              :class="[
                'flex-1 py-2 px-3 rounded-lg border font-medium text-sm transition-colors',
                !txnIssueStatus[verifyingTransaction.id]
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-green-700 border-green-300 hover:bg-green-50',
              ]"
              @click="() => { if (txnIssueStatus[verifyingTransaction.id]) toggleTxnIssue(verifyingTransaction.id) }"
            >
              ✅ ถูกต้อง
            </button>
            <button
              :class="[
                'flex-1 py-2 px-3 rounded-lg border font-medium text-sm transition-colors',
                txnIssueStatus[verifyingTransaction.id]
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-red-700 border-red-300 hover:bg-red-50',
              ]"
              @click="() => { if (!txnIssueStatus[verifyingTransaction.id]) toggleTxnIssue(verifyingTransaction.id) }"
            >
              ⚠️ มีปัญหา
            </button>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <BaseButton variant="secondary" @click="showVerifyModal = false">ปิด</BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Audit Approve Confirm -->
    <ConfirmDialog
      :open="showAuditApproveConfirm"
      title="ยืนยันการตรวจสอบ"
      message="ยืนยันผลการ Audit และส่งให้ Owner อนุมัติหรือไม่?"
      confirm-text="ยืนยันการตรวจสอบ"
      cancel-text="ยกเลิก"
      variant="success"
      @confirm="handleApproveAudit"
      @cancel="showAuditApproveConfirm = false"
    />

    <!-- Audit Reject Confirm -->
    <ConfirmDialog
      :open="showAuditRejectConfirm"
      title="ส่งคืนให้ Manager แก้ไข"
      message="ต้องการส่งคืนรายการนี้ให้ Manager แก้ไขหรือไม่? กรุณาระบุรายละเอียดปัญหาในช่องด้านบนก่อน"
      confirm-text="ส่งคืนแก้ไข"
      cancel-text="ยกเลิก"
      variant="warning"
      @confirm="handleRejectAudit"
      @cancel="showAuditRejectConfirm = false"
    />

    <!-- Owner Approve Confirm -->
    <ConfirmDialog
      :open="showOwnerApproveConfirm"
      :title="decision === 'request_correction' ? 'ยืนยันส่งคืนแก้ไข?' : 'ยืนยันการอนุมัติ?'"
      :message="decision === 'request_correction' ? 'ต้องการส่งคืนให้ Auditor/Manager แก้ไขใช่หรือไม่?' : 'ต้องการอนุมัติรายการประจำวันนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้'"
      :confirm-label="decision === 'request_correction' ? 'ส่งคืนแก้ไข' : 'ยืนยันอนุมัติ'"
      :confirm-variant="decision === 'request_correction' ? 'danger' : 'primary'"
      :loading="isSubmittingAction"
      @confirm="handleSubmitApproval"
      @cancel="showOwnerApproveConfirm = false"
    />

    <!-- Owner Reject Confirm -->
    <ConfirmDialog
      :open="showOwnerRejectConfirm"
      title="ยืนยันส่งคืนแก้ไข?"
      message="ต้องการส่งคืนให้ Auditor/Manager แก้ไขใช่หรือไม่?"
      confirm-label="ส่งคืน"
      confirm-variant="danger"
      :loading="isSubmittingAction"
      @confirm="handleRequestCorrection"
      @cancel="showOwnerRejectConfirm = false"
    />
  </PageWrapper>
</template>
