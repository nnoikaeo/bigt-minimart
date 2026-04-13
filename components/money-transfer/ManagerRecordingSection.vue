<script setup lang="ts">
import { useMoneyTransferStore } from '~/stores/money-transfer'
import { useDailyRecordSettingsStore } from '~/stores/daily-record-settings'
import { useLogger } from '~/composables/useLogger'
import { usePermissions } from '~/composables/usePermissions'
import { PERMISSIONS, ROLES } from '~/types/permissions'
import { BANK_LIST } from '~/constants/banks'
import type { TableColumn } from '~/components/shared/TransactionTable.vue'
import type { BalanceCardItem } from '~/components/shared/CompactBalanceSummary.vue'
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
  ArrowPathIcon,
} from '@heroicons/vue/24/outline'

const props = defineProps<{
  date: string
  currentUser: { uid: string; displayName: string }
}>()

const logger = useLogger('ManagerRecordingSection')
const store = useMoneyTransferStore()
const settingsStore = useDailyRecordSettingsStore()
const { can, hasAnyRole } = usePermissions()

// ─── Role ─────────────────────────────────────────────────────────────────────
const isManagerOrAsst = computed(() => hasAnyRole([ROLES.MANAGER, ROLES.ASSISTANT_MANAGER]))
const isStep1InProgress = computed(() => store.getCurrentWorkflowStatus === 'step1_in_progress')

// ─── Alert messages ───────────────────────────────────────────────────────────
const successMessage = ref('')
const errorMessage = ref('')

// ─── Modal visibility ─────────────────────────────────────────────────────────
const showTransactionModal = ref(false)
const showFavoriteModal = ref(false)
const showDetailModal = ref(false)
const showDeleteConfirm = ref(false)
const showOpeningBalanceModal = ref(false)

// ─── Modal data ───────────────────────────────────────────────────────────────
const editingTransaction = ref<any>(null)
const viewingTransaction = ref<any>(null)
const deletingTransactionId = ref<string>('')
const presetType = ref<'transfer' | 'withdrawal' | 'owner_deposit' | ''>('')
const statusChangeMode = ref<{ currentStatus: 'completed' | 'on_hold' } | undefined>(undefined)

// ─── Completing step 1 ────────────────────────────────────────────────────────
const isCompletingStep1 = ref(false)

// ─── Favorite Transfer modal state ────────────────────────────────────────────
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

const favTab = ref<1 | 2 | 3 | 4 | 5>(1)
const favMode = ref<'select' | 'manage' | 'add' | 'edit'>('select')
const favFormData = ref({ name: '', channel: 'promptpay' as 'promptpay' | 'bank', identifier: '', identifierType: 'phone' as string, bankName: '' })
const editingFavoriteId = ref<string>('')
const deletingFavoriteId = ref<string>('')
const isSavingFavorite = ref(false)

// ─── Opening Balance ──────────────────────────────────────────────────────────
const openingSource = ref<'carryover' | 'manual'>('carryover')
const manualOpeningAmount = ref<number>(0)
const isSettingOpeningBalance = ref(false)

// ─── Filter Tabs ──────────────────────────────────────────────────────────────
const activeFilter = ref<'all' | 'completed' | 'draft' | 'on_hold' | 'cancelled'>('all')
const filterTabs = [
  { label: 'ทั้งหมด', value: 'all' as const },
  { label: 'สำเร็จ', value: 'completed' as const },
  { label: 'รอดำเนินการ', value: 'draft' as const },
  { label: 'พักรายการ', value: 'on_hold' as const },
]

// ─── Pagination ───────────────────────────────────────────────────────────────
const currentPage = ref(1)
const PAGE_SIZE = 10

// ─── Computed ─────────────────────────────────────────────────────────────────
const usingDefaultFees = computed(() => settingsStore.moneyTransferFees.updatedAt === null)

const dateTransactions = computed(() => store.getTransactionsByDate(props.date))

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
const totalCash = computed(() =>
  totalTransfers.value - totalWithdrawals.value + (store.currentBalance?.serviceFeeCash ?? 0)
)

const filteredTransactions = computed(() => {
  if (activeFilter.value === 'all') return dateTransactions.value
  return dateTransactions.value.filter((t: any) => t.status === activeFilter.value)
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredTransactions.value.length / PAGE_SIZE)))
const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredTransactions.value.slice(start, start + PAGE_SIZE)
})
watch([activeFilter, () => props.date], () => { currentPage.value = 1 })

const draftTransactions = computed(() =>
  dateTransactions.value.filter((t: any) => t.status === 'draft')
)
const hasDrafts = computed(() => draftTransactions.value.length > 0)
const hasOnHold = computed(() =>
  dateTransactions.value.some((t: any) => t.status === 'on_hold')
)
const onHoldCount = computed(() =>
  dateTransactions.value.filter((t: any) => t.status === 'on_hold').length
)

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

const isOpeningSet = computed(() => store.currentBalance?.openingBalanceSource != null)
const canAddTransaction = computed(() => isOpeningSet.value && !store.isStep1Complete)
const canCompleteStep1 = computed(
  () => isOpeningSet.value && todayStats.value.total > 0 && !hasDrafts.value && !hasOnHold.value
)
const carryoverAmount = computed(() => store.previousDayBalance?.bankAccount ?? 0)
const openingBalance = computed(() => store.currentBalance?.openingBalance ?? 0)
const openingSourceLabel = computed(() => {
  const map: Record<string, string> = { carryover: 'จากเมื่อวาน', manual: 'กำหนดเอง' }
  return map[store.currentBalance?.openingBalanceSource ?? ''] || ''
})

const mtPrimaryCards = computed<BalanceCardItem[]>(() => [
  {
    label: 'เงินในบัญชีเริ่มต้น',
    value: openingBalance.value,
    colorClass: 'text-gray-700',
    subtitle: openingSourceLabel.value || undefined,
  },
  {
    label: 'รวมเงินโอน',
    value: totalTransfers.value,
    colorClass: 'text-red-600',
  },
  {
    label: 'เงินในบัญชีคงเหลือ',
    value: store.currentBalance?.bankAccount ?? 0,
    colorClass: 'text-gray-900',
    valueSize: 'text-xl',
    cardClass: 'border-gray-300 bg-gray-50',
    labelClass: 'text-gray-600 font-medium',
  },
  {
    label: 'เงินสดคงเหลือ',
    value: totalCash.value,
    colorClass: 'text-blue-800',
    cardClass: 'border-blue-200 bg-blue-50/40',
    labelClass: 'text-blue-600 font-medium',
  },
])

const mtSecondaryCards = computed<BalanceCardItem[]>(() => [
  { label: 'รวมเงินฝาก', value: totalDeposits.value, colorClass: 'text-blue-700' },
  { label: 'รวมเงินถอน', value: totalWithdrawals.value, colorClass: 'text-purple-700' },
  { label: 'รวมค่าบริการ (เงินสด)', value: store.currentBalance?.serviceFeeCash ?? 0, colorClass: 'text-green-700' },
  { label: 'รวมค่าบริการ (เงินโอน)', value: store.currentBalance?.serviceFeeTransfer ?? 0, colorClass: 'text-green-700' },
])

const favTabItems = computed(() =>
  (store.favorites as any[])
    .filter(f => f.tab === favTab.value)
    .sort((a: any, b: any) => a.order - b.order)
)
const favTabFull = computed(() => favTabItems.value.length >= 10)

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
} = useMoneyTransferHelpers()

const mtColumns: TableColumn[] = [
  { key: 'datetime', label: 'เวลา', formatter: (_v, row) => formatTime(row.datetime) },
  { key: 'transactionType', label: 'ประเภท', tdClass: 'font-medium text-gray-900', formatter: (v) => getTransactionTypeLabel(v) },
  { key: 'accountName', label: 'ชื่อบัญชี', component: 'account-name', hideOnMobile: true },
  { key: 'amount', label: 'จำนวนเงิน', align: 'right', tdClass: 'font-semibold text-gray-900', formatter: (v) => formatCurrency(v) },
  { key: 'commission', label: 'ค่าบริการ', align: 'right', component: 'commission' },
  { key: 'status', label: 'สถานะ', align: 'center', component: 'status' },
]

function getTabCount(status: string): number {
  if (status === 'all') return dateTransactions.value.length
  return dateTransactions.value.filter((t: any) => t.status === status).length
}

function canCompleteDraft(draft: any): boolean {
  return (store.currentBalance?.bankAccount ?? 0) >= draft.amount
}
function getShortfall(draft: any): number {
  return Math.max(0, draft.amount - (store.currentBalance?.bankAccount ?? 0))
}

// ─── Modal open/close ─────────────────────────────────────────────────────────
function openNewTransactionModal(preset: 'transfer' | 'withdrawal' | 'owner_deposit' | '' = '') {
  editingTransaction.value = null
  statusChangeMode.value = undefined
  presetType.value = preset
  showTransactionModal.value = true
}
function openEditModal(transaction: any) {
  editingTransaction.value = transaction
  statusChangeMode.value = undefined
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
function openStatusChange(txn: any) {
  editingTransaction.value = txn
  statusChangeMode.value = { currentStatus: txn.status }
  presetType.value = ''
  showDetailModal.value = false
  showTransactionModal.value = true
}
function confirmDelete(transactionId: string) {
  deletingTransactionId.value = transactionId
  showDeleteConfirm.value = true
}

// ─── Favorite modal helpers ────────────────────────────────────────────────────
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

// ─── Actions ──────────────────────────────────────────────────────────────────
async function handleSetOpeningBalance() {
  const amount = Number(
    openingSource.value === 'carryover' ? carryoverAmount.value : manualOpeningAmount.value
  )
  isSettingOpeningBalance.value = true
  try {
    await store.setOpeningBalance(props.date, amount, openingSource.value, props.currentUser.uid)
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
      date: props.date,
      datetime: new Date().toISOString(),
      transactionType: 'transfer',
      channel: fav.channel,
      amount: Number(favAmount.value),
      commission: favEffectiveCommission.value,
      commissionType: favCommissionType.value,
      destinationName: fav.name,
      destinationIdentifier: fav.identifier,
      accountName: fav.name,
      recordedBy: props.currentUser.uid,
      recordedByName: props.currentUser.displayName,
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
    await store.fetchTransactionsByDate(props.date)
    logger.log('Favorite transfer created')
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to create favorite transfer', err)
  }
}

async function handleSubmitTransaction(transactionData: any) {
  try {
    const statusChange = transactionData._statusChange
    const { _statusChange, status: _status, ...txnFields } = transactionData

    if (editingTransaction.value?.id) {
      await store.updateTransaction(editingTransaction.value.id, statusChange ? txnFields : { ...txnFields, status: _status })
      if (statusChange) {
        await store.changeTransactionStatus(
          editingTransaction.value.id,
          statusChange.status,
          statusChange.statusNote
        )
        const labels: Record<string, string> = { on_hold: 'พักรายการ', completed: 'สำเร็จ', cancelled: 'ยกเลิก' }
        successMessage.value = `อัปเดตรายการและเปลี่ยนสถานะเป็น "${labels[statusChange.status]}" สำเร็จ`
      } else {
        successMessage.value = 'อัปเดตรายการสำเร็จ'
      }
    } else {
      await store.createTransaction({
        ...txnFields,
        date: props.date,
        recordedBy: props.currentUser.uid,
        recordedByName: props.currentUser.displayName,
      })
      successMessage.value = 'บันทึกรายการใหม่สำเร็จ'
    }
    showTransactionModal.value = false
    statusChangeMode.value = undefined
    await store.fetchTransactionsByDate(props.date)
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
    await store.fetchTransactionsByDate(props.date)
    logger.log('Draft completed:', transactionId)
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to complete draft', err)
  }
}

async function handleDeleteTransaction() {
  try {
    await store.deleteTransaction(deletingTransactionId.value)
    successMessage.value = 'ลบรายการสำเร็จ'
    showDeleteConfirm.value = false
    await store.fetchTransactionsByDate(props.date)
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
  if (hasOnHold.value) {
    errorMessage.value = 'กรุณาสรุปรายการที่พักไว้ (on hold) ทั้งหมดก่อน'
    return
  }
  if (todayStats.value.total === 0) {
    errorMessage.value = 'กรุณาบันทึกรายการอย่างน้อย 1 รายการก่อน'
    return
  }
  isCompletingStep1.value = true
  try {
    await store.completeStep1(props.date)
    successMessage.value = 'บันทึกรายการเสร็จสมบูรณ์ — ดำเนินการตรวจนับเงินสดได้เลย'
    logger.log('Step 1 completed')
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
</script>

<template>
  <div>
    <!-- Alerts -->
    <BaseAlert v-if="successMessage" variant="success" :message="successMessage" :auto-close="true" class="mb-4" @close="successMessage = ''" />
    <BaseAlert v-if="errorMessage" variant="error" :message="errorMessage" class="mb-4" @close="errorMessage = ''" />

    <!-- ── Opening Balance prompt ──────────────────────────────────────────── -->
    <section v-if="!isOpeningSet" class="mb-4">
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

    <!-- ── Balance Cards — full 8 cards ──────────────────────────────────── -->
    <section v-if="isStep1InProgress" class="mb-6">
      <h2 class="text-base font-semibold text-gray-700 mb-3">📊 ยอดเงินปัจจุบัน</h2>
      <!-- Row 1 -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <BaseCard class="text-center">
          <div class="text-xs text-gray-500 mb-1">เงินในบัญชีเริ่มต้น</div>
          <div class="text-lg font-bold text-gray-700">{{ formatCurrency(store.currentBalance?.openingBalance ?? 0) }}</div>
          <div class="text-xs text-gray-400 mt-0.5">
            {{ store.currentBalance?.openingBalanceSource === 'carryover' ? 'จากเมื่อวาน' : store.currentBalance?.openingBalanceSource === 'manual' ? 'กำหนดเอง' : '—' }}
          </div>
        </BaseCard>
        <BaseCard class="text-center">
          <div class="text-xs text-gray-500 mb-1">รวมเงินฝาก</div>
          <div class="text-lg font-bold text-blue-700">{{ formatCurrency(totalDeposits) }}</div>
        </BaseCard>
        <BaseCard class="text-center">
          <div class="text-xs text-gray-500 mb-1">รวมเงินโอน</div>
          <div class="text-lg font-bold text-red-600">{{ formatCurrency(totalTransfers) }}</div>
        </BaseCard>
        <BaseCard class="text-center">
          <div class="text-xs text-gray-500 mb-1">รวมเงินถอน</div>
          <div class="text-lg font-bold text-purple-700">{{ formatCurrency(totalWithdrawals) }}</div>
        </BaseCard>
      </div>
      <!-- Row 2 -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <BaseCard class="text-center">
          <div class="text-xs text-gray-500 mb-1">รวมค่าบริการ (เงินสด)</div>
          <div class="text-lg font-bold text-green-700">{{ formatCurrency(store.currentBalance?.serviceFeeCash ?? 0) }}</div>
        </BaseCard>
        <BaseCard class="text-center">
          <div class="text-xs text-gray-500 mb-1">รวมค่าบริการ (โอน)</div>
          <div class="text-lg font-bold text-green-700">{{ formatCurrency(store.currentBalance?.serviceFeeTransfer ?? 0) }}</div>
        </BaseCard>
        <BaseCard class="text-center border-gray-300 bg-gray-50 col-span-1">
          <div class="text-xs text-gray-600 font-medium mb-1">เงินในบัญชีคงเหลือ</div>
          <div class="text-xl font-bold text-gray-900">{{ formatCurrency(store.currentBalance?.bankAccount ?? 0) }}</div>
        </BaseCard>
        <BaseCard class="text-center border-blue-200 bg-blue-50/40 col-span-1">
          <div class="text-xs text-blue-600 font-medium mb-1">เงินสดคงเหลือ</div>
          <div class="text-lg font-bold text-blue-800">{{ formatCurrency(totalCash) }}</div>
        </BaseCard>
      </div>
    </section>

    <!-- ── Default Fee Banner ─────────────────────────────────────────────── -->
    <div v-if="usingDefaultFees" class="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
      <span class="shrink-0 text-base">⚙️</span>
      <div class="flex-1 text-amber-800">
        ยังใช้<strong>อัตราค่าบริการเริ่มต้น</strong> (10 / 20 / 30 / 40 บาท) —
        <NuxtLink to="/settings/daily-record-settings" class="underline font-semibold hover:text-amber-900">
          ตั้งค่าได้ที่ ตั้งค่า › ตั้งค่าการบันทึกรายวัน
        </NuxtLink>
      </div>
    </div>

    <!-- ── Quick Actions ───────────────────────────────────────────────────── -->
    <section v-if="isStep1InProgress" class="mb-6">
      <h2 class="text-base font-semibold text-gray-700 mb-3">⚡ รายการด่วน</h2>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          :disabled="!canAddTransaction"
          :class="['flex flex-col items-center gap-2 p-4 border rounded-xl font-medium text-sm transition-colors', canAddTransaction ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 text-yellow-800 cursor-pointer' : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-50']"
          @click="canAddTransaction && openFavoriteModal()"
        >
          <StarIcon class="w-6 h-6" />
          รายการโปรด
        </button>
        <button
          :disabled="!canAddTransaction"
          :class="['flex flex-col items-center gap-2 p-4 border rounded-xl font-medium text-sm transition-colors', canAddTransaction ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-800 cursor-pointer' : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-50']"
          @click="canAddTransaction && openNewTransactionModal('transfer')"
        >
          <ArrowUpTrayIcon class="w-6 h-6" />
          โอนเงิน
        </button>
        <button
          :disabled="!canAddTransaction"
          :class="['flex flex-col items-center gap-2 p-4 border rounded-xl font-medium text-sm transition-colors', canAddTransaction ? 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-800 cursor-pointer' : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-50']"
          @click="canAddTransaction && openNewTransactionModal('withdrawal')"
        >
          <ArrowDownTrayIcon class="w-6 h-6" />
          ถอนเงิน
        </button>
        <button
          :disabled="!canAddTransaction"
          :class="['flex flex-col items-center gap-2 p-4 border rounded-xl font-medium text-sm transition-colors', canAddTransaction ? 'bg-green-50 border-green-200 hover:bg-green-100 text-green-800 cursor-pointer' : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-50']"
          @click="canAddTransaction && openNewTransactionModal('owner_deposit')"
        >
          <BanknotesIcon class="w-6 h-6" />
          ฝากเงิน
        </button>
      </div>
    </section>

    <!-- ── Draft Transactions Alert ───────────────────────────────────────── -->
    <section v-if="hasDrafts" class="mb-6">
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
                <span v-if="!canCompleteDraft(draft)" class="text-red-600 ml-2">(ขาด {{ formatCurrency(getShortfall(draft)) }})</span>
              </div>
              <div v-if="draft.draftReason" class="text-xs text-gray-500 mt-0.5">
                {{ draft.draftReason === 'insufficient_funds' ? 'ยอดเงินในบัญชีไม่เพียงพอ' : draft.draftReason }}
              </div>
            </div>
            <div class="flex gap-2">
              <ActionButton v-if="canCompleteDraft(draft)" :permission="PERMISSIONS.EDIT_FINANCE" variant="success" size="sm" @click="handleCompleteDraft(draft.id)">
                <CheckCircleIcon class="w-4 h-4" />
                ดำเนินการ
              </ActionButton>
              <BaseButton v-else variant="secondary" size="sm" disabled>ยอดไม่พอ</BaseButton>
              <ActionButton :permission="PERMISSIONS.EDIT_FINANCE" variant="danger" size="sm" @click="confirmDelete(draft.id)">
                <TrashIcon class="w-4 h-4" />
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Transactions Table ─────────────────────────────────────────────── -->
    <section v-if="isStep1InProgress" class="mb-6">
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-gray-100">
          <h2 class="text-base font-semibold text-gray-700">📋 รายการธุรกรรมวันนี้</h2>
          <div class="flex items-center gap-2">
            <ActionButton v-if="canAddTransaction" :permission="PERMISSIONS.EDIT_FINANCE" variant="primary" size="sm" @click.stop="openNewTransactionModal()">
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
            :class="['px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors', activeFilter === tab.value ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700']"
            @click="activeFilter = tab.value"
          >
            {{ tab.label }}
            <span :class="['ml-1.5 px-1.5 py-0.5 rounded-full text-xs', activeFilter === tab.value ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600']">
              {{ getTabCount(tab.value) }}
            </span>
          </button>
        </div>
        <!-- Table -->
        <TransactionTable
          :transactions="paginatedTransactions"
          :columns="mtColumns"
          :index-offset="(currentPage - 1) * PAGE_SIZE"
          :empty-message="activeFilter === 'all' ? 'กด Quick Actions หรือ [รายการใหม่] เพื่อเริ่มบันทึก' : `ไม่มีรายการที่มีสถานะ ${filterTabs.find(t => t.value === activeFilter)?.label}`"
          @row-click="openDetailModal"
        >
          <template #col-account-name="{ row }">
            <div class="text-gray-900 text-sm">{{ getAccountName(row) }}</div>
            <div v-if="getChannelSubtitle(row)" class="text-xs text-gray-400 mt-0.5">{{ getChannelSubtitle(row) }}</div>
          </template>
          <template #col-commission="{ row }">
            <template v-if="row.transactionType !== 'owner_deposit'">
              {{ row.commission ? formatCurrency(row.commission) : '-' }}
              <span v-if="row.commissionType" class="text-xs text-gray-400 ml-1">{{ row.commissionType === 'cash' ? 'C' : 'T' }}</span>
            </template>
            <template v-else>-</template>
          </template>
          <template #col-status="{ row }">
            <div class="flex flex-col items-center gap-1">
              <BaseBadge :variant="getStatusBadgeVariant(row.status)" size="sm" dot>{{ getStatusLabel(row.status) }}</BaseBadge>
            </div>
          </template>
          <template #actions="{ txn }">
            <button aria-label="ดูรายละเอียด" class="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" @click="openDetailModal(txn)">
              <EyeIcon class="w-4 h-4" />
            </button>
            <ActionButton
              v-if="(txn.status === 'completed' || txn.status === 'on_hold') && !store.isStep1Complete"
              :permission="PERMISSIONS.EDIT_FINANCE"
              variant="ghost"
              size="sm"
              class="text-amber-500 hover:text-amber-600 hover:bg-amber-50"
              @click="openStatusChange(txn)"
            >
              <ArrowPathIcon class="w-4 h-4" />
            </ActionButton>
            <ActionButton
              v-if="txn.status === 'draft'"
              :permission="PERMISSIONS.EDIT_FINANCE"
              variant="ghost"
              size="sm"
              @click="openEditModal(txn)"
            >
              <PencilIcon class="w-4 h-4" />
            </ActionButton>
            <ActionButton
              v-if="txn.status === 'draft'"
              :permission="PERMISSIONS.EDIT_FINANCE"
              variant="ghost"
              size="sm"
              class="text-red-500 hover:text-red-600 hover:bg-red-50"
              @click="confirmDelete(txn.id)"
            >
              <TrashIcon class="w-4 h-4" />
            </ActionButton>
          </template>
        </TransactionTable>
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 px-4 py-3 border-t border-gray-100">
          <BaseButton variant="secondary" size="sm" :disabled="currentPage === 1" @click="currentPage--">‹</BaseButton>
          <span class="text-sm text-gray-600">{{ currentPage }} / {{ totalPages }}</span>
          <BaseButton variant="secondary" size="sm" :disabled="currentPage === totalPages" @click="currentPage++">›</BaseButton>
        </div>
      </div>
    </section>

    <!-- ── Step 1 Completion Checklist ────────────────────────────────────── -->
    <section v-if="!store.isStep1Complete" class="py-4">
      <div
        class="max-w-lg mx-auto border-2 rounded-2xl p-5 mb-5 transition-colors duration-300"
        :class="canCompleteStep1 ? 'border-green-400 bg-green-50' : 'border-amber-300 bg-amber-50'"
      >
        <h3 class="font-semibold text-sm mb-3" :class="canCompleteStep1 ? 'text-green-800' : 'text-amber-800'">
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
          <li class="flex items-center gap-2" :class="!hasOnHold ? 'text-green-700' : 'text-red-600'">
            <span class="text-base">{{ !hasOnHold ? '✅' : '❌' }}</span>
            {{ hasOnHold ? 'มีรายการพักค้างอยู่' : 'ไม่มีรายการพักค้างอยู่' }}
            <span v-if="hasOnHold" class="font-medium text-red-600">({{ onHoldCount }} รายการ)</span>
          </li>
        </ul>
      </div>
      <div class="flex justify-center mb-3 flex-col items-center gap-2">
        <BaseAlert v-if="hasDrafts" variant="warning" message="กรุณาดำเนินการหรือลบ Draft Transaction ทั้งหมดก่อนไปขั้นตอนถัดไป" :dismissible="false" class="w-full max-w-lg" />
        <BaseAlert v-if="hasOnHold" variant="warning" message="กรุณาสรุปรายการที่พักไว้ (on hold) ทั้งหมดก่อนไปขั้นตอนถัดไป" :dismissible="false" class="w-full max-w-lg" />
      </div>
      <div class="flex justify-center">
        <div class="rounded-xl transition-all duration-300" :class="canCompleteStep1 ? 'ring-4 ring-green-400 ring-offset-2 shadow-lg shadow-green-200' : ''">
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

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- Modal O: Opening Balance                                               -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <BaseModal :open="showOpeningBalanceModal" title="💳 กำหนดยอดเงินในบัญชีเริ่มต้น" size="md" @close="showOpeningBalanceModal = false">
      <div class="space-y-4">
        <label :class="['flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors', openingSource === 'carryover' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300']">
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
        <label :class="['flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors', openingSource === 'manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300']">
          <input v-model="openingSource" type="radio" value="manual" class="mt-0.5 accent-blue-600" />
          <div class="flex-1">
            <div class="font-semibold text-gray-900">✏️ กำหนดเอง</div>
            <div class="text-sm text-gray-500 mt-0.5">ระบุยอดเงินเริ่มต้นด้วยตนเอง</div>
            <div v-if="openingSource === 'manual'" class="mt-3">
              <div class="relative" @click.stop>
                <BaseInput v-model="manualOpeningAmount" type="number" placeholder="0" min="0" />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">บาท</span>
              </div>
            </div>
          </div>
        </label>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton variant="secondary" @click="showOpeningBalanceModal = false">ยกเลิก</BaseButton>
          <BaseButton variant="primary" :disabled="openingSource === 'manual' && manualOpeningAmount < 0" :loading="isSettingOpeningBalance" @click="handleSetOpeningBalance">
            💾 ยืนยันยอดเงินเริ่มต้น
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- Modal A: Favorite Transfer                                             -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <BaseModal :open="showFavoriteModal" size="lg" @close="showFavoriteModal = false">
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

      <!-- Step 1: Select / Manage / Add / Edit -->
      <div v-if="favStep === 1">
        <div v-if="favMode === 'select' || favMode === 'manage'" class="flex border-b border-gray-200 mb-4 -mx-1">
          <button
            v-for="t in ([1,2,3,4,5] as const)"
            :key="t"
            class="flex-1 py-2 text-sm font-medium transition-colors"
            :class="favTab === t ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500 hover:text-gray-700'"
            @click="favTab = t; deletingFavoriteId = ''"
          >
            Tab #{{ t }}
            <span class="ml-1 text-xs rounded-full px-1.5 py-0.5" :class="favTab === t ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'">
              {{ (store.favorites as any[]).filter((f: any) => f.tab === t).length }}
            </span>
          </button>
        </div>

        <!-- SELECT MODE -->
        <div v-if="favMode === 'select'">
          <p class="text-sm text-gray-500 mb-3">คลิกชื่อเพื่อเลือกบัญชีปลายทาง</p>
          <div class="h-72 overflow-y-auto space-y-2 pr-1">
            <template v-if="favTabItems.length > 0">
              <button v-for="(fav, i) in favTabItems" :key="fav.id" class="w-full flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-colors text-left" @click="selectFavorite(fav)">
                <div class="flex items-center gap-3">
                  <span class="text-yellow-500 font-bold text-sm w-6 text-center">★{{ i + 1 }}</span>
                  <div>
                    <div class="font-medium text-gray-900">{{ fav.name }}</div>
                    <div class="text-sm text-gray-500">{{ fav.channel === 'promptpay' ? `พร้อมเพย์ · ${fav.identifierType === 'phone' ? 'เบอร์โทร' : 'บัตรประชาชน'}` : fav.bankName }} · {{ fav.identifier }}</div>
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

        <!-- MANAGE MODE -->
        <div v-else-if="favMode === 'manage'">
          <div class="h-64 overflow-y-auto space-y-2 pr-1">
            <template v-if="favTabItems.length > 0">
              <div v-for="(fav, i) in favTabItems" :key="fav.id">
                <div class="flex items-center justify-between p-3 border border-gray-200 rounded-xl" :class="deletingFavoriteId === fav.id ? 'border-red-300 bg-red-50' : ''">
                  <div class="flex items-center gap-3">
                    <span class="text-yellow-500 font-bold text-sm w-6 text-center">★{{ i + 1 }}</span>
                    <div>
                      <div class="font-medium text-gray-900 text-sm">{{ fav.name }}</div>
                      <div class="text-xs text-gray-500">{{ fav.channel === 'promptpay' ? `พร้อมเพย์ · ${fav.identifierType === 'phone' ? 'เบอร์โทร' : 'บัตรประชาชน'}` : fav.bankName }} · {{ fav.identifier }}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button class="text-blue-500 hover:text-blue-700 text-sm p-1" @click="openEditFavoriteForm(fav)">✏️</button>
                    <button class="text-red-500 hover:text-red-700 text-sm p-1" @click="deletingFavoriteId = deletingFavoriteId === fav.id ? '' : fav.id">🗑️</button>
                  </div>
                </div>
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
          <div class="mt-3 pt-3 border-t border-gray-100">
            <button v-if="!favTabFull" class="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors" @click="openAddFavoriteForm">
              ➕ เพิ่มบัญชีโปรดใน Tab #{{ favTab }}
            </button>
            <p v-else class="text-center text-sm text-gray-400 py-2">Tab #{{ favTab }} เต็มแล้ว (สูงสุด 10 รายการ)</p>
          </div>
        </div>

        <!-- ADD / EDIT FORM -->
        <div v-else-if="favMode === 'add' || favMode === 'edit'" class="space-y-4">
          <FormField label="ชื่อ / ฉายา" required>
            <BaseInput v-model="favFormData.name" placeholder="เช่น สมชาย, บ. ABC จำกัด" />
          </FormField>
          <FormField label="ช่องทาง" required>
            <div class="flex gap-6">
              <label class="flex items-center gap-2 cursor-pointer"><input type="radio" v-model="favFormData.channel" value="bank" class="accent-red-500" /><span class="text-sm">ธนาคาร</span></label>
              <label class="flex items-center gap-2 cursor-pointer"><input type="radio" v-model="favFormData.channel" value="promptpay" class="accent-red-500" /><span class="text-sm">พร้อมเพย์</span></label>
            </div>
          </FormField>
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
          <template v-else-if="favFormData.channel === 'promptpay'">
            <FormField label="ประเภทพร้อมเพย์" required>
              <div class="flex gap-6">
                <label class="flex items-center gap-2 cursor-pointer"><input type="radio" v-model="favFormData.identifierType" value="phone" class="accent-red-500" /><span class="text-sm">หมายเลขโทรศัพท์</span></label>
                <label class="flex items-center gap-2 cursor-pointer"><input type="radio" v-model="favFormData.identifierType" value="idcard" class="accent-red-500" /><span class="text-sm">หมายเลขบัตรประชาชน</span></label>
              </div>
            </FormField>
            <FormField :label="favFormData.identifierType === 'idcard' ? 'เลขบัตรประชาชน' : 'เบอร์โทรศัพท์'" required>
              <BaseInput v-model="favFormData.identifier" :placeholder="favFormData.identifierType === 'idcard' ? 'เช่น 1-2345-67890-12-3' : 'เช่น 081-234-5678'" />
            </FormField>
          </template>
        </div>
      </div>

      <!-- Step 2: Enter Amount -->
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
              <BaseInput v-model="favAmount" type="number" placeholder="0" :error="isInsufficientFunds" />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">บาท</span>
            </div>
            <div v-if="isInsufficientFunds" class="text-red-600 text-sm mt-1">
              ❌ ยอดเงินไม่เพียงพอ (ขาด {{ formatCurrency(favAmount - (store.currentBalance?.bankAccount ?? 0)) }})
            </div>
          </FormField>
          <FormField label="ค่าบริการ">
            <div class="flex items-center gap-3">
              <div class="relative flex-1">
                <BaseInput
                  v-model="favManualCommission"
                  type="number"
                  placeholder="0"
                  :disabled="!favIsCommissionManual"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">บาท</span>
              </div>
              <label class="flex items-center gap-1.5 text-sm text-gray-600 whitespace-nowrap">
                <input v-model="favIsCommissionManual" type="checkbox" class="accent-red-500" />
                กำหนดเอง
              </label>
            </div>
            <div v-if="!favIsCommissionManual" class="text-xs text-gray-400 mt-1">ค่าบริการอัตโนมัติ: {{ formatCurrency(favEffectiveCommission) }}</div>
          </FormField>
          <FormField label="ประเภทค่าบริการ">
            <div class="flex gap-4">
              <label class="flex items-center gap-2 cursor-pointer"><input v-model="favCommissionType" type="radio" value="cash" class="accent-red-500" /><span class="text-sm">เงินสด</span></label>
              <label class="flex items-center gap-2 cursor-pointer"><input v-model="favCommissionType" type="radio" value="transfer" class="accent-red-500" /><span class="text-sm">โอน</span></label>
            </div>
          </FormField>
          <div v-if="favAmount > 0" class="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
            <div class="flex justify-between">
              <span class="text-gray-500">{{ favBannerInfo.balanceLabel }} ปัจจุบัน</span>
              <span class="font-medium">{{ formatCurrency(favBannerInfo.current) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">หลังโอน</span>
              <span class="font-medium" :class="favBannerInfo.ok ? 'text-gray-900' : 'text-red-600'">{{ formatCurrency(favBannerInfo.after) }}</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between">
          <!-- Back button / mode toggle -->
          <div class="flex gap-2">
            <BaseButton v-if="favStep === 2" variant="secondary" @click="favStep = 1; favMode = 'select'">← กลับ</BaseButton>
            <BaseButton v-else-if="favMode !== 'select'" variant="secondary" @click="favMode = 'select'">← กลับ</BaseButton>
          </div>
          <div class="flex gap-2">
            <!-- Manage toggle -->
            <BaseButton v-if="favStep === 1 && favMode === 'select'" variant="secondary" size="sm" @click="favMode = 'manage'">⚙️ จัดการ</BaseButton>
            <!-- Save fav form -->
            <BaseButton v-if="favMode === 'add' || favMode === 'edit'" variant="primary" :loading="isSavingFavorite" :disabled="!favFormData.name.trim() || !favFormData.identifier.trim()" @click="handleSaveFavorite">
              💾 บันทึก
            </BaseButton>
            <!-- Submit transfer -->
            <ActionButton v-if="favStep === 2" :permission="PERMISSIONS.EDIT_FINANCE" variant="primary" :disabled="favAmount <= 0" @click="handleSubmitFavorite">
              ✅ {{ isInsufficientFunds ? 'บันทึกเป็น Draft' : 'ยืนยันโอนเงิน' }}
            </ActionButton>
          </div>
        </div>
      </template>
    </BaseModal>

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- Modal B: New / Edit Transaction                                        -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <BaseModal
      :open="showTransactionModal"
      :title="statusChangeMode ? '✏️ แก้ไขรายการและเปลี่ยนสถานะ' : editingTransaction ? '✏️ แก้ไขรายการ' : '📝 รายการใหม่'"
      size="xl"
      @close="showTransactionModal = false; statusChangeMode = undefined"
    >
      <MoneyTransferTransactionForm
        v-if="showTransactionModal && store.currentBalance"
        :current-balance="store.currentBalance"
        :recorded-by="currentUser.uid"
        :recorded-by-name="currentUser.displayName"
        :editing-data="editingTransaction"
        :preset-type="presetType || undefined"
        :status-change="statusChangeMode"
        @submit="handleSubmitTransaction"
        @cancel="showTransactionModal = false; statusChangeMode = undefined"
      />
    </BaseModal>

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- Transaction Detail Modal                                               -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <BaseModal :open="showDetailModal" size="md" @close="showDetailModal = false">
      <template #header>
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-bold text-gray-900">รายละเอียดรายการ</h2>
          <BaseBadge v-if="viewingTransaction" :variant="getStatusBadgeVariant(viewingTransaction.status)" size="md" dot>
            {{ getStatusLabel(viewingTransaction.status) }}
          </BaseBadge>
        </div>
      </template>
      <div v-if="viewingTransaction" class="space-y-3 text-sm">
        <div v-if="viewingTransaction.status === 'draft'" class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800">
          ⚠️ รายการนี้อยู่ในสถานะ Draft — รอดำเนินการ
        </div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-3">
          <template v-if="viewingTransaction.channel === 'bank' || viewingTransaction.channel === 'other'">
            <div class="col-span-2"><div class="text-gray-500">ธนาคาร</div><div class="font-medium text-gray-900">{{ viewingTransaction.bankName || '-' }}</div></div>
            <div><div class="text-gray-500">เลขบัญชี</div><div class="font-medium text-gray-900">{{ viewingTransaction.accountNumber || '-' }}</div></div>
            <div><div class="text-gray-500">ชื่อบัญชี</div><div class="font-medium text-gray-900">{{ viewingTransaction.accountName || '-' }}</div></div>
          </template>
          <template v-else-if="viewingTransaction.channel === 'promptpay'">
            <div class="col-span-2"><div class="text-gray-500">ช่องทาง</div><div class="font-medium text-gray-900">พร้อมเพย์</div></div>
            <div><div class="text-gray-500">{{ viewingTransaction.promptpayIdentifierType === 'id_card' ? 'เลขบัตรประชาชน' : 'หมายเลขโทรศัพท์' }}</div><div class="font-medium text-gray-900">{{ viewingTransaction.promptpayIdentifier || '-' }}</div></div>
            <div><div class="text-gray-500">ชื่อบัญชี</div><div class="font-medium text-gray-900">{{ viewingTransaction.promptpayAccountName || viewingTransaction.accountName || '-' }}</div></div>
          </template>
          <div><div class="text-gray-500">ประเภท</div><div class="font-medium text-gray-900">{{ getTransactionTypeLabel(viewingTransaction.transactionType) }}</div></div>
          <div v-if="viewingTransaction.transactionType === 'owner_deposit'"><div class="text-gray-500">ช่องทาง</div><div class="font-medium text-gray-900">{{ getChannelLabel(viewingTransaction.channel) }}</div></div>
          <div><div class="text-gray-500">วันที่/เวลา</div><div class="font-medium text-gray-900">{{ formatDatetime(viewingTransaction.datetime) }}</div></div>
          <div><div class="text-gray-500">จำนวนเงิน</div><div class="font-bold text-gray-900 text-base">{{ formatCurrency(viewingTransaction.amount) }}</div></div>
          <div v-if="viewingTransaction.commission && viewingTransaction.transactionType !== 'owner_deposit'">
            <div class="text-gray-500">ค่าบริการ</div>
            <div class="font-medium text-green-700">{{ formatCurrency(viewingTransaction.commission) }} <span class="text-xs text-gray-400">({{ viewingTransaction.commissionType === 'cash' ? 'เงินสด' : 'โอน' }})</span></div>
          </div>
          <div v-if="viewingTransaction.destinationName"><div class="text-gray-500">ชื่อปลายทาง</div><div class="font-medium text-gray-900">{{ viewingTransaction.destinationName }}</div></div>
          <div v-if="viewingTransaction.destinationIdentifier"><div class="text-gray-500">หมายเลขบัญชี</div><div class="font-medium text-gray-900">{{ viewingTransaction.destinationIdentifier }}</div></div>
          <div v-if="viewingTransaction.notes" class="col-span-2"><div class="text-gray-500">หมายเหตุ</div><div class="font-medium text-gray-900">{{ viewingTransaction.notes }}</div></div>
        </div>
      </div>
      <template #footer>
        <div class="flex items-center justify-between">
          <div class="flex gap-2">
            <ActionButton
              v-if="viewingTransaction && (viewingTransaction.status === 'completed' || viewingTransaction.status === 'on_hold') && !store.isStep1Complete"
              :permission="PERMISSIONS.EDIT_FINANCE"
              variant="secondary"
              size="sm"
              @click="openStatusChange(viewingTransaction)"
            >
              <ArrowPathIcon class="w-4 h-4" />
              เปลี่ยนสถานะ
            </ActionButton>
            <ActionButton
              v-if="viewingTransaction && viewingTransaction.status === 'draft'"
              :permission="PERMISSIONS.EDIT_FINANCE"
              variant="secondary"
              size="sm"
              @click="openEditModal(viewingTransaction); showDetailModal = false"
            >
              <PencilIcon class="w-4 h-4" />
              แก้ไข
            </ActionButton>
          </div>
          <div class="flex gap-2">
            <ActionButton
              v-if="viewingTransaction && viewingTransaction.status === 'draft'"
              :permission="PERMISSIONS.EDIT_FINANCE"
              variant="danger"
              size="sm"
              @click="confirmDelete(viewingTransaction.id); showDetailModal = false"
            >
              <TrashIcon class="w-4 h-4" />
              ลบ
            </ActionButton>
            <BaseButton variant="secondary" @click="showDetailModal = false">ปิด</BaseButton>
          </div>
        </div>
      </template>
    </BaseModal>

    <!-- Delete Confirm Dialog -->
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
  </div>
</template>
