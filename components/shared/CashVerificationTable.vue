<script setup lang="ts">
/**
 * Shared cash verification table.
 * Generic version — usable by Money Transfer, Bill Payment, or any service.
 *
 * Modes:
 *  - manager-input:    3 cols (คาดหวัง | Manager นับ [input] | ส่วนต่าง)
 *  - manager-readonly: 3 cols (คาดหวัง | Manager นับ | ส่วนต่าง)
 *  - auditor-input:    5 cols (คาดหวัง | Manager นับ | Auditor นับ [input] | ส่วนต่าง | แสดงผล)
 *  - auditor-readonly / full-readonly: 5 cols read-only
 */
import { formatDiff } from '~/types/shared-workflow'

export interface CashVerificationRow {
  label: string
  expected: number
  managerActual: number | null
  auditorActual?: number | null
  readOnly?: boolean
}

type TableMode = 'manager-input' | 'manager-readonly' | 'auditor-input' | 'auditor-readonly' | 'full-readonly'

const props = withDefaults(
  defineProps<{
    rows: CashVerificationRow[]
    mode: TableMode
    showTotal?: boolean
    verificationNotes?: string
  }>(),
  {
    showTotal: true,
  },
)

const emit = defineEmits<{
  'update:managerActual': [rowIndex: number, value: number | null]
  'update:auditorActual': [rowIndex: number, value: number | null]
}>()

// --- helpers ---

function formatCurrency(amount: number): string {
  return (
    new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' ฿'
  )
}

const showAuditorColumns = computed(() =>
  ['auditor-input', 'auditor-readonly', 'full-readonly'].includes(props.mode),
)

const isManagerInput = computed(() => props.mode === 'manager-input')
const isAuditorInput = computed(() => props.mode === 'auditor-input')

// --- totals ---

const totalExpected = computed(() => props.rows.reduce((s, r) => s + r.expected, 0))

const totalManagerActual = computed(() =>
  props.rows.reduce((s, r) => s + (r.managerActual ?? 0), 0),
)

const totalAuditorActual = computed(() =>
  props.rows.reduce((s, r) => s + (r.auditorActual ?? 0), 0),
)

// For total diff: use auditor when available, else manager
const totalDiff = computed(() => {
  if (showAuditorColumns.value) return totalAuditorActual.value - totalExpected.value
  return totalManagerActual.value - totalExpected.value
})

// Total badge waits until every row has a count
const allCounted = computed(() => props.rows.every(r => rowDiff(r) != null))

// Any non-matching row counts — a shortfall in one row can offset a surplus in another
const hasDiscrepancies = computed(
  () => totalDiff.value !== 0 || props.rows.some(r => (rowDiff(r) ?? 0) !== 0),
)

// --- per-row helpers ---

function rowDiff(row: CashVerificationRow): number | null {
  if (showAuditorColumns.value) {
    if (row.auditorActual == null) return null
    return row.auditorActual - row.expected
  }
  if (row.managerActual == null) return null
  return row.managerActual - row.expected
}

function diffVariant(diff: number | null): 'success' | 'error' | 'default' {
  if (diff == null) return 'default'
  if (diff === 0) return 'success'
  return 'error'
}

// --- input handlers ---

// Empty input → null (not counted yet), so the placeholder shows instead of 0
function parseCount(event: Event): number | null {
  const raw = (event.target as HTMLInputElement).value
  if (raw === '') return null
  return parseFloat(raw) || 0
}

function onManagerInput(index: number, event: Event) {
  emit('update:managerActual', index, parseCount(event))
}

function onAuditorInput(index: number, event: Event) {
  emit('update:auditorActual', index, parseCount(event))
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
            <th v-if="showAuditorColumns" class="text-right px-4 py-3 font-medium text-blue-700">Auditor นับ</th>
            <th class="text-right px-4 py-3 font-medium text-gray-600">ผลต่าง</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="(row, idx) in rows" :key="idx">
            <td class="px-4 py-3 text-gray-700">{{ row.label }}</td>

            <!-- Expected -->
            <td class="px-4 py-3 text-right text-gray-600">{{ formatCurrency(row.expected) }}</td>

            <!-- Manager actual -->
            <td class="px-4 py-3 text-right">
              <input
                v-if="isManagerInput && !row.readOnly"
                type="number"
                placeholder="0"
                :value="row.managerActual ?? ''"
                class="w-28 text-right border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                @input="onManagerInput(idx, $event)"
              />
              <span v-else class="font-medium text-gray-900">
                {{ formatCurrency(row.managerActual ?? 0) }}
              </span>
            </td>

            <!-- Auditor actual -->
            <td v-if="showAuditorColumns" class="px-4 py-3 text-right">
              <input
                v-if="isAuditorInput && !row.readOnly"
                type="number"
                placeholder="0"
                :value="row.auditorActual ?? ''"
                class="w-28 text-right border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                @input="onAuditorInput(idx, $event)"
              />
              <span v-else class="font-medium text-blue-800">
                {{ row.auditorActual != null ? formatCurrency(row.auditorActual) : '-' }}
              </span>
            </td>

            <!-- Diff -->
            <td class="px-4 py-3 text-right">
              <BaseBadge v-if="rowDiff(row) != null" :variant="diffVariant(rowDiff(row))" size="sm">
                {{ formatDiff(rowDiff(row), formatCurrency) }}
              </BaseBadge>
              <span v-else class="text-gray-400">—</span>
            </td>
          </tr>

          <!-- Total Row -->
          <tr v-if="showTotal" class="bg-gray-50 border-t-2 border-gray-200">
            <td class="px-4 py-3 font-semibold text-gray-900">รวมเงินสดทั้งหมด</td>
            <td class="px-4 py-3 text-right font-semibold text-gray-700">{{ formatCurrency(totalExpected) }}</td>
            <td class="px-4 py-3 text-right font-bold text-gray-900">{{ formatCurrency(totalManagerActual) }}</td>
            <td v-if="showAuditorColumns" class="px-4 py-3 text-right font-bold text-blue-800">
              {{ formatCurrency(totalAuditorActual) }}
            </td>
            <td class="px-4 py-3 text-right">
              <BaseBadge v-if="allCounted" :variant="hasDiscrepancies ? 'warning' : 'success'" size="sm">
                {{ hasDiscrepancies ? '⚠️ มีผลต่าง' : '✅ ตรงกัน' }}
              </BaseBadge>
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
