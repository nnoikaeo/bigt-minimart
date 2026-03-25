# 🔐 Access Control Implementation Guide

**Version**: 1.0  
**Date**: 2026-02-02  
**Status**: Implementation Plan Ready  
**Approach**: C (Merged Page - RECOMMENDED)

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Architecture Design](#-architecture-design)
3. [Implementation Strategy](#-implementation-strategy)
4. [Code Examples](#-code-examples)
5. [Integration with Daily Sales](#-integration-with-daily-sales)
6. [Testing Checklist](#-testing-checklist)
7. [Timeline](#-timeline)

---

## 🎯 Overview

### The Problem

BIG TEE Minimart has 5 employees who ALL can serve as cashiers through a **rotation system**:
- วราณี อุบลแย้ม → cashier
- น้ำผึ้ง พ่วงพลับ → cashier, assistant_manager
- กัลญา ผิวขำทองดี → cashier, manager
- พรทิพย์ เรือนสุข → auditor (NOT cashier)
- นพพล น้อยแก้ว → cashier, manager, auditor, owner

### The Solution: Approach C

**Single unified page** (`/admin/access-control`) with:
- **TAB 1**: Users Management (Create, Edit, Delete users with multiple roles)
- **TAB 2**: Roles & Permissions (Manage role permissions with matrix UI)

### Why Approach C?

| Aspect | Value |
|--------|-------|
| **Multiple Roles** | ✅ Support วราณี with 1, น้ำผึ้ง with 2, นพพล with 4 |
| **Professional UX** | ✅ Tabbed interface (1 page not 2) |
| **Permission Control** | ✅ Fine-grained access control per role |
| **Industry Standard** | ✅ How enterprise systems do it |
| **Time Investment** | ✅ ~2.5 hours (reasonable) |
| **Business Fit** | ✅ Perfect for rotation system |

---

## 🏗️ Architecture Design

### System Data Flow

```
Component Layer
├─ pages/admin/access-control.vue (TAB 1 + TAB 2)
│  └─ Form validation & UI state
│
Store Layer (Pinia)
├─ stores/access-control.ts
│  ├─ State: users, roles, permissions, rolePermissions
│  ├─ Getters: getAllUsers, getCashiers, getRolePermissions, etc.
│  └─ Actions: fetchUsers, createUser, updateUser, deleteUser, etc.
│
API Endpoints Layer
├─ server/api/access-control/users/
│  ├─ index.get.ts (fetch all users)
│  ├─ index.post.ts (create user)
│  └─ [id]/
│     ├─ index.put.ts (update user)
│     └─ index.delete.ts (delete user)
│
├─ server/api/access-control/roles/
│  ├─ index.get.ts (fetch all roles)
│  └─ [id]/permissions.put.ts (update permissions)
│
Repository Layer
├─ server/repositories/access-control.repository.ts (interface)
├─ server/repositories/access-control-json.repository.ts (JSON implementation)
└─ (future) access-control-firestore.repository.ts
│
Data Layer
├─ public/data/users.json
├─ public/data/roles.json
└─ public/data/permissions.json

Type Layer
├─ types/access-control.ts (interfaces & types)
└─ types/repositories.ts (IAccessControlRepository)
```

### Database Schema

#### User Type
```typescript
interface User {
  uid: string                    // "user-001"
  email: string                  // "warani@example.com"
  displayName: string            // "วราณี อุบลแย้ม"
  roles: UserRole[]              // ["cashier"] or ["cashier", "manager"]
  primaryRole: UserRole          // "cashier" (for display)
  isActive: boolean              // true
  createdAt: string | Date       // "2026-01-01T00:00:00Z"
  updatedAt: string | Date       // "2026-01-01T00:00:00Z"
}

type UserRole = 'owner' | 'manager' | 'assistant_manager' | 'cashier' | 'auditor'
```

#### Role Type
```typescript
interface Role {
  id: string                     // "cashier"
  name: string                   // "แคชเชียร์" (Thai name only)
  description: string            // "Point of Sale and cash handling"
  createdAt: string | Date
}
```

#### Permission Type
```typescript
interface Permission {
  id: string                     // "view_dashboard"
  name: string                   // "ดูหน้าหลัก" (Thai name only)
  description: string
  category: 'dashboard' | 'sales' | 'finance' | 'users' | 'roles'
  createdAt: string | Date
}
```

#### Role Permissions Mapping
```typescript
interface RolePermission {
  roleId: string                 // "cashier"
  permissions: {
    [permissionId: string]: boolean  // { "view_dashboard": true, ... }
  }
}
```

---

## 📋 Implementation Strategy

### File Structure

```
pages/admin/
└─ access-control.vue (NEW - main component)

server/api/access-control/
├─ users/
│  ├─ index.get.ts (GET all users)
│  ├─ index.post.ts (CREATE user)
│  └─ [id]/
│     ├─ index.put.ts (UPDATE user)
│     └─ index.delete.ts (DELETE user)
│
└─ roles/
   ├─ index.get.ts (GET all roles)
   └─ [id]/
      └─ permissions.put.ts (UPDATE permissions)

server/repositories/
├─ access-control.repository.ts (interface)
└─ access-control-json.repository.ts (JSON implementation)

stores/
└─ access-control.ts (Pinia store)

types/
├─ access-control.ts (interfaces)
└─ repositories.ts (IAccessControlRepository)

public/data/
├─ users.json (sample users)
├─ roles.json (sample roles)
└─ permissions.json (sample permissions)
```

### Implementation Phases

#### Phase 1: Design & Types (15 min)
- Create `types/access-control.ts`
- Define User, Role, Permission, RolePermission interfaces
- Define UserRole type

#### Phase 2: Repository Interface (10 min)
- Create `server/repositories/access-control.repository.ts`
- Define IAccessControlRepository interface
- Methods: getAllUsers, createUser, updateUser, deleteUser, getAllRoles, getRolePermissions, updateRolePermissions

#### Phase 3: JSON Repository Implementation (20 min)
- Create `server/repositories/access-control-json.repository.ts`
- Implement all repository methods
- Handle file I/O for JSON data

#### Phase 4: Pinia Store (30 min)
- Create `stores/access-control.ts`
- State: users, roles, permissions, rolePermissions, loading, error
- Getters: getAllUsers, getActiveUsers, getCashiers, getAllRoles, getRolePermissions, etc.
- Actions: fetchUsers, createUser, updateUser, deleteUser, fetchRoles, updateRolePermissions, etc.

#### Phase 5: API Endpoints (40 min)
- Create 6 API endpoints:
  1. `GET /api/access-control/users`
  2. `POST /api/access-control/users`
  3. `PUT /api/access-control/users/[id]`
  4. `DELETE /api/access-control/users/[id]`
  5. `GET /api/access-control/roles`
  6. `PUT /api/access-control/roles/[id]/permissions`

#### Phase 6: Page Component (30 min)
- Create `pages/admin/access-control.vue`
- TAB 1: Users management (table + form modal)
- TAB 2: Roles & permissions (matrix UI)
- Form validation & error handling

#### Phase 7: Sample Data & Testing (10 min)
- Create 3 JSON files: users.json, roles.json, permissions.json
- 5 sample users
- 5 sample roles
- 8 sample permissions

---

## 💻 Code Examples

### Types Definition

**File: `types/access-control.ts`**

```typescript
export type UserRole = 'owner' | 'manager' | 'assistant_manager' | 'cashier' | 'auditor'

export interface User {
  uid: string
  email: string
  displayName: string
  roles: UserRole[]
  primaryRole: UserRole
  isActive: boolean
  createdAt?: string | Date
  updatedAt?: string | Date
}

export interface CreateUserInput {
  email: string
  password: string
  displayName: string
  roles: UserRole[]
  primaryRole: UserRole
}

export interface UpdateUserInput {
  displayName?: string
  roles?: UserRole[]
  primaryRole?: UserRole
  isActive?: boolean
}

export interface Role {
  id: string
  name: string  // "แคชเชียร์" (Thai name only)
  description: string
  createdAt?: string | Date
}

export interface Permission {
  id: string
  name: string  // "ดูหน้าหลัก" (Thai name only)
  description: string
  category: 'dashboard' | 'sales' | 'finance' | 'users' | 'roles'
  createdAt?: string | Date
}

export interface RolePermission {
  roleId: string
  permissions: Record<string, boolean>
}
```

### Repository Interface

**File: `server/repositories/access-control.repository.ts`**

```typescript
import type { User, CreateUserInput, UpdateUserInput, Role, Permission, RolePermission } from '~/types/access-control'

export interface IAccessControlRepository {
  // Users
  getAllUsers(): Promise<User[]>
  getUserById(uid: string): Promise<User | null>
  createUser(input: CreateUserInput): Promise<User>
  updateUser(uid: string, input: UpdateUserInput): Promise<User>
  deleteUser(uid: string): Promise<boolean>

  // Roles
  getAllRoles(): Promise<Role[]>
  getRoleById(roleId: string): Promise<Role | null>

  // Permissions
  getAllPermissions(): Promise<Permission[]>
  getRolePermissions(roleId: string): Promise<RolePermission>
  updateRolePermissions(roleId: string, permissions: Record<string, boolean>): Promise<RolePermission>
}
```

### Pinia Store (Key Methods)

**File: `stores/access-control.ts`**

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, CreateUserInput, UpdateUserInput, Role, Permission } from '~/types/access-control'

export const useAccessControlStore = defineStore('accessControl', () => {
  const { accessControlRepository } = useAccessControlRepository()

  // State
  const users = ref<User[]>([])
  const roles = ref<Role[]>([])
  const permissions = ref<Permission[]>([])
  const rolePermissions = ref<Record<string, Record<string, boolean>>>({})
  const loading = ref(false)
  const error = ref('')

  // Getters
  const getAllUsers = computed(() => users.value)
  const getActiveUsers = computed(() => users.value.filter(u => u.isActive))
  const getCashiers = computed(() => 
    users.value.filter(u => u.roles.includes('cashier') && u.isActive)
  )
  const getAllRoles = computed(() => roles.value)
  const getAllPermissions = computed(() => permissions.value)

  // Actions
  const fetchUsers = async () => {
    loading.value = true
    try {
      users.value = await accessControlRepository.getAllUsers()
      error.value = ''
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const createUser = async (input: CreateUserInput) => {
    try {
      const newUser = await accessControlRepository.createUser(input)
      users.value.push(newUser)
      return { success: true, data: newUser }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  const updateUser = async (uid: string, input: UpdateUserInput) => {
    try {
      const updated = await accessControlRepository.updateUser(uid, input)
      const index = users.value.findIndex(u => u.uid === uid)
      users.value[index] = updated
      return { success: true, data: updated }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  const deleteUser = async (uid: string) => {
    try {
      await accessControlRepository.deleteUser(uid)
      users.value = users.value.filter(u => u.uid !== uid)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  const fetchRoles = async () => {
    loading.value = true
    try {
      roles.value = await accessControlRepository.getAllRoles()
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const fetchPermissions = async () => {
    loading.value = true
    try {
      permissions.value = await accessControlRepository.getAllPermissions()
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const updateRolePermissions = async (roleId: string, permissions: Record<string, boolean>) => {
    try {
      const result = await accessControlRepository.updateRolePermissions(roleId, permissions)
      rolePermissions.value[roleId] = result.permissions
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  return {
    users,
    roles,
    permissions,
    rolePermissions,
    loading,
    error,
    getAllUsers,
    getActiveUsers,
    getCashiers,
    getAllRoles,
    getAllPermissions,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    fetchRoles,
    fetchPermissions,
    updateRolePermissions,
  }
})
```

### Sample Data

**File: `public/data/users.json`**

```json
[
  {
    "uid": "user-001",
    "email": "warani@example.com",
    "displayName": "วราณี อุบลแย้ม",
    "roles": ["cashier"],
    "primaryRole": "cashier",
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00Z"
  },
  {
    "uid": "user-002",
    "email": "namphung@example.com",
    "displayName": "น้ำผึ้ง พ่วงพลับ",
    "roles": ["cashier", "assistant_manager"],
    "primaryRole": "assistant_manager",
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00Z"
  },
  {
    "uid": "user-005",
    "email": "nopphon@example.com",
    "displayName": "นพพล น้อยแก้ว",
    "roles": ["cashier", "manager", "auditor", "owner"],
    "primaryRole": "owner",
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00Z"
  }
]
```

**File: `public/data/roles.json`**

```json
[
  {
    "id": "cashier",
    "name": "แคชเชียร์",
    "description": "Point of Sale and cash handling"
  },
  {
    "id": "assistant_manager",
    "name": "ผู้ช่วยผู้จัดการ",
    "description": "Support manager operations"
  },
  {
    "id": "manager",
    "name": "ผู้จัดการร้าน",
    "description": "Manage daily operations"
  },
  {
    "id": "auditor",
    "name": "ผู้ตรวจสอบ",
    "description": "Audit and verification"
  },
  {
    "id": "owner",
    "name": "เจ้าของร้าน",
    "description": "Full system access"
  }
]
```

**File: `public/data/permissions.json`**

```json
[
  {
    "id": "view_dashboard",
    "name": "ดูหน้าหลัก",
    "description": "Access dashboard",
    "category": "dashboard"
  },
  {
    "id": "close_cashier_report",
    "name": "ปิดกะขาย",
    "description": "Close daily sales report",
    "category": "sales"
  },
  {
    "id": "view_sales",
    "name": "ดูการขาย",
    "description": "View sales reports",
    "category": "sales"
  },
  {
    "id": "delete_sales",
    "name": "ลบการขาย",
    "description": "Delete sales records",
    "category": "sales"
  },
  {
    "id": "manage_money_transfer",
    "name": "จัดการโอนเงิน",
    "description": "Manage money transfer service",
    "category": "finance"
  },
  {
    "id": "view_reports",
    "name": "ดูรายงาน",
    "description": "View financial reports",
    "category": "finance"
  },
  {
    "id": "manage_users",
    "name": "จัดการผู้ใช้",
    "description": "Create/edit/delete users",
    "category": "users"
  },
  {
    "id": "manage_roles",
    "name": "จัดการบทบาท",
    "description": "Manage roles and permissions",
    "category": "roles"
  }
]
```

---

## 🔗 Integration with Daily Sales

After implementing Access Control, integrate with DailySalesModal.vue:

```typescript
// DailySalesModal.vue
import { useAccessControlStore } from '~/stores/access-control'

const accessControlStore = useAccessControlStore()

// Get cashiers from access control store
const cashiers = computed(() => accessControlStore.getCashiers)

// Result shows:
// ✅ วราณี (แคชเชียร์)
// ✅ น้ำผึ้ง (ผู้ช่วยผู้จัดการ)
// ✅ กัลญา (ผู้จัดการ)
// ❌ พรทิพย์ (NOT shown - auditor only)
// ✅ นพพล (เจ้าของ)
```

---

## ✅ Testing Checklist

### Users Management Tests
- [ ] Fetch all users successfully
- [ ] Create user with single role (วราณี)
- [ ] Create user with multiple roles (นพพล)
- [ ] Update user roles
- [ ] Delete user
- [ ] Filter active users
- [ ] Cashier dropdown shows 4 people (not 5)

### Roles & Permissions Tests
- [ ] Fetch all roles (5 roles)
- [ ] Fetch all permissions (8 permissions)
- [ ] View role permissions matrix
- [ ] Update role permissions
- [ ] Verify cashier permissions (3-4 items)
- [ ] Verify owner permissions (all items)
- [ ] Verify auditor can't close cashier report

### Integration Tests
- [ ] Daily Sales uses access control store
- [ ] Cashier dropdown populated from getCashiers
- [ ] Cashier selection saves role information
- [ ] Edit existing sales shows correct cashier + role
- [ ] Multiple cashiers can be selected across different shifts

---

## 📊 Timeline

| Phase | Task | Time |
|-------|------|------|
| 1 | Design & Types | 15 min |
| 2 | Repository Interface | 10 min |
| 3 | JSON Repository | 20 min |
| 4 | Pinia Store | 30 min |
| 5 | API Endpoints | 40 min |
| 6 | Page Component | 30 min |
| 7 | Sample Data & Tests | 10 min |
| | **Total** | **155 min** |

---

## 🎯 Success Criteria

- ✅ Type safety (0 TypeScript errors)
- ✅ Multiple roles per user (วราณี=1, น้ำผึ้ง=2, นพพล=4)
- ✅ Cashier dropdown excludes auditor-only roles
- ✅ Professional tabbed interface
- ✅ Complete CRUD for users
- ✅ Permission matrix working
- ✅ Integration with Daily Sales
- ✅ All tests passing

---

## 📝 Notes

- Using **Repository Pattern** for seamless JSON → Firestore migration
- Supporting **multiple roles per user** (core business requirement)
- Using **Thai names only** in type definitions for consistency
- Building on **WEEK_03 architecture** (proven pattern)
- **No additional .md files** beyond this one document

---

**Ready to implement?** Follow the 7 phases above! 🚀

