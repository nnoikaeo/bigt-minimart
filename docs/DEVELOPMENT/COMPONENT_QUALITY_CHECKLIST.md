# ✅ Component Quality Checklist

**Version**: 1.0
**Last Updated**: Feb 9, 2026
**Purpose**: Verify that new components follow architecture principles

---

## 📋 Overview

Use this checklist **every time** you create a new UI component or page to ensure it follows the architecture guidelines defined in [COMPONENT_SYSTEM_ARCHITECTURE.md](../TECHNICAL/COMPONENT_SYSTEM_ARCHITECTURE.md).

---

## 🎯 Quick Reference

### Component Types & Where They Go

| Component Type | Location | Example |
|---|---|---|
| Reusable UI (Button, Input, etc.) | `components/ui/` | `BaseButton.vue` |
| Layout (PageWrapper, Header) | `components/layout/` | `PageWrapper.vue` |
| Domain-specific (Sales, Finance) | `components/domain/{feature}/` | `DailySalesModal.vue` |

---

## ✅ Checklist Sections

1. [File Organization](#1--file-organization)
2. [TypeScript & Props](#2--typescript--props)
3. [Pinia Integration](#3--pinia-integration)
4. [RBAC & Permissions](#4--rbac--permissions)
5. [Styling & UI](#5--styling--ui)
6. [Accessibility](#6--accessibility)
7. [Performance](#7--performance)
8. [Code Quality](#8--code-quality)

---

## 1. 📁 File Organization

### ✅ Naming Convention

- [ ] Component name is **PascalCase** (e.g., `BaseButton.vue`, `PageHeader.vue`)
- [ ] Base components use `Base` prefix (e.g., `BaseButton`, `BaseInput`)
- [ ] Domain components use feature prefix (e.g., `DailySalesTable`)
- [ ] Layout components are descriptive (e.g., `PageWrapper`, `EmptyState`)

### ✅ File Location

- [ ] UI components are in correct subfolder:
  - `components/ui/button/` - Buttons
  - `components/ui/form/` - Form inputs
  - `components/ui/table/` - Tables
  - `components/ui/feedback/` - Modals, alerts
  - `components/ui/display/` - Cards, badges
- [ ] Layout components are in `components/layout/`
- [ ] Domain components are in `components/domain/{feature}/`

### ❌ **Common Mistakes**

```
❌ components/MyButton.vue          (not in ui/ folder)
❌ components/ui/CustomButton.vue   (inconsistent naming)
❌ components/sales-table.vue       (kebab-case instead of PascalCase)

✅ components/ui/button/BaseButton.vue
✅ components/domain/sales/DailySalesTable.vue
```

---

## 2. 📝 TypeScript & Props

### ✅ Script Setup & TypeScript

- [ ] Uses `<script setup lang="ts">`
- [ ] Props are typed with `interface Props`
- [ ] Emits are typed with `defineEmits<{ ... }>()`
- [ ] Uses `withDefaults()` for default props
- [ ] No `any` types (use proper types)

### ✅ Example: Good TypeScript

```vue
<script setup lang="ts">
// ✅ GOOD: Fully typed
interface Props {
  title: string
  count?: number
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
  variant: 'primary',
  disabled: false
})

const emit = defineEmits<{
  click: [id: string]
  update: [data: FormData]
}>()
</script>
```

### ❌ **Common Mistakes**

```typescript
// ❌ BAD: Using any
const props = defineProps<{ data: any }>()

// ❌ BAD: No types on emits
const emit = defineEmits(['click', 'update'])

// ❌ BAD: Inline type instead of interface
const props = defineProps<{ title: string, count: number }>()
```

---

## 3. 🔄 Pinia Integration

### ✅ Store Usage

- [ ] Uses existing Pinia stores (don't create new ones unnecessarily)
- [ ] Imports stores correctly: `const authStore = useAuthStore()`
- [ ] Uses computed for store getters: `const user = computed(() => authStore.user)`
- [ ] Calls store actions directly: `await salesStore.addDailySale(data)`
- [ ] Does NOT duplicate store logic in components

### ✅ Example: Correct Pinia Usage

```vue
<script setup lang="ts">
// ✅ GOOD: Use existing stores
const salesStore = useSalesStore()
const authStore = useAuthStore()

// ✅ GOOD: Computed from store
const sales = computed(() => salesStore.getAllSales)
const loading = computed(() => salesStore.isLoading)
const user = computed(() => authStore.user)

// ✅ GOOD: Call store actions
const handleCreate = async (data) => {
  await salesStore.addDailySale(data)
}
</script>

<template>
  <!-- ✅ GOOD: Pass store data to components -->
  <DataTable :data="sales" :loading="loading" />
</template>
```

### ❌ **Common Mistakes**

```vue
<script setup lang="ts">
// ❌ BAD: Duplicating store logic
const sales = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  // Fetching directly instead of using store
  const response = await fetch('/api/sales')
  sales.value = await response.json()
  loading.value = false
})

// ❌ BAD: Not using computed for store
const user = authStore.user  // Not reactive!

// ✅ GOOD: Use computed
const user = computed(() => authStore.user)
</script>
```

### ✅ Composable Usage (usePermissions)

- [ ] Uses `usePermissions()` for permission checks (not direct store access)
- [ ] Permission checks are reactive (use `computed` if needed)
- [ ] Does NOT call `accessControlStore.hasPermission()` directly in components

```vue
<script setup lang="ts">
// ✅ GOOD: Use composable
const { can, hasRole } = usePermissions()

// ✅ GOOD: Reactive check
const canEdit = computed(() => can(PERMISSIONS.EDIT_SALES))

// ❌ BAD: Direct store access
const accessControlStore = useAccessControlStore()
const canEdit = accessControlStore.hasPermission(role, 'edit-sales')
</script>
```

---

## 4. 🔐 RBAC & Permissions

### ✅ Permission Constants

- [ ] Imports permission constants: `import { PERMISSIONS } from '~/types/permissions'`
- [ ] Uses constants, NOT magic strings
- [ ] Permission IDs match `public/data/permissions.json`

### ✅ ActionButton Usage

- [ ] Uses `<ActionButton :permission="...">` for permission-based actions
- [ ] Does NOT use manual `v-if="isOwner"` or `v-if="role === 'owner'"`
- [ ] Button auto-hides if user lacks permission

### ✅ Example: Correct Permission Usage

```vue
<script setup lang="ts">
import { PERMISSIONS } from '~/types/permissions'
import { PencilIcon, TrashIcon } from '@heroicons/vue/24/outline'

// ✅ GOOD: Use permission composable
const { can } = usePermissions()
</script>

<template>
  <!-- ✅ GOOD: Use ActionButton with permission -->
  <ActionButton
    :permission="PERMISSIONS.EDIT_SALES"
    @click="handleEdit"
  >
    <PencilIcon class="w-4 h-4" />
    แก้ไข
  </ActionButton>

  <!-- ✅ GOOD: Use v-can directive -->
  <button v-can="PERMISSIONS.DELETE_SALES" @click="handleDelete">
    ลบ
  </button>
</template>
```

### ❌ **Common Mistakes**

```vue
<template>
  <!-- ❌ BAD: Magic string -->
  <ActionButton permission="edit-sales">  <!-- Should use PERMISSIONS constant -->

  <!-- ❌ BAD: Manual role check -->
  <button v-if="authStore.user?.primaryRole === 'owner'" @click="approve">
    อนุมัติ
  </button>

  <!-- ✅ GOOD: Use ActionButton -->
  <ActionButton :permission="PERMISSIONS.APPROVE_SALES" @click="approve">
    อนุมัติ
  </ActionButton>

  <!-- ❌ BAD: Checking permission directly -->
  <button v-if="accessControlStore.hasPermission(role, 'edit-sales')">
    แก้ไข
  </button>

  <!-- ✅ GOOD: Use v-can directive -->
  <button v-can="PERMISSIONS.EDIT_SALES">
    แก้ไข
  </button>
</template>
```

### ✅ Permission Testing Checklist

Test with each role:

| Role | Expected Behavior |
|---|---|
| **Owner** | Can see ALL actions (view, create, edit, delete, approve) |
| **Manager** | Can see view, create, edit, delete (NO approve) |
| **Assistant Manager** | Can see view, create, edit (NO delete, approve) |
| **Cashier** | Can see view, create ONLY |
| **Auditor** | Can see view ONLY (read-only) |

---

## 5. 🎨 Styling & UI

### ✅ Tailwind CSS Usage

- [ ] Uses Tailwind utility classes
- [ ] Consistent with design system (red primary color)
- [ ] Responsive design (`sm:`, `md:`, `lg:` breakpoints)
- [ ] Uses `@apply` ONLY when necessary (complex repeated patterns)

### ✅ Icon Usage

- [ ] Uses Heroicons (not emojis for actions)
- [ ] Icon size is consistent: `w-4 h-4` (small), `w-5 h-5` (medium), `w-6 h-6` (large)
- [ ] Imports from `@heroicons/vue/24/outline` or `/24/solid`

```vue
<script setup lang="ts">
// ✅ GOOD: Import Heroicons
import { PencilIcon, TrashIcon, CheckIcon } from '@heroicons/vue/24/outline'
</script>

<template>
  <!-- ✅ GOOD: Heroicon with consistent size -->
  <PencilIcon class="w-5 h-5" />

  <!-- ❌ BAD: Emoji for action button -->
  <span>✏️</span>
</template>
```

### ✅ Component Variants

- [ ] Button variants: `primary`, `secondary`, `danger`, `success`, `ghost`
- [ ] Badge variants: `success`, `warning`, `error`, `info`, `default`
- [ ] Alert variants: `success`, `error`, `warning`, `info`
- [ ] Uses consistent sizing: `sm`, `md`, `lg`

### ❌ **Common Mistakes**

```vue
<!-- ❌ BAD: Inline styles -->
<button style="background: red; padding: 10px;">

<!-- ❌ BAD: Inconsistent colors -->
<button class="bg-blue-600 text-white">  <!-- Should use red primary -->

<!-- ✅ GOOD: Use BaseButton component -->
<BaseButton variant="primary">Submit</BaseButton>

<!-- ❌ BAD: Repeated Tailwind classes -->
<button class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
<button class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
<button class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">

<!-- ✅ GOOD: Use BaseButton component -->
<BaseButton variant="primary">Button 1</BaseButton>
<BaseButton variant="primary">Button 2</BaseButton>
<BaseButton variant="primary">Button 3</BaseButton>
```

---

## 6. ♿ Accessibility

### ✅ ARIA Labels

- [ ] All buttons have accessible labels or text
- [ ] Icon-only buttons have `aria-label` or `title`
- [ ] Form inputs have associated labels
- [ ] Modals have proper `role` and `aria` attributes

### ✅ Keyboard Navigation

- [ ] All interactive elements are keyboard accessible (Tab, Enter)
- [ ] Modals can be closed with ESC key
- [ ] Focus management (focus trap in modals)
- [ ] Visible focus indicators

### ✅ Example: Accessible Component

```vue
<template>
  <!-- ✅ GOOD: Icon button with aria-label -->
  <button
    aria-label="แก้ไขรายการ"
    @click="handleEdit"
  >
    <PencilIcon class="w-5 h-5" />
  </button>

  <!-- ✅ GOOD: Form input with label -->
  <label for="email">อีเมล</label>
  <input
    id="email"
    type="email"
    v-model="email"
  />

  <!-- ✅ GOOD: Modal with keyboard support -->
  <BaseModal
    :open="showModal"
    @close="showModal = false"
    @keydown.esc="showModal = false"
  >
    <!-- Content -->
  </BaseModal>
</template>
```

### ❌ **Common Mistakes**

```vue
<!-- ❌ BAD: Icon button without label -->
<button @click="handleEdit">
  <PencilIcon class="w-5 h-5" />
</button>

<!-- ✅ GOOD: With aria-label -->
<button aria-label="แก้ไข" @click="handleEdit">
  <PencilIcon class="w-5 h-5" />
</button>

<!-- ❌ BAD: Input without label -->
<input v-model="email" placeholder="Email" />

<!-- ✅ GOOD: With label -->
<FormField label="อีเมล">
  <BaseInput v-model="email" />
</FormField>
```

---

## 7. ⚡ Performance

### ✅ Computed vs. Reactive

- [ ] Uses `computed()` for derived values
- [ ] Uses `ref()` or `reactive()` for component state only
- [ ] Does NOT perform expensive operations in template

### ✅ Example: Correct Usage

```vue
<script setup lang="ts">
// ✅ GOOD: Computed for derived value
const filteredSales = computed(() => {
  return props.data.filter(item => item.status === 'active')
})

// ✅ GOOD: Computed from store
const sales = computed(() => salesStore.getAllSales)

// ❌ BAD: Function in template (called every render)
const filterSales = () => {
  return props.data.filter(item => item.status === 'active')
}
</script>

<template>
  <!-- ✅ GOOD: Use computed -->
  <div v-for="sale in filteredSales" :key="sale.id">

  <!-- ❌ BAD: Function call in template -->
  <div v-for="sale in filterSales()" :key="sale.id">
</template>
```

### ✅ Lazy Loading

- [ ] Heavy components use `defineAsyncComponent()` for lazy loading
- [ ] Large data sets use pagination or virtualization
- [ ] Images use lazy loading

---

## 8. 🔍 Code Quality

### ✅ Naming Conventions

- [ ] Variables use `camelCase`: `const userName = ...`
- [ ] Constants use `UPPER_SNAKE_CASE`: `const MAX_SIZE = 100`
- [ ] Boolean variables start with `is`, `has`, `can`: `isLoading`, `hasPermission`, `canEdit`
- [ ] Functions use verb + noun: `handleClick`, `fetchData`, `validateForm`

### ✅ Comments

- [ ] Complex logic has comments
- [ ] JSDoc comments for composables/utilities
- [ ] NO obvious comments (e.g., `// Get user` above `const user = ...`)

### ✅ Error Handling

- [ ] Try-catch blocks for async operations
- [ ] User-friendly error messages
- [ ] Errors logged with `useLogger()`

### ✅ Example: Good Error Handling

```vue
<script setup lang="ts">
const logger = useLogger('DailySales')
const error = ref('')

const handleSubmit = async (data) => {
  try {
    await salesStore.addDailySale(data)
    logger.log('Sales entry created successfully')
  } catch (err: any) {
    error.value = err.message || 'เกิดข้อผิดพลาด'
    logger.error('Failed to create sales entry', err)
  }
}
</script>

<template>
  <BaseAlert v-if="error" variant="error" :message="error" />
</template>
```

### ✅ Testing Checklist

- [ ] Component renders correctly
- [ ] Props are passed correctly
- [ ] Emits fire correctly
- [ ] Permission checks work for all roles
- [ ] Responsive design works on mobile
- [ ] Accessibility passes (keyboard nav, screen reader)

---

## 📊 Final Checklist Summary

### Before Committing

- [ ] ✅ **File organization** is correct
- [ ] ✅ **TypeScript** has no errors
- [ ] ✅ **Pinia integration** follows guidelines
- [ ] ✅ **RBAC permissions** are implemented
- [ ] ✅ **Styling** uses Tailwind + design system
- [ ] ✅ **Accessibility** is tested
- [ ] ✅ **Performance** is optimized
- [ ] ✅ **Code quality** meets standards
- [ ] ✅ **Testing** passes for all roles

### Quick Test Commands

```bash
# Type check
npm run type-check

# Lint code
npm run lint

# Run dev server
npm run dev

# Build for production (test for errors)
npm run build
```

---

## 🎯 Example: Complete Component Review

### ❌ Bad Component Example

```vue
<!-- components/MyButton.vue -->
<script setup>
// ❌ No TypeScript
const props = defineProps(['text', 'onClick'])

// ❌ No store usage pattern
const user = authStore.user
</script>

<template>
  <!-- ❌ Manual role check, inline styles -->
  <button
    v-if="user.role === 'owner'"
    style="background: red; padding: 10px"
    @click="props.onClick"
  >
    {{ props.text }}
  </button>
</template>
```

**Issues**:
- ❌ Wrong file location (not in `ui/button/`)
- ❌ Wrong naming (`MyButton` instead of `BaseButton`)
- ❌ No TypeScript
- ❌ Manual role check
- ❌ Inline styles
- ❌ Not using Pinia correctly (not reactive)

### ✅ Good Component Example

```vue
<!-- components/ui/button/ActionButton.vue -->
<script setup lang="ts">
import type { PermissionId } from '~/types/permissions'

// ✅ Typed props
interface Props {
  permission?: PermissionId
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  disabled: false
})

// ✅ Typed emits
const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// ✅ Use composable for permissions
const { can } = usePermissions()

// ✅ Reactive permission check
const hasPermission = computed(() => {
  if (!props.permission) return true
  return can(props.permission)
})
</script>

<template>
  <!-- ✅ Use BaseButton component -->
  <BaseButton
    v-if="hasPermission"
    :variant="variant"
    :disabled="disabled"
    @click="emit('click', $event)"
  >
    <slot />
  </BaseButton>
</template>
```

**Why it's good**:
- ✅ Correct file location
- ✅ Correct naming
- ✅ Full TypeScript support
- ✅ Uses composable for permissions
- ✅ Reactive permission check
- ✅ Uses BaseButton component (no styling duplication)
- ✅ Clean, maintainable code

---

## 📚 Related Documentation

- [COMPONENT_SYSTEM_ARCHITECTURE.md](../TECHNICAL/COMPONENT_SYSTEM_ARCHITECTURE.md) - Full architecture guide
- [CODING_STANDARDS.md](./CODING_STANDARDS.md) - General coding standards
- [STATE_MANAGEMENT_ARCHITECTURE.md](../TECHNICAL/STATE_MANAGEMENT_ARCHITECTURE.md) - Pinia usage guide

---

## 🎉 Completion

✅ **All checkboxes checked?**
🎉 **Your component is ready!**

If any checklist items failed, review the [COMPONENT_SYSTEM_ARCHITECTURE.md](../TECHNICAL/COMPONENT_SYSTEM_ARCHITECTURE.md) documentation and fix the issues before committing.

---

**Status**: ✅ READY TO USE
**Last Updated**: Feb 9, 2026
**Version**: 1.0
