<template>
  <div class="bg-white rounded-lg shadow">
    <!-- Group Header with Collapse Toggle -->
    <div
      class="px-6 py-4 border-b border-gray-200 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition"
      @click="onToggle"
    >
      <!-- Toggle Icon with Smooth Rotation -->
      <span
        class="text-xl transition-transform flex-shrink-0"
        :style="{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }"
      >
        ▼
      </span>

      <!-- Header Title Content -->
      <div class="flex-1">
        <h3 class="text-base font-bold text-gray-900">
          <slot name="title">
            {{ title }}
          </slot>
          <span class="text-sm text-gray-500 font-normal">
            ({{ itemCount }} {{ itemLabel }})
          </span>
        </h3>
      </div>
    </div>

    <!-- Expandable Content -->
    <div
      v-if="isExpanded"
      class="border-t border-gray-200 overflow-x-auto"
    >
      <slot name="content" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  /**
   * Unique identifier for this group
   */
  groupId: string

  /**
   * Whether the group is expanded
   */
  isExpanded: boolean

  /**
   * Callback when toggle is clicked
   */
  onToggle: () => void

  /**
   * Title text (can be overridden with slot)
   */
  title?: string

  /**
   * Number of items in this group
   */
  itemCount?: number

  /**
   * Label for items (e.g., "หน้า", "สิทธิ์")
   */
  itemLabel?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Group',
  itemCount: 0,
  itemLabel: 'items',
})
</script>

<style scoped>
/* Smooth transition for toggle animation */
.transition-transform {
  transition: transform 0.2s ease-in-out;
}

/* Hover effect on header */
.hover\:bg-gray-50:hover {
  background-color: rgb(249, 250, 251);
}
</style>
