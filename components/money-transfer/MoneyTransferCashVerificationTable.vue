<script setup lang="ts">
/**
 * Read-only cash verification table.
 * Used in:
 *  - index.vue CASE B        (mode='manager', 4 cols: รายการ | คาดไว้ | นับจริง | ผลต่าง)
 *  - index.vue Section 6B   (mode='auditor', 5 cols: รายการ | คาดหวัง | Manager | Auditor | ผลต่าง)
 *
 * Props:
 *  - expectedTransferWithdrawal / expectedServiceFee  — expected amounts from Step 2
 *  - managerActual   — Manager's Step 2 actual counts (always present in read-only view)
 *  - auditorActual   — Auditor's recorded counts (optional; enables 5-column mode)
 *  - hasDiscrepancies — used in manager-only mode for the total row badge
 *  - verificationNotes — optional notes row shown at the bottom
 */
import { useMoneyTransferHelpers } from '~/composables/useMoneyTransferHelpers'

const props = defineProps<{
  expectedTransferWithdrawal: number
  expectedServiceFee: number
  managerActual: { transferWithdrawal: number; serviceFee: number; total: number } | null
  auditorActual?: { transferWithdrawal: number; serviceFee: number; total: number } | null
  hasDiscrepancies?: boolean
  verificationNotes?: string
}>()

const { formatCurrency, formatDiff } = useMoneyTransferHelpers()

const expectedTotal = computed(() => props.expectedTransferWithdrawal + props.expectedServiceFee)
const showAuditorColumn = computed(() => props.auditorActual != null)

function diffClass(diff: number): string {
  if (diff === 0) return 'text-green-700'
  return 'text-red-700'
}
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-600">รายการ</th>
            <th class="text-right px-4 py-3 font-medium text-gray-600">คาดไว้</th>
            <th class="text-right px-4 py-3 font-medium text-gray-600">Manager นับ</th>
            <th v-if="showAuditorColumn" class="text-right px-4 py-3 font-medium text-blue-700">Auditor นับ</th>
            <th class="text-right px-4 py-3 font-medium text-gray-600">ผลต่าง</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <!-- Row A: Transfer/Withdrawal -->
          <tr>
            <td class="px-4 py-3 text-gray-700">A. เงินสดจากโอน/ถอนเงิน</td>
            <td class="px-4 py-3 text-right text-gray-600">{{ formatCurrency(expectedTransferWithdrawal) }}</td>
            <td class="px-4 py-3 text-right font-medium text-gray-900">
              {{ formatCurrency(managerActual?.transferWithdrawal ?? 0) }}
            </td>
            <td v-if="showAuditorColumn" class="px-4 py-3 text-right font-medium text-blue-800">
              {{ auditorActual ? formatCurrency(auditorActual.transferWithdrawal) : '-' }}
            </td>
            <td class="px-4 py-3 text-right">
              <span
                v-if="showAuditorColumn && auditorActual"
                :class="['text-sm font-semibold', diffClass(auditorActual.transferWithdrawal - expectedTransferWithdrawal)]"
              >
                {{ formatDiff(auditorActual.transferWithdrawal - expectedTransferWithdrawal) }}
              </span>
              <span v-else-if="!showAuditorColumn && managerActual" :class="['text-sm font-semibold', diffClass((managerActual.transferWithdrawal) - expectedTransferWithdrawal)]">
                {{ formatDiff((managerActual.transferWithdrawal) - expectedTransferWithdrawal) }}
              </span>
              <span v-else class="text-gray-400">—</span>
            </td>
          </tr>

          <!-- Row B: Service Fee Cash -->
          <tr>
            <td class="px-4 py-3 text-gray-700">B. ค่าบริการ (เงินสด)</td>
            <td class="px-4 py-3 text-right text-gray-600">{{ formatCurrency(expectedServiceFee) }}</td>
            <td class="px-4 py-3 text-right font-medium text-gray-900">
              {{ formatCurrency(managerActual?.serviceFee ?? 0) }}
            </td>
            <td v-if="showAuditorColumn" class="px-4 py-3 text-right font-medium text-blue-800">
              {{ auditorActual ? formatCurrency(auditorActual.serviceFee) : '-' }}
            </td>
            <td class="px-4 py-3 text-right">
              <span
                v-if="showAuditorColumn && auditorActual"
                :class="['text-sm font-semibold', diffClass(auditorActual.serviceFee - expectedServiceFee)]"
              >
                {{ formatDiff(auditorActual.serviceFee - expectedServiceFee) }}
              </span>
              <span v-else-if="!showAuditorColumn && managerActual" :class="['text-sm font-semibold', diffClass(managerActual.serviceFee - expectedServiceFee)]">
                {{ formatDiff(managerActual.serviceFee - expectedServiceFee) }}
              </span>
              <span v-else class="text-gray-400">—</span>
            </td>
          </tr>

          <!-- Total Row -->
          <tr class="bg-gray-50 border-t-2 border-gray-200">
            <td class="px-4 py-3 font-semibold text-gray-900">รวมเงินสดทั้งหมด</td>
            <td class="px-4 py-3 text-right font-semibold text-gray-700">{{ formatCurrency(expectedTotal) }}</td>
            <td class="px-4 py-3 text-right font-bold text-gray-900">
              {{ formatCurrency(managerActual?.total ?? 0) }}
            </td>
            <td v-if="showAuditorColumn" class="px-4 py-3 text-right font-bold text-blue-800">
              {{ auditorActual ? formatCurrency(auditorActual.total) : '-' }}
            </td>
            <td class="px-4 py-3 text-right">
              <template v-if="showAuditorColumn && auditorActual">
                <span :class="['text-sm font-bold', diffClass(auditorActual.total - expectedTotal)]">
                  {{ formatDiff(auditorActual.total - expectedTotal) }}
                </span>
              </template>
              <template v-else-if="!showAuditorColumn">
                <BaseBadge :variant="hasDiscrepancies ? 'warning' : 'success'" size="sm">
                  {{ hasDiscrepancies ? '⚠️ มีผลต่าง' : '✅ ตรงกัน' }}
                </BaseBadge>
              </template>
              <span v-else class="text-gray-400">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Verification notes -->
    <div v-if="verificationNotes" class="px-4 py-3 border-t border-gray-100 bg-amber-50">
      <p class="text-sm text-amber-800"><strong>หมายเหตุ:</strong> {{ verificationNotes }}</p>
    </div>
  </div>
</template>
