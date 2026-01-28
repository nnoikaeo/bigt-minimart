# 🗂️ State Management Architecture with Pinia

**Document**: State Management Implementation Guide  
**Last Updated**: January 28, 2026  
**Version**: 1.0  
**Status**: Planning Phase

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Current Implementation](#current-implementation)
3. [Planned Store Architecture](#planned-store-architecture)
4. [Store Implementation Guide](#store-implementation-guide)
5. [Best Practices](#best-practices)
6. [Usage Patterns](#usage-patterns)
7. [Integration with Firebase](#integration-with-firebase)

---

## 🎯 Overview

### What is Pinia?

Pinia is the official state management library for Vue 3 applications. It provides:
- ✅ **Centralized State** - Single source of truth for application data
- ✅ **Reactive Updates** - Automatic UI re-renders when state changes
- ✅ **Type Safety** - Full TypeScript support
- ✅ **DevTools Integration** - Easy debugging and time-travel
- ✅ **Simple API** - Easier than Vuex

### Why Use Pinia in This Project?

- **Component Communication**: Share data between components without prop drilling
- **Firebase Integration**: Cache Firestore data and manage sync state
- **Role-Based Display**: Manage what data each user role can see
- **Form State**: Keep form data persistent across page navigation
- **UI State**: Manage sidebar, modals, and global UI state
- **Performance**: Prevent unnecessary API calls by caching

---

## ✅ Current Implementation

### 1. Authentication Store (`stores/auth.ts`)

```typescript
import { defineStore } from 'pinia'

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  role?: 'owner' | 'manager' | 'assistant_manager' | 'cashier' | 'auditor'
}

export const useAuthStore = defineStore('auth', {
  // 📦 STATE - The data
  state: () => ({
    user: null as AuthUser | null,           // Current logged-in user
    isAuthenticated: false,                   // Login status
    isLoading: false,                         // Loading state during auth
  }),

  // 📖 GETTERS - Read computed properties
  getters: {
    getCurrentUser: (state) => state.user,
    getIsAuthenticated: (state) => state.isAuthenticated,
    getIsLoading: (state) => state.isLoading,
    
    // Computed getter: User's role
    getUserRole: (state) => state.user?.role,
    
    // Computed getter: Is user an admin
    isAdmin: (state) => ['owner', 'manager'].includes(state.user?.role || ''),
  },

  // ⚡ ACTIONS - Modify state methods
  actions: {
    setUser(user: AuthUser) {
      this.user = user
      this.isAuthenticated = true
    },

    clearUser() {
      this.user = null
      this.isAuthenticated = false
    },

    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    // ✅ Firebase integration: Login
    async loginWithEmail(email: string, password: string) {
      this.isLoading = true
      try {
        // Firebase Auth
        const response = await $fetch('/api/auth/login', {
          method: 'POST',
          body: { email, password }
        })
        
        // Store user in Pinia
        this.setUser(response.user)
        return response
      } finally {
        this.isLoading = false
      }
    },

    // ✅ Firebase integration: Logout
    async logout() {
      try {
        await $fetch('/api/auth/logout', { method: 'POST' })
      } finally {
        this.clearUser()
      }
    },
  },
})
```

**How it works with Firebase**:
- ✅ Login: Firebase Auth → Server → Pinia Store
- ✅ Persist: Store in browser session/localStorage
- ✅ Use: Components access `authStore.user` (reactive)

---

### 2. UI Store (`stores/ui.ts`)

```typescript
export const useUIStore = defineStore('ui', {
  state: () => ({
    expandedGroups: {
      dashboard: true,
      sales: true,
      finance: true,
      inventory: false,
      personnel: true,
      settings: true,
      admin: true,
    } as Record<string, boolean>,

    activeGroup: 'sales' as string | null,
    activePage: 'daily-sales' as string | null,
    isMobileSidebarOpen: false,
  }),

  getters: {
    getExpandedGroups: (state) => state.expandedGroups,
    getActiveGroup: (state) => state.activeGroup,
    getActivePage: (state) => state.activePage,
    isSidebarOpenMobile: (state) => state.isMobileSidebarOpen,
  },

  actions: {
    toggleGroup(groupKey: string) {
      this.expandedGroups[groupKey] = !this.expandedGroups[groupKey]
    },

    setActiveGroup(groupKey: string) {
      this.activeGroup = groupKey
    },

    setActivePage(pageName: string) {
      this.activePage = pageName
    },

    toggleMobileSidebar() {
      this.isMobileSidebarOpen = !this.isMobileSidebarOpen
    },

    closeMobileSidebar() {
      this.isMobileSidebarOpen = false
    },

    // ✅ Persist UI preferences to localStorage
    savePreferences() {
      const prefs = {
        expandedGroups: this.expandedGroups,
        activeGroup: this.activeGroup,
      }
      localStorage.setItem('uiPreferences', JSON.stringify(prefs))
    },

    // ✅ Load UI preferences from localStorage
    loadPreferences() {
      const saved = localStorage.getItem('uiPreferences')
      if (saved) {
        const prefs = JSON.parse(saved)
        this.expandedGroups = prefs.expandedGroups
        this.activeGroup = prefs.activeGroup
      }
    },
  },
})
```

**How it works with localStorage**:
- ✅ Save: When user interacts (toggle menu, select page)
- ✅ Load: On app startup
- ✅ Use: UI stays in same state across page reloads

---

## 📋 Planned Store Architecture

### Store Map

```
┌─────────────────────────────────────────────────────────────┐
│                  Application Stores                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ auth.ts     → Authentication & User Data               │
│  ✅ ui.ts       → UI State (Sidebar, Active Page)           │
│                                                             │
│  📋 sales.ts    → Daily Sales Records                       │
│  📋 finance.ts  → Expenses & Financial Data                 │
│  📋 users.ts    → Staff Management                          │
│  📋 reports.ts  → Reports & Analytics                       │
│  📋 settings.ts → System Settings & Preferences             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Planned Stores (Phase 1)

#### 1. Sales Store (`stores/sales.ts`) - Phase 1, Week 3

**Purpose**: Manage daily sales records and data

```typescript
export interface DailySalesEntry {
  id?: string
  date: string
  cashierId: string
  cashierName: string
  posposData: { cash: number; qr: number; bank: number; government: number }
  cashReconciliation: { expectedAmount: number; actualAmount: number; difference: number }
  status: 'submitted' | 'audited' | 'approved'
  auditNotes?: string
  submittedAt?: Date
  auditedAt?: Date
}

export const useSalesStore = defineStore('sales', {
  state: () => ({
    dailySales: [] as DailySalesEntry[],
    selectedSale: null as DailySalesEntry | null,
    isLoading: false,
    filters: {
      startDate: '',
      endDate: '',
      cashierId: '',
      status: '' as 'submitted' | 'audited' | 'approved' | '',
    },
    stats: {
      totalSales: 0,
      totalCash: 0,
      totalQR: 0,
      totalBank: 0,
      totalGov: 0,
      averageSales: 0,
    },
  }),

  getters: {
    getAllSales: (state) => state.dailySales,
    
    // Filter by status
    getPendingSales: (state) => 
      state.dailySales.filter(s => s.status === 'submitted'),
    
    getApprovedSales: (state) =>
      state.dailySales.filter(s => s.status === 'approved'),

    // Get stats
    getSalesStats: (state) => state.stats,
    getTotalRevenue: (state) => state.stats.totalSales,

    // Get filtered sales
    getFilteredSales: (state) => {
      let results = state.dailySales
      
      if (state.filters.startDate) {
        results = results.filter(s => s.date >= state.filters.startDate)
      }
      if (state.filters.endDate) {
        results = results.filter(s => s.date <= state.filters.endDate)
      }
      if (state.filters.cashierId) {
        results = results.filter(s => s.cashierId === state.filters.cashierId)
      }
      if (state.filters.status) {
        results = results.filter(s => s.status === state.filters.status)
      }
      
      return results
    },
  },

  actions: {
    // Fetch from Firebase
    async fetchDailySales(startDate: string, endDate: string) {
      this.isLoading = true
      try {
        const data = await $fetch('/api/daily-sales', {
          query: { startDate, endDate }
        })
        this.dailySales = data
        this.calculateStats()
      } catch (error) {
        console.error('Failed to fetch daily sales:', error)
      } finally {
        this.isLoading = false
      }
    },

    // Add new sale
    async addDailySale(sale: DailySalesEntry) {
      try {
        const response = await $fetch('/api/daily-sales', {
          method: 'POST',
          body: sale,
        })
        this.dailySales.push(response)
        this.calculateStats()
      } catch (error) {
        console.error('Failed to add daily sale:', error)
      }
    },

    // Update sale
    async updateDailySale(saleId: string, updates: Partial<DailySalesEntry>) {
      try {
        await $fetch(`/api/daily-sales/${saleId}`, {
          method: 'PUT',
          body: updates,
        })
        const index = this.dailySales.findIndex(s => s.id === saleId)
        if (index !== -1) {
          this.dailySales[index] = { ...this.dailySales[index], ...updates }
          this.calculateStats()
        }
      } catch (error) {
        console.error('Failed to update daily sale:', error)
      }
    },

    // Approve sale
    async approveSale(saleId: string, auditNotes?: string) {
      await this.updateDailySale(saleId, {
        status: 'approved',
        auditNotes,
        auditedAt: new Date(),
      })
    },

    // Set filters
    setDateFilter(startDate: string, endDate: string) {
      this.filters.startDate = startDate
      this.filters.endDate = endDate
    },

    setCashierFilter(cashierId: string) {
      this.filters.cashierId = cashierId
    },

    setStatusFilter(status: 'submitted' | 'audited' | 'approved' | '') {
      this.filters.status = status
    },

    // Calculate statistics
    calculateStats() {
      this.stats.totalSales = this.dailySales.reduce((sum, s) => {
        const total = s.posposData.cash + s.posposData.qr + 
                     s.posposData.bank + s.posposData.government
        return sum + total
      }, 0)
      
      this.stats.totalCash = this.dailySales.reduce((sum, s) => sum + s.posposData.cash, 0)
      this.stats.totalQR = this.dailySales.reduce((sum, s) => sum + s.posposData.qr, 0)
      this.stats.totalBank = this.dailySales.reduce((sum, s) => sum + s.posposData.bank, 0)
      this.stats.totalGov = this.dailySales.reduce((sum, s) => sum + s.posposData.government, 0)
      
      if (this.dailySales.length > 0) {
        this.stats.averageSales = this.stats.totalSales / this.dailySales.length
      }
    },
  },
})
```

#### 2. Finance Store (`stores/finance.ts`) - Phase 1, Week 4

**Purpose**: Manage expenses and financial data

```typescript
export const useFinanceStore = defineStore('finance', {
  state: () => ({
    expenses: [] as Expense[],
    monthlyExpenses: {} as Record<string, number>,
    summary: {
      totalIncome: 0,
      totalExpenses: 0,
      netProfit: 0,
    },
  }),

  getters: {
    getMonthlyExpensesSummary: (state) => state.monthlyExpenses,
    getTotalExpenses: (state) => state.summary.totalExpenses,
    getNetProfit: (state) => state.summary.netProfit,
  },

  actions: {
    async addExpense(expense: Expense) {
      this.expenses.push(expense)
      await saveExpenseToFirebase(expense)
      this.updateSummary()
    },

    async fetchMonthlyExpenses(month: string) {
      const data = await fetchExpensesFromFirebase(month)
      this.expenses = data
    },

    updateSummary() {
      const salesStore = useSalesStore()
      this.summary.totalExpenses = this.expenses.reduce((sum, e) => sum + e.amount, 0)
      this.summary.totalIncome = salesStore.stats.totalSales
      this.summary.netProfit = this.summary.totalIncome - this.summary.totalExpenses
    },
  },
})
```

#### 3. Users Store (`stores/users.ts`) - Phase 1, Week 2

**Purpose**: Manage staff and employee data

```typescript
export const useUsersStore = defineStore('users', {
  state: () => ({
    allUsers: [] as User[],
    cashiers: [] as Cashier[],
    managers: [] as Manager[],
    selectedUser: null as User | null,
  }),

  getters: {
    getAllUsers: (state) => state.allUsers,
    getCashiers: (state) => state.cashiers,
    getActiveUsers: (state) => state.allUsers.filter(u => u.isActive),
  },

  actions: {
    async fetchAllUsers() {
      const data = await fetchUsersFromFirebase()
      this.allUsers = data
      this.cashiers = data.filter(u => u.role === 'cashier')
    },

    async addUser(user: User) {
      await createUserInFirebase(user)
      this.allUsers.push(user)
    },

    async updateUserRole(userId: string, newRole: string) {
      await updateUserInFirebase(userId, { role: newRole })
      const user = this.allUsers.find(u => u.uid === userId)
      if (user) user.role = newRole
    },
  },
})
```

#### 4. Reports Store (`stores/reports.ts`) - Phase 1-2, Week 5

**Purpose**: Generate and manage reports

```typescript
export const useReportsStore = defineStore('reports', {
  state: () => ({
    dailyReport: null as DailyReport | null,
    monthlyReport: null as MonthlyReport | null,
    filters: {
      startDate: '',
      endDate: '',
    },
  }),

  getters: {
    getDailyReport: (state) => state.dailyReport,
    getMonthlyReport: (state) => state.monthlyReport,
  },

  actions: {
    async generateDailyReport(date: string) {
      const salesStore = useSalesStore()
      const financeStore = useFinanceStore()

      this.dailyReport = {
        date,
        totalSales: salesStore.stats.totalSales,
        totalExpenses: financeStore.summary.totalExpenses,
        netIncome: salesStore.stats.totalSales - financeStore.summary.totalExpenses,
        breakdown: {
          cash: salesStore.stats.totalCash,
          qr: salesStore.stats.totalQR,
          bank: salesStore.stats.totalBank,
          gov: salesStore.stats.totalGov,
        },
      }
    },

    async generateMonthlyReport(month: string) {
      // Generate comprehensive monthly report
    },
  },
})
```

#### 5. Settings Store (`stores/settings.ts`) - Phase 2

**Purpose**: System settings and user preferences

```typescript
export const useSettingsStore = defineStore('settings', {
  state: () => ({
    systemSettings: {
      businessName: 'BigT Minimart',
      openTime: '08:00',
      closeTime: '22:00',
    },
    userPreferences: {
      theme: 'light',
      language: 'th',
      notifications: true,
    },
  }),

  actions: {
    updateSystemSettings(settings: any) {
      this.systemSettings = { ...this.systemSettings, ...settings }
      saveSettingsToFirebase(this.systemSettings)
    },

    updateUserPreferences(preferences: any) {
      this.userPreferences = { ...this.userPreferences, ...preferences }
      localStorage.setItem('userPreferences', JSON.stringify(this.userPreferences))
    },
  },
})
```

---

## 📖 Store Implementation Guide

### Step-by-Step: Creating a New Store

#### 1. Define Interfaces (TypeScript)

```typescript
// types/sales.ts
export interface DailySalesEntry {
  id?: string
  date: string
  cashierId: string
  // ... more fields
}

export interface SalesStats {
  totalSales: number
  totalCash: number
  // ... more fields
}
```

#### 2. Create the Store File

```typescript
// stores/sales.ts
import { defineStore } from 'pinia'
import type { DailySalesEntry, SalesStats } from '~/types/sales'

export const useSalesStore = defineStore('sales', {
  state: () => ({
    // Your state here
  }),

  getters: {
    // Your getters here
  },

  actions: {
    // Your actions here
  },
})
```

#### 3. Use in Component

```vue
<script setup lang="ts">
import { useSalesStore } from '~/stores/sales'
import { computed } from 'vue'

const salesStore = useSalesStore()

// Access state (reactive)
const sales = computed(() => salesStore.getAllSales)

// Access getters
const stats = computed(() => salesStore.getSalesStats)

// Call actions
async function loadSales() {
  await salesStore.fetchDailySales('2026-01-01', '2026-01-31')
}

// Watch for changes
watch(() => salesStore.stats, (newStats) => {
  console.log('Stats updated:', newStats)
})
</script>

<template>
  <div>
    <h1>Total Sales: {{ stats.totalSales }}</h1>
    <table>
      <tr v-for="sale in sales" :key="sale.id">
        <td>{{ sale.date }}</td>
        <td>{{ sale.cashierName }}</td>
      </tr>
    </table>
  </div>
</template>
```

---

## ✨ Best Practices

### 1. Keep State Flat
```typescript
// ❌ BAD - Nested state
state: () => ({
  user: {
    profile: {
      name: '',
      address: {
        street: '',
      }
    }
  }
})

// ✅ GOOD - Flat state
state: () => ({
  userName: '',
  userEmail: '',
  userAddress: '',
})
```

### 2. Use Getters for Computed Values
```typescript
// ✅ GOOD
getters: {
  isAdmin: (state) => ['owner', 'manager'].includes(state.userRole),
}

// Use in component
if (authStore.isAdmin) { }
```

### 3. Use Actions for Side Effects
```typescript
// ✅ GOOD
actions: {
  async fetchUser() {
    this.isLoading = true
    try {
      const user = await $fetch('/api/user')
      this.user = user
    } finally {
      this.isLoading = false
    }
  }
}
```

### 4. Keep Stores Focused
```
✅ Each store has ONE responsibility:
  - auth.ts → Authentication only
  - sales.ts → Sales data only
  - finance.ts → Financial data only

❌ Don't mix responsibilities:
  - DON'T put sales logic in auth store
  - DON'T put finance logic in sales store
```

### 5. Use Namespaced Stores
```typescript
// Auto-namespaced
export const useSalesStore = defineStore('sales', { ... })
export const useFinanceStore = defineStore('finance', { ... })

// Use with clear names
const salesStore = useSalesStore()
const financeStore = useFinanceStore()
```

---

## 🔗 Usage Patterns

### Pattern 1: Fetch and Cache

```typescript
async function loadData() {
  // Only fetch if not already loaded
  if (salesStore.dailySales.length === 0) {
    await salesStore.fetchDailySales(startDate, endDate)
  }
}
```

### Pattern 2: Filtered Results

```typescript
// Set filters
salesStore.setDateFilter('2026-01-01', '2026-01-31')
salesStore.setCashierFilter('cashier-123')

// Get filtered results (reactive)
const filtered = computed(() => salesStore.getFilteredSales)
```

### Pattern 3: Cross-Store Communication

```typescript
// In reports store
generateDailyReport(date: string) {
  const salesStore = useSalesStore()
  const financeStore = useFinanceStore()
  
  return {
    sales: salesStore.stats,
    expenses: financeStore.summary,
    profit: salesStore.stats.totalSales - financeStore.summary.totalExpenses,
  }
}
```

### Pattern 4: Persist to LocalStorage

```typescript
// For user preferences
updateUserPreferences(prefs: any) {
  this.preferences = { ...this.preferences, ...prefs }
  localStorage.setItem('userPreferences', JSON.stringify(this.preferences))
}

// Load from localStorage on app startup
loadUserPreferences() {
  const saved = localStorage.getItem('userPreferences')
  if (saved) {
    this.preferences = JSON.parse(saved)
  }
}
```

---

## 🏗️ Repository Pattern: Data Abstraction Layer

### Why Repository Pattern?

**Problem**: Direct Firestore calls scattered across store → Hard to change data source

**Solution**: Repository layer abstracts data source → Easy to swap JSON ↔ Firestore

```
❌ WITHOUT Repository:
   Component → Store → Firestore (tightly coupled)
   To change to JSON: must edit Store ❌

✅ WITH Repository:
   Component → Store → Repository → JSON or Firestore (decoupled)
   To change: just swap repository ✅
```

### Architecture

```
┌──────────────────┐
│   Component      │  (doesn't care about data source)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Pinia Store     │  (uses repository abstraction)
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  ISalesRepository (Interface)            │
│  ├─ fetch()                             │
│  ├─ getById()                           │
│  ├─ add()                               │
│  ├─ update()                            │
│  └─ delete()                            │
└────────┬────────────────────────────────┘
         │
    ┌────┴──────┐
    │            │
    ▼            ▼
┌──────────┐  ┌──────────────┐
│  JSON    │  │  Firestore   │
│Repository│  │Repository    │
└──────────┘  └──────────────┘
   (Dev)          (Prod)
```

### Implementation Phases

#### **Phase 1: Development (NOW)** ✅
- Use `SalesJsonRepository`
- Data stored in `public/data/daily-sales.json`
- Perfect for rapid development

#### **Phase 2: Production (Future)**
- Create `SalesFirestoreRepository`
- Change 1 import line in store
- Component & Store unchanged!

### Files Created

```
types/
└── repositories.ts              ← Interface definitions

server/repositories/
├── sales-json.repository.ts     ← JSON implementation (NOW)
└── sales-firestore.repository.ts ← Firestore impl (FUTURE)

stores/
└── sales.ts                     ← Uses repository
```

---

### 1️⃣ Repository Interface (`types/repositories.ts`)

```typescript
/**
 * Sales Repository Interface
 * Both JSON and Firestore repos implement this
 */
export interface ISalesRepository {
  init(): Promise<void>
  
  // READ
  fetch(startDate: string, endDate: string): Promise<DailySalesEntry[]>
  getById(id: string): Promise<DailySalesEntry>
  getAll(): Promise<DailySalesEntry[]>
  getByStatus(status: 'submitted' | 'audited' | 'approved'): Promise<DailySalesEntry[]>
  count(): Promise<number>
  
  // WRITE
  add(sale: Omit<DailySalesEntry, 'id' | 'submittedAt'>): Promise<DailySalesEntry>
  update(id: string, updates: Partial<DailySalesEntry>): Promise<void>
  delete(id: string): Promise<void>
}

export interface DailySalesEntry {
  id: string
  date: string
  cashierId: string
  cashierName: string
  posposData: {
    cash: number
    qr: number
    bank: number
    government: number
  }
  cashReconciliation: {
    expectedAmount: number
    actualCashInDrawer: number
    difference: number
    notes?: string
  }
  status: 'submitted' | 'audited' | 'approved'
  auditNotes?: string
  submittedAt: Date
  submittedBy?: string
}
```

---

### 2️⃣ JSON Repository (`server/repositories/sales-json.repository.ts`)

```typescript
export class SalesJsonRepository implements ISalesRepository {
  private data: DailySalesEntry[] = []
  private dataFile: string = 'public/data/daily-sales.json'

  async init(): Promise<void> {
    // Load from JSON file
    const content = await fs.readFile(this.dataFile, 'utf-8')
    this.data = JSON.parse(content)
  }

  async fetch(startDate: string, endDate: string): Promise<DailySalesEntry[]> {
    // Filter in-memory data
    return this.data.filter(sale => {
      const saleDate = new Date(sale.date)
      return saleDate >= new Date(startDate) && saleDate <= new Date(endDate)
    })
  }

  async add(sale: Omit<DailySalesEntry, 'id' | 'submittedAt'>): Promise<DailySalesEntry> {
    const newSale: DailySalesEntry = {
      ...sale,
      id: `sales-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      submittedAt: new Date(),
    }
    this.data.push(newSale)
    await this.save() // Save to file
    return newSale
  }

  async update(id: string, updates: Partial<DailySalesEntry>): Promise<void> {
    const index = this.data.findIndex(s => s.id === id)
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...updates }
      await this.save() // Save to file
    }
  }

  async delete(id: string): Promise<void> {
    this.data = this.data.filter(s => s.id !== id)
    await this.save() // Save to file
  }

  private async save(): Promise<void> {
    const json = JSON.stringify(this.data, null, 2)
    await fs.writeFile(this.dataFile, json, 'utf-8')
  }
}

export const salesJsonRepository = new SalesJsonRepository()
```

**Advantages**:
- ✅ No Firestore needed
- ✅ Development fast
- ✅ Easy to modify data
- ✅ Version control (git)
- ✅ Testing simple

---

### 3️⃣ Firestore Repository (`server/repositories/sales-firestore.repository.ts`)

```typescript
export class SalesFirestoreRepository implements ISalesRepository {
  private db: Firestore
  private collectionName = 'daily_sales'

  constructor(db: Firestore) {
    this.db = db
  }

  async init(): Promise<void> {
    // Test Firestore connection
    await getDocs(query(collection(this.db, this.collectionName)))
  }

  async fetch(startDate: string, endDate: string): Promise<DailySalesEntry[]> {
    const q = query(
      collection(this.db, this.collectionName),
      where('date', '>=', new Date(startDate)),
      where('date', '<=', new Date(endDate))
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as DailySalesEntry[]
  }

  async add(sale: Omit<DailySalesEntry, 'id' | 'submittedAt'>): Promise<DailySalesEntry> {
    const docRef = await addDoc(collection(this.db, this.collectionName), {
      ...sale,
      submittedAt: Timestamp.now(),
    })
    return { ...sale, id: docRef.id, submittedAt: new Date() }
  }

  async update(id: string, updates: Partial<DailySalesEntry>): Promise<void> {
    await updateDoc(doc(this.db, this.collectionName, id), updates)
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.db, this.collectionName, id))
  }
}

export const createSalesFirestoreRepository = (db: Firestore) => 
  new SalesFirestoreRepository(db)
```

**Advantages**:
- ✅ Real-time sync
- ✅ Scales infinitely
- ✅ Secure (Rules)
- ✅ Automatic backup

---

### 4️⃣ Using Repository in Store

```typescript
// stores/sales.ts - CURRENT (using JSON)
import { salesJsonRepository } from '~/server/repositories/sales-json.repository'

export const useSalesStore = defineStore('sales', {
  state: () => ({
    dailySales: [] as DailySalesEntry[],
    isLoading: false,
  }),

  actions: {
    async fetchDailySales(startDate: string, endDate: string) {
      this.isLoading = true
      try {
        // ← Use repository (not direct Firestore)
        this.dailySales = await salesJsonRepository.fetch(startDate, endDate)
      } finally {
        this.isLoading = false
      }
    },

    async addDailySale(sale: DailySalesEntry) {
      const newSale = await salesJsonRepository.add(sale)
      this.dailySales.push(newSale)
    },

    async updateDailySale(id: string, updates: Partial<DailySalesEntry>) {
      await salesJsonRepository.update(id, updates)
      const index = this.dailySales.findIndex(s => s.id === id)
      if (index !== -1) {
        this.dailySales[index] = { ...this.dailySales[index], ...updates }
      }
    },

    async deleteDailySale(id: string) {
      await salesJsonRepository.delete(id)
      this.dailySales = this.dailySales.filter(s => s.id !== id)
    },
  },
})
```

**To migrate to Firestore**: Just change import!

```typescript
// STEP 1: Change import (1 line!)
import { createSalesFirestoreRepository } from '~/server/repositories/sales-firestore.repository'
const salesRepository = createSalesFirestoreRepository(db)

// ✅ Store code unchanged!
// ✅ Component code unchanged!
// ✅ UI unchanged!
```

---

### 5️⃣ Migration Timeline

```
PHASE 1: Development with JSON (Week 1-4)
├─ Store uses SalesJsonRepository
├─ Data in public/data/daily-sales.json
├─ Build UI/UX
├─ Refine features
└─ ✅ Ready for testing

PHASE 2: Testing (Week 5)
├─ All features working?
├─ Performance OK?
└─ Users happy?

PHASE 3: Firestore Migration (Week 6+)
├─ Create SalesFirestoreRepository
├─ Initialize Firestore collection
├─ Change 1 import in store
├─ Test with real Firestore
├─ Deploy to production
└─ ✅ Scaled, secure, real-time!
```

---

## 🔥 Integration with Firebase

### Overview: How Firestore & Pinia Work Together

```
Firestore (Remote)          ↔          Pinia (Local Cache)
──────────────────────────────────────────────────────
🗄️ Persistent Storage        💾 Fast In-Memory Cache
📡 Single Source of Truth    ⚡ Immediate UI Updates
Network Required             Network Optional
Slower (200-500ms)           Faster (1-10ms)
```

**Purpose**: 
- Pinia caches Firestore data locally for instant access
- Reduces network requests and API calls
- Enables offline-like experience
- Maintains data consistency across components

---

### Data Flow Diagram: Read & Write Operations

#### **📥 READ Flow** (ดึงข้อมูล)

```
┌──────────────┐
│  Component   │  "Get all daily sales"
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│  useStore() + computed(() => ...)   │  1️⃣ Access store
└──────┬───────────────────────────────┘
       │
       ├─→ Store.dailySales.length > 0?
       │   ✅ YES → Return cached data (1ms)
       │   ❌ NO  → Fetch from Firestore
       │
       ▼ (if no cache)
┌──────────────────────────────────────┐
│  Store Action: fetchDailySales()     │  2️⃣ Call action
├──────────────────────────────────────┤
│ • Set isLoading = true              │
│ • Call $fetch('/api/daily-sales')   │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Server API (/api/daily-sales)       │  3️⃣ Server route
├──────────────────────────────────────┤
│ • Query Firestore                    │
│ • collection('daily_sales')          │
│ • where(...), orderBy(...), limit()  │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Firestore Query                     │  4️⃣ Database
├──────────────────────────────────────┤
│ • Find matching documents            │
│ • Return to server                   │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Store Action (continued)            │  5️⃣ Update store
├──────────────────────────────────────┤
│ • this.dailySales = data[]           │
│ • this.calculateStats()              │
│ • Set isLoading = false              │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Component (Re-render)               │  6️⃣ Update UI
├──────────────────────────────────────┤
│ • Display: Total Sales = 50,000฿    │
│ • Render: Sales table                │
└──────────────────────────────────────┘
```

**Timing**:
- First load: ~500ms (network + processing)
- Subsequent loads: ~1ms (from cache)

---

#### **📤 WRITE Flow** (บันทึก/อัปเดต)

```
┌──────────────────────┐
│   User Input         │  "บันทึกยอดขายใหม่"
│   Form Submit ◄──────┤  e.g., 10,000฿
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  Store Action: addDailySale()            │  1️⃣ Optimistic update
├──────────────────────────────────────────┤
│ • Validate data (Zod schema)             │
│ • Add to Pinia immediately:              │
│   this.dailySales.push(newSale)          │
│ • UI updates INSTANTLY (1ms)             │
│ • User sees result right away ✨         │
└──────┬───────────────────────────────────┘
       │
       ▼ (background)
┌──────────────────────────────────────────┐
│  Server API: POST /api/daily-sales       │  2️⃣ Send to server
├──────────────────────────────────────────┤
│ • Receive data from client               │
│ • Validate on server                     │
│ • Prepare for Firestore                  │
│   - Add timestamps                       │
│   - Add user info                        │
│   - Convert to Firestore format          │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  Firestore: addDoc()                     │  3️⃣ Write to DB
├──────────────────────────────────────────┤
│ • Create new document                    │
│ • Auto-generate ID                       │
│ • Save to collection('daily_sales')      │
│ • Return doc ID                          │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  Server API (continued)                  │  4️⃣ Return to client
├──────────────────────────────────────────┤
│ • Return data with ID                    │
│   { id: 'xPz8cD4e...', ...data }        │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  Store Action (finalize)                 │  5️⃣ Update with real ID
├──────────────────────────────────────────┤
│ • Find the optimistic entry              │
│ • Update with real ID from server        │
│ • calculateStats() (if needed)           │
│ • Clear error (if any)                   │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  Component                               │  6️⃣ Show confirmation
├──────────────────────────────────────────┤
│ • Show: "บันทึกสำเร็จ ✅"                │
│ • Data persisted in DB                   │
└──────────────────────────────────────────┘
```

**Timeline**:
- Optimistic update: 1ms (User sees immediately)
- Background save: ~500ms (Network request)
- Database write: ~100ms (Firestore)
- Total: ~600ms (but user sees result at 1ms)

---

### Pattern: Firestore ↔ Pinia Workflow

#### **Example: Daily Sales Flow**

```typescript
// 📁 stores/sales.ts
export const useSalesStore = defineStore('sales', {
  state: () => ({
    dailySales: [] as DailySalesEntry[],
    isLoading: false,
    syncStatus: {
      isSyncing: false,
      lastSyncTime: null as Date | null,
      error: null as string | null,
    },
  }),

  getters: {
    getAllSales: (state) => state.dailySales,
    getSalesStats: (state) => {
      return {
        totalSales: state.dailySales.reduce((sum, s) => {
          return sum + (s.posposData.cash + s.posposData.qr + 
                       s.posposData.bank + s.posposData.government)
        }, 0),
      }
    },
  },

  actions: {
    // ✅ READ: Fetch from Firestore and cache in Pinia
    async fetchDailySales(startDate: string, endDate: string) {
      // Check if already cached
      if (this.dailySales.length > 0) {
        console.log('✅ Using cached data')
        return
      }

      this.isLoading = true
      this.syncStatus.isSyncing = true
      this.syncStatus.error = null

      try {
        console.log('📡 Fetching from Firestore...')
        
        // 1️⃣ Call server API
        const data = await $fetch('/api/daily-sales', {
          query: { startDate, endDate }
        })

        // 2️⃣ Store in Pinia (cache)
        this.dailySales = data
        this.syncStatus.lastSyncTime = new Date()

        console.log('✅ Data synced:', data.length, 'records')
      } catch (error) {
        console.error('❌ Fetch failed:', error)
        this.syncStatus.error = error.message
        throw error
      } finally {
        this.isLoading = false
        this.syncStatus.isSyncing = false
      }
    },

    // ✅ WRITE: Add to cache immediately, save to Firestore
    async addDailySale(sale: DailySalesEntry) {
      this.syncStatus.error = null

      try {
        // OPTIMISTIC: Add to Pinia immediately
        console.log('1️⃣ Adding to Pinia cache (optimistic)')
        this.dailySales.push(sale)
        
        // Component re-renders here! UI updates instantly

        // PERSIST: Send to Firestore (background)
        console.log('2️⃣ Saving to Firestore...')
        const response = await $fetch('/api/daily-sales', {
          method: 'POST',
          body: sale,
        })

        // FINALIZE: Update with real ID
        console.log('3️⃣ Updating with real ID from server')
        const index = this.dailySales.findIndex(s => s === sale)
        if (index !== -1 && response.id) {
          this.dailySales[index].id = response.id
        }

        console.log('✅ Sale saved successfully:', response.id)
      } catch (error) {
        console.error('❌ Error saving sale:', error)
        
        // ROLLBACK: Remove from cache on error
        this.dailySales = this.dailySales.filter(s => s !== sale)
        this.syncStatus.error = error.message
        throw error
      }
    },

    // ✅ UPDATE: Modify existing record
    async updateDailySale(saleId: string, updates: Partial<DailySalesEntry>) {
      try {
        // OPTIMISTIC: Update cache first
        console.log('1️⃣ Updating cache')
        const index = this.dailySales.findIndex(s => s.id === saleId)
        if (index === -1) throw new Error('Sale not found')
        
        const originalData = { ...this.dailySales[index] }
        this.dailySales[index] = { ...this.dailySales[index], ...updates }

        // PERSIST: Send to server
        console.log('2️⃣ Updating in Firestore...')
        await $fetch(`/api/daily-sales/${saleId}`, {
          method: 'PUT',
          body: updates,
        })

        console.log('✅ Sale updated successfully')
      } catch (error) {
        console.error('❌ Error updating sale:', error)
        
        // ROLLBACK: Restore original data
        const index = this.dailySales.findIndex(s => s.id === saleId)
        if (index !== -1) {
          this.dailySales[index] = originalData
        }
        throw error
      }
    },

    // ✅ DELETE: Remove from cache and Firestore
    async deleteDailySale(saleId: string) {
      try {
        // OPTIMISTIC: Remove from cache
        console.log('1️⃣ Removing from cache')
        this.dailySales = this.dailySales.filter(s => s.id !== saleId)

        // PERSIST: Delete from Firestore
        console.log('2️⃣ Deleting from Firestore...')
        await $fetch(`/api/daily-sales/${saleId}`, {
          method: 'DELETE',
        })

        console.log('✅ Sale deleted successfully')
      } catch (error) {
        console.error('❌ Error deleting sale:', error)
        throw error
      }
    },
  },
})
```

---

#### **Server API Implementation**

```typescript
// 📁 server/api/daily-sales.get.ts
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '~/server/utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const { startDate, endDate } = getQuery(event)

  try {
    console.log('🔷 Server: Querying Firestore...')
    
    // Query Firestore
    const q = query(
      collection(db, 'daily_sales'),
      where('date', '>=', new Date(startDate as string)),
      where('date', '<=', new Date(endDate as string))
    )

    const querySnapshot = await getDocs(q)
    
    // Convert to TypeScript objects
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))

    console.log('🔷 Server: Retrieved', data.length, 'records')
    return data
  } catch (error) {
    console.error('🔷 Server Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch daily sales',
    })
  }
})
```

```typescript
// 📁 server/api/daily-sales.post.ts
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '~/server/utils/firebase-admin'
import { DailySalesSchema } from '~/types/schemas'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { user } = await requireAuth(event)

  try {
    // Validate with Zod
    const validatedData = DailySalesSchema.parse(body)

    console.log('🔷 Server: Preparing data for Firestore...')
    
    // Prepare document
    const docData = {
      ...validatedData,
      date: new Date(validatedData.date),
      submittedAt: Timestamp.now(),
      submittedBy: user.uid,
      status: 'submitted',
    }

    // Add to Firestore
    console.log('🔷 Server: Writing to Firestore...')
    const docRef = await addDoc(collection(db, 'daily_sales'), docData)

    console.log('🔷 Server: Document created:', docRef.id)
    
    // Return with ID
    return {
      id: docRef.id,
      ...validatedData,
      submittedAt: new Date(),
      submittedBy: user.uid,
    }
  } catch (error) {
    console.error('🔷 Server Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to save daily sales',
    })
  }
})
```

---

### Caching Strategy

#### **Pattern 1: Cache on First Load**

```typescript
// Load data only once per session
async function loadSalesData() {
  if (salesStore.dailySales.length > 0) {
    // ✅ Already cached - use it
    console.log('Using cache:', salesStore.dailySales.length, 'records')
    return
  }

  // ❌ Not cached - fetch from Firestore
  console.log('Fetching from Firestore...')
  await salesStore.fetchDailySales(startDate, endDate)
}
```

**Timeline**:
- 1st call: 500ms (fetch)
- 2nd+ calls: 1ms (cache)

---

#### **Pattern 2: Manual Refresh**

```typescript
// Manually refresh cache when needed
async function refreshData() {
  console.log('Refreshing cache from Firestore...')
  // Clear cache
  salesStore.dailySales = []
  // Fetch fresh data
  await salesStore.fetchDailySales(startDate, endDate)
}
```

---

#### **Pattern 3: Time-Based Cache Expiry**

```typescript
state: () => ({
  dailySales: [],
  cacheExpiryTime: 5 * 60 * 1000, // 5 minutes
  lastFetchTime: null as Date | null,
}),

actions: {
  async fetchDailySales(startDate: string, endDate: string) {
    // Check if cache is still valid
    if (this.isCacheValid()) {
      console.log('✅ Cache still valid, using it')
      return
    }

    // Cache expired, fetch fresh data
    console.log('📡 Cache expired, fetching...')
    await this._doFetch(startDate, endDate)
  },

  isCacheValid(): boolean {
    if (!this.lastFetchTime) return false
    
    const now = new Date().getTime()
    const lastFetch = this.lastFetchTime.getTime()
    return (now - lastFetch) < this.cacheExpiryTime
  },

  async _doFetch(startDate: string, endDate: string) {
    // ... fetch logic
    this.lastFetchTime = new Date()
  },
}
```

---

### Sync Status Indicators

```typescript
// 📁 stores/sales.ts
state: () => ({
  dailySales: [],
  syncStatus: {
    isSyncing: false,           // Currently syncing?
    lastSyncTime: null as Date | null,  // Last successful sync
    error: null as string | null,       // Sync error message
  },
}),

// In component:
// <div v-if="salesStore.syncStatus.isSyncing">
//   ⏳ Syncing...
// </div>
// <div v-if="salesStore.syncStatus.error">
//   ❌ Error: {{ salesStore.syncStatus.error }}
// </div>
// <div v-if="salesStore.syncStatus.lastSyncTime">
//   ✅ Last sync: {{ formatTime(salesStore.syncStatus.lastSyncTime) }}
// </div>
```

---

## 📅 Implementation Timeline

| Phase | Store | Week | Status |
|-------|-------|------|--------|
| Phase 1 | auth | Week 1 | ✅ Done |
| Phase 1 | ui | Week 2 | ✅ Done |
| Phase 1 | sales | Week 3 | 📋 Planned |
| Phase 1 | finance | Week 4 | 📋 Planned |
| Phase 1 | users | Week 5 | 📋 Planned |
| Phase 1 | reports | Week 5-6 | 📋 Planned |
| Phase 2 | settings | Phase 2 | 📋 Planned |

---

**Version History**:
- v1.0 (Jan 28, 2026) - Initial documentation

