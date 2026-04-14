<script setup lang="ts">
/**
 * Shared Owner Decision Card
 *
 * Renders a 3-option radio card grid for Owner approval decisions:
 *   - approved
 *   - approved_with_notes
 *   - needs_correction (can be disabled via disableCorrection)
 *
 * Emits:
 *   - update:modelValue   — when radio selection changes
 *   - submit(decision, notes) — when the submit button is clicked
 */
import { CheckCircleIcon } from '@heroicons/vue/24/outline'
import { PERMISSIONS } from '~/types/permissions'

type Decision = 'approved' | 'approved_with_notes' | 'needs_correction'

const props = withDefaults(
  defineProps<{
    modelValue: Decision | null
    disableCorrection?: boolean
    isSubmitting?: boolean
  }>(),
  {
    disableCorrection: false,
    isSubmitting: false,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: Decision | null]
  submit: [decision: Decision, notes: string]
}>()

const notes = ref('')

const selected = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const needsNotes = computed(
  () => selected.value === 'approved_with_notes' || selected.value === 'needs_correction'
)

const canSubmit = computed(() => {
  if (!selected.value) return false
  if (needsNotes.value && notes.value.trim() === '') return false
  return true
})

const submitLabel = computed(() => {
  if (selected.value === 'needs_correction') return 'ส่งคืนแก้ไข'
  if (selected.value === 'approved_with_notes') return 'อนุมัติพร้อมหมายเหตุ ✅'
  return 'อนุมัติ ✅'
})

const submitVariant = computed(() =>
  selected.value === 'needs_correction' ? 'danger' : 'primary'
)

// When selection changes to one that doesn't need notes, clear them
watch(selected, (val) => {
  if (val === 'approved') notes.value = ''
})

function handleSubmit() {
  if (!canSubmit.value || !selected.value) return
  emit('submit', selected.value, notes.value.trim())
}
</script>

<template>
  <div class="space-y-3">
    <!-- Radio card grid -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <!-- Approve -->
      <label
        class="flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition-colors"
        :class="selected === 'approved' ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'"
      >
        <div class="flex items-center gap-2">
          <input
            v-model="selected"
            type="radio"
            value="approved"
            class="accent-green-600 shrink-0"
          />
          <p class="font-medium text-sm text-gray-900">อนุมัติ ✅</p>
        </div>
        <p class="text-xs text-gray-500 pl-5">บันทึกเป็นที่สิ้นสุด</p>
      </label>

      <!-- Approve with notes -->
      <label
        class="flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition-colors"
        :class="selected === 'approved_with_notes' ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'"
      >
        <div class="flex items-center gap-2">
          <input
            v-model="selected"
            type="radio"
            value="approved_with_notes"
            class="accent-blue-600 shrink-0"
          />
          <p class="font-medium text-sm text-gray-900">อนุมัติพร้อมหมายเหตุ</p>
        </div>
        <p class="text-xs text-gray-500 pl-5">มีข้อสังเกตเพิ่มเติม</p>
      </label>

      <!-- Needs correction -->
      <label
        class="flex flex-col gap-1 p-3 rounded-lg border transition-colors"
        :class="[
          selected === 'needs_correction' ? 'border-red-400 bg-red-50' : 'border-gray-200',
          disableCorrection ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-gray-300',
        ]"
      >
        <div class="flex items-center gap-2">
          <input
            v-model="selected"
            type="radio"
            value="needs_correction"
            class="accent-red-600 shrink-0"
            :disabled="disableCorrection"
          />
          <p class="font-medium text-sm text-gray-900">ขอให้แก้ไข</p>
        </div>
        <p class="text-xs text-gray-500 pl-5">
          {{ disableCorrection ? 'ใช้ได้เฉพาะเมื่อ Audit พบปัญหา' : 'ส่งกลับแก้ไข' }}
        </p>
      </label>
    </div>

    <!-- Notes textarea -->
    <div v-if="needsNotes">
      <BaseTextarea
        v-model="notes"
        :placeholder="selected === 'needs_correction' ? 'ระบุสิ่งที่ต้องแก้ไข...' : 'ระบุหมายเหตุหรือข้อสังเกต...'"
        :rows="2"
      />
    </div>

    <!-- Submit button -->
    <div class="flex justify-end pt-1">
      <ActionButton
        :permission="PERMISSIONS.EDIT_FINANCE"
        :variant="submitVariant"
        :loading="isSubmitting"
        :disabled="!canSubmit || isSubmitting"
        @click="handleSubmit"
      >
        <CheckCircleIcon class="w-4 h-4" />
        {{ submitLabel }}
      </ActionButton>
    </div>
  </div>
</template>
