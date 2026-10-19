<script setup lang="ts">
import { useBillPaymentStore } from '~/stores/bill-payment'
import { useLogger } from '~/composables/useLogger'
import { usePermissions } from '~/composables/usePermissions'
import { useBillPaymentHelpers } from '~/composables/useBillPaymentHelpers'
import { PERMISSIONS } from '~/types/permissions'
import type { BillPaymentTransaction, BillPaymentTransactionStatus, BillPaymentFavorite } from '~/types/bill-payment'
import type { TableColumn, FilterTab } from '~/components/shared/TransactionTable.vue'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  DocumentTextIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'

const props = defineProps<{
  date: string
  currentUser: { uid: string; displayName: string }
}>()

const emit = defineEmits<{
  'step1-completed': []
}>()

const logger = useLogger('BPManagerRecordingSection')
const store = useBillPaymentStore()
const { can } = usePermissions()
const {
  formatAmount,
  formatTime,
  formatBillType,
  formatTransactionType,
  getStatusLabel,
  getStatusBadgeVariant,
} = useBillPaymentHelpers()

// ─── Workflow ─────────────────────────────────────────────────────────────────
const workflowStatus = computed(() => store.getCurrentWorkflowStatus)
const isNeedsCorrection = computed(() => workflowStatus.value === 'needs_correction')
const isStep1InProgress = computed(() => workflowStatus.value === 'step1_in_progress')

// ─── Transactions ─────────────────────────────────────────────────────────────
const dateTransactions = computed(() => store.getTransactionsByDate(props.date))

// ─── Filter Tabs ──────────────────────────────────────────────────────────────
const activeFilter = ref('all')

const filterTabs = computed<FilterTab[]>(() => [
  { key: 'all', label: 'ทั้งหมด', count: dateTransactions.value.length },
  { key: 'completed', label: 'สำเร็จ', count: dateTransactions.value.filter((t: any) => t.status === 'completed').length },
  { key: 'draft', label: 'รอดำเนินการ', count: dateTransactions.value.filter((t: any) => t.status === 'draft').length },
  { key: 'on_hold', label: 'พักรายการ', count: dateTransactions.value.filter((t: any) => t.status === 'on_hold').length },
  { key: 'cancelled', label: 'ยกเลิก', count: dateTransactions.value.filter((t: any) => t.status === 'cancelled').length },
])

const filteredTransactions = computed(() => {
  if (activeFilter.value === 'all') return dateTransactions.value
  return dateTransactions.value.filter((t: any) => t.status === activeFilter.value)
})

// ─── Table Columns ────────────────────────────────────────────────────────────
const bpColumns: TableColumn[] = [
  { key: 'transactionType', label: 'ประเภท', component: 'type' },
  { key: 'customerName', label: 'ลูกค้า', formatter: (v) => v || '-' },
  { key: 'amount', label: 'จำนวนเงิน', align: 'right', component: 'amount' },
  { key: 'commission', label: 'ค่าธรรมเนียม', align: 'right', component: 'commission' },
  { key: 'status', label: 'สถานะ', align: 'center', component: 'status' },
  { key: 'timestamp', label: 'เวลา', formatter: (v) => formatTime(v) },
]

const totalOwnerDeposit = computed(() =>
  dateTransactions.value
    .filter((t: any) => t.transactionType === 'owner_deposit' && t.status === 'completed')
    .reduce((sum: number, t: any) => sum + (t.amount ?? 0), 0)
)

// ─── Alerts ───────────────────────────────────────────────────────────────────
const successMessage = ref('')
const errorMessage = ref('')

// ─── Step 1 completion ────────────────────────────────────────────────────────
const isCompletingStep1 = ref(false)

// ─── Opening Balance ──────────────────────────────────────────────────────────
const showOpeningBalanceModal = ref(false)
const openingSource = ref<'carryover' | 'manual'>('carryover')
const manualOpeningAmount = ref<number>(0)
const isSettingOpeningBalance = ref(false)

const isOpeningSet = computed(() => store.currentBalance?.openingBalanceSource != null)
// Only gate actions on opening-balance when workflow is still in Step 1.
// Past Step 1 (completed/audited/approved), editing is governed by workflow status, not opening balance.
const needsOpeningBalance = computed(() => isStep1InProgress.value && !isOpeningSet.value)
// Manager can edit/delete only while workflow is still mutable (Step 1 or sent back for correction)
const canManagerEdit = computed(() => isStep1InProgress.value || isNeedsCorrection.value)
// Reason a row's edit/delete is disabled (drives tooltip message)
const disableReason = computed(() => {
  if (!canManagerEdit.value) return 'รายการนี้ผ่านขั้นตอนแก้ไขแล้ว ไม่สามารถแก้ไข/ลบได้'
  if (needsOpeningBalance.value) return 'กรุณาตั้ง Opening Balance ก่อน'
  return ''
})
const isRowActionDisabled = computed(() => !canManagerEdit.value || needsOpeningBalance.value)
const carryoverAmount = computed(() => store.previousDayBalance?.bankAccount ?? 0)
const noDraftPending = computed(() => store.getDraftTransactions.length === 0)
const noOnHoldPending = computed(() => store.getOnHoldTransactions.length === 0)
const canCompleteStep1 = computed(
  () =>
    isOpeningSet.value &&
    dateTransactions.value.length > 0 &&
    noDraftPending.value &&
    noOnHoldPending.value &&
    !isCompletingStep1.value
)

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
    await store.setOpeningBalance(props.date, amount, openingSource.value, props.currentUser.uid)
    showOpeningBalanceModal.value = false
    successMessage.value = `กำหนดยอดเงินเริ่มต้น ${formatAmount(amount)} สำเร็จ`
    logger.log('Opening balance set', { amount, source: openingSource.value })
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to set opening balance', err)
  } finally {
    isSettingOpeningBalance.value = false
  }
}

// ─── Transaction modal ────────────────────────────────────────────────────────
const showTransactionModal = ref(false)
const editingTransaction = ref<BillPaymentTransaction | null>(null)
const transactionPresetType = ref<'bill_payment' | 'owner_deposit' | ''>('')

function openNewTransaction(type: 'bill_payment' | 'owner_deposit' | '' = '') {
  if (!canManagerEdit.value) return
  if (needsOpeningBalance.value) {
    openOpeningBalanceModal()
    return
  }
  editingTransaction.value = null
  transactionPresetType.value = type
  showTransactionModal.value = true
}

function openEditTransaction(txn: BillPaymentTransaction) {
  if (!canManagerEdit.value) return
  if (needsOpeningBalance.value) {
    openOpeningBalanceModal()
    return
  }
  editingTransaction.value = txn
  showTransactionModal.value = true
}

function closeModal() {
  showTransactionModal.value = false
  editingTransaction.value = null
}

async function handleFormSubmit(formData: {
  transactionType: 'bill_payment' | 'owner_deposit'
  billType?: 'utility' | 'telecom' | 'loan' | 'other'
  amount: number
  commission: number
  customerName?: string
  status?: BillPaymentTransactionStatus
  statusNote?: string
  notes?: string
}) {
  errorMessage.value = ''
  try {
    const payload = {
      date: props.date,
      ...formData,
      recordedBy: props.currentUser.uid,
      recordedAt: new Date().toISOString(),
    }

    if (editingTransaction.value) {
      await store.updateTransaction(editingTransaction.value.id, payload)
      successMessage.value = 'แก้ไขรายการสำเร็จ'
    } else {
      const created = await store.createTransaction(payload)
      successMessage.value = created.status === 'draft' ? QUEUED_MESSAGE : 'เพิ่มรายการสำเร็จ'
    }

    closeModal()
    logger.log('Transaction saved for', props.date)
  } catch (err: any) {
    errorMessage.value = err.message ?? 'เกิดข้อผิดพลาด'
    logger.error('handleFormSubmit', err)
  }
}

// ─── Delete transaction ───────────────────────────────────────────────────────
const showDeleteConfirm = ref(false)
const deletingTransactionId = ref('')

function promptDelete(id: string) {
  if (!canManagerEdit.value) return
  if (needsOpeningBalance.value) {
    openOpeningBalanceModal()
    return
  }
  deletingTransactionId.value = id
  showDeleteConfirm.value = true
}

async function handleDeleteExecute() {
  errorMessage.value = ''
  try {
    await store.deleteDraftTransaction(deletingTransactionId.value)
    successMessage.value = 'ลบรายการสำเร็จ'
    logger.log('Deleted transaction', deletingTransactionId.value)
  } catch (err: any) {
    errorMessage.value = err.message ?? 'ลบรายการไม่สำเร็จ'
    logger.error('handleDeleteExecute', err)
  } finally {
    showDeleteConfirm.value = false
    deletingTransactionId.value = ''
  }
}

// ─── Draft queue ──────────────────────────────────────────────────────────────
const QUEUED_MESSAGE = 'บันทึกเข้าคิวแล้ว — ชำระในแอปธนาคารแล้วกด "ดำเนินการ"'

// รับชำระบิลจ่ายจากบัญชีธนาคาร (bankAccount)
function getDraftShortfall(txn: BillPaymentTransaction): number {
  if (txn.transactionType !== 'bill_payment') return 0
  return Math.max(0, txn.amount - (store.currentBalance?.bankAccount ?? 0))
}
function getInsufficientMessage(txn: BillPaymentTransaction): string {
  return `ยอดในบัญชีไม่พอ (ขาด ${formatAmount(getDraftShortfall(txn))})`
}

// Dialog แจ้งเหตุผลที่ดำเนินการ/ยกเลิก draft ไม่ได้ (errorMessage อยู่บนสุดของหน้า มองไม่เห็นตอนเลื่อนลงมา)
const queueBlockedMessage = ref('')

async function handleCompleteDraft(txn: BillPaymentTransaction) {
  if (!canManagerEdit.value) return
  if (needsOpeningBalance.value) {
    openOpeningBalanceModal()
    return
  }
  errorMessage.value = ''
  if (getDraftShortfall(txn) > 0) {
    queueBlockedMessage.value = getInsufficientMessage(txn)
    return
  }
  try {
    await store.completeDraftTransaction(txn.id)
    successMessage.value = 'ดำเนินการรายการสำเร็จ — นับยอดแล้ว'
    logger.log('Draft completed', txn.id)
  } catch (err: any) {
    queueBlockedMessage.value = err.data?.message ?? err.message ?? 'เกิดข้อผิดพลาด'
    logger.error('handleCompleteDraft', err)
  }
}

// ยกเลิก draft (ชำระในแอปธนาคารไม่ผ่าน) — ไม่กระทบยอด
const showCancelDraftConfirm = ref(false)
const cancellingDraftId = ref('')

function promptCancelDraft(id: string) {
  if (!canManagerEdit.value) return
  cancellingDraftId.value = id
  showCancelDraftConfirm.value = true
}

async function handleCancelDraft() {
  errorMessage.value = ''
  try {
    await store.changeTransactionStatus(cancellingDraftId.value, 'cancelled', 'ทำรายการในแอปธนาคารไม่สำเร็จ')
    successMessage.value = 'ยกเลิกรายการแล้ว (ไม่กระทบยอด)'
    logger.log('Draft cancelled', cancellingDraftId.value)
  } catch (err: any) {
    queueBlockedMessage.value = err.data?.message ?? err.message ?? 'เกิดข้อผิดพลาด'
    logger.error('handleCancelDraft', err)
  } finally {
    showCancelDraftConfirm.value = false
    cancellingDraftId.value = ''
  }
}

// ─── Complete Step 1 ──────────────────────────────────────────────────────────
async function handleCompleteStep1() {
  if (!canCompleteStep1.value || !can(PERMISSIONS.EDIT_FINANCE)) return
  isCompletingStep1.value = true
  errorMessage.value = ''
  try {
    await store.completeStep1(props.date)
    await store.fetchDailySummary(props.date)
    successMessage.value = 'ขั้นตอนที่ 1 เสร็จสมบูรณ์ กรุณาตรวจนับเงินสด'
    logger.log('Step 1 completed for', props.date)
    emit('step1-completed')
  } catch (err: any) {
    errorMessage.value = err.message ?? 'ไม่สามารถดำเนินการได้'
    logger.error('handleCompleteStep1', err)
  } finally {
    isCompletingStep1.value = false
  }
}

// ─── Quick Actions + Favorites ────────────────────────────────────────────────
const canAddTransaction = computed(() => isOpeningSet.value && isStep1InProgress.value)

// ─── Favorites Modal ──────────────────────────────────────────────────────────
const showFavoriteModal = ref(false)
const favStep = ref<1 | 2>(1)
const favTab = ref<1 | 2 | 3 | 4 | 5>(1)
const favMode = ref<'select' | 'manage' | 'add' | 'edit'>('select')
const selectedFavorite = ref<BillPaymentFavorite | null>(null)
const favAmount = ref<number>(0)
const editingFavoriteId = ref<string>('')
const deletingFavoriteId = ref<string>('')
const isSavingFavorite = ref(false)
const favFormData = ref({
  label: '',
  billType: '' as 'utility' | 'telecom' | 'loan' | 'other' | '',
  // ยอดไม่คงที่ (ค่าไฟ/ค่าน้ำ/บัตรเครดิต) = กรอกทุกครั้ง; ยอดคงที่ (ผ่อนรถ) = ใช้ defaultAmount
  amountMode: 'variable' as 'variable' | 'fixed',
  defaultAmount: '' as number | '',
})
const isFavFormValid = computed(() =>
  favFormData.value.label.trim().length > 0 &&
  favFormData.value.billType !== '' &&
  (favFormData.value.amountMode === 'variable' || Number(favFormData.value.defaultAmount) > 0)
)

const BILL_TYPE_OPTIONS = [
  { value: 'utility', label: 'สาธารณูปโภค' },
  { value: 'telecom', label: 'โทรคมนาคม' },
  { value: 'loan', label: 'สินเชื่อ' },
  { value: 'other', label: 'อื่นๆ' },
] as const

// Commission for a favorite: auto from the bill-payment fee tiers (same as TransactionForm),
// with manual override — a legacy favorite's defaultCommission pre-fills the manual value.
const favAmountNumber = computed(() => Number(favAmount.value) || 0)
const favBillTypeRef = computed(() => selectedFavorite.value?.billType || 'other')
const {
  isManual: favIsCommissionManual,
  manualValue: favManualCommission,
  autoCommission: favAutoCommission,
  effectiveCommission: favEffectiveCommission,
  reset: resetFavCommission,
} = useCommission(favAmountNumber, { serviceType: 'bill-payment', billType: favBillTypeRef })

function toggleFavCommissionMode() {
  if (!favIsCommissionManual.value) {
    favManualCommission.value = favAutoCommission.value
    favIsCommissionManual.value = true
  } else {
    resetFavCommission()
  }
}

const favTabItems = computed(() =>
  (store.favorites as BillPaymentFavorite[])
    .filter(f => f.tab === favTab.value)
    .sort((a, b) => a.order - b.order)
)
const favTabFull = computed(() => favTabItems.value.length >= 10)
const favTabCount = (t: number) => (store.favorites as BillPaymentFavorite[]).filter(f => f.tab === t).length

// Bank balance preview in step 2 (bill_payment is paid from the bank account)
const favBankBalance = computed(() => store.currentBalance?.bankAccount ?? 0)
const isFavInsufficient = computed(() => Number(favAmount.value) > favBankBalance.value)

function openFavoriteModal() {
  if (needsOpeningBalance.value) {
    openOpeningBalanceModal()
    return
  }
  favStep.value = 1
  favMode.value = 'select'
  favTab.value = 1
  deletingFavoriteId.value = ''
  selectedFavorite.value = null
  favAmount.value = 0
  resetFavCommission()
  showFavoriteModal.value = true
}

function handleSelectFavorite(fav: BillPaymentFavorite) {
  selectedFavorite.value = fav
  favAmount.value = fav.defaultAmount ?? 0
  if (fav.defaultCommission != null) {
    favIsCommissionManual.value = true
    favManualCommission.value = fav.defaultCommission
  } else {
    resetFavCommission()
  }
  favStep.value = 2
}

function goBackFavStep1() {
  favStep.value = 1
  favMode.value = 'select'
  selectedFavorite.value = null
}

async function handleSubmitFavorite() {
  if (!selectedFavorite.value || !favAmount.value) return
  const fav = selectedFavorite.value
  const commission = Number(favEffectiveCommission.value) || 0
  errorMessage.value = ''
  try {
    await store.createTransaction({
      date: props.date,
      transactionType: 'bill_payment',
      billType: fav.billType,
      amount: Number(favAmount.value),
      commission,
      // ชื่อรายการโปรดใช้เป็นชื่อลูกค้า (favorite เก่าที่มี customerName แยกยังใช้ค่านั้น)
      customerName: fav.customerName || fav.label,
      recordedBy: props.currentUser.uid,
      recordedAt: new Date().toISOString(),
    })
    successMessage.value = QUEUED_MESSAGE
    showFavoriteModal.value = false
    logger.log('Favorite bill payment created for', props.date)
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('handleSubmitFavorite', err)
  }
}

function startAddFavorite() {
  editingFavoriteId.value = ''
  favFormData.value = { label: '', billType: '', amountMode: 'variable', defaultAmount: '' }
  favMode.value = 'add'
}

function startEditFavorite(fav: BillPaymentFavorite) {
  editingFavoriteId.value = fav.id
  favFormData.value = {
    label: fav.label,
    billType: fav.billType ?? '',
    amountMode: fav.defaultAmount ? 'fixed' : 'variable',
    defaultAmount: fav.defaultAmount ?? '',
  }
  favMode.value = 'edit'
}

async function handleSaveFavorite() {
  if (!isFavFormValid.value) return
  isSavingFavorite.value = true
  errorMessage.value = ''
  try {
    const data = {
      tab: favTab.value,
      order: favTabItems.value.length + 1,
      label: favFormData.value.label.trim(),
      billType: (favFormData.value.billType as BillPaymentFavorite['billType']) || undefined,
      defaultAmount: favFormData.value.amountMode === 'fixed' ? Number(favFormData.value.defaultAmount) : undefined,
    }
    if (favMode.value === 'edit' && editingFavoriteId.value) {
      await store.updateFavorite(editingFavoriteId.value, data)
      successMessage.value = 'แก้ไข Favorite สำเร็จ'
    } else {
      await store.addFavorite(data)
      successMessage.value = 'เพิ่ม Favorite สำเร็จ'
    }
    favMode.value = 'manage'
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('handleSaveFavorite', err)
  } finally {
    isSavingFavorite.value = false
  }
}

async function confirmDeleteFavorite() {
  if (!deletingFavoriteId.value) return
  isSavingFavorite.value = true
  errorMessage.value = ''
  try {
    await store.deleteFavorite(deletingFavoriteId.value)
    deletingFavoriteId.value = ''
    successMessage.value = 'ลบรายการโปรดสำเร็จ'
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('confirmDeleteFavorite', err)
  } finally {
    isSavingFavorite.value = false
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([
    store.fetchPreviousDayBalance(props.date),
    store.loadFavorites(),
  ])
})
</script>

<template>
  <div>
    <!-- ── Alerts ──────────────────────────────────────────────────────────── -->
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

    <!-- ── Needs Correction Banner ─────────────────────────────────────────── -->
    <div
      v-if="isNeedsCorrection && store.currentSummary?.correctionNotes"
      class="mb-4 rounded-xl border border-red-300 bg-red-50 px-5 py-4"
    >
      <div class="flex items-start gap-3">
        <ExclamationTriangleIcon class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
        <div>
          <p class="font-semibold text-red-800">ส่งกลับให้แก้ไข</p>
          <p class="mt-1 text-sm text-red-700">{{ store.currentSummary.correctionNotes }}</p>
        </div>
      </div>
    </div>

    <!-- ── Draft / On-Hold Alert ─────────────────────────────────────────── -->
    <div
      v-if="store.getDraftTransactions.length > 0 || store.getOnHoldTransactions.length > 0"
      class="mb-4 rounded-xl border border-yellow-300 bg-yellow-50 px-5 py-4"
    >
      <div class="mb-2 flex items-center gap-2">
        <ExclamationTriangleIcon class="h-5 w-5 text-yellow-600" />
        <p class="font-semibold text-yellow-800">มีรายการที่รอดำเนินการ</p>
      </div>
      <ul class="space-y-2">
        <li
          v-for="txn in [...store.getDraftTransactions, ...store.getOnHoldTransactions]"
          :key="txn.id"
          class="flex items-center justify-between gap-3 rounded-lg border border-yellow-200 bg-white px-4 py-2 text-sm"
        >
          <div class="flex items-center gap-2 min-w-0">
            <BaseBadge :variant="getStatusBadgeVariant(txn.status)" size="sm">
              {{ getStatusLabel(txn.status) }}
            </BaseBadge>
            <span class="truncate text-gray-700">
              {{ formatTransactionType(txn.transactionType) }}
              {{ txn.customerName ? `— ${txn.customerName}` : '' }}
              · {{ formatAmount(txn.amount) }}
            </span>
            <span v-if="txn.statusNote" class="text-xs text-gray-400">({{ txn.statusNote }})</span>
            <span v-if="txn.status === 'draft' && getDraftShortfall(txn) > 0" class="text-xs text-red-600">
              {{ getInsufficientMessage(txn) }}
            </span>
          </div>
          <div class="flex shrink-0 gap-2">
            <ActionButton
              v-if="txn.status === 'draft'"
              :permission="PERMISSIONS.EDIT_FINANCE"
              :disabled="isRowActionDisabled"
              variant="primary"
              size="sm"
              :title="disableReason"
              @click="handleCompleteDraft(txn)"
            >
              <template #icon><CheckCircleIcon class="h-4 w-4" /></template>
              ดำเนินการ
            </ActionButton>
            <ActionButton
              v-if="txn.status === 'draft'"
              :permission="PERMISSIONS.EDIT_FINANCE"
              :disabled="isRowActionDisabled"
              variant="secondary"
              size="sm"
              :title="disableReason || 'ชำระในแอปธนาคารไม่ผ่าน'"
              @click="promptCancelDraft(txn.id)"
            >
              <template #icon><XCircleIcon class="h-4 w-4" /></template>
              ยกเลิก
            </ActionButton>
            <ActionButton
              :permission="PERMISSIONS.EDIT_FINANCE"
              :disabled="isRowActionDisabled"
              variant="ghost"
              size="sm"
              :title="disableReason || 'ลบ'"
              class="text-red-500 hover:text-red-700"
              @click="promptDelete(txn.id)"
            >
              <TrashIcon class="h-4 w-4" />
            </ActionButton>
          </div>
        </li>
      </ul>
    </div>

    <!-- ── Opening Balance prompt ──────────────────────────────────────────── -->
    <section v-if="needsOpeningBalance" class="mb-4">
      <div class="flex items-center justify-between gap-4 rounded-xl border border-blue-300 bg-blue-50 px-5 py-4">
        <div>
          <div class="font-semibold text-blue-900">💳 กำหนดยอดเงินในบัญชีเริ่มต้น</div>
          <div class="mt-0.5 text-sm text-blue-700">กรุณากำหนดยอดเงินก่อนเริ่มบันทึกรายการ</div>
        </div>
        <ActionButton :permission="PERMISSIONS.EDIT_FINANCE" variant="primary" @click="openOpeningBalanceModal">
          กำหนดยอดเงินเริ่มต้น
        </ActionButton>
      </div>
    </section>

    <!-- ── Balance Cards ──────────────────────────────────────────────────── -->
    <CompactBalanceSummary
      :primary-cards="[
        { label: 'เงินเริ่มต้น', value: store.currentBalance?.openingBalance ?? 0, colorClass: 'text-gray-700' },
        { label: 'รวมรับชำระ', value: store.currentBalance?.billPaymentCash ?? 0, colorClass: 'text-green-700' },
        { label: 'เงินในบัญชีคงเหลือ', value: store.currentBalance?.bankAccount ?? 0, colorClass: 'text-blue-700' },
        { label: 'เงินสดคงเหลือ', value: (store.currentBalance?.billPaymentCash ?? 0) + (store.currentBalance?.serviceFeeCash ?? 0), colorClass: 'text-emerald-700' },
      ]"
      :secondary-cards="[
        { label: 'รวมฝากเงิน', value: totalOwnerDeposit, colorClass: 'text-purple-700' },
        { label: 'ค่าธรรมเนียม', value: store.currentBalance?.serviceFeeCash ?? 0, colorClass: 'text-yellow-700' },
      ]"
      :collapsible="!isStep1InProgress"
      :default-expanded="isStep1InProgress"
      title="📊 ยอดเงินปัจจุบัน"
      class="mb-6"
    />

    <!-- ── Quick Actions ───────────────────────────────────────────────────── -->
    <section v-if="isStep1InProgress" class="mb-6">
      <h2 class="mb-3 text-base font-semibold text-gray-700">⚡ รายการด่วน</h2>
      <div class="grid grid-cols-3 gap-3">
        <button
          :disabled="!canAddTransaction"
          :class="['flex flex-col items-center gap-2 p-4 border rounded-xl font-medium text-sm transition-colors', canAddTransaction ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 text-yellow-800 cursor-pointer' : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-50']"
          @click="canAddTransaction && openFavoriteModal()"
        >
          <StarIcon class="h-6 w-6" />
          รายการโปรด
        </button>
        <button
          :disabled="!canAddTransaction"
          :class="['flex flex-col items-center gap-2 p-4 border rounded-xl font-medium text-sm transition-colors', canAddTransaction ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-800 cursor-pointer' : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-50']"
          @click="canAddTransaction && openNewTransaction('bill_payment')"
        >
          <DocumentTextIcon class="h-6 w-6" />
          รับชำระบิล
        </button>
        <button
          :disabled="!canAddTransaction"
          :class="['flex flex-col items-center gap-2 p-4 border rounded-xl font-medium text-sm transition-colors', canAddTransaction ? 'bg-green-50 border-green-200 hover:bg-green-100 text-green-800 cursor-pointer' : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-50']"
          @click="canAddTransaction && openNewTransaction('owner_deposit')"
        >
          <BanknotesIcon class="h-6 w-6" />
          ฝากเงิน
        </button>
      </div>
    </section>

    <!-- ── Transaction List ───────────────────────────────────────────────── -->
    <section class="mb-6">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-base font-semibold text-gray-700">
          📝 รายการวันที่ {{ date }}
          <span class="ml-1 text-sm font-normal text-gray-400">
            ({{ dateTransactions.length }} รายการ)
          </span>
        </h2>
        <ActionButton
          v-if="canManagerEdit"
          :permission="PERMISSIONS.EDIT_FINANCE"
          :disabled="needsOpeningBalance"
          variant="primary"
          size="sm"
          :title="needsOpeningBalance ? 'กรุณาตั้ง Opening Balance ก่อน' : ''"
          @click="openNewTransaction()"
        >
          <template #icon><PlusIcon class="h-4 w-4" /></template>
          รายการใหม่
        </ActionButton>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white shadow-sm">
        <TransactionTable
          :transactions="filteredTransactions"
          :columns="bpColumns"
          :show-filter-tabs="true"
          :filter-tabs="filterTabs"
          :active-filter="activeFilter"
          :show-pagination="true"
          :page-size="10"
          empty-message="กดปุ่ม 'รายการใหม่' เพื่อเริ่มบันทึกรายการรับชำระบิล"
          @update:active-filter="activeFilter = $event"
        >
          <!-- ประเภท column -->
          <template #col-type="{ row }">
            <div class="font-medium text-gray-800">
              {{ formatTransactionType(row.transactionType) }}
            </div>
            <div v-if="row.billType" class="text-xs text-gray-400">
              {{ formatBillType(row.billType) }}
            </div>
          </template>

          <!-- จำนวนเงิน column -->
          <template #col-amount="{ row }">
            <span class="font-medium text-gray-800">{{ formatAmount(row.amount) }}</span>
          </template>

          <!-- ค่าธรรมเนียม column -->
          <template #col-commission="{ row }">
            <span class="text-gray-600">
              {{ row.transactionType === 'bill_payment' ? formatAmount(row.commission) : '-' }}
            </span>
          </template>

          <!-- สถานะ column -->
          <template #col-status="{ row }">
            <BaseBadge :variant="getStatusBadgeVariant(row.status)">
              {{ getStatusLabel(row.status) }}
            </BaseBadge>
          </template>

          <!-- Actions -->
          <template #actions="{ txn }">
            <div class="flex items-center justify-center gap-2">
              <ActionButton
                :permission="PERMISSIONS.EDIT_FINANCE"
                :disabled="isRowActionDisabled"
                variant="ghost"
                size="sm"
                :title="disableReason || 'แก้ไข'"
                @click="openEditTransaction(txn)"
              >
                <PencilIcon class="h-4 w-4" />
              </ActionButton>
              <ActionButton
                :permission="PERMISSIONS.EDIT_FINANCE"
                :disabled="isRowActionDisabled"
                variant="ghost"
                size="sm"
                :title="disableReason || 'ลบ'"
                class="text-red-500 hover:text-red-700"
                @click="promptDelete(txn.id)"
              >
                <TrashIcon class="h-4 w-4" />
              </ActionButton>
            </div>
          </template>
        </TransactionTable>
      </div>
    </section>

    <!-- ── Step 1 Complete Button ─────────────────────────────────────────── -->
    <section v-if="isStep1InProgress || isNeedsCorrection" class="flex flex-col items-end gap-3 border-t border-gray-100 pt-4">
      <!-- Checklist -->
      <div
        class="w-full rounded-xl border px-5 py-4"
        :class="canCompleteStep1 ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'"
      >
        <h3 class="mb-3 text-sm font-semibold" :class="canCompleteStep1 ? 'text-green-800' : 'text-gray-700'">
          {{ canCompleteStep1 ? '✅ พร้อมยืนยันบันทึกรายการแล้ว' : '📋 เงื่อนไขก่อนยืนยันบันทึกรายการ' }}
        </h3>
        <ul class="space-y-2 text-sm">
          <li class="flex items-center gap-2" :class="isOpeningSet ? 'text-green-700' : 'text-gray-500'">
            <span class="text-base">{{ isOpeningSet ? '✅' : '❌' }}</span>
            ตั้ง Opening Balance แล้ว
          </li>
          <li class="flex items-center gap-2" :class="dateTransactions.length > 0 ? 'text-green-700' : 'text-gray-500'">
            <span class="text-base">{{ dateTransactions.length > 0 ? '✅' : '❌' }}</span>
            มีรายการอย่างน้อย 1 รายการ
            <span class="text-gray-400">({{ dateTransactions.length }} รายการ)</span>
          </li>
          <li class="flex items-center gap-2" :class="noDraftPending ? 'text-green-700' : 'text-orange-600'">
            <span class="text-base">{{ noDraftPending ? '✅' : '❌' }}</span>
            ไม่มีรายการรอดำเนินการค้าง
            <span v-if="!noDraftPending" class="text-orange-500">
              (เหลือ {{ store.getDraftTransactions.length }} รายการ)
            </span>
          </li>
          <li class="flex items-center gap-2" :class="noOnHoldPending ? 'text-green-700' : 'text-orange-600'">
            <span class="text-base">{{ noOnHoldPending ? '✅' : '❌' }}</span>
            ไม่มีรายการ On Hold ค้าง
            <span v-if="!noOnHoldPending" class="text-orange-500">
              (เหลือ {{ store.getOnHoldTransactions.length }} รายการ)
            </span>
          </li>
        </ul>
      </div>
      <ActionButton
        :permission="PERMISSIONS.EDIT_FINANCE"
        :variant="canCompleteStep1 ? 'success' : 'primary'"
        :disabled="!canCompleteStep1"
        :loading="isCompletingStep1"
        @click="handleCompleteStep1"
      >
        ยืนยันบันทึกรายการ → ตรวจนับเงินสด
      </ActionButton>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════════════
         MODAL: Add / Edit Transaction
    ════════════════════════════════════════════════════════════════════════════ -->
    <BaseModal
      :open="showTransactionModal"
      :title="editingTransaction ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'"
      @close="closeModal"
    >
      <BillPaymentTransactionForm
        :editing-data="editingTransaction"
        :preset-type="transactionPresetType"
        @submit="handleFormSubmit"
        @cancel="closeModal"
      />
    </BaseModal>

    <!-- ═══════════════════════════════════════════════════════════════════════
         MODAL: Opening Balance
    ════════════════════════════════════════════════════════════════════════════ -->
    <BaseModal :open="showOpeningBalanceModal" title="💳 กำหนดยอดเงินในบัญชีเริ่มต้น" size="md" @close="showOpeningBalanceModal = false">
      <div class="space-y-4">
        <label :class="['flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors', openingSource === 'carryover' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300']">
          <input v-model="openingSource" type="radio" value="carryover" class="mt-0.5 accent-blue-600" />
          <div class="flex-1">
            <div class="font-semibold text-gray-900">🔄 ใช้ยอดคงเหลือจากเมื่อวาน (Carry-over)</div>
            <div class="mt-0.5 text-sm text-gray-500">ยอดเงินคงเหลือ ณ สิ้นวันเมื่อวาน</div>
            <div class="mt-2 text-lg font-bold text-blue-700">
              <span v-if="store.previousDayBalance">{{ formatAmount(carryoverAmount) }}</span>
              <span v-else class="text-sm font-normal text-gray-400">ไม่พบข้อมูลวันก่อนหน้า</span>
            </div>
          </div>
        </label>
        <label :class="['flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors', openingSource === 'manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300']">
          <input v-model="openingSource" type="radio" value="manual" class="mt-0.5 accent-blue-600" />
          <div class="flex-1">
            <div class="font-semibold text-gray-900">✏️ กำหนดเอง</div>
            <div class="mt-0.5 text-sm text-gray-500">ระบุยอดเงินเริ่มต้นด้วยตนเอง</div>
            <div v-if="openingSource === 'manual'" class="mt-3" @click.stop>
              <div class="relative">
                <BaseInput v-model="manualOpeningAmount" type="number" placeholder="0" min="0" />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">บาท</span>
              </div>
            </div>
          </div>
        </label>
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

    <!-- ═══════════════════════════════════════════════════════════════════════
         CONFIRM DIALOG: Delete
    ════════════════════════════════════════════════════════════════════════════ -->
    <ConfirmDialog
      :open="showDeleteConfirm"
      title="ลบรายการ"
      message="คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
      confirm-text="ลบ"
      variant="danger"
      @confirm="handleDeleteExecute"
      @cancel="showDeleteConfirm = false"
    />

    <!-- Queue blocked dialog (ยอดไม่พอ / server error ตอนดำเนินการ-ยกเลิก) -->
    <BaseModal :open="!!queueBlockedMessage" title="ดำเนินการไม่ได้" size="sm" @close="queueBlockedMessage = ''">
      <div class="flex items-start gap-3 text-sm text-gray-700">
        <ExclamationTriangleIcon class="h-6 w-6 flex-shrink-0 text-amber-500" />
        <p>{{ queueBlockedMessage }} — รายการยังอยู่ในคิว "รอดำเนินการ"</p>
      </div>
      <template #footer>
        <div class="flex justify-end">
          <BaseButton variant="primary" @click="queueBlockedMessage = ''">ตกลง</BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- CONFIRM DIALOG: Cancel draft (ชำระในแอปธนาคารไม่ผ่าน) -->
    <ConfirmDialog
      :open="showCancelDraftConfirm"
      title="ยกเลิกรายการ"
      message="ชำระในแอปธนาคารไม่สำเร็จใช่หรือไม่? รายการจะถูกบันทึกเป็น ยกเลิก และไม่กระทบยอด"
      confirm-text="ยกเลิกรายการ"
      cancel-text="ปิด"
      variant="warning"
      @confirm="handleCancelDraft"
      @cancel="showCancelDraftConfirm = false"
    />

    <!-- ═══════════════════════════════════════════════════════════════════════
         MODAL: Favorites
    ════════════════════════════════════════════════════════════════════════════ -->
    <BaseModal :open="showFavoriteModal" size="lg" @close="showFavoriteModal = false">
      <template #header>
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <StarIcon class="h-5 w-5 text-yellow-500" />
            <h2 class="text-lg font-bold text-gray-900">
              <span v-if="favStep === 1 && favMode === 'select'">รายการโปรด</span>
              <span v-else-if="favStep === 1 && favMode === 'manage'">จัดการรายการโปรด</span>
              <span v-else-if="favStep === 1 && favMode === 'add'">เพิ่มรายการโปรด</span>
              <span v-else-if="favStep === 1 && favMode === 'edit'">แก้ไขรายการโปรด</span>
              <span v-else>กรอกจำนวนเงิน</span>
            </h2>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-sm text-gray-500">
              ยอดเงินในบัญชี:
              <span class="font-bold" :class="isFavInsufficient ? 'text-red-600' : 'text-green-700'">
                {{ formatAmount(favBankBalance) }}
              </span>
            </div>
            <button
              type="button"
              aria-label="ปิด"
              class="text-gray-400 transition-colors hover:text-gray-600"
              @click="showFavoriteModal = false"
            >
              <XMarkIcon class="h-6 w-6" />
            </button>
          </div>
        </div>
      </template>

      <!-- Step 1: Select / Manage / Add / Edit -->
      <div v-if="favStep === 1">
        <div v-if="favMode === 'select' || favMode === 'manage'" class="-mx-1 mb-4 flex border-b border-gray-200">
          <button
            v-for="t in ([1, 2, 3, 4, 5] as const)"
            :key="t"
            class="flex-1 py-2 text-sm font-medium transition-colors"
            :class="favTab === t ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500 hover:text-gray-700'"
            @click="favTab = t; deletingFavoriteId = ''"
          >
            Tab #{{ t }}
            <span class="ml-1 rounded-full px-1.5 py-0.5 text-xs" :class="favTab === t ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'">
              {{ favTabCount(t) }}
            </span>
          </button>
        </div>

        <!-- SELECT MODE -->
        <div v-if="favMode === 'select'">
          <p class="mb-3 text-sm text-gray-500">คลิกชื่อเพื่อเลือกรายการ</p>
          <div class="h-72 space-y-2 overflow-y-auto pr-1">
            <template v-if="favTabItems.length > 0">
              <button
                v-for="(fav, i) in favTabItems"
                :key="fav.id"
                class="flex w-full items-center justify-between rounded-xl border border-gray-200 p-3 text-left transition-colors hover:border-red-300 hover:bg-red-50"
                @click="handleSelectFavorite(fav)"
              >
                <div class="flex items-center gap-3">
                  <span class="w-6 text-center text-sm font-bold text-yellow-500">★{{ i + 1 }}</span>
                  <div>
                    <div class="font-medium text-gray-900">{{ fav.label }}</div>
                    <div class="text-sm text-gray-500">
                      {{ BILL_TYPE_OPTIONS.find(o => o.value === fav.billType)?.label ?? 'ไม่ระบุประเภท' }}
                      · {{ fav.defaultAmount ? `ยอดคงที่ ${formatAmount(fav.defaultAmount)}` : 'กรอกยอดทุกครั้ง' }}
                    </div>
                  </div>
                </div>
                <span class="text-lg text-gray-300">›</span>
              </button>
            </template>
            <div v-else class="py-12 text-center text-gray-400">
              <p class="mb-2 text-4xl">☆</p>
              <p class="text-sm">Tab #{{ favTab }} ยังไม่มีรายการโปรด</p>
              <p class="mt-1 text-xs">กด "จัดการ" เพื่อเพิ่ม</p>
            </div>
          </div>
        </div>

        <!-- MANAGE MODE -->
        <div v-else-if="favMode === 'manage'">
          <div class="h-64 space-y-2 overflow-y-auto pr-1">
            <template v-if="favTabItems.length > 0">
              <div v-for="(fav, i) in favTabItems" :key="fav.id">
                <div
                  class="flex items-center justify-between rounded-xl border border-gray-200 p-3"
                  :class="deletingFavoriteId === fav.id ? 'border-red-300 bg-red-50' : ''"
                >
                  <div class="flex items-center gap-3">
                    <span class="w-6 text-center text-sm font-bold text-yellow-500">★{{ i + 1 }}</span>
                    <div>
                      <div class="text-sm font-medium text-gray-900">{{ fav.label }}</div>
                      <div class="text-xs text-gray-500">
                        {{ BILL_TYPE_OPTIONS.find(o => o.value === fav.billType)?.label ?? 'ไม่ระบุประเภท' }}
                        · {{ fav.defaultAmount ? `ยอดคงที่ ${formatAmount(fav.defaultAmount)}` : 'กรอกยอดทุกครั้ง' }}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button class="p-1 text-blue-500 hover:text-blue-700" title="แก้ไข" @click="startEditFavorite(fav)">
                      <PencilIcon class="h-4 w-4" />
                    </button>
                    <button class="p-1 text-red-500 hover:text-red-700" title="ลบ" @click="deletingFavoriteId = deletingFavoriteId === fav.id ? '' : fav.id">
                      <TrashIcon class="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div v-if="deletingFavoriteId === fav.id" class="mt-1 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                  <span class="text-sm text-red-700">ยืนยันลบ "{{ fav.label }}" ?</span>
                  <div class="flex gap-2">
                    <button class="text-sm text-gray-500 hover:text-gray-700" @click="deletingFavoriteId = ''">ยกเลิก</button>
                    <BaseButton size="sm" variant="danger" :loading="isSavingFavorite" @click="confirmDeleteFavorite">ลบ</BaseButton>
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="py-10 text-center text-gray-400">
              <p class="text-sm">Tab #{{ favTab }} ยังไม่มีรายการโปรด</p>
            </div>
          </div>
          <div class="mt-3 border-t border-gray-100 pt-3">
            <button
              v-if="!favTabFull"
              class="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-2.5 text-sm text-gray-500 transition-colors hover:border-red-300 hover:text-red-500"
              @click="startAddFavorite"
            >
              <PlusIcon class="h-4 w-4" />
              เพิ่มรายการโปรดใน Tab #{{ favTab }}
            </button>
            <p v-else class="py-2 text-center text-sm text-gray-400">Tab #{{ favTab }} เต็มแล้ว (สูงสุด 10 รายการ)</p>
          </div>
        </div>

        <!-- ADD / EDIT FORM -->
        <div v-else-if="favMode === 'add' || favMode === 'edit'" class="space-y-4">
          <FormField label="ชื่อรายการโปรด" required>
            <BaseInput v-model="favFormData.label" placeholder="เช่น ค่าไฟ คุณสมชาย" />
          </FormField>

          <FormField label="ประเภทบิล" required>
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button
                v-for="opt in BILL_TYPE_OPTIONS"
                :key="opt.value"
                type="button"
                class="rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                :class="favFormData.billType === opt.value
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'"
                @click="favFormData.billType = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </FormField>

          <FormField label="ยอดเงิน" required>
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label
                class="flex cursor-pointer items-start gap-2 rounded-lg border p-3 transition-colors"
                :class="favFormData.amountMode === 'variable' ? 'border-primary bg-red-50' : 'border-gray-200 bg-white hover:bg-gray-50'"
              >
                <input v-model="favFormData.amountMode" type="radio" value="variable" class="mt-1 accent-red-600" />
                <span>
                  <span class="block text-sm font-medium text-gray-900">ยอดไม่คงที่</span>
                  <span class="block text-xs text-gray-500">กรอกยอดทุกครั้งที่ลูกค้ามาจ่าย เช่น ค่าไฟ ค่าน้ำ บัตรเครดิต</span>
                </span>
              </label>
              <label
                class="flex cursor-pointer items-start gap-2 rounded-lg border p-3 transition-colors"
                :class="favFormData.amountMode === 'fixed' ? 'border-primary bg-red-50' : 'border-gray-200 bg-white hover:bg-gray-50'"
              >
                <input v-model="favFormData.amountMode" type="radio" value="fixed" class="mt-1 accent-red-600" />
                <span>
                  <span class="block text-sm font-medium text-gray-900">ยอดคงที่</span>
                  <span class="block text-xs text-gray-500">ใช้ยอดเดิมทุกครั้ง (แก้ได้ตอนบันทึก) เช่น ผ่อนรถ ผ่อนสินค้า</span>
                </span>
              </label>
            </div>
            <div v-if="favFormData.amountMode === 'fixed'" class="mt-2">
              <BaseInput v-model="favFormData.defaultAmount" type="number" placeholder="ยอดต่อครั้ง (บาท)" min="0" />
            </div>
          </FormField>
        </div>
      </div>

      <!-- Step 2: Enter Amount -->
      <div v-else-if="favStep === 2 && selectedFavorite">
        <div class="mb-4 rounded-xl bg-gray-50 p-4">
          <div class="font-semibold text-gray-900">★ {{ selectedFavorite.label }}</div>
          <div class="mt-0.5 text-sm text-gray-500">
            {{ BILL_TYPE_OPTIONS.find(o => o.value === selectedFavorite!.billType)?.label ?? 'ไม่ระบุประเภท' }}
            <template v-if="selectedFavorite.customerName"> · {{ selectedFavorite.customerName }}</template>
          </div>
        </div>
        <div class="space-y-4">
          <FormField label="จำนวนเงิน" required>
            <div class="relative">
              <BaseInput v-model="favAmount" type="number" placeholder="0" min="0" />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">บาท</span>
            </div>
            <div v-if="isFavInsufficient" class="mt-1 text-sm text-amber-700">
              ยอดในบัญชีตอนนี้ไม่พอ (ขาด {{ formatAmount(Number(favAmount) - favBankBalance) }}) — บันทึกเข้าคิวได้ แต่ต้องมียอดพอก่อนกด "ดำเนินการ"
            </div>
          </FormField>
          <FormField :label="favIsCommissionManual ? 'ค่าธรรมเนียม' : 'ค่าธรรมเนียม (คำนวณอัตโนมัติ)'">
            <div class="flex items-center gap-3">
              <div class="relative flex-1">
                <input
                  :value="favEffectiveCommission"
                  type="number"
                  min="0"
                  step="1"
                  :disabled="!favIsCommissionManual"
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-500"
                  @input="e => { favManualCommission = Number((e.target as HTMLInputElement).value) }"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">บาท</span>
              </div>
              <label class="flex items-center gap-1.5 whitespace-nowrap text-sm text-gray-600">
                <input :checked="favIsCommissionManual" type="checkbox" class="accent-red-500" @change="toggleFavCommissionMode" />
                กำหนดเอง
              </label>
            </div>
          </FormField>
          <div v-if="Number(favAmount) > 0" class="space-y-1 rounded-lg bg-gray-50 p-3 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">ยอดเงินในบัญชี ปัจจุบัน</span>
              <span class="font-medium">{{ formatAmount(favBankBalance) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">หลังดำเนินการ</span>
              <span class="font-medium" :class="isFavInsufficient ? 'text-red-600' : 'text-gray-900'">
                {{ formatAmount(favBankBalance - Number(favAmount)) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between">
          <div class="flex gap-2">
            <BaseButton v-if="favStep === 2" variant="secondary" @click="goBackFavStep1">← กลับ</BaseButton>
            <BaseButton v-else-if="favMode === 'manage'" variant="secondary" @click="favMode = 'select'; deletingFavoriteId = ''">← กลับ</BaseButton>
            <BaseButton v-else-if="favMode === 'add' || favMode === 'edit'" variant="secondary" @click="favMode = 'manage'">← กลับ</BaseButton>
          </div>
          <div class="flex gap-2">
            <BaseButton v-if="favStep === 1 && favMode === 'select'" variant="secondary" size="sm" @click="favMode = 'manage'">
              <Cog6ToothIcon class="h-4 w-4" />
              จัดการ
            </BaseButton>
            <BaseButton
              v-if="favStep === 1 && (favMode === 'add' || favMode === 'edit')"
              variant="primary"
              :loading="isSavingFavorite"
              :disabled="!isFavFormValid"
              @click="handleSaveFavorite"
            >
              บันทึก
            </BaseButton>
            <ActionButton
              v-if="favStep === 2"
              :permission="PERMISSIONS.EDIT_FINANCE"
              variant="primary"
              :disabled="!favAmount || Number(favAmount) <= 0"
              @click="handleSubmitFavorite"
            >
              บันทึกเข้าคิว
            </ActionButton>
          </div>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
