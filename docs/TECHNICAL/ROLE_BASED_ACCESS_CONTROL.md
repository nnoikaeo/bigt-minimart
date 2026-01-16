# 🔐 Role-Based Access Control (RBAC) Implementation

**Document**: Technical Implementation Guide  
**Last Updated**: January 16, 2026  
**Status**: Design Phase (Ready for Implementation)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Design Approach](#design-approach)
4. [Firestore Schema](#firestore-schema)
5. [API Endpoints](#api-endpoints)
6. [Implementation Guide](#implementation-guide)
7. [Frontend Integration](#frontend-integration)
8. [Admin UI (roles.vue)](#admin-ui)
9. [Validation Rules](#validation-rules)
10. [Security Considerations](#security-considerations)

---

## 🎯 Overview

BigT MiniMart uses **Strict Role Hierarchy + Page Access Matrix** to control which pages each user role can access.

### Key Principles
- ✅ **Owner**: Auto-access all pages (non-negotiable)
- ✅ **Explicit Configuration**: Each role has explicit page access list
- ✅ **No Conflicts**: Role hierarchy prevents contradictions
- ✅ **Flexible**: Admin can customize access per role
- ✅ **Audit Trail**: Track who changed what and when

---

## 🏗️ Architecture

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ User Login                                                  │
├─────────────────────────────────────────────────────────────┤
│ 1. Firebase Auth                                            │
│ 2. Fetch user record (users collection)                    │
│ 3. Fetch role permissions (role_permissions collection)    │
│ 4. Build accessible pages list                             │
│ 5. Store in localStorage + Pinia store                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Page Rendering                                              │
├─────────────────────────────────────────────────────────────┤
│ 1. Sidebar: Filter menu based on accessible pages          │
│ 2. Router: Check permission before navigate                │
│ 3. Page: Display with role-specific content                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Admin UI (/admin/roles)                                     │
├─────────────────────────────────────────────────────────────┤
│ 1. List all roles                                           │
│ 2. Show page access checklist                              │
│ 3. Toggle page access                                      │
│ 4. Save changes to Firestore                               │
│ 5. Validate rules                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Design Approach

### Why Strict Role Hierarchy?

**3 Options Comparison**:

| Aspect | Option 1: canBeCashier | Option 2: Permissions Array | Option 3: Strict Hierarchy |
|--------|----------------------|---------------------------|--------------------------|
| Flexibility | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Complexity | ✅ Simple | ⚠️ Medium | ✅ Simple |
| Conflict Risk | Medium | Medium | ❌ None |
| Scalability | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**We chose Option 3** because:
- ✅ No conflicts possible
- ✅ Simple to implement
- ✅ Easy to maintain for small team
- ✅ Can upgrade to Option 2 later if needed

### Key Decisions

**1. Owner Auto-Access**
```
if (user.role === 'owner') {
  return getAllPages()  // No need to check role_permissions
}
```

**2. Explicit Role Matrix**
```json
{
  "auditor": {
    "sales/daily-sales": true,
    "sales/sales-report": true,
    "finance/daily-expenses": false,
    ...
  }
}
```

**3. Single Source of Truth**
- Store in `role_permissions` collection
- Not duplicated in `users` collection
- Fetch on login, cache in frontend

---

## 🗄️ Firestore Schema

### Collection: role_permissions

```typescript
interface RolePermissions {
  // PK: role (e.g., "auditor")
  role: string
  
  // Display info
  name: string              // e.g., "ผู้ตรวจสอบ"
  description?: string      // e.g., "บันทึกและตรวจสอบยอดขาย"
  
  // Page access matrix
  pages: {
    [pageRoute]: boolean    // e.g., "sales/daily-sales": true
  }
  
  // Audit info
  updatedAt: Timestamp
  updatedBy: string         // Owner UID who made the change
}
```

### Example Documents

**Auditor Role**
```firestore
role_permissions/auditor:
{
  "role": "auditor",
  "name": "ผู้ตรวจสอบ",
  "description": "บันทึก ตรวจสอบ และอนุมัติยอดขาย",
  "pages": {
    "sales/daily-sales": true,
    "sales/sales-report": true,
    "finance/daily-expenses": false,
    "finance/cash-flow": false,
    "finance/monthly-report": false,
    "hr/attendance": false,
    "hr/overtime": false,
    "settings/system-settings": false,
    "settings/others": false,
    "admin/users": false,
    "admin/roles": false
  },
  "updatedAt": Timestamp,
  "updatedBy": "owner-uid-1"
}
```

**Manager Role**
```firestore
role_permissions/manager:
{
  "role": "manager",
  "name": "ผู้จัดการร้าน",
  "description": "จัดการปฏิบัติการรายวัน",
  "pages": {
    "sales/daily-sales": false,
    "sales/sales-report": true,
    "finance/daily-expenses": true,
    "finance/cash-flow": true,
    "finance/monthly-report": false,
    "hr/attendance": true,
    "hr/overtime": true,
    "settings/system-settings": false,
    "settings/others": false,
    "admin/users": false,
    "admin/roles": false
  },
  "updatedAt": Timestamp,
  "updatedBy": "owner-uid-1"
}
```

**Owner Role** (Implicit - no document needed)
```
// Auto-access all pages
// No document in role_permissions collection
```

---

## 📡 API Endpoints

### 1. GET /api/role-permissions

**Purpose**: Get all role permissions (for admin UI)

**Request**:
```
GET /api/role-permissions
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "role": "auditor",
      "name": "ผู้ตรวจสอบ",
      "pages": { "sales/daily-sales": true, ... }
    },
    {
      "role": "manager",
      "name": "ผู้จัดการร้าน",
      "pages": { "sales/daily-sales": false, ... }
    }
  ]
}
```

**Security**: Owner/Admin only

---

### 2. GET /api/role-permissions/:role

**Purpose**: Get specific role permissions

**Request**:
```
GET /api/role-permissions/auditor
```

**Response**:
```json
{
  "success": true,
  "data": {
    "role": "auditor",
    "name": "ผู้ตรวจสอบ",
    "pages": { "sales/daily-sales": true, ... }
  }
}
```

**Security**: Public (for client-side filtering)

---

### 3. PUT /api/role-permissions/:role

**Purpose**: Update role page permissions

**Request**:
```
PUT /api/role-permissions/auditor
Content-Type: application/json

{
  "pages": {
    "sales/daily-sales": true,
    "sales/sales-report": true,
    "finance/daily-expenses": false,
    ...
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Role permissions updated successfully",
  "data": { ... }
}
```

**Security**: Owner/Admin only

**Validation**:
- Cannot modify owner role
- All pages must be valid
- Owner must have all pages

---

## 🚀 Implementation Guide

### Phase 1: Backend Setup

1. **Create Firestore collection & documents**
   ```
   role_permissions/
   ├─ auditor
   ├─ manager
   ├─ cashier
   └─ staff
   ```

2. **Create API endpoints**
   - `server/api/role-permissions/index.get.ts`
   - `server/api/role-permissions/[role].get.ts`
   - `server/api/role-permissions/[role].put.ts`

3. **Add validation logic**
   - Prevent owner modification
   - Validate page routes
   - Audit trail tracking

### Phase 2: Frontend Setup

1. **Create composable**
   - `composables/useRolePermissions.ts`
   - Fetch role permissions on login
   - Cache in Pinia store

2. **Update sidebar logic**
   - `utils/sidebar-menu.ts`: Filter by page access
   - `components/Sidebar.vue`: Use filtered menu

3. **Update router**
   - `middleware/role-based-access.ts`
   - Check access before page load

### Phase 3: Admin UI

1. **Create `/admin/roles.vue`**
   - List all roles
   - Show page access checklist
   - Toggle access per page
   - Save changes

2. **Add validation UI**
   - Prevent invalid configurations
   - Show warnings for conflicts
   - Audit trail display

---

## 💻 Frontend Integration

### Composable: useRolePermissions.ts

```typescript
export const useRolePermissions = () => {
  const userRole = useAuthStore().user?.role
  const rolePermissions = ref({})
  
  // Get user's accessible pages
  const getAccessiblePages = () => {
    if (userRole === 'owner') return getAllPages()
    
    return Object.entries(rolePermissions.value.pages)
      .filter(([route, access]) => access)
      .map(([route]) => route)
  }
  
  // Check if user can access page
  const canAccessPage = (pageRoute: string) => {
    if (userRole === 'owner') return true
    return rolePermissions.value.pages?.[pageRoute] === true
  }
  
  // Fetch role permissions
  const fetchRolePermissions = async () => {
    const response = await $fetch(`/api/role-permissions/${userRole}`)
    rolePermissions.value = response.data
  }
  
  return {
    getAccessiblePages,
    canAccessPage,
    fetchRolePermissions,
    rolePermissions
  }
}
```

### Sidebar Menu Filtering

```typescript
// utils/sidebar-menu.ts
export const filterMenuByRoleAccess = (
  menu: MenuGroup[],
  userRole: string,
  rolePermissions: RolePageAccess
) => {
  // Owner: all pages
  if (userRole === 'owner') return menu
  
  // Other roles: filter by page access
  return menu
    .map(group => ({
      ...group,
      pages: group.pages.filter(page =>
        rolePermissions.pages[page.route] === true
      )
    }))
    .filter(group => group.pages.length > 0)
}
```

### Route Guard

```typescript
// middleware/role-based-access.ts
export default defineRouteMiddleware(async (to, from) => {
  const { user } = useAuthStore()
  const { canAccessPage } = useRolePermissions()
  
  const pageRoute = to.path
    .replace(/^\//, '')  // Remove leading /
    .replace(/\d+$/, '')  // Remove ID
  
  if (!canAccessPage(pageRoute)) {
    return navigateTo('/')
  }
})
```

---

## 👨‍💼 Admin UI (/admin/roles)

### Features

1. **Role List**
   - Display all roles with names
   - Highlight owner role
   - Show last updated info

2. **Page Access Checklist**
   - Group by sidebar sections
   - Checkbox per page
   - Visual feedback

3. **Save & Validation**
   - Validate before save
   - Show error messages
   - Confirm changes

4. **Audit Trail**
   - Show who changed what
   - Show when changes were made
   - Allow rollback (optional)

### UI Layout

```
┌─────────────────────────────────────────────┐
│ 🔐 บทบาทและสิทธิ์                           │
├─────────────────────────────────────────────┤
│ [Auditor] [Manager] [Cashier] [Staff]      │
│                                             │
│ ผู้ตรวจสอบ                                  │
│                                             │
│ [✅] 💰 บันทึกยอดขาย                        │
│ [✅] 💰 รายงานการขาย                        │
│ [❌] 📈 รายรับ-รายจ่าย                      │
│ [❌] 📈 กระแสเงินสด                         │
│ ... (more pages)                            │
│                                             │
│ [ยกเลิก] [บันทึก]                          │
└─────────────────────────────────────────────┘
```

---

## ✅ Validation Rules

### Rule 1: Owner Must Have All Pages
```typescript
if (role === 'owner') {
  const allPages = getAllPages()
  if (!allPages.every(p => pages[p.route])) {
    throw new Error('Owner must access all pages')
  }
}
```

### Rule 2: No Role > Owner Access
```typescript
if (countAccess(role.pages) > countAccess(owner.pages)) {
  throw new Error('Role cannot have more access than owner')
}
```

### Rule 3: Admin Pages Only for Owner
```typescript
const adminPages = ['admin/users', 'admin/roles']
const hasAdminAccess = adminPages.some(p => pages[p] === true)

if (role !== 'owner' && hasAdminAccess) {
  throw new Error('Only owner can access admin pages')
}
```

### Rule 4: Valid Page Routes
```typescript
const validRoutes = getAllPages().map(p => p.route)
Object.keys(pages).forEach(route => {
  if (!validRoutes.includes(route)) {
    throw new Error(`Invalid route: ${route}`)
  }
})
```

---

## 🔒 Security Considerations

### 1. Authentication
- ✅ Only logged-in users can change roles
- ✅ Only owner can access `/admin/roles`
- ✅ Firestore rules enforce owner-only access

### 2. Authorization
- ✅ Backend validates role before returning data
- ✅ Page access checked on every route navigation
- ✅ API endpoints verify permission before modification

### 3. Audit Trail
- ✅ Track who changed role permissions
- ✅ Track when changes were made
- ✅ Track what was changed (diff)

### 4. Firestore Rules

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // role_permissions collection
    match /role_permissions/{role} {
      // Public read
      allow read: if request.auth != null;
      
      // Owner only write
      allow write: if
        request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'owner';
    }
  }
}
```

---

## 📊 Implementation Checklist

### Phase 1: Data & API
- [ ] Create Firestore collection `role_permissions`
- [ ] Add all role documents
- [ ] Create GET endpoints
- [ ] Create PUT endpoint with validation
- [ ] Add Firestore security rules

### Phase 2: Frontend
- [ ] Create useRolePermissions composable
- [ ] Update sidebar-menu.ts filtering
- [ ] Create role-based-access middleware
- [ ] Update sidebar component
- [ ] Test permission checking

### Phase 3: Admin UI
- [ ] Create /admin/roles.vue page
- [ ] Build role list component
- [ ] Build page access checklist
- [ ] Add save & validation logic
- [ ] Add audit trail display

### Phase 4: Testing
- [ ] Test role filtering on sidebar
- [ ] Test route guards
- [ ] Test admin UI updates
- [ ] Test permission caching
- [ ] Test validation rules

---

## 📚 References

- [USER_ROLES.md](../REQUIREMENTS/USER_ROLES.md) - Role definitions
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Firestore schema
- [SIDEBAR_IMPLEMENTATION.md](./SIDEBAR_IMPLEMENTATION.md) - Sidebar details

---

**Document Version**: 1.0  
**Status**: Ready for Implementation  
**Next Steps**: Start Phase 1 (Firestore setup)
