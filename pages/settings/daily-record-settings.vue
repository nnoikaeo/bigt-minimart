<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useDailyRecordSettingsStore } from '~/stores/daily-record-settings'
import { useLogger } from '~/composables/useLogger'

definePageMeta({ middleware: 'auth' })

const logger = useLogger('DailyRecordSettings')
const authStore = useAuthStore()
const store = useDailyRecordSettingsStore()

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type TabKey = 'sales' | 'money-transfer' | 'bill-payment' | 'expenses'

const activeTab = ref<TabKey>('money-transfer')

const tabs = [
  { key: 'sales' as TabKey,         icon: '⏹️', label: 'ยอดขาย' },
  { key: 'money-transfer' as TabKey, icon: '🏦', label: 'บริการโอนเงิน' },
  { key: 'bill-payment' as TabKey,  icon: '💳', label: 'บริการรับชำระบิล' },
  { key: 'expenses' as TabKey,      icon: '💹', label: 'รายรับ-รายจ่าย' },
]

// ─── Fee Config (editable draft) ─────────────────────────────────────────────

const draftTiers = ref([])
const isDirty = ref(false)

function resetDraft() {
  draftTiers.value = store.sortedTiers.map(t => ({ ...t }))
  isDirty.value = false
}

// Watch only after first population to avoid false-dirty on mount
let watchReady = false
watch(draftTiers, () => { if (watchReady) isDirty.value = true }, { deep: true })

async function handleSave() {
  const updatedBy = authStore.user?.username ?? 'unknown'
  // BaseInput emits string — ensure fees are sent as integers
  const tiers = draftTiers.value.map(t => ({
    ...t,
    fee: Math.max(0, parseInt(String(t.fee), 10) || 0),
  }))
  const ok = await store.saveMoneyTransferFees(tiers, updatedBy)
  if (ok) {
    isDirty.value = false
    logger.log('Fee config saved by', updatedBy)
  }
}

function handleCancel() {
  resetDraft()
  store.clearMessages()
}

// ─── Fee Calculator ───────────────────────────────────────────────────────────

const calcInput = ref('')
const calcResult = ref(null)
const calcError = ref('')

function handleCalculate() {
  calcError.value = ''
  calcResult.value = null
  const amount = parseInt(calcInput.value, 10)
  if (!calcInput.value || isNaN(amount) || amount <= 0) {
    calcError.value = 'กรุณากรอกยอดโอนที่เป็นตัวเลขจำนวนเต็มบวก'
    return
  }
  calcResult.value = store.calculateFee(amount)
}

function formatNumber(n: number): string {
  return n.toLocaleString('th-TH')
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  await store.fetchMoneyTransferFees()
  resetDraft()
  watchReady = true
})
</script>

<template>
  <PageWrapper
    title="ตั้งค่าการบันทึกรายวัน"
    description="กำหนดค่าเริ่มต้นสำหรับการบันทึกข้อมูลรายวัน"
    icon="📋"
    :loading="store.isLoading"
  >
    <!-- ── Tab Bar ──────────────────────────────────────────────────────── -->
    <div class="border-b border-gray-200 mb-8">
      <nav class="-mb-px flex gap-1 overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          class="flex items-center gap-1.5 whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none"
          :class="
            activeTab === tab.key
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          "
        >
          <span>{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </button>
      </nav>
    </div>

    <!-- ── Tab: ยอดขาย (placeholder) ─────────────────────────────────── -->
    <div v-if="activeTab === 'sales'">
      <EmptyState
        icon="⏹️"
        title="ยังไม่เปิดใช้งาน"
        description="การตั้งค่าสำหรับยอดขายจะเพิ่มเข้ามาในเวอร์ชันถัดไป"
      />
    </div>

    <!-- ── Tab: บริการโอนเงิน ──────────────────────────────────────── -->
    <div v-else-if="activeTab === 'money-transfer'" class="space-y-8">

      <!-- Success / Error alerts -->
      <BaseAlert v-if="store.successMessage" variant="success" :message="store.successMessage" @close="store.clearMessages()" />
      <BaseAlert v-if="store.error" variant="error" :message="store.error" @close="store.clearMessages()" />

      <!-- ── Section 1: Fee Table ──────────────────────────────────────── -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100">
          <h2 class="text-base font-semibold text-gray-900">🏦 ตารางอัตราค่าบริการ</h2>
          <p class="text-sm text-gray-500 mt-0.5">แก้ไขได้เฉพาะค่าบริการ (บาท) — ช่วงเงินเป็นค่าคงที่</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left font-medium text-gray-600 w-12">#</th>
                <th class="px-6 py-3 text-left font-medium text-gray-600">ยอดโอน (บาท)</th>
                <th class="px-6 py-3 text-left font-medium text-gray-600 w-48">ค่าบริการ (บาท)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="(tier, idx) in draftTiers"
                :key="tier.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4 text-gray-400 font-medium">{{ Number(idx) + 1 }}</td>
                <td class="px-6 py-4 text-gray-700">{{ tier.label }}</td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2 max-w-[140px]">
                    <BaseInput
                      v-model="tier.fee"
                      type="number"
                      placeholder="0"
                      class="text-center"
                    />
                    <span class="text-gray-500 text-sm shrink-0">บาท</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Section 2: How it works (>10,000) ───────────────────────── -->
      <div class="rounded-xl border border-blue-100 bg-blue-50 px-6 py-5">
        <div class="flex gap-3">
          <span class="text-xl shrink-0">💡</span>
          <div class="space-y-2">
            <p class="font-medium text-blue-900">วิธีคำนวณ กรณียอดเกิน 10,000 บาท</p>
            <p class="text-sm text-blue-700">
              ยอดโอนที่เกิน 10,000 บาท จะถูกแบ่งเป็นรอบละ 10,000 บาท
              แต่ละรอบคิดค่าบริการตามช่วงเงินของรอบนั้น
            </p>
            <div class="mt-3 text-sm text-blue-800 bg-white rounded-lg border border-blue-100 px-4 py-3 space-y-1">
              <p class="font-medium">ตัวอย่าง: โอน 14,000 บาท</p>
              <p>• รอบที่ 1: 10,000 บาท → {{ formatNumber(draftTiers[3]?.fee ?? 40) }} บาท (ช่วง {{ draftTiers[3]?.label ?? '7,000–10,000' }})</p>
              <p>• รอบที่ 2: &nbsp;4,000 บาท → {{ formatNumber(draftTiers[2]?.fee ?? 30) }} บาท (ช่วง {{ draftTiers[2]?.label ?? '4,000–6,999' }})</p>
              <p class="border-t border-blue-100 pt-1 font-semibold">รวมค่าบริการ = {{ formatNumber((draftTiers[3]?.fee ?? 40) + (draftTiers[2]?.fee ?? 30)) }} บาท</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Section 3: Fee Calculator ───────────────────────────────── -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100">
          <h2 class="text-base font-semibold text-gray-900">🧮 เครื่องคิดทดสอบ</h2>
          <p class="text-sm text-gray-500 mt-0.5">ทดสอบคำนวณค่าบริการจากอัตราที่กำหนดไว้</p>
        </div>

        <div class="px-6 py-5 space-y-4">
          <!-- Input row -->
          <div class="flex items-end gap-3">
            <div class="flex-1 max-w-xs">
              <label class="block text-sm font-medium text-gray-700 mb-1">ยอดโอน (บาท)</label>
              <BaseInput
                v-model="calcInput"
                type="number"
                placeholder="เช่น 14000"
                @keyup.enter="handleCalculate"
              />
              <p v-if="calcError" class="text-xs text-red-600 mt-1">{{ calcError }}</p>
            </div>
            <BaseButton variant="secondary" @click="handleCalculate">
              คำนวณ
            </BaseButton>
          </div>

          <!-- Result -->
          <div v-if="calcResult" class="rounded-lg border border-gray-200 overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left font-medium text-gray-600">รอบที่</th>
                  <th class="px-4 py-2 text-right font-medium text-gray-600">ยอดโอน (บาท)</th>
                  <th class="px-4 py-2 text-right font-medium text-gray-600">ค่าบริการ (บาท)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="item in calcResult.breakdown" :key="item.cycle" class="hover:bg-gray-50">
                  <td class="px-4 py-2 text-gray-600">{{ item.cycle }}</td>
                  <td class="px-4 py-2 text-right text-gray-700">{{ formatNumber(item.amount) }}</td>
                  <td class="px-4 py-2 text-right text-gray-700">{{ formatNumber(item.fee) }}</td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colspan="2" class="px-4 py-3 font-semibold text-gray-800">รวมค่าบริการ</td>
                  <td class="px-4 py-3 text-right font-bold text-red-600 text-base">
                    {{ formatNumber(calcResult.totalFee) }} บาท
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- ── Action Buttons ────────────────────────────────────────────── -->
      <div class="flex justify-end gap-3 pt-2">
        <BaseButton
          variant="secondary"
          :disabled="store.isSaving"
          @click="handleCancel"
        >
          ยกเลิก
        </BaseButton>
        <BaseButton
          variant="primary"
          :disabled="!isDirty || store.isSaving"
          :loading="store.isSaving"
          @click="handleSave"
        >
          <template #default>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            บันทึกการตั้งค่า
          </template>
        </BaseButton>
      </div>

    </div>

    <!-- ── Tab: บริการรับชำระบิล (placeholder) ────────────────────── -->
    <div v-else-if="activeTab === 'bill-payment'">
      <EmptyState
        icon="💳"
        title="ยังไม่เปิดใช้งาน"
        description="การตั้งค่าสำหรับบริการรับชำระบิลจะเพิ่มเข้ามาในเวอร์ชันถัดไป"
      />
    </div>

    <!-- ── Tab: รายรับ-รายจ่าย (placeholder) ──────────────────────── -->
    <div v-else-if="activeTab === 'expenses'">
      <EmptyState
        icon="💹"
        title="ยังไม่เปิดใช้งาน"
        description="การตั้งค่าสำหรับรายรับ-รายจ่ายจะเพิ่มเข้ามาในเวอร์ชันถัดไป"
      />
    </div>

  </PageWrapper>
</template>
