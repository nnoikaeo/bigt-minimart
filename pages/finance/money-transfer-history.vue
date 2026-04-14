<script setup lang="ts">
import { useMoneyTransferStore } from '~/stores/money-transfer'
import { useLogger } from '~/composables/useLogger'
import { usePermissions } from '~/composables/usePermissions'
import { PERMISSIONS, ROLES } from '~/types/permissions'
import { getWorkflowStatusBadge } from '~/types/shared-workflow'
import { PlusIcon, CalendarIcon } from '@heroicons/vue/24/outline'

definePageMeta({
  middleware: 'auth',
})

const logger = useLogger('MoneyTransferHistory')
const store = useMoneyTransferStore()
const router = useRouter()
const { can, hasAnyRole, userRole } = usePermissions()

// ─── State ────────────────────────────────────────────────────────────────────
const errorMessage = ref('')
const showAddModal = ref(false)
const newRecordDate = ref<string>(new Date().toISOString().split('T')[0] ?? '')

// ─── Computed ─────────────────────────────────────────────────────────────────
const canEdit = computed(() => can(PERMISSIONS.EDIT_FINANCE))

const isManagerOrAM = computed(() =>
  hasAnyRole([ROLES.MANAGER, ROLES.ASSISTANT_MANAGER, ROLES.OWNER])
)
const isAuditor = computed(() => hasAnyRole([ROLES.AUDITOR]))
const isOwner = computed(() => hasAnyRole([ROLES.OWNER]))

const today = new Date().toISOString().split('T')[0] ?? ''

const isBackdated = computed(() =>
  !!newRecordDate.value && newRecordDate.value < today
)

/** Active inbox filter (click card to filter table) */
const activeFilter = ref<'manager' | 'auditor' | 'owner' | null>(null)

function toggleFilter(role: 'manager' | 'auditor' | 'owner') {
  activeFilter.value = activeFilter.value === role ? null : role
}

/** Pending Inbox counts by role */
const pendingForManager = computed(() =>
  store.summaries.filter(
    (s: any) =>
      s.workflowStatus === 'step1_in_progress' ||
      s.workflowStatus === 'needs_correction'
  ).length
)
const pendingForAuditor = computed(() =>
  store.summaries.filter((s: any) =>
    s.workflowStatus === 'step2_completed' ||
    s.workflowStatus === 'step2_completed_with_notes' ||
    s.workflowStatus === 'needs_correction'
  ).length
)
const pendingForOwner = computed(() =>
  store.summaries.filter((s: any) =>
    s.workflowStatus === 'audited' ||
    s.workflowStatus === 'audited_with_issues'
  ).length
)

/** Filtered summaries based on active inbox filter */
const filteredSummaries = computed(() => {
  if (!activeFilter.value) return store.summaries
  const statusSets: Record<string, string[]> = {
    manager: ['step1_in_progress', 'needs_correction'],
    auditor: ['step2_completed', 'step2_completed_with_notes', 'needs_correction'],
    owner: ['audited', 'audited_with_issues'],
  }
  const allowed = statusSets[activeFilter.value] ?? []
  return store.summaries.filter((s: any) => allowed.includes(s.workflowStatus))
})

/** Pending count relevant to current user's role */
const myPendingCount = computed(() => {
  const role = userRole.value
  if (role === ROLES.AUDITOR) return pendingForAuditor.value
  if (role === ROLES.OWNER) return pendingForOwner.value
  // manager / assistant_manager
  return pendingForManager.value
})

// ─── Smart Action Button ───────────────────────────────────────────────────────
function getActionButton(summary: any): { label: string; route: string; variant: 'primary' | 'secondary' | 'danger' } | null {
  const role = userRole.value
  const status = summary.workflowStatus
  const date = summary.date

  if (role === ROLES.MANAGER || role === ROLES.ASSISTANT_MANAGER) {
    if (status === 'step1_in_progress') return { label: 'ทำงาน', route: `/finance/money-transfer-service?date=${date}`, variant: 'primary' }
    return { label: 'ดูรายละเอียด', route: `/finance/money-transfer-service?date=${date}`, variant: 'secondary' }
  }

  if (role === ROLES.AUDITOR) {
    if (status === 'step2_completed') return { label: 'ตรวจสอบ', route: `/finance/money-transfer-service?date=${date}`, variant: 'primary' }
    if (status === 'step2_completed_with_notes') return { label: 'ตรวจสอบ (มีหมายเหตุ)', route: `/finance/money-transfer-service?date=${date}`, variant: 'primary' }
    if (status === 'needs_correction') return { label: 'ตรวจสอบใหม่', route: `/finance/money-transfer-service?date=${date}`, variant: 'danger' }
    if (status === 'audited' || status === 'audited_with_issues') return { label: 'ดูการตรวจสอบ', route: `/finance/money-transfer-service?date=${date}`, variant: 'secondary' }
    return { label: 'ดูรายละเอียด', route: `/finance/money-transfer-service?date=${date}`, variant: 'secondary' }
  }

  if (role === ROLES.OWNER) {
    if (status === 'audited') return { label: 'อนุมัติ', route: `/finance/money-transfer-service?date=${date}`, variant: 'primary' }
    if (status === 'audited_with_issues') return { label: 'อนุมัติ (มีปัญหา)', route: `/finance/money-transfer-service?date=${date}`, variant: 'primary' }
    if (status === 'approved' || status === 'approved_with_notes') return { label: 'ดูรายละเอียด', route: `/finance/money-transfer-service?date=${date}`, variant: 'secondary' }
    return { label: 'ดูรายละเอียด', route: `/finance/money-transfer-service?date=${date}`, variant: 'secondary' }
  }

  return { label: 'ดูรายละเอียด', route: `/finance/money-transfer-service?date=${date}`, variant: 'secondary' }
}

// ─── Status Badge (uses shared WORKFLOW_STATUS_MAP) ──────────────────────────
function getStatusBadge(status: string): { label: string; class: string } {
  const badge = getWorkflowStatusBadge(status)
  return { label: badge.label, class: badge.cssClass }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('th-TH', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount) + ' ฿'
}

// ─── Actions ──────────────────────────────────────────────────────────────────
function openAddModal() {
  newRecordDate.value = new Date().toISOString().split('T')[0] ?? ''
  showAddModal.value = true
}

function navigateToAddRecord() {
  if (!newRecordDate.value) return
  showAddModal.value = false
  router.push(`/finance/money-transfer-service?date=${newRecordDate.value}`)
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    await store.fetchAllSummaries()
    logger.log('Summaries loaded', store.summaries.length)
  } catch (err: any) {
    errorMessage.value = err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล'
    logger.error('Failed to load summaries', err)
  }
})
</script>

<template>
  <PageWrapper
    title="ประวัติบริการโอนเงิน"
    description="ประวัติการบันทึกและตรวจสอบเงินจากบริการโอนเงิน"
    icon="🏦"
    :loading="false"
    :error="store.error ?? undefined"
  >
    <template #actions>
      <ActionButton
        :permission="PERMISSIONS.EDIT_FINANCE"
        variant="primary"
        @click="openAddModal"
      >
        <PlusIcon class="w-4 h-4 mr-1" />
        เพิ่มรายการ
      </ActionButton>
    </template>

    <!-- Error alert -->
    <BaseAlert
      v-if="errorMessage"
      variant="error"
      :message="errorMessage"
      class="mb-4"
      @close="errorMessage = ''"
    />

    <!-- ── Pending Inbox ─────────────────────────────────────────────────────── -->
    <section class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <!-- Manager/AM card -->
      <div
        v-if="isManagerOrAM"
        class="bg-white border rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all"
        :class="activeFilter === 'manager' ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleFilter('manager')"
      >
        <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-lg font-bold flex-shrink-0">
          {{ pendingForManager }}
        </div>
        <div>
          <div class="text-sm font-semibold text-gray-800">รอดำเนินการ</div>
          <div class="text-xs text-gray-500">กำลังบันทึก / ส่งกลับแก้ไข</div>
        </div>
      </div>

      <!-- Auditor card -->
      <div
        v-if="isAuditor || isManagerOrAM"
        class="bg-white border rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all"
        :class="activeFilter === 'auditor' ? 'border-orange-400 ring-2 ring-orange-100' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleFilter('auditor')"
      >
        <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-lg font-bold flex-shrink-0">
          {{ pendingForAuditor }}
        </div>
        <div>
          <div class="text-sm font-semibold text-gray-800">รอตรวจสอบ</div>
          <div class="text-xs text-gray-500">รอตรวจสอบ / ส่งกลับแก้ไข</div>
        </div>
      </div>

      <!-- Owner card -->
      <div
        v-if="isOwner || isManagerOrAM"
        class="bg-white border rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all"
        :class="activeFilter === 'owner' ? 'border-yellow-400 ring-2 ring-yellow-100' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleFilter('owner')"
      >
        <div class="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 text-lg font-bold flex-shrink-0">
          {{ pendingForOwner }}
        </div>
        <div>
          <div class="text-sm font-semibold text-gray-800">รออนุมัติ</div>
          <div class="text-xs text-gray-500">ตรวจสอบแล้ว / มีปัญหา</div>
        </div>
      </div>

      <!-- Auditor-only: pending owner approval card -->
      <div
        v-if="isAuditor && !isManagerOrAM"
        class="bg-white border rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all"
        :class="activeFilter === 'owner' ? 'border-yellow-400 ring-2 ring-yellow-100' : 'border-gray-200 hover:border-gray-300'"
        @click="toggleFilter('owner')"
      >
        <div class="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 text-lg font-bold flex-shrink-0">
          {{ pendingForOwner }}
        </div>
        <div>
          <div class="text-sm font-semibold text-gray-800">รออนุมัติ</div>
          <div class="text-xs text-gray-500">ตรวจสอบแล้ว / มีปัญหา</div>
        </div>
      </div>
    </section>

    <!-- ── History List ───────────────────────────────────────────────────────── -->
    <section class="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-gray-700">
          {{ activeFilter ? 'รายการที่กรอง' : 'ประวัติทั้งหมด' }}
        </h2>
        <button
          v-if="activeFilter"
          class="text-xs text-blue-600 hover:text-blue-800 font-medium"
          @click="activeFilter = null"
        >
          ดูทั้งหมด ✕
        </button>
      </div>

      <!-- Empty state -->
      <EmptyState
        v-if="store.summaries.length === 0"
        title="ยังไม่มีรายการ"
        description="กด 'เพิ่มรายการ' เพื่อเริ่มบันทึกรายการบริการโอนเงิน"
        class="py-12"
      />

      <EmptyState
        v-else-if="filteredSummaries.length === 0"
        title="ไม่มีรายการที่ตรงกัน"
        description="ไม่พบรายการในตัวกรองที่เลือก"
        class="py-12"
      />

      <!-- Table -->
      <div v-else-if="filteredSummaries.length > 0" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th class="px-5 py-3 text-left">วันที่</th>
              <th class="px-5 py-3 text-left">สถานะ</th>
              <th class="px-5 py-3 text-right">จำนวนรายการ</th>
              <th class="px-5 py-3 text-right">ยอดรวม</th>
              <th class="px-5 py-3 text-right">ค่าบริการ</th>
              <th class="px-5 py-3 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="summary in filteredSummaries"
              :key="summary.date"
              class="hover:bg-gray-50 transition-colors"
            >
              <!-- Date -->
              <td class="px-5 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                {{ formatDate(summary.date) }}
              </td>

              <!-- Status -->
              <td class="px-5 py-3.5">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatusBadge(summary.workflowStatus).class"
                >
                  {{ getStatusBadge(summary.workflowStatus).label }}
                </span>
              </td>

              <!-- Transaction count -->
              <td class="px-5 py-3.5 text-right text-gray-700">
                {{ summary.step1?.totalTransactions ?? 0 }}
              </td>

              <!-- Total amount -->
              <td class="px-5 py-3.5 text-right text-gray-700 whitespace-nowrap">
                {{ formatCurrency(summary.step1?.totalAmount ?? 0) }}
              </td>

              <!-- Commission -->
              <td class="px-5 py-3.5 text-right text-gray-700 whitespace-nowrap">
                {{ formatCurrency(summary.step1?.totalCommission ?? 0) }}
              </td>

              <!-- Action button -->
              <td class="px-5 py-3.5 text-center">
                <template v-if="getActionButton(summary)">
                  <BaseButton
                    :variant="getActionButton(summary)!.variant"
                    size="sm"
                    @click="router.push(getActionButton(summary)!.route)"
                  >
                    {{ getActionButton(summary)!.label }}
                  </BaseButton>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </PageWrapper>

  <!-- ── Modal: เพิ่มรายการ (date picker) ──────────────────────────────────── -->
  <BaseModal
    :open="showAddModal"
    title="เพิ่มรายการบริการโอนเงิน"
    @close="showAddModal = false"
  >
    <div class="space-y-4">
      <p class="text-sm text-gray-600">เลือกวันที่ที่ต้องการบันทึกรายการ (สามารถเลือกย้อนหลังได้)</p>

      <!-- Backdated warning -->
      <BaseAlert
        v-if="isBackdated"
        variant="warning"
        message="คุณกำลังบันทึกรายการย้อนหลัง กรุณาตรวจสอบวันที่ให้ถูกต้อง"
      />

      <FormField label="วันที่">
        <div class="relative">
          <CalendarIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            v-model="newRecordDate"
            type="date"
            class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500"
          />
        </div>
      </FormField>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="showAddModal = false">ยกเลิก</BaseButton>
      <BaseButton
        variant="primary"
        :disabled="!newRecordDate"
        @click="navigateToAddRecord"
      >
        ไปบันทึกรายการ →
      </BaseButton>
    </template>
  </BaseModal>
</template>
