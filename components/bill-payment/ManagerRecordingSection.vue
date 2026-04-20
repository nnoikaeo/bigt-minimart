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
  StarIcon,
  DocumentTextIcon,
  BanknotesIcon,
  Cog6ToothIcon,
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
  billType?: 'utility' | 'telecom' | 'insurance' | 'other'
  amount: number
  commission: number
  customerName?: string
  status: BillPaymentTransactionStatus
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
      await store.createTransaction(payload)
      successMessage.value = 'เพิ่มรายการสำเร็จ'
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

async function handleCompleteDraft(txnId: string) {
  if (!canManagerEdit.value) return
  if (needsOpeningBalance.value) {
    openOpeningBalanceModal()
    return
  }
  errorMessage.value = ''
  try {
    await store.completeDraftTransaction(txnId)
    successMessage.value = 'ดำเนินการรายการสำเร็จ'
    logger.log('Draft completed', txnId)
  } catch (err: any) {
    errorMessage.value = err.message ?? 'เกิดข้อผิดพลาด'
    logger.error('handleCompleteDraft', err)
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
const favIsCommissionManual = ref(false)
const favManualCommission = ref<number>(0)
const editingFavoriteId = ref<string>('')
const isSavingFavorite = ref(false)
const favFormData = ref({
  label: '',
  customerName: '',
  billType: '' as 'utility' | 'telecom' | 'insurance' | 'other' | '',
  defaultAmount: '' as number | '',
  defaultCommission: '' as number | '',
})

const BILL_TYPE_OPTIONS = [
  { value: '', label: '— ไม่ระบุ —' },
  { value: 'utility', label: '💡 สาธารณูปโภค' },
  { value: 'telecom', label: '📱 โทรคมนาคม' },
  { value: 'insurance', label: '🛡️ ประกัน' },
  { value: 'other', label: '📋 อื่นๆ' },
]

const favTabItems = computed(() =>
  (store.favorites as BillPaymentFavorite[])
    .filter(f => f.tab === favTab.value)
    .sort((a, b) => a.order - b.order)
)
const favTabFull = computed(() => favTabItems.value.length >= 10)

function openFavoriteModal() {
  if (needsOpeningBalance.value) {
    openOpeningBalanceModal()
    return
  }
  favStep.value = 1
  favMode.value = 'select'
  favTab.value = 1
  selectedFavorite.value = null
  favAmount.value = 0
  favIsCommissionManual.value = false
  favManualCommission.value = 0
  showFavoriteModal.value = true
}

function handleSelectFavorite(fav: BillPaymentFavorite) {
  selectedFavorite.value = fav
  favAmount.value = fav.defaultAmount ?? 0
  if (fav.defaultCommission != null) {
    favIsCommissionManual.value = true
    favManualCommission.value = fav.defaultCommission
  } else {
    favIsCommissionManual.value = false
    favManualCommission.value = 0
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
  const commission = favIsCommissionManual.value ? (favManualCommission.value ?? 0) : 0
  errorMessage.value = ''
  try {
    await store.createTransaction({
      date: props.date,
      transactionType: 'bill_payment',
      billType: fav.billType,
      amount: Number(favAmount.value),
      commission,
      customerName: fav.customerName || undefined,
      status: 'completed',
      recordedBy: props.currentUser.uid,
      recordedAt: new Date().toISOString(),
    })
    successMessage.value = 'บันทึกรายการจาก Favorite สำเร็จ'
    showFavoriteModal.value = false
    logger.log('Favorite bill payment created for', props.date)
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('handleSubmitFavorite', err)
  }
}

function startAddFavorite() {
  editingFavoriteId.value = ''
  favFormData.value = { label: '', customerName: '', billType: '', defaultAmount: '', defaultCommission: '' }
  favMode.value = 'add'
}

function startEditFavorite(fav: BillPaymentFavorite) {
  editingFavoriteId.value = fav.id
  favFormData.value = {
    label: fav.label,
    customerName: fav.customerName ?? '',
    billType: fav.billType ?? '',
    defaultAmount: fav.defaultAmount ?? '',
    defaultCommission: fav.defaultCommission ?? '',
  }
  favMode.value = 'edit'
}

async function handleSaveFavorite() {
  if (!favFormData.value.label.trim()) return
  isSavingFavorite.value = true
  errorMessage.value = ''
  try {
    const data = {
      tab: favTab.value,
      order: favTabItems.value.length + 1,
      label: favFormData.value.label.trim(),
      customerName: favFormData.value.customerName?.trim() || undefined,
      billType: (favFormData.value.billType as BillPaymentFavorite['billType']) || undefined,
      defaultAmount: favFormData.value.defaultAmount !== '' ? Number(favFormData.value.defaultAmount) : undefined,
      defaultCommission: favFormData.value.defaultCommission !== '' ? Number(favFormData.value.defaultCommission) : undefined,
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

async function handleDeleteFavorite(id: string) {
  errorMessage.value = ''
  try {
    await store.deleteFavorite(id)
    successMessage.value = 'ลบ Favorite สำเร็จ'
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('handleDeleteFavorite', err)
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
          </div>
          <div class="flex shrink-0 gap-2">
            <ActionButton
              v-if="txn.status === 'draft'"
              :permission="PERMISSIONS.EDIT_FINANCE"
              :disabled="isRowActionDisabled"
              variant="primary"
              size="sm"
              :title="disableReason"
              @click="handleCompleteDraft(txn.id)"
            >
              <template #icon><CheckCircleIcon class="h-4 w-4" /></template>
              ดำเนินการ
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
            ไม่มีรายการ Draft ค้าง
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

    <!-- ═══════════════════════════════════════════════════════════════════════
         MODAL: Favorites
    ════════════════════════════════════════════════════════════════════════════ -->
    <BaseModal :open="showFavoriteModal" size="lg" @close="showFavoriteModal = false">
      <template #title>
        <span v-if="favStep === 1 && favMode === 'select'">⭐ รายการโปรด</span>
        <span v-else-if="favStep === 1 && favMode === 'manage'">⚙️ จัดการรายการโปรด</span>
        <span v-else-if="favStep === 1 && (favMode === 'add' || favMode === 'edit')">
          {{ favMode === 'add' ? '➕ เพิ่มรายการโปรด' : '✏️ แก้ไขรายการโปรด' }}
        </span>
        <span v-else>ยืนยันรายการ</span>
      </template>

      <div class="space-y-4">
        <!-- Step 1: Select or Manage -->
        <template v-if="favStep === 1">
          <!-- Tab selector -->
          <div class="flex gap-1 border-b border-gray-200 pb-3">
            <button
              v-for="t in [1,2,3,4,5]"
              :key="t"
              :class="['px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', favTab === t ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100']"
              @click="favTab = t as 1|2|3|4|5"
            >
              Tab {{ t }}
            </button>
            <div class="ml-auto flex gap-2">
              <button
                v-if="favMode === 'select'"
                class="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                @click="favMode = 'manage'"
              >
                <Cog6ToothIcon class="h-4 w-4" />
                จัดการ
              </button>
              <button
                v-else-if="favMode === 'manage'"
                class="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                @click="favMode = 'select'"
              >
                ← กลับ
              </button>
              <button
                v-else-if="favMode === 'add' || favMode === 'edit'"
                class="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                @click="favMode = 'manage'"
              >
                ← กลับ
              </button>
            </div>
          </div>

          <!-- Select mode: list of favorites to pick -->
          <template v-if="favMode === 'select'">
            <div v-if="favTabItems.length === 0" class="py-8 text-center text-sm text-gray-400">
              ยังไม่มีรายการโปรดใน Tab {{ favTab }}<br />
              <button class="mt-2 text-blue-600 hover:underline" @click="favMode = 'manage'">+ เพิ่มรายการโปรด</button>
            </div>
            <div v-else class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                v-for="fav in favTabItems"
                :key="fav.id"
                class="flex flex-col items-start rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
                @click="handleSelectFavorite(fav)"
              >
                <span class="font-semibold text-gray-900">{{ fav.label }}</span>
                <span v-if="fav.customerName" class="mt-0.5 text-sm text-gray-500">{{ fav.customerName }}</span>
                <span v-if="fav.billType" class="mt-1 text-xs text-blue-600">
                  {{ BILL_TYPE_OPTIONS.find(o => o.value === fav.billType)?.label }}
                </span>
                <span v-if="fav.defaultAmount" class="mt-1 text-sm font-medium text-green-700">
                  {{ formatAmount(fav.defaultAmount) }}
                </span>
              </button>
            </div>
          </template>

          <!-- Manage mode: edit/delete list -->
          <template v-else-if="favMode === 'manage'">
            <div v-if="favTabItems.length === 0" class="py-4 text-center text-sm text-gray-400">
              ยังไม่มีรายการโปรดใน Tab {{ favTab }}
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="fav in favTabItems"
                :key="fav.id"
                class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
              >
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900">{{ fav.label }}</p>
                  <p v-if="fav.customerName" class="text-sm text-gray-500">{{ fav.customerName }}</p>
                </div>
                <button class="text-blue-600 hover:text-blue-800" title="แก้ไข" @click="startEditFavorite(fav)">
                  <PencilIcon class="h-4 w-4" />
                </button>
                <button class="text-red-500 hover:text-red-700" title="ลบ" @click="handleDeleteFavorite(fav.id)">
                  <TrashIcon class="h-4 w-4" />
                </button>
              </div>
            </div>
            <button
              v-if="!favTabFull"
              class="mt-3 w-full rounded-xl border border-dashed border-blue-300 py-3 text-sm text-blue-600 hover:bg-blue-50"
              @click="startAddFavorite"
            >
              + เพิ่มรายการโปรด
            </button>
            <p v-else class="mt-2 text-center text-xs text-gray-400">Tab นี้เต็มแล้ว (สูงสุด 10 รายการ)</p>
          </template>

          <!-- Add / Edit form -->
          <template v-else-if="favMode === 'add' || favMode === 'edit'">
            <div class="space-y-3">
              <FormField label="ชื่อรายการโปรด" required>
                <BaseInput v-model="favFormData.label" placeholder="เช่น ค่าไฟบ้านคุณสมชาย" />
              </FormField>
              <FormField label="ชื่อลูกค้า">
                <BaseInput v-model="favFormData.customerName" placeholder="ชื่อลูกค้า (ไม่บังคับ)" />
              </FormField>
              <FormField label="ประเภทบิล">
                <select v-model="favFormData.billType" class="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm">
                  <option v-for="opt in BILL_TYPE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </FormField>
              <div class="grid grid-cols-2 gap-3">
                <FormField label="จำนวนเงินเริ่มต้น (บาท)">
                  <BaseInput v-model="favFormData.defaultAmount" type="number" placeholder="0" min="0" />
                </FormField>
                <FormField label="ค่าธรรมเนียมเริ่มต้น (บาท)">
                  <BaseInput v-model="favFormData.defaultCommission" type="number" placeholder="0" min="0" />
                </FormField>
              </div>
            </div>
            <div class="mt-4 flex justify-end gap-2">
              <BaseButton variant="secondary" @click="favMode = 'manage'">ยกเลิก</BaseButton>
              <BaseButton variant="primary" :loading="isSavingFavorite" :disabled="!favFormData.label.trim()" @click="handleSaveFavorite">
                💾 บันทึก
              </BaseButton>
            </div>
          </template>
        </template>

        <!-- Step 2: Confirm amount -->
        <template v-else-if="favStep === 2 && selectedFavorite">
          <div class="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p class="font-semibold text-blue-900">{{ selectedFavorite.label }}</p>
            <p v-if="selectedFavorite.customerName" class="text-sm text-blue-700">{{ selectedFavorite.customerName }}</p>
            <p v-if="selectedFavorite.billType" class="mt-1 text-xs text-blue-600">
              {{ BILL_TYPE_OPTIONS.find(o => o.value === selectedFavorite!.billType)?.label }}
            </p>
          </div>
          <FormField label="จำนวนเงิน (บาท)" required>
            <BaseInput v-model="favAmount" type="number" placeholder="0" min="0" />
          </FormField>
          <FormField label="ค่าธรรมเนียม (บาท)">
            <div class="flex items-center gap-2">
              <BaseInput
                v-model="favManualCommission"
                type="number"
                placeholder="0"
                min="0"
                :disabled="!favIsCommissionManual"
                class="flex-1"
              />
              <button
                class="rounded-lg border px-3 py-2 text-sm transition-colors"
                :class="favIsCommissionManual ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 bg-gray-50 text-gray-500'"
                @click="favIsCommissionManual = !favIsCommissionManual"
              >
                {{ favIsCommissionManual ? '✏️ กำหนดเอง' : '— ไม่มี' }}
              </button>
            </div>
          </FormField>
          <div class="flex justify-end gap-2">
            <BaseButton variant="secondary" @click="goBackFavStep1">← กลับ</BaseButton>
            <BaseButton
              variant="primary"
              :disabled="!favAmount || Number(favAmount) <= 0"
              @click="handleSubmitFavorite"
            >
              ✅ บันทึกรายการ
            </BaseButton>
          </div>
        </template>
      </div>
    </BaseModal>
  </div>
</template>
