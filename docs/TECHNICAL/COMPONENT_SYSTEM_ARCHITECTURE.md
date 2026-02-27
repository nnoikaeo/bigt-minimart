# 🎨 Component System Architecture & RBAC Implementation

**Version**: 1.0
**Last Updated**: Feb 9, 2026
**Status**: 📋 Implementation Plan

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Context & Problem Statement](#context--problem-statement)
3. [Architecture Overview](#architecture-overview)
4. [Pinia Integration](#pinia-integration)
5. [Component Organization](#component-organization)
6. [RBAC Implementation](#rbac-implementation)
7. [Core UI Components](#core-ui-components)
8. [Layout Components](#layout-components)
9. [Implementation Plan](#implementation-plan)
10. [Examples](#examples)
11. [Testing Strategy](#testing-strategy)
12. [Best Practices](#best-practices)

---

## 🎯 Overview

This document outlines the architecture for creating a comprehensive reusable component system with complete Role-Based Access Control (RBAC) for the BigT Minimart Management System.

### Goals

- ✅ Create reusable UI components (buttons, forms, tables, modals, etc.)
- ✅ Implement complete RBAC with declarative permission checking
- ✅ Standardize page structure across the application
- ✅ Improve maintainability and code quality
- ✅ Enhance accessibility and user experience

### Tech Stack

- **Framework**: Vue 3 + Nuxt 4
- **State Management**: Pinia (existing stores)
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Form Validation**: VeeValidate + Zod
- **Headless UI**: Radix Vue
- **Language**: TypeScript

---

## 🚨 Context & Problem Statement

### Current Issues

1. **Code Duplication**
   - Every page repeats similar styling patterns
   - Inline Tailwind classes everywhere
   - No reusable components for common UI elements

2. **Incomplete RBAC**
   - Only "Approve" button checks user roles (owner-only)
   - **Edit and Delete buttons have NO permission checks**
   - Any authenticated user can perform critical operations

3. **Inconsistent UI**
   - Pages lack unified structure
   - Different patterns for headers, buttons, forms
   - Difficult to maintain and update

4. **Poor Accessibility**
   - No ARIA labels
   - No keyboard navigation
   - No screen reader support

5. **No Component Abstraction**
   - Missing Button, Input, Table, Card, Modal components
   - Business logic scattered across pages
   - Hard to test and maintain

### User Requirements

- Reusable UI components for consistency
- Role-based permissions for all action buttons
- Standardized, configurable page structure
- Easy maintenance and updates
- Accessibility compliance

---

## 🏗️ Architecture Overview

### System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    UI LAYER (NEW)                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Pages (daily-sales.vue, users.vue, etc.)           │  │
│  │  • Uses: PageWrapper, DataTable, ActionButton       │  │
│  │  • Calls: Store actions (CRUD operations)           │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                       │
│  ┌──────────────────▼───────────────────────────────────┐  │
│  │  Reusable Components                                 │  │
│  │  • BaseButton, BaseInput, DataTable                  │  │
│  │  • ActionButton (with permission checking)           │  │
│  │  • PageWrapper, PageHeader                           │  │
│  └──────────────────┬───────────────────────────────────┘  │
└────────────────────┬┘                                       │
                     │                                        │
┌────────────────────▼────────────────────────────────────────┐
│                COMPOSABLE LAYER                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  usePermissions()                                     │  │
│  │  • can(permissionId) → boolean                        │  │
│  │  • hasRole(roleId) → boolean                          │  │
│  │  • Uses: authStore + accessControlStore               │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                       │
│  ┌──────────────────▼───────────────────────────────────┐  │
│  │  useValidatedForm(schema)                            │  │
│  │  • Form validation with Zod + VeeValidate            │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│               PINIA STORES (EXISTING)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  authStore                                           │  │
│  │  • user (uid, email, displayName, primaryRole)       │  │
│  │  • isAuthenticated, isLoading                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  accessControlStore                                  │  │
│  │  • hasPermission(roleId, permissionId) → boolean     │  │
│  │  • getUserById(uid), getAllUsers()                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  salesStore                                          │  │
│  │  • getAllSales, isLoading, error                     │  │
│  │  • Actions: addDailySale, updateDailySale, etc.     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  uiStore                                             │  │
│  │  • Sidebar state, active page, etc.                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Separation of Concerns**
   - **Stores**: Business logic + data management (unchanged)
   - **Composables**: Reusable logic (permissions, validation)
   - **Components**: UI presentation (new layer)

2. **Backwards Compatible**
   - Existing Pinia stores remain unchanged
   - Gradual migration (page by page)
   - No breaking changes to existing code

3. **Declarative Permissions**
   - Use `<ActionButton :permission="PERMISSIONS.EDIT_SALES">` instead of `v-if="isOwner"`
   - Permission logic centralized in composable

4. **Type Safety**
   - Full TypeScript support
   - Type-safe props, emits, and permissions

---

## 🔄 Pinia Integration

### How Components Work with Pinia

The new component system **complements** Pinia stores, not replaces them.

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. User Login                                              │
│     └→ authStore.login() saves user + role                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Page Load                                               │
│     ├→ middleware/auth.ts loads permissions                │
│     └→ accessControlStore populated with role-permissions  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Component Render                                        │
│     ├→ Page: salesStore.fetchDailySales() ← Data          │
│     ├→ ActionButton: usePermissions()                      │
│     │   ├→ Reads: authStore.user.primaryRole              │
│     │   └→ Calls: accessControlStore.hasPermission()      │
│     └→ Decision: Show/Hide button                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  4. User Action                                             │
│     └→ @click="handleEdit" → salesStore.updateDailySale()  │
└─────────────────────────────────────────────────────────────┘
```

### usePermissions() Composable

**File**: `composables/usePermissions.ts`

```typescript
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useAccessControlStore } from '~/stores/access-control'

export function usePermissions() {
  // ✅ Access existing Pinia stores
  const authStore = useAuthStore()
  const accessControlStore = useAccessControlStore()

  // Get current user's role
  const userRole = computed(() => authStore.user?.primaryRole ?? 'unknown')

  // Check if user has permission
  const can = (permissionId: string): boolean => {
    const role = userRole.value
    if (role === 'unknown') return false

    // ✅ Use existing store method
    return accessControlStore.hasPermission(role, permissionId)
  }

  const canAny = (permissionIds: string[]): boolean => {
    return permissionIds.some(id => can(id))
  }

  const canAll = (permissionIds: string[]): boolean => {
    return permissionIds.every(id => can(id))
  }

  const hasRole = (roleId: string): boolean => {
    return userRole.value === roleId
  }

  return {
    userRole,
    can,
    canAny,
    canAll,
    hasRole,
  }
}
```

### Page Component Example

```vue
<script setup lang="ts">
import { PERMISSIONS } from '~/types/permissions'

// ✅ Use existing Pinia stores
const salesStore = useSalesStore()
const sales = computed(() => salesStore.getAllSales)
const loading = computed(() => salesStore.isLoading)

// ✅ Use new permission composable
const { can } = usePermissions()

// ✅ Call store actions as before
const handleCreate = async (data) => {
  await salesStore.addDailySale(data)
}

const handleEdit = async (id, data) => {
  await salesStore.updateDailySale(id, data)
}
</script>

<template>
  <!-- ✅ Pass store data to components -->
  <DataTable :data="sales" :loading="loading" />

  <!-- ✨ NEW: Permission-aware button -->
  <ActionButton
    :permission="PERMISSIONS.CREATE_SALES"
    @click="handleCreate"
  >
    เพิ่ม
  </ActionButton>
</template>
```

### What Changes vs. What Stays

#### ✅ **Stays the Same (No Changes)**

1. **Pinia Stores**
   - `authStore`, `accessControlStore`, `salesStore`, `uiStore`
   - All state, getters, actions remain unchanged
   - Store methods (`hasPermission`, `addDailySale`, etc.)

2. **Data Management**
   - Pages still import and use stores
   - Still call store actions for CRUD operations
   - Still use computed properties from stores

3. **Business Logic**
   - Existing composables (`useDailySales`, `useLogger`)
   - Existing middleware (`auth.ts`)
   - Existing repositories

#### ✨ **What's New**

1. **UI Components**
   - `BaseButton`, `BaseInput`, `DataTable`, `BaseModal`, etc.
   - Reusable, consistent styling

2. **Permission Checking**
   - `usePermissions()` composable (wrapper around stores)
   - `ActionButton` component (auto-hides if no permission)
   - `v-can` directive (declarative permission checks)

3. **Layout Components**
   - `PageWrapper`, `PageHeader` (standardized page structure)
   - `EmptyState`, `LoadingState` (reusable states)

### Integration Benefits

1. **Testability**
   - Test stores independently
   - Mock composables easily
   - Isolated component testing

2. **Maintainability**
   - Change permission logic in one place
   - Update UI styling consistently
   - Clear separation of concerns

3. **Performance**
   - Permission checks are reactive (computed)
   - No unnecessary re-renders
   - Store caching still works

---

## 📁 Component Organization

### Directory Structure

```
components/
├── ui/                              # Design System
│   ├── button/
│   │   ├── BaseButton.vue          # Core button
│   │   └── ActionButton.vue        # Button with permissions
│   ├── form/
│   │   ├── BaseInput.vue
│   │   ├── BaseSelect.vue
│   │   ├── BaseTextarea.vue
│   │   └── FormField.vue           # Wrapper with label/error
│   ├── table/
│   │   ├── BaseTable.vue           # Simple table
│   │   └── DataTable.vue           # Advanced table
│   ├── feedback/
│   │   ├── BaseAlert.vue
│   │   ├── BaseModal.vue           # Using Radix Dialog
│   │   └── ConfirmDialog.vue
│   └── display/
│       ├── BaseCard.vue
│       ├── BaseBadge.vue
│       └── BaseAvatar.vue
│
├── layout/                          # Page Structure
│   ├── PageWrapper.vue             # Standard page container
│   ├── PageHeader.vue              # Page header with actions
│   ├── EmptyState.vue
│   ├── LoadingState.vue
│   ├── Header.vue                  # (Existing)
│   ├── Sidebar.vue                 # (Existing)
│   └── Breadcrumb.vue              # (Existing)
│
└── domain/                          # Feature-specific
    └── sales/
        ├── DailySalesTable.vue     # (Refactor)
        └── DailySalesModal.vue     # (Refactor)
```

### Naming Conventions

- **Base Components**: `Base{ComponentName}.vue` (e.g., `BaseButton.vue`)
- **Feature Components**: `{Feature}{ComponentName}.vue` (e.g., `DataTable.vue`)
- **Domain Components**: `{Domain}{ComponentName}.vue` (e.g., `DailySalesTable.vue`)
- **Layout Components**: `{Purpose}.vue` (e.g., `PageHeader.vue`)

### Auto-Import

Nuxt auto-imports components, no manual imports needed:

```vue
<!-- No import required -->
<BaseButton variant="primary">Click</BaseButton>
```

---

## 🔐 RBAC Implementation

### Permission System

#### Permission Constants

**File**: `types/permissions.ts`

```typescript
export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'view-dashboard',
  VIEW_AUDIT_LOG: 'view-audit-log',

  // Sales
  VIEW_SALES: 'view-sales',
  CREATE_SALES: 'create-sales',
  EDIT_SALES: 'edit-sales',
  DELETE_SALES: 'delete-sales',    // ← NEW
  APPROVE_SALES: 'approve-sales',  // ← NEW

  // Finance
  VIEW_FINANCE: 'view-finance',
  EDIT_FINANCE: 'edit-finance',

  // Users & Roles
  MANAGE_USERS: 'manage-users',
  MANAGE_ROLES: 'manage-roles',
} as const

export type PermissionId = typeof PERMISSIONS[keyof typeof PERMISSIONS]

export const ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  ASSISTANT_MANAGER: 'assistant_manager',
  CASHIER: 'cashier',
  AUDITOR: 'auditor',
} as const

export type RoleId = typeof ROLES[keyof typeof ROLES]
```

#### Role-Permission Matrix

Update `public/data/role-permissions.json`:

```json
{
  "owner": [
    "view-dashboard",
    "view-sales", "create-sales", "edit-sales", "delete-sales", "approve-sales",
    "view-finance", "edit-finance",
    "manage-users", "manage-roles",
    "view-audit-log"
  ],
  "manager": [
    "view-dashboard",
    "view-sales", "create-sales", "edit-sales", "delete-sales",
    "view-finance", "edit-finance",
    "manage-users"
  ],
  "assistant_manager": [
    "view-dashboard",
    "view-sales", "create-sales", "edit-sales",
    "view-finance"
  ],
  "cashier": [
    "view-dashboard",
    "view-sales", "create-sales"
  ],
  "auditor": [
    "view-dashboard",
    "view-sales",
    "view-finance",
    "view-audit-log"
  ]
}
```

### v-can Directive

**File**: `plugins/directives.ts`

```typescript
import { defineNuxtPlugin } from '#app'
import type { DirectiveBinding } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useAccessControlStore } from '~/stores/access-control'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('can', {
    mounted(el: HTMLElement, binding: DirectiveBinding) {
      const authStore = useAuthStore()
      const accessControlStore = useAccessControlStore()

      const permissionId = binding.value
      const userRole = authStore.user?.primaryRole

      if (!userRole || !accessControlStore.hasPermission(userRole, permissionId)) {
        el.style.display = 'none'
      }
    },

    updated(el: HTMLElement, binding: DirectiveBinding) {
      const authStore = useAuthStore()
      const accessControlStore = useAccessControlStore()

      const permissionId = binding.value
      const userRole = authStore.user?.primaryRole

      if (!userRole || !accessControlStore.hasPermission(userRole, permissionId)) {
        el.style.display = 'none'
      } else {
        el.style.display = ''
      }
    }
  })
})
```

**Usage**:

```vue
<template>
  <!-- Button only visible if user has permission -->
  <button v-can="PERMISSIONS.EDIT_SALES">
    แก้ไข
  </button>
</template>
```

### ActionButton Component

**File**: `components/ui/button/ActionButton.vue`

```vue
<script setup lang="ts">
import type { PermissionId } from '~/types/permissions'

interface Props {
  permission?: PermissionId
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false
})

const emit = defineEmits<{ click: [event: MouseEvent] }>()

const { can } = usePermissions()

// Check permission
const hasPermission = computed(() => {
  if (!props.permission) return true
  return can(props.permission)
})

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
    @click="emit('click', $event)"
  >
    <slot />
  </BaseButton>
</template>
```

**Usage**:

```vue
<ActionButton
  :permission="PERMISSIONS.EDIT_SALES"
  variant="primary"
  @click="handleEdit"
>
  ✏️ แก้ไข
</ActionButton>
```

---

## 🎨 Core UI Components

See the full implementation in the [Implementation Plan](#implementation-plan) section.

### Key Components

1. **BaseButton** - Reusable button with variants
2. **ActionButton** - Button with permission checking
3. **FormField** - Form field wrapper with label/error
4. **BaseInput, BaseSelect, BaseTextarea** - Form inputs
5. **BaseModal** - Modal using Radix Vue
6. **DataTable** - Advanced table with sort/filter/pagination
7. **BaseBadge** - Status badges
8. **BaseCard** - Content card
9. **BaseAlert** - Alert messages

---

## 📐 Layout Components

### PageWrapper

Standardized page container with:
- Optional breadcrumb
- Page header with title/description/icon
- Action buttons slot
- Loading and error states
- Main content area

### PageHeader

Page header with:
- Title and description
- Optional icon
- Action buttons slot
- Responsive layout

---

## 📋 Implementation Plan

### Phase 1: Foundation (2-3 days)

1. Install dependencies
2. Create permission system (types, composables, directives)
3. Create base UI components (Button, Input, Modal, Badge, Card)
4. Update permission data files

### Phase 2: Layout Components (1-2 days)

1. Create PageWrapper, PageHeader
2. Create EmptyState, LoadingState
3. Create Alert and feedback components

### Phase 3: Advanced Components (2-3 days)

1. Create DataTable with sorting/pagination
2. Create ActionButton with permission checks
3. Create form validation helper

### Phase 4: Refactor Daily Sales (2-3 days)

1. Migrate Daily Sales page
2. Refactor DailySalesModal
3. Add permission checks

### Phase 5: Testing (2-3 days)

1. Permission testing for all roles
2. Component functionality testing
3. Accessibility testing
4. Performance testing

**Total**: 9-14 days (2-3 weeks)

---

## 📝 Examples

### Before & After: Daily Sales Page

See complete examples in the [Component Quality Checklist](../DEVELOPMENT/COMPONENT_QUALITY_CHECKLIST.md).

---

## 🧪 Testing Strategy

### Permission Testing

Test each role against all actions:

| Role | View | Create | Edit | Delete | Approve |
|------|------|--------|------|--------|---------|
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ✅ | ✅ | ❌ |
| Assistant Manager | ✅ | ✅ | ✅ | ❌ | ❌ |
| Cashier | ✅ | ✅ | ❌ | ❌ | ❌ |
| Auditor | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 💡 Best Practices

### 1. Component Composition

Use slots for flexibility:

```vue
<BaseButton>
  <template #icon>
    <PlusIcon class="w-5 h-5" />
  </template>
  เพิ่ม
</BaseButton>
```

### 2. TypeScript

Always type props and emits:

```typescript
interface Props {
  title: string
  count?: number
}

const emit = defineEmits<{
  submit: [data: FormData]
}>()
```

### 3. Performance

Use computed for derived values:

```typescript
const filteredData = computed(() => {
  return props.data.filter(item => item.status === 'active')
})
```

### 4. Accessibility

Always provide ARIA labels:

```vue
<button aria-label="Close" @click="close">
  <XMarkIcon />
</button>
```

---

## 🎯 Success Criteria

### Functional Requirements

- ✅ All CRUD operations have proper permission checks
- ✅ Users only see allowed actions
- ✅ Daily Sales uses new components
- ✅ Forms validate with Zod
- ✅ Modals are accessible

### Non-Functional Requirements

- ✅ No code duplication
- ✅ Consistent styling
- ✅ TypeScript errors = 0
- ✅ Lighthouse score > 90

---

## 🔗 Related Documentation

- [COMPONENT_QUALITY_CHECKLIST.md](../DEVELOPMENT/COMPONENT_QUALITY_CHECKLIST.md) - Testing checklist
- [STATE_MANAGEMENT_ARCHITECTURE.md](./STATE_MANAGEMENT_ARCHITECTURE.md) - Pinia stores
- [ROLE_BASED_ACCESS_CONTROL.md](./ROLE_BASED_ACCESS_CONTROL.md) - RBAC overview
- [UI_UX_GUIDELINES.md](../DESIGN/UI_UX_GUIDELINES.md) - Design guidelines

---

**Status**: 📋 Implementation Plan Ready
**Last Updated**: Feb 9, 2026
**Version**: 1.0
