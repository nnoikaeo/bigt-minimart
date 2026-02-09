<script setup lang="ts">
/**
 * EmptyState Component
 *
 * Displays a centered, friendly message when no data is available
 * Used to handle empty states in data lists and tables
 *
 * @example
 * <EmptyState
 *   icon="📊"
 *   title="ไม่มีข้อมูล"
 *   description="ยังไม่มียอดขายในวันนี้"
 *   actionLabel="เพิ่มข้อมูล"
 *   actionLink="/sales/create"
 * />
 */

interface Props {
  /** Emoji icon or icon name */
  icon?: string
  /** Title text */
  title: string
  /** Description text */
  description?: string
  /** Action button label (optional) */
  actionLabel?: string
  /** Action button link/route (optional) */
  actionLink?: string
}

defineProps<Props>()

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 px-4">
    <!-- Icon -->
    <div v-if="icon" class="text-6xl mb-4">{{ icon }}</div>

    <!-- Title -->
    <h3 class="text-xl font-bold text-gray-900 mb-2">{{ title }}</h3>

    <!-- Description -->
    <p v-if="description" class="text-gray-600 text-center mb-6 max-w-md">
      {{ description }}
    </p>

    <!-- Action Button / Link -->
    <NuxtLink
      v-if="actionLabel && actionLink"
      :to="actionLink"
      class="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    >
      {{ actionLabel }}
    </NuxtLink>

    <button
      v-else-if="actionLabel"
      @click="emit('action')"
      class="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>
