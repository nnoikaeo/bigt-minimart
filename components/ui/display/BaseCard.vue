<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  padding?: boolean
  hoverable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  padding: true,
  hoverable: false,
})
</script>

<template>
  <div
    :class="[
      'bg-white rounded-lg shadow',
      hoverable ? 'hover:shadow-lg transition-shadow duration-200 cursor-pointer' : '',
    ]"
  >
    <!-- Header -->
    <div v-if="title || subtitle || $slots.header" class="border-b border-gray-200 px-6 py-4">
      <slot name="header">
        <h3 v-if="title" class="text-lg font-semibold text-gray-900">
          {{ title }}
        </h3>
        <p v-if="subtitle" class="text-sm text-gray-600 mt-1">
          {{ subtitle }}
        </p>
      </slot>
    </div>

    <!-- Body -->
    <div :class="{ 'p-6': padding }">
      <slot />
    </div>

    <!-- Footer -->
    <div v-if="$slots.footer" class="border-t border-gray-200 px-6 py-4">
      <slot name="footer" />
    </div>
  </div>
</template>
