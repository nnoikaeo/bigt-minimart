<script setup lang="ts">
import { computed } from 'vue'
import type { PermissionId } from '~/types/permissions'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface Props {
  permission?: PermissionId
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  type?: 'button' | 'submit' | 'reset'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  fullWidth: false,
  type: 'button',
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const { can } = usePermissions()

/**
 * Check if user has the required permission
 * If no permission is specified, button is always shown
 */
const hasPermission = computed(() => {
  if (!props.permission) return true
  return can(props.permission)
})

/**
 * Combine permission check with disabled prop
 */
const isDisabled = computed(() => {
  return !hasPermission.value || props.disabled || props.loading
})
</script>

<template>
  <!-- Only render if user has permission -->
  <BaseButton
    v-if="hasPermission"
    :variant="variant"
    :size="size"
    :disabled="isDisabled"
    :loading="loading"
    :full-width="fullWidth"
    :type="type"
    :class="class"
    @click="emit('click', $event)"
  >
    <slot />
  </BaseButton>
</template>
