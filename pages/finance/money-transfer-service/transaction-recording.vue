<script setup lang="ts">
import { useMoneyTransferStore } from '~/stores/money-transfer'
import { useLogger } from '~/composables/useLogger'
import { usePermissions } from '~/composables/usePermissions'
import { PERMISSIONS } from '~/types/permissions'
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
} from '@heroicons/vue/24/outline'

definePageMeta({
  middleware: 'auth',
})

const logger = useLogger('MoneyTransferStep1')
const store = useMoneyTransferStore()
const router = useRouter()
const route = useRoute()
const { can } = usePermissions()

// ─── Auth ────────────────────────────────────────────────────────────────────
const authStore = useAuthStore()
const currentUser = computed(() => ({
  uid: authStore.user?.uid ?? '',
  displayName: authStore.user?.displayName ?? 'Unknown',
}))

// ─── State ───────────────────────────────────────────────────────────────────
const selectedDate = ref<string>(new Date().toISOString().split('T')[0] ?? '')
const activeFilter = ref<'all' | 'completed' | 'draft' | 'failed'>('all')
const successMessage = ref('')
const errorMessage = ref('')
// Show redirect notice when arriving from step-2 guard
const showStep1RequiredNotice = ref(false)

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
const favCommission = ref<number>(0)

// Owner Deposit modal state
const ownerDepositAmount = ref<number>(0)
const ownerDepositNotes = ref('')
const ownerDepositTime = ref(new Date().toTimeString().slice(0, 5))
const isOwnerDepositSubmitting = ref(false)

// Completing step 1
const isCompletingStep1 = ref(false)

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

/** Opening balance has been set for the selected date */
const isOpeningSet = computed(() => store.currentBalance?.openingBalanceSource != null)

/** All prerequisites met — user should click the complete button */
const canCompleteStep1 = computed(
  () => isOpeningSet.value && todayStats.value.total > 0 && !hasDrafts.value
)

/** bankAccount from previous day (pre-fills carry-over option) */
const carryoverAmount = computed(() => store.previousDayBalance?.bankAccount ?? 0)

const dateTransactions = computed(() =>
  store.getTransactionsByDate(selectedDate.value)
)

const filteredTransactions = computed(() => {
  if (activeFilter.value === 'all') return dateTransactions.value
  return dateTransactions.value.filter((t: any) => t.status === activeFilter.value)
})

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
      .filter((t: any) => t.status === 'completed')
      .reduce((sum: number, t: any) => sum + (t.commission || 0), 0),
  }
})

function getTabCount(status: string): number {
  if (status === 'all') return dateTransactions.value.length
  return dateTransactions.value.filter((t: any) => t.status === status).length
}

/** Favorites for the currently selected tab, sorted by order */
const favTabItems = computed(() =>
  (store.favorites as any[])
    .filter(f => f.tab === favTab.value)
    .sort((a: any, b: any) => a.order - b.order)
)

/** True when the current tab already has 10 favorites */
const favTabFull = computed(() => favTabItems.value.length >= 10)

const favBalanceAfter = computed(() => {
  const balance = store.currentBalance?.bankAccount ?? 0
  return balance - favAmount.value
})

const isInsufficientFunds = computed(() => {
  const balance = store.currentBalance?.bankAccount ?? 0
  return favAmount.value > 0 && favAmount.value > balance
})

const ownerDepositBalanceAfter = computed(() => {
  const balance = store.currentBalance?.bankAccount ?? 0
  return balance + ownerDepositAmount.value
})

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' ฿'
}

function formatTime(datetime: string | Date): string {
  return new Date(datetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

function getTransactionTypeLabel(type: string): string {
  const map: Record<string, string> = {
    transfer: 'โอนเงิน',
    withdrawal: 'ถอนเงิน',
    owner_deposit: 'เจ้าของฝากเงิน',
  }
  return map[type] || type
}

function getChannelLabel(channel?: string): string {
  if (!channel) return '-'
  const map: Record<string, string> = {
    promptpay: 'PromptPay',
    bank: 'โอนธนาคาร',
    other: 'อื่นๆ',
  }
  return map[channel] || channel
}

function getStatusBadgeVariant(status: string): 'success' | 'warning' | 'error' | 'default' {
  const map: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
    completed: 'success',
    draft: 'warning',
    failed: 'error',
    cancelled: 'default',
  }
  return map[status] ?? 'default'
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    completed: 'สำเร็จ',
    draft: 'รอดำเนินการ',
    failed: 'ล้มเหลว',
    cancelled: 'ยกเลิก',
  }
  return map[status] || status
}

function canCompleteDraft(draft: any): boolean {
  return (store.currentBalance?.bankAccount ?? 0) >= draft.amount
}

function getShortfall(draft: any): number {
  return Math.max(0, draft.amount - (store.currentBalance?.bankAccount ?? 0))
}

// ─── Actions ──────────────────────────────────────────────────────────────────
async function handleDateChange() {
  try {
    await store.fetchTransactionsByDate(selectedDate.value)
    await store.fetchDailySummary(selectedDate.value)
    await store.fetchPreviousDayBalance(selectedDate.value)
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
  favCommission.value = 0
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
  const amount =
    openingSource.value === 'carryover' ? carryoverAmount.value : manualOpeningAmount.value
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
  favCommission.value = 0
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

function calcFavCommission() {
  // Auto-calculate: 1% min 10 ฿
  if (favAmount.value > 0) {
    favCommission.value = Math.max(10, Math.floor(favAmount.value * 0.01))
  } else {
    favCommission.value = 0
  }
}

async function handleSubmitFavorite() {
  if (!selectedFavorite.value || favAmount.value <= 0) return
  try {
    const data = {
      date: selectedDate.value,
      datetime: new Date().toISOString(),
      transactionType: 'transfer',
      channel: selectedFavorite.value.channel,
      amount: favAmount.value,
      commission: favCommission.value,
      commissionType: 'cash',
      destinationName: selectedFavorite.value.name,
      destinationIdentifier: selectedFavorite.value.identifier,
      recordedBy: currentUser.value.uid,
      recordedByName: currentUser.value.displayName,
      status: isInsufficientFunds.value ? 'draft' : 'completed',
      draftReason: isInsufficientFunds.value ? 'insufficient_funds' : undefined,
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
    successMessage.value = 'บันทึกรายการเสร็จสมบูรณ์ ไปยังตรวจนับเงินสดได้เลย'
    logger.log('Step 1 completed')
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to complete Step 1', err)
  } finally {
    isCompletingStep1.value = false
  }
}

function goToStep2() {
  router.push('/finance/money-transfer-service/cash-counting')
}

// ─── Init ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    await store.initializeStore()
    await store.fetchPreviousDayBalance(selectedDate.value)
    if (selectedDate.value) {
      await store.fetchTransactionsByDate(selectedDate.value)
    }
    // Show notice when redirected from cash-counting guard
    if (route.query.notice === 'step1_required') {
      showStep1RequiredNotice.value = true
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล'
  }
})
</script>

<template>
  <PageWrapper
    title="บันทึกรายการ"
    description="บันทึกรายการ โอนเงิน/ถอนเงิน ประจำวัน"
    icon="🏦"
    :loading="store.isLoading"
    :error="store.error"
  >
    <template #actions>
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

    <!-- ── Opening Balance ──────────────────────────────────────────────── -->
    <section class="mb-4">
      <!-- Not yet set: show prompt banner -->
      <div
        v-if="!isOpeningSet"
        class="flex items-center justify-between gap-4 bg-blue-50 border border-blue-300 rounded-xl px-5 py-4"
      >
        <div>
          <div class="font-semibold text-blue-900">💳 กำหนดยอดเงินในบัญชีเริ่มต้น</div>
          <div class="text-sm text-blue-700 mt-0.5">กรุณากำหนดยอดเงินก่อนเริ่มบันทึกรายการ</div>
        </div>
        <BaseButton variant="primary" @click="openOpeningBalanceModal">
          กำหนดยอดเงินเริ่มต้น
        </BaseButton>
      </div>

      <!-- Already set: show success row -->
      <div
        v-else
        class="flex items-center justify-between gap-4 bg-green-50 border border-green-200 rounded-xl px-5 py-3"
      >
        <div class="text-green-800 text-sm">
          ✅ ยอดเงินเริ่มต้น:
          <strong>{{ formatCurrency(store.currentBalance?.openingBalance ?? 0) }}</strong>
          <span class="text-green-600 font-normal ml-2">
            ({{ store.currentBalance?.openingBalanceSource === 'carryover' ? 'Carry-over จากเมื่อวาน' : 'กำหนดเอง' }})
          </span>
        </div>
        <BaseButton variant="secondary" size="sm" disabled>✓ ตั้งค่าแล้ว</BaseButton>
      </div>
    </section>

    <!-- ── Balance Cards ────────────────────────────────────────────────── -->
    <section class="mb-6">
      <h2 class="text-base font-semibold text-gray-700 mb-3">📊 ยอดเงินปัจจุบัน</h2>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <BaseCard class="text-center">
          <div class="text-sm text-gray-500 mb-1">เงินในบัญชี</div>
          <div class="text-xl font-bold text-gray-900">
            {{ formatCurrency(store.currentBalance?.bankAccount ?? 0) }}
          </div>
        </BaseCard>
        <BaseCard class="text-center">
          <div class="text-sm text-gray-500 mb-1">เงินสดจากโอน/ถอน</div>
          <div class="text-xl font-bold text-gray-900">
            {{ formatCurrency(store.currentBalance?.transferCash ?? 0) }}
          </div>
        </BaseCard>
        <BaseCard class="text-center">
          <div class="text-sm text-gray-500 mb-1">ค่าบริการ (เงินสด)</div>
          <div class="text-xl font-bold text-green-700">
            {{ formatCurrency(store.currentBalance?.serviceFeeCash ?? 0) }}
          </div>
        </BaseCard>
        <BaseCard class="text-center">
          <div class="text-sm text-gray-500 mb-1">ค่าบริการ (โอน)</div>
          <div class="text-xl font-bold text-green-700">
            {{ formatCurrency(store.currentBalance?.serviceFeeTransfer ?? 0) }}
          </div>
        </BaseCard>
      </div>
    </section>

    <!-- ── Quick Actions ───────────────────────────────────────────────── -->
    <section v-if="canEdit" class="mb-6">
      <h2 class="text-base font-semibold text-gray-700 mb-3">⚡ Quick Actions</h2>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          :disabled="!isOpeningSet"
          :class="[
            'flex flex-col items-center gap-2 p-4 border rounded-xl font-medium text-sm transition-colors',
            isOpeningSet
              ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 text-yellow-800 cursor-pointer'
              : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-50',
          ]"
          @click="isOpeningSet && openFavoriteModal()"
        >
          <StarIcon class="w-6 h-6" />
          Favorite Transfer
        </button>
        <button
          :disabled="!isOpeningSet"
          :class="[
            'flex flex-col items-center gap-2 p-4 border rounded-xl font-medium text-sm transition-colors',
            isOpeningSet
              ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-800 cursor-pointer'
              : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-50',
          ]"
          @click="isOpeningSet && openNewTransactionModal('transfer')"
        >
          <ArrowUpTrayIcon class="w-6 h-6" />
          New Transfer
        </button>
        <button
          :disabled="!isOpeningSet"
          :class="[
            'flex flex-col items-center gap-2 p-4 border rounded-xl font-medium text-sm transition-colors',
            isOpeningSet
              ? 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-800 cursor-pointer'
              : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-50',
          ]"
          @click="isOpeningSet && openNewTransactionModal('withdrawal')"
        >
          <ArrowDownTrayIcon class="w-6 h-6" />
          New Withdrawal
        </button>
        <button
          :disabled="!isOpeningSet"
          :class="[
            'flex flex-col items-center gap-2 p-4 border rounded-xl font-medium text-sm transition-colors',
            isOpeningSet
              ? 'bg-green-50 border-green-200 hover:bg-green-100 text-green-800 cursor-pointer'
              : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-50',
          ]"
          @click="isOpeningSet && openNewTransactionModal('owner_deposit')"
        >
          <BanknotesIcon class="w-6 h-6" />
          Owner Deposit
        </button>
      </div>
    </section>

    <!-- ── Draft Transactions Alert ───────────────────────────────────── -->
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
    <section class="mb-6">
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <!-- Table Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-gray-100">
          <h2 class="text-base font-semibold text-gray-700">📋 รายการธุรกรรมวันนี้</h2>
          <ActionButton
            :permission="PERMISSIONS.EDIT_FINANCE"
            variant="primary"
            size="sm"
            :disabled="!isOpeningSet"
            @click="openNewTransactionModal()"
          >
            <PlusIcon class="w-4 h-4" />
            รายการใหม่
          </ActionButton>
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
        <div class="overflow-x-auto">
          <table v-if="filteredTransactions.length > 0" class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left px-4 py-3 font-medium text-gray-600">#</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600">เวลา</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600">ประเภท</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600">ช่องทาง</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600">จำนวนเงิน</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600">ค่าบริการ</th>
                <th class="text-center px-4 py-3 font-medium text-gray-600">สถานะ</th>
                <th class="text-center px-4 py-3 font-medium text-gray-600">จัดการ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="(txn, idx) in filteredTransactions"
                :key="txn.id"
                :class="[
                  'hover:bg-gray-50 transition-colors cursor-pointer',
                  txn.status === 'draft' ? 'bg-amber-50/50' : '',
                ]"
                @click="openDetailModal(txn)"
              >
                <td class="px-4 py-3 text-gray-500">{{ (idx as number) + 1 }}</td>
                <td class="px-4 py-3 text-gray-700">{{ formatTime(txn.datetime) }}</td>
                <td class="px-4 py-3 text-gray-900 font-medium">{{ getTransactionTypeLabel(txn.transactionType) }}</td>
                <td class="px-4 py-3 text-gray-600">{{ getChannelLabel(txn.channel) }}</td>
                <td class="px-4 py-3 text-right font-semibold text-gray-900">{{ formatCurrency(txn.amount) }}</td>
                <td class="px-4 py-3 text-right text-gray-600">
                  {{ txn.commission ? formatCurrency(txn.commission) : '-' }}
                  <span v-if="txn.commissionType" class="text-xs text-gray-400 ml-1">
                    {{ txn.commissionType === 'cash' ? 'C' : 'T' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center" @click.stop>
                  <BaseBadge :variant="getStatusBadgeVariant(txn.status)" size="sm" dot>
                    {{ getStatusLabel(txn.status) }}
                  </BaseBadge>
                </td>
                <td class="px-4 py-3 text-center" @click.stop>
                  <div class="flex items-center justify-center gap-1">
                    <button
                      aria-label="ดูรายละเอียด"
                      class="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      @click="openDetailModal(txn)"
                    >
                      <EyeIcon class="w-4 h-4" />
                    </button>
                    <ActionButton
                      v-if="txn.status === 'draft'"
                      :permission="PERMISSIONS.EDIT_FINANCE"
                      variant="ghost"
                      size="sm"
                      aria-label="แก้ไขรายการ"
                      @click="openEditModal(txn)"
                    >
                      <PencilIcon class="w-4 h-4" />
                    </ActionButton>
                    <ActionButton
                      v-if="txn.status === 'draft'"
                      :permission="PERMISSIONS.EDIT_FINANCE"
                      variant="ghost"
                      size="sm"
                      aria-label="ลบรายการ"
                      class="text-red-500 hover:text-red-600 hover:bg-red-50"
                      @click="confirmDelete(txn.id)"
                    >
                      <TrashIcon class="w-4 h-4" />
                    </ActionButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Empty State -->
          <EmptyState
            v-else
            icon="📋"
            title="ยังไม่มีรายการ"
            :description="activeFilter === 'all' ? 'กด Quick Actions หรือ [รายการใหม่] เพื่อเริ่มบันทึก' : `ไม่มีรายการที่มีสถานะ ${filterTabs.find(t => t.value === activeFilter)?.label}`"
          />
        </div>

        <!-- Summary Row -->
        <div v-if="filteredTransactions.length > 0" class="px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-4 text-sm text-gray-600">
          <span>รวม {{ todayStats.total }} รายการ</span>
          <span>สำเร็จ {{ todayStats.completed }} รายการ</span>
          <span v-if="hasDrafts" class="text-amber-700">Draft {{ todayStats.drafts }} รายการ</span>
          <span class="font-medium text-green-700">ค่าบริการ: {{ formatCurrency(todayStats.totalCommission) }}</span>
        </div>
      </div>
    </section>

    <!-- ── Step 1 Completion ───────────────────────────────────────────── -->
    <section v-if="!store.isStep1Complete" class="py-4">

      <!-- Redirect notice (arriving from step-2 guard) -->
      <div class="flex justify-center mb-4">
        <BaseAlert
          v-if="showStep1RequiredNotice"
          variant="warning"
          title="⚠️ ต้องยืนยันขั้นตอนบันทึกรายการก่อน"
          message="คุณถูกพากลับมาที่นี่เพราะขั้นตอนบันทึกรายการยังไม่เสร็จสมบูรณ์ — ตรวจสอบเงื่อนไขด้านล่างแล้วกดปุ่ม"
          :dismissible="true"
          class="w-full max-w-lg"
          @close="showStep1RequiredNotice = false"
        />
      </div>

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
            ไม่มี Draft ค้างอยู่
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

      <!-- Complete button — glows green when all prerequisites met -->
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
            ยืนยันบันทึกรายการ → ไปตรวจนับเงินสด
          </ActionButton>
        </div>
      </div>
    </section>

    <section v-else class="flex flex-col items-center gap-3 py-4">
      <BaseAlert
        variant="success"
        title="บันทึกรายการเสร็จสมบูรณ์"
        message="ไปยังขั้นตอนตรวจนับเงินสดได้เลย"
        :dismissible="false"
        class="w-full max-w-lg"
      />
      <BaseButton variant="success" size="lg" @click="goToStep2">
        ไปตรวจนับเงินสด →
      </BaseButton>
    </section>

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
              <span v-if="favStep === 1 && favMode === 'select'">Favorite Transfer</span>
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
                      {{ fav.channel === 'promptpay' ? 'PromptPay' : 'Bank' }} · {{ fav.identifier }}
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
                        {{ fav.channel === 'promptpay' ? 'PromptPay' : 'Bank' }} · {{ fav.identifier }}
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
                <option value="กสิกรไทย">ธนาคารกสิกรไทย (KBank)</option>
                <option value="ไทยพาณิชย์">ธนาคารไทยพาณิชย์ (SCB)</option>
                <option value="กรุงไทย">ธนาคารกรุงไทย (KTB)</option>
                <option value="กรุงเทพ">ธนาคารกรุงเทพ (BBL)</option>
                <option value="กรุงศรีอยุธยา">ธนาคารกรุงศรีอยุธยา (BAY)</option>
                <option value="ทีทีบี">ธนาคารทีทีบี (TTB)</option>
                <option value="ออมสิน">ธนาคารออมสิน (GSB)</option>
                <option value="เพื่อการเกษตรและสหกรณ์">ธนาคารเพื่อการเกษตรและสหกรณ์ (BAAC)</option>
                <option value="อาคารสงเคราะห์">ธนาคารอาคารสงเคราะห์ (GHB)</option>
                <option value="ยูโอบี">ธนาคารยูโอบี (UOB)</option>
                <option value="ซีไอเอ็มบี ไทย">ธนาคารซีไอเอ็มบี ไทย (CIMB)</option>
                <option value="เกียรตินาคิน">ธนาคารเกียรตินาคิน (KKP)</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </FormField>
            <FormField label="เลขบัญชีธนาคาร" required>
              <BaseInput v-model="favFormData.identifier" placeholder="เช่น 123-4-56789-0" />
            </FormField>
          </template>

          <!-- PromptPay: ประเภท radio + หมายเลข -->
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
            {{ selectedFavorite.channel === 'promptpay' ? 'PromptPay' : 'Bank' }} · {{ selectedFavorite.identifier }}
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
                @update:model-value="calcFavCommission"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">บาท</span>
            </div>
            <div v-if="isInsufficientFunds" class="text-red-600 text-sm mt-1">
              ❌ ยอดเงินไม่เพียงพอ (ขาด {{ formatCurrency(favAmount - (store.currentBalance?.bankAccount ?? 0)) }})
            </div>
          </FormField>

          <FormField label="ค่าบริการ (คำนวณอัตโนมัติ 1%, ขั้นต่ำ 10 ฿)">
            <div class="relative">
              <BaseInput v-model="favCommission" type="number" placeholder="0" />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">บาท</span>
            </div>
          </FormField>

          <div class="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            ยอดเงินหลังโอน:
            <strong :class="favBalanceAfter < 0 ? 'text-red-600' : 'text-gray-900'">
              {{ formatCurrency(favBalanceAfter) }}
            </strong>
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
          <div>
            <div class="text-gray-500">ประเภท</div>
            <div class="font-medium text-gray-900">{{ getTransactionTypeLabel(viewingTransaction.transactionType) }}</div>
          </div>
          <div>
            <div class="text-gray-500">ช่องทาง</div>
            <div class="font-medium text-gray-900">{{ getChannelLabel(viewingTransaction.channel) }}</div>
          </div>
          <div>
            <div class="text-gray-500">วันที่/เวลา</div>
            <div class="font-medium text-gray-900">{{ formatTime(viewingTransaction.datetime) }}</div>
          </div>
          <div>
            <div class="text-gray-500">จำนวนเงิน</div>
            <div class="font-bold text-gray-900 text-base">{{ formatCurrency(viewingTransaction.amount) }}</div>
          </div>
          <div v-if="viewingTransaction.commission">
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
  </PageWrapper>
</template>
