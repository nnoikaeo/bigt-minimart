<script setup lang="ts">
/**
 * PageHeader Component
 *
 * Displays a page header with title, description, and action buttons
 * Used at the top of pages to show the main heading and quick actions
 *
 * @example
 * <PageHeader
 *   title="ยอดขาย"
 *   description="บันทึกและจัดการยอดขายรายวัน"
 *   icon="💰"
 * >
 *   <template #actions>
 *     <button class="btn btn-primary">เพิ่ม</button>
 *   </template>
 * </PageHeader>
 */

interface Props {
  /** Page title */
  title: string
  /** Page description (optional) */
  description?: string
  /** Emoji icon to display before title (optional) */
  icon?: string
}

defineProps<Props>()

defineSlots<{
  /** Action buttons slot - placed on right side */
  actions(): any
}>()
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 border-b border-gray-200">
    <!-- Title section -->
    <div class="flex-1 min-w-0">
      <!-- Title with optional icon -->
      <div class="flex items-center gap-2 mb-1">
        <span v-if="icon" class="text-3xl">{{ icon }}</span>
        <h1 class="text-3xl font-bold text-gray-900 truncate">{{ title }}</h1>
      </div>

      <!-- Description -->
      <p v-if="description" class="text-gray-600 text-sm">{{ description }}</p>
    </div>

    <!-- Actions slot -->
    <div v-if="$slots.actions" class="flex items-center gap-2 sm:flex-shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>
