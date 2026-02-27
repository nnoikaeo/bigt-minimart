<script setup lang="ts">
/**
 * BaseTable Component
 *
 * Simple, accessible table component for displaying tabular data
 * Foundation for DataTable with additional features
 *
 * @example
 * <BaseTable
 *   :rows="items"
 *   :columns="[
 *     { key: 'name', label: 'Name' },
 *     { key: 'email', label: 'Email' }
 *   ]"
 * />
 */

export interface TableColumn {
  /** Unique column identifier */
  key: string
  /** Column header label */
  label: string
  /** Column width (optional, e.g., 'w-20', '200px') */
  width?: string
  /** Text alignment: 'left' | 'center' | 'right' */
  align?: 'left' | 'center' | 'right'
  /** Custom cell formatting function */
  formatter?: (value: any) => string | number
}

interface Props {
  /** Array of table rows */
  rows: any[]
  /** Array of column definitions */
  columns: TableColumn[]
  /** Unique key for each row */
  rowKey?: string
  /** Show loading state */
  loading?: boolean
  /** Message when no rows available */
  emptyMessage?: string
  /** Allow row clicking */
  clickableRows?: boolean
}

withDefaults(defineProps<Props>(), {
  rowKey: 'id',
  loading: false,
  emptyMessage: 'ไม่มีข้อมูล',
  clickableRows: false,
})

const emit = defineEmits<{
  rowClick: [row: any]
}>()

/**
 * Get alignment classes
 */
const getAlignClass = (align?: string): string => {
  switch (align) {
    case 'center':
      return 'text-center'
    case 'right':
      return 'text-right'
    default:
      return 'text-left'
  }
}

/**
 * Get cell value
 */
const getCellValue = (row: any, column: TableColumn): any => {
  const value = row[column.key]
  return column.formatter ? column.formatter(value) : value
}
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-gray-200">
    <table class="min-w-full divide-y divide-gray-200">
      <!-- Table Header -->
      <thead class="bg-gray-50">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :class="[
              'px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider',
              getAlignClass(column.align),
              column.width,
            ]"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>

      <!-- Table Body -->
      <tbody class="bg-white divide-y divide-gray-200">
        <!-- Loading State -->
        <tr v-if="loading">
          <td :colspan="columns.length" class="px-6 py-8 text-center">
            <LoadingState text="กำลังโหลด..." />
          </td>
        </tr>

        <!-- Empty State -->
        <tr v-else-if="!rows || rows.length === 0">
          <td :colspan="columns.length" class="px-6 py-8">
            <EmptyState
              :title="emptyMessage"
              icon="📊"
            />
          </td>
        </tr>

        <!-- Data Rows -->
        <tr
          v-for="(row, index) in rows"
          v-else
          :key="row[rowKey] || index"
          :class="[
            clickableRows && 'cursor-pointer hover:bg-gray-50 transition-colors',
          ]"
          @click="clickableRows && emit('rowClick', row)"
        >
          <td
            v-for="column in columns"
            :key="column.key"
            :class="[
              'px-6 py-4 text-sm text-gray-900',
              getAlignClass(column.align),
            ]"
          >
            <!-- Default cell rendering -->
            <slot
              :name="`cell-${column.key}`"
              :value="getCellValue(row, column)"
              :row="row"
              :column="column"
            >
              {{ getCellValue(row, column) }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
