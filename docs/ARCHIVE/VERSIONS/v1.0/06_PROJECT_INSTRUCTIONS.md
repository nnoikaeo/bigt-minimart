# Project Instructions for Claude Code
# คำแนะนำโปรเจกต์สำหรับ Claude Code

## 📋 Project Overview

**Project Name**: BigThee Minimart Management System  
**Version**: 1.0  
**Start Date**: 2026-01-07  
**Target Launch**: มีนาคม 2026

**Description**:  
ระบบจัดการร้านมินิมาร์ทแบบครบวงจร สำหรับร้านบิ๊กธี มินิมาร์ท เน้นการจัดการรายรับ-รายจ่าย การตรวจสอบ Audit และรายงานการเงิน

---

## 🎯 Development Principles

### 1. Code Quality
- ✅ เขียน Clean Code ที่อ่านง่าย
- ✅ ใช้ TypeScript เพื่อ Type Safety
- ✅ Follow Naming Conventions
- ✅ เขียน Comments สำหรับ Logic ที่ซับซ้อน
- ✅ ไม่มี Console Logs ใน Production

### 2. Component Design
- ✅ สร้าง Reusable Components
- ✅ Single Responsibility Principle
- ✅ Props Validation
- ✅ Emit Events แทน Direct Data Mutation

### 3. Performance
- ✅ Lazy Load Components
- ✅ Optimize Images
- ✅ Minimize Bundle Size
- ✅ Use Pagination สำหรับ Lists ยาว
- ✅ Implement Caching เมื่อเหมาะสม

### 4. Security
- ✅ Validate Input ทุกครั้ง (Frontend + Backend)
- ✅ Sanitize Output
- ✅ Implement RBAC (Role-Based Access Control)
- ✅ ไม่ Expose Sensitive Data ใน Client
- ✅ Use HTTPS Only

---

## 🏗️ Project Structure

```
bigthee-minimart/
├── .nuxt/                      # Nuxt build output
├── assets/                     # Static assets
│   ├── css/
│   │   └── main.css            # Tailwind CSS
│   ├── images/
│   │   └── logo.png            # โลโก้ร้าน
│   └── fonts/                  # Custom fonts (optional)
├── components/                 # Vue Components
│   ├── common/                 # Common components
│   │   ├── BaseButton.vue
│   │   ├── BaseInput.vue
│   │   ├── BaseCard.vue
│   │   ├── BaseModal.vue
│   │   └── BaseAlert.vue
│   ├── layout/                 # Layout components
│   │   ├── AppHeader.vue
│   │   ├── AppSidebar.vue
│   │   ├── AppFooter.vue
│   │   └── UserMenu.vue
│   ├── sales/                  # Sales-related components
│   │   ├── SalesForm.vue
│   │   ├── SalesList.vue
│   │   └── SalesSummary.vue
│   ├── expenses/               # Expense components
│   ├── audit/                  # Audit components
│   ├── reports/                # Report components
│   └── dashboard/              # Dashboard components
├── composables/                # Composables (Composition API)
│   ├── useAuth.ts
│   ├── useSales.ts
│   ├── useExpenses.ts
│   └── useFirestore.ts
├── layouts/                    # Nuxt Layouts
│   ├── default.vue             # Default layout (with sidebar)
│   ├── auth.vue                # Auth layout (no sidebar)
│   └── blank.vue               # Blank layout
├── middleware/                 # Nuxt Middleware
│   ├── auth.ts                 # Authentication check
│   ├── guest.ts                # Guest only (for login page)
│   └── role.ts                 # Role-based access control
├── pages/                      # Nuxt Pages (Auto-routing)
│   ├── index.vue               # Dashboard
│   ├── login.vue               # Login page
│   ├── sales/
│   │   ├── index.vue           # Sales list
│   │   ├── close-shift.vue     # ปิดกะขาย
│   │   └── daily.vue           # บันทึกยอดรายวัน
│   ├── expenses/
│   │   ├── daily.vue
│   │   ├── monthly.vue
│   │   └── yearly.vue
│   ├── audit/
│   │   ├── index.vue           # Audit list
│   │   └── [id].vue            # Audit detail
│   ├── reports/
│   │   ├── daily.vue
│   │   ├── monthly.vue
│   │   └── cash-flow.vue
│   └── admin/
│       └── users.vue           # User management
├── plugins/                    # Nuxt Plugins
│   ├── firebase.client.ts      # Firebase initialization
│   └── dayjs.ts                # Day.js plugin
├── server/                     # Nuxt Server (API)
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.post.ts
│   │   │   ├── logout.post.ts
│   │   │   └── me.get.ts
│   │   ├── users/
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   ├── [id].get.ts
│   │   │   ├── [id].put.ts
│   │   │   └── [id].delete.ts
│   │   ├── sales/
│   │   ├── expenses/
│   │   ├── audit/
│   │   └── reports/
│   ├── middleware/
│   │   ├── auth.ts             # Server auth middleware
│   │   └── logger.ts           # Request logger
│   └── utils/
│       ├── firebase-admin.ts   # Firebase Admin SDK
│       ├── validation.ts       # Zod schemas
│       └── helpers.ts          # Helper functions
├── stores/                     # Pinia Stores
│   ├── auth.ts                 # Auth state
│   ├── sales.ts                # Sales state
│   ├── expenses.ts             # Expenses state
│   └── ui.ts                   # UI state (sidebar, modals, etc.)
├── types/                      # TypeScript Types
│   ├── user.ts
│   ├── sales.ts
│   ├── expenses.ts
│   └── api.ts
├── utils/                      # Utility functions
│   ├── format.ts               # Formatting helpers
│   ├── validation.ts           # Validation helpers
│   └── constants.ts            # Constants
├── .env.example                # Environment variables example
├── .gitignore
├── nuxt.config.ts              # Nuxt configuration
├── package.json
├── tailwind.config.js          # Tailwind CSS config
├── tsconfig.json               # TypeScript config
└── README.md
```

---

## 🔧 Technical Configuration

### Nuxt Config (`nuxt.config.ts`)

```typescript
export default defineNuxtConfig({
  // Nuxt 3
  devtools: { enabled: true },
  
  // TypeScript
  typescript: {
    strict: true,
    typeCheck: true,
  },
  
  // Modules
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],
  
  // CSS
  css: ['~/assets/css/main.css'],
  
  // Build
  build: {
    transpile: ['@heroicons/vue'],
  },
  
  // Runtime Config
  runtimeConfig: {
    // Private keys (server-only)
    firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT,
    
    // Public keys (client + server)
    public: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
    },
  },
  
  // App Config
  app: {
    head: {
      title: 'บิ๊กธี มินิมาร์ท',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'ระบบจัดการร้านบิ๊กธี มินิมาร์ท' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
      ],
    },
  },
});
```

### Tailwind Config (`tailwind.config.js`)

```javascript
module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#EF3340',
          dark: '#D42834',
          light: '#F9848C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Thai', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

---

## 🔥 Firebase Setup

### Firebase Config

```typescript
// plugins/firebase.client.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const firebaseConfig = {
    apiKey: config.public.firebaseApiKey,
    authDomain: config.public.firebaseAuthDomain,
    projectId: config.public.firebaseProjectId,
    storageBucket: config.public.firebaseStorageBucket,
    messagingSenderId: config.public.firebaseMessagingSenderId,
    appId: config.public.firebaseAppId,
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  return {
    provide: {
      firebase: app,
      auth,
      db,
      storage,
    },
  };
});
```

### Firebase Admin (Server)

```typescript
// server/utils/firebase-admin.ts
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const config = useRuntimeConfig();

// Initialize only once
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(config.firebaseServiceAccount)),
  });
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
```

---

## 🛡️ Authentication & RBAC

### Auth Composable

```typescript
// composables/useAuth.ts
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

export const useAuth = () => {
  const { $auth } = useNuxtApp();
  const authStore = useAuthStore();
  
  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword($auth, email, password);
      const user = userCredential.user;
      
      // Get user data from Firestore
      const userData = await $fetch(`/api/users/${user.uid}`);
      authStore.setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };
  
  const logout = async () => {
    await signOut($auth);
    authStore.clearUser();
  };
  
  return {
    login,
    logout,
  };
};
```

### Auth Middleware

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();
  
  if (!authStore.isAuthenticated) {
    return navigateTo('/login');
  }
});
```

### Role Middleware

```typescript
// middleware/role.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();
  const requiredRole = to.meta.role as string;
  
  if (!authStore.hasRole(requiredRole)) {
    return navigateTo('/');
  }
});
```

---

## 📝 Coding Standards

### Naming Conventions

```typescript
// Components: PascalCase
BaseButton.vue
SalesForm.vue

// Composables: camelCase with "use" prefix
useAuth.ts
useSales.ts

// Types/Interfaces: PascalCase
interface User {}
type UserRole = string;

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://...';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Functions: camelCase
function calculateTotal() {}
const handleSubmit = () => {};

// Variables: camelCase
const userName = 'John';
const totalAmount = 1000;
```

### Component Structure

```vue
<script setup lang="ts">
// 1. Imports
import { ref, computed } from 'vue';
import type { User } from '~/types/user';

// 2. Props & Emits
interface Props {
  user: User;
  showDetails?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: false,
});

const emit = defineEmits<{
  (e: 'update', user: User): void;
  (e: 'delete', id: string): void;
}>();

// 3. Reactive State
const isLoading = ref(false);
const errorMessage = ref('');

// 4. Computed Properties
const fullName = computed(() => {
  return `${props.user.firstName} ${props.user.lastName}`;
});

// 5. Methods
const handleUpdate = async () => {
  isLoading.value = true;
  try {
    // Update logic
    emit('update', props.user);
  } catch (error) {
    errorMessage.value = 'เกิดข้อผิดพลาด';
  } finally {
    isLoading.value = false;
  }
};

// 6. Lifecycle Hooks
onMounted(() => {
  // Init logic
});
</script>

<template>
  <div class="component-wrapper">
    <!-- Template content -->
  </div>
</template>

<style scoped>
/* Component-specific styles (if needed) */
/* Prefer Tailwind CSS classes */
</style>
```

### API Route Structure

```typescript
// server/api/sales/index.post.ts
import { z } from 'zod';
import { adminDb } from '~/server/utils/firebase-admin';

// 1. Validation Schema
const salesSchema = z.object({
  date: z.string(),
  userId: z.string(),
  amount: z.number().positive(),
  // ... other fields
});

// 2. Handler
export default defineEventHandler(async (event) => {
  try {
    // 2.1 Authentication Check
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized',
      });
    }
    
    // 2.2 Authorization Check
    if (!['owner', 'manager', 'assistant_manager'].includes(user.role)) {
      throw createError({
        statusCode: 403,
        message: 'Forbidden',
      });
    }
    
    // 2.3 Read Body
    const body = await readBody(event);
    
    // 2.4 Validate Input
    const validatedData = salesSchema.parse(body);
    
    // 2.5 Business Logic
    const salesRef = adminDb.collection('daily_sales').doc();
    await salesRef.set({
      ...validatedData,
      createdAt: new Date(),
      createdBy: user.uid,
    });
    
    // 2.6 Return Response
    return {
      success: true,
      data: {
        id: salesRef.id,
        ...validatedData,
      },
    };
    
  } catch (error) {
    // 2.7 Error Handling
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Invalid input',
        data: error.errors,
      });
    }
    throw error;
  }
});
```

---

## 🧪 Testing Guidelines

### Unit Tests (Vitest)

```typescript
// tests/utils/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from '~/utils/format';

describe('formatCurrency', () => {
  it('should format number as currency', () => {
    expect(formatCurrency(1000)).toBe('฿1,000.00');
    expect(formatCurrency(1234.56)).toBe('฿1,234.56');
  });
  
  it('should handle negative numbers', () => {
    expect(formatCurrency(-500)).toBe('-฿500.00');
  });
});

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2026-01-07');
    expect(formatDate(date)).toBe('07/01/2026');
  });
});
```

---

## 📋 Git Workflow

### Branch Strategy

```
main                 # Production branch
  └── develop        # Development branch
       ├── feature/auth-system
       ├── feature/sales-form
       ├── feature/audit-system
       └── bugfix/login-issue
```

### Commit Messages

```bash
# Format: <type>(<scope>): <subject>

# Types:
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation
style:    # Code style (formatting, etc.)
refactor: # Code refactoring
test:     # Adding tests
chore:    # Maintenance

# Examples:
git commit -m "feat(auth): implement login system"
git commit -m "fix(sales): correct calculation in total amount"
git commit -m "docs(readme): update installation instructions"
```

---

## 🚀 Deployment

### Build for Production

```bash
# Install dependencies
npm install

# Build
npm run build

# Preview (optional)
npm run preview
```

### Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (first time only)
firebase init hosting

# Deploy
firebase deploy --only hosting
```

### Environment Variables

```bash
# .env.example
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
FIREBASE_SERVICE_ACCOUNT=
```

---

## 🐛 Debugging Tips

### Common Issues

**1. Firebase Auth Error**
```typescript
// Check if user is authenticated
const authStore = useAuthStore();
console.log('Is Authenticated:', authStore.isAuthenticated);
console.log('Current User:', authStore.user);
```

**2. Firestore Permission Denied**
```typescript
// Check security rules
// Make sure user has correct role
// Log the attempted action
```

**3. Build Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules .nuxt
npm install
npm run dev
```

---

## 📚 Useful Resources

### Documentation
- [Nuxt 3 Docs](https://nuxt.com/docs)
- [Vue 3 Docs](https://vuejs.org/)
- [Firebase Docs](https://firebase.google.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)

### Tools
- [Heroicons](https://heroicons.com/) - Icon library
- [Day.js](https://day.js.org/) - Date manipulation
- [Zod](https://zod.dev/) - Schema validation
- [Chart.js](https://www.chartjs.org/) - Charts

---

## ✅ Checklist Before Committing

- [ ] Code compiles without errors
- [ ] No TypeScript errors
- [ ] No console.log statements
- [ ] Code follows naming conventions
- [ ] Components are reusable
- [ ] Proper error handling
- [ ] Input validation implemented
- [ ] Responsive design (Mobile/Desktop)
- [ ] Tested on Chrome/Safari/Firefox
- [ ] Commit message follows format

---

## 📞 Communication

### Progress Updates
- แจ้งความคืบหน้าทุกสัปดาห์
- แจ้ง Blockers ทันที
- Demo Features เมื่อเสร็จ

### Questions & Issues
- ถามคำถามได้ตลอดเวลา
- แจ้ง Bugs ทันทีที่พบ
- Suggest Improvements

---

**Last Updated**: 2026-01-07  
**Version**: 1.0  
**Status**: 📝 Ready for Development

---

## 🎯 Quick Start for Claude Code

1. อ่านเอกสารทั้งหมดใน `/bigthee-docs/`
2. เริ่มจาก Week 1: Project Setup
3. สร้าง Project Structure ตามที่กำหนด
4. Implement Features ตาม Roadmap
5. Test ทุก Feature ก่อน Move ต่อ
6. แจ้งความคืบหน้าเป็นประจำ

**Let's build something great! 🚀**
