# Auth Store Usage Guide

## 📦 Auth Store คืออะไร?

**Auth Store** = ที่เก็บข้อมูลผู้ใช้ที่ล็อกอินอยู่ในหน่วยความจำของแอปพลิเคชัน (Pinia State Management)

```
Auth Store (Pinia)
├─ user (ข้อมูลผู้ใช้)
│  ├─ uid: "kpTHjc5TcrQFtU42KY48guEl5Av1"
│  ├─ email: "kook@bigt.co.th"
│  ├─ displayName: "วราณี อุบลแย้ม"
│  ├─ primaryRole: "cashier"
│  ├─ roles: ["cashier"]
│  └─ isActive: true
├─ isAuthenticated: true
└─ isLoading: false
```

---

## 📂 ไฟล์ที่เกี่ยวข้อง

### 1. **stores/auth.ts** - ส่วนที่เก็บข้อมูล
```typescript
export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  primaryRole?: 'owner' | 'manager' | 'assistant_manager' | 'cashier' | 'auditor'
  roles?: string[]
  isActive?: boolean
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    isAuthenticated: false,
    isLoading: false,
  }),
  
  getters: {
    getCurrentUser: (state) => state.user,
    getIsAuthenticated: (state) => state.isAuthenticated,
  },
  
  actions: {
    setUser(user: AuthUser) {
      this.user = user
      this.isAuthenticated = true
    },
    
    clearUser() {
      this.user = null
      this.isAuthenticated = false
    },
  }
})
```

---

## 🔄 วิธีการใช้งาน Auth Store

### **ขั้นตอนที่ 1: Import Auth Store**

```typescript
// ในไฟล์ component / composable
import { useAuthStore } from '~/stores/auth'

// ในส่วน script setup
const authStore = useAuthStore()
```

### **ขั้นตอนที่ 2: อ่านข้อมูลผู้ใช้**

#### **วิธีที่ 1: ใช้ State โดยตรง**
```typescript
// Sidebar.vue
const user = computed(() => authStore.user)

// อ่านค่า
console.log(user.value?.displayName)  // "วราณี อุบลแย้ม"
console.log(user.value?.primaryRole)  // "cashier"
console.log(user.value?.email)        // "kook@bigt.co.th"
```

#### **วิธีที่ 2: ใช้ Getters**
```typescript
// Header.vue
const currentUser = computed(() => authStore.getCurrentUser)
const isAuth = computed(() => authStore.getIsAuthenticated)
```

#### **วิธีที่ 3: ดึงค่าเฉพาะฟิลด์**
```typescript
// Sidebar.vue - ดึง primaryRole แล้วคำนวณเมนู
const userRole = computed(() => {
  return authStore.user?.primaryRole || 'unknown'
})

const visibleMenu = computed(() => {
  return filterMenuByRole(sidebarMenu, userRole.value)
  //     ↑ แสดงเมนูตามบทบาท
})
```

---

## 💡 ตัวอย่างจริงในโปรเจกต์

### **1. Sidebar.vue - ใช้บทบาทกรองเมนู**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

// ① อ่านข้อมูลผู้ใช้
const user = computed(() => authStore.user)

// ② ดึง primaryRole
const userRole = computed(() => {
  if (!user.value) return 'unknown'
  return user.value.primaryRole ?? 'unknown'
})

// ③ คำนวณเมนูตามบทบาท
const visibleMenu = computed(() => {
  return filterMenuByRole(sidebarMenu, userRole.value)
  // เช่น:
  // - owner → แสดงเมนู: Dashboard, Users, Settings, etc.
  // - cashier → แสดงเมนู: Dashboard, Daily Sales
  // - auditor → แสดงเมนู: Dashboard, Audit Log
})
</script>

<template>
  <!-- ④ ใช้ข้อมูลในการแสดงผล -->
  <nav>
    <div v-for="group in visibleMenu" :key="group.groupKey">
      <button>{{ group.groupName }}</button>
      <!-- แสดงเมนูตามบทบาท -->
    </div>
  </nav>
</template>
```

### **2. Header.vue - แสดง User Info**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

// ① อ่านข้อมูลผู้ใช้
const user = computed(() => authStore.user)

// ② ดึง displayName
const userName = computed(() => user.value?.displayName || 'User')

// ③ ดึง primaryRole
const userRole = computed(() => user.value?.primaryRole || 'unknown')

// ④ แปลง role ให้เป็นตัวอักษรไทย
const roleLabel = computed(() => {
  const roleMap: Record<string, string> = {
    owner: 'เจ้าของร้าน',
    manager: 'ผู้จัดการ',
    cashier: 'แคชเชียร์',
    auditor: 'ผู้ตรวจสอบ',
    unknown: 'ผู้ใช้',
  }
  return roleMap[userRole.value] || 'ผู้ใช้'
})
</script>

<template>
  <!-- ⑤ แสดงข้อมูลผู้ใช้ -->
  <div class="flex items-center gap-3">
    <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
      {{ userName.charAt(0).toUpperCase() }}
    </div>
    <div>
      <p class="text-sm font-medium">{{ userName }}</p>
      <!-- หรือ: {{ userRole }} -->
      <p class="text-xs text-gray-500">{{ roleLabel }}</p>
    </div>
  </div>
</template>
```

### **3. useAuth.ts - กำหนดข้อมูล Auth Store**

```typescript
// บรรทัด 88-95
authStore.setUser({
  uid: user.uid,
  email: user.email,
  displayName: userDisplayName,           // ← ชื่อจากตัวผู้ใช้
  primaryRole: userPrimaryRole,           // ← บทบาทหลัก
  roles: userRoles,                       // ← รายชื่อบทบาททั้งหมด
  isActive: userIsActive,                 // ← สถานะใช้งาน
})
```

---

## 🔌 Data Flow แบบเห็นภาพ

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Login (login.vue)                                  │
│    Email: kook@bigt.co.th, Password: password123           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. useAuth.ts (composable)                                  │
│    - ตรวจสอบ Firebase Auth ✓                               │
│    - ดึง UID จาก Firebase                                    │
│    - ดึงข้อมูลจาก Firestore (displayName, primaryRole)     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Auth Store (stores/auth.ts)                             │
│    authStore.setUser({                                      │
│      uid: "kpTHjc5TcrQFtU42KY48guEl5Av1",                  │
│      email: "kook@bigt.co.th",                              │
│      displayName: "วราณี อุบลแย้ม",                        │
│      primaryRole: "cashier",                                │
│      roles: ["cashier"],                                    │
│      isActive: true                                         │
│    })                                                        │
└────────────────┬────────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌──────────────┐
│Sidebar │  │Header  │  │Other Pages   │
│        │  │        │  │              │
│ใช้:    │  │ใช้:    │  │ใช้:          │
│・role  │  │・name  │  │・user info   │
│・menu  │  │・role  │  │・permissions │
└────────┘  └────────┘  └──────────────┘
```

---

## 📝 ข้อมูลในแต่ละฟิลด์

| ฟิลด์ | ชนิด | ค่าตัวอย่าง | ใช้ที่ |
|------|------|-----------|--------|
| **uid** | string | `kpTHjc5TcrQFtU42KY48guEl5Av1` | ระบุตัวตนเฉพาะ, Firestore queries |
| **email** | string | `kook@bigt.co.th` | แสดงอีเมล, ล็อกเอาต์ |
| **displayName** | string | `วราณี อุบลแย้ม` | Header, ชื่อผู้ใช้ |
| **primaryRole** | string | `cashier` | กรองเมนู, แสดงบทบาท |
| **roles** | array | `["cashier"]` | ตรวจสอบสิทธิ์ (ในอนาคต) |
| **isActive** | boolean | `true` | ตรวจสอบว่าบัญชีใช้ได้ |

---

## ⚡ Quick Reference

### **การอ่านค่าจาก Auth Store**

```typescript
// Import
import { useAuthStore } from '~/stores/auth'
const authStore = useAuthStore()

// อ่านทั้งหมด
const user = authStore.user
// { uid, email, displayName, primaryRole, roles, isActive }

// อ่านแต่ละฟิลด์
const displayName = authStore.user?.displayName
const role = authStore.user?.primaryRole
const isAuth = authStore.isAuthenticated

// ใน computed
const userName = computed(() => authStore.user?.displayName || 'User')
```

### **การตั้งค่า Auth Store**

```typescript
// ใน useAuth.ts
authStore.setUser({
  uid: user.uid,
  email: user.email,
  displayName: userDisplayName,
  primaryRole: userPrimaryRole,
  roles: userRoles,
  isActive: userIsActive,
})
```

### **การล้าง Auth Store (Logout)**

```typescript
authStore.logout()
// หรือ
authStore.clearUser()
```

---

## ✅ สรุป

1. **Auth Store** = ที่เก็บข้อมูลผู้ใช้ (Pinia State)
2. **ใช้ useAuthStore()** = อ่านข้อมูลจาก Auth Store
3. **ใช้ computed()** = ทำให้ข้อมูลอัปเดตอัตโนมัติ
4. **Sidebar** = ใช้ primaryRole กรองเมนู
5. **Header** = ใช้ displayName และ primaryRole แสดง User Info

💚 ทีนี้สามารถ extend เพิ่ม getters / actions ในอนาคตได้ง่ายเพราะทั้งหมด centralized ที่ Auth Store!
