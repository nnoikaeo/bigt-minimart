# UI/UX Guidelines
# แนวทางการออกแบบ UI/UX

## 🎨 Brand Identity

### สี (Color Palette)

#### Primary Colors
```css
/* แดง - สีหลักจากโลโก้ */
--color-primary: #EF3340;       /* Red 500 */
--color-primary-dark: #D42834;  /* Red 600 - Hover State */
--color-primary-light: #F9848C; /* Red 300 - Light Variant */

/* ขาว */
--color-white: #FFFFFF;

/* เทา - สำหรับ Text และ Background */
--color-gray-50: #F9FAFB;       /* Background */
--color-gray-100: #F3F4F6;      /* Light Background */
--color-gray-200: #E5E7EB;      /* Border */
--color-gray-300: #D1D5DB;      /* Disabled */
--color-gray-400: #9CA3AF;      /* Placeholder */
--color-gray-500: #6B7280;      /* Secondary Text */
--color-gray-600: #4B5563;      /* Primary Text */
--color-gray-700: #374151;      /* Heading */
--color-gray-800: #1F2937;      /* Dark Text */
--color-gray-900: #111827;      /* Very Dark */
```

#### Semantic Colors
```css
/* สำเร็จ */
--color-success: #10B981;       /* Green 500 */
--color-success-light: #D1FAE5; /* Green 100 */

/* คำเตือน */
--color-warning: #F59E0B;       /* Amber 500 */
--color-warning-light: #FEF3C7; /* Amber 100 */

/* ข้อผิดพลาด */
--color-error: #EF4444;         /* Red 500 */
--color-error-light: #FEE2E2;   /* Red 100 */

/* ข้อมูล */
--color-info: #3B82F6;          /* Blue 500 */
--color-info-light: #DBEAFE;    /* Blue 100 */
```

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#EF3340',
          dark: '#D42834',
          light: '#F9848C',
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Thai', 'sans-serif'],
      },
    },
  },
};
```

---

## 🔤 Typography

### Fonts
- **Primary**: `Inter` (English)
- **Secondary**: `Noto Sans Thai` (Thai)
- **Fallback**: `sans-serif`

### Font Sizes (Tailwind CSS)

```
text-xs:   12px / 16px (0.75rem / 1rem)
text-sm:   14px / 20px (0.875rem / 1.25rem)
text-base: 16px / 24px (1rem / 1.5rem)
text-lg:   18px / 28px (1.125rem / 1.75rem)
text-xl:   20px / 28px (1.25rem / 1.75rem)
text-2xl:  24px / 32px (1.5rem / 2rem)
text-3xl:  30px / 36px (1.875rem / 2.25rem)
text-4xl:  36px / 40px (2.25rem / 2.5rem)
```

### Font Weights

```
font-normal:    400
font-medium:    500
font-semibold:  600
font-bold:      700
```

### Usage Guidelines

```typescript
// Headings
<h1 className="text-3xl font-bold text-gray-800">หัวข้อหลัก</h1>
<h2 className="text-2xl font-semibold text-gray-700">หัวข้อรอง</h2>
<h3 className="text-xl font-medium text-gray-700">หัวข้อย่อย</h3>

// Body Text
<p className="text-base text-gray-600">เนื้อหาปกติ</p>
<span className="text-sm text-gray-500">ข้อความรอง</span>

// Labels
<label className="text-sm font-medium text-gray-700">ป้ายกำกับ</label>

// Buttons
<button className="text-base font-medium">ปุ่มกด</button>
```

---

## 📐 Spacing & Layout

### Spacing Scale (Tailwind CSS)

```
space-0:  0px
space-1:  4px   (0.25rem)
space-2:  8px   (0.5rem)
space-3:  12px  (0.75rem)
space-4:  16px  (1rem)
space-5:  20px  (1.25rem)
space-6:  24px  (1.5rem)
space-8:  32px  (2rem)
space-10: 40px  (2.5rem)
space-12: 48px  (3rem)
space-16: 64px  (4rem)
```

### Container & Max Width

```css
/* Container */
.container {
  max-width: 1280px;  /* Desktop */
  margin: 0 auto;
  padding: 0 1rem;    /* 16px */
}

/* Section Spacing */
.section {
  padding-top: 3rem;    /* 48px */
  padding-bottom: 3rem; /* 48px */
}
```

### Grid System

```html
<!-- 12-column grid -->
<div class="grid grid-cols-12 gap-6">
  <!-- Sidebar (3 columns) -->
  <aside class="col-span-3">...</aside>
  
  <!-- Main Content (9 columns) -->
  <main class="col-span-9">...</main>
</div>
```

---

## 🖱️ Components

### Buttons

```html
<!-- Primary Button -->
<button class="
  px-6 py-3
  bg-primary hover:bg-primary-dark
  text-white font-medium
  rounded-lg
  transition-colors duration-200
  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
">
  บันทึก
</button>

<!-- Secondary Button -->
<button class="
  px-6 py-3
  bg-white hover:bg-gray-50
  text-gray-700 font-medium
  border border-gray-300
  rounded-lg
  transition-colors duration-200
  focus:outline-none focus:ring-2 focus:ring-gray-300
">
  ยกเลิก
</button>

<!-- Danger Button -->
<button class="
  px-6 py-3
  bg-error hover:bg-red-600
  text-white font-medium
  rounded-lg
  transition-colors duration-200
  focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2
">
  ลบ
</button>

<!-- Disabled Button -->
<button disabled class="
  px-6 py-3
  bg-gray-300 text-gray-500
  rounded-lg
  cursor-not-allowed
">
  ปิดใช้งาน
</button>
```

### Input Fields

```html
<!-- Text Input -->
<div class="space-y-1">
  <label class="block text-sm font-medium text-gray-700">
    ชื่อ
  </label>
  <input
    type="text"
    class="
      w-full px-4 py-2
      border border-gray-300 rounded-lg
      focus:ring-2 focus:ring-primary focus:border-primary
      text-gray-800 placeholder-gray-400
    "
    placeholder="กรอกชื่อ"
  />
</div>

<!-- Number Input -->
<div class="space-y-1">
  <label class="block text-sm font-medium text-gray-700">
    จำนวนเงิน
  </label>
  <div class="relative">
    <input
      type="number"
      class="
        w-full pl-12 pr-4 py-2
        border border-gray-300 rounded-lg
        focus:ring-2 focus:ring-primary focus:border-primary
        text-gray-800
      "
      placeholder="0.00"
    />
    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
      ฿
    </span>
  </div>
</div>

<!-- Select Dropdown -->
<div class="space-y-1">
  <label class="block text-sm font-medium text-gray-700">
    ประเภท
  </label>
  <select class="
    w-full px-4 py-2
    border border-gray-300 rounded-lg
    focus:ring-2 focus:ring-primary focus:border-primary
    text-gray-800
  ">
    <option>เลือกประเภท</option>
    <option>เงินสด</option>
    <option>โอน</option>
  </select>
</div>

<!-- Error State -->
<div class="space-y-1">
  <label class="block text-sm font-medium text-gray-700">
    อีเมล
  </label>
  <input
    type="email"
    class="
      w-full px-4 py-2
      border border-error rounded-lg
      focus:ring-2 focus:ring-error focus:border-error
      text-gray-800
    "
    placeholder="example@email.com"
  />
  <p class="text-sm text-error">กรุณากรอกอีเมลให้ถูกต้อง</p>
</div>
```

### Cards

```html
<!-- Basic Card -->
<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <h3 class="text-lg font-semibold text-gray-800 mb-4">
    หัวข้อการ์ด
  </h3>
  <p class="text-gray-600">
    เนื้อหาภายในการ์ด
  </p>
</div>

<!-- Card with Action -->
<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
  <div class="p-6">
    <h3 class="text-lg font-semibold text-gray-800">
      รายการที่ 1
    </h3>
    <p class="text-sm text-gray-500 mt-1">
      รายละเอียดเพิ่มเติม
    </p>
  </div>
  <div class="bg-gray-50 px-6 py-3 flex justify-end gap-3">
    <button class="text-sm text-gray-600 hover:text-gray-800">
      ดูรายละเอียด
    </button>
    <button class="text-sm text-primary hover:text-primary-dark">
      แก้ไข
    </button>
  </div>
</div>
```

### Tables

```html
<div class="overflow-x-auto">
  <table class="w-full">
    <thead class="bg-gray-50 border-b border-gray-200">
      <tr>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          วันที่
        </th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          รายการ
        </th>
        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
          จำนวนเงิน
        </th>
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-200">
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
          07/01/2026
        </td>
        <td class="px-6 py-4 text-sm text-gray-600">
          ยอดขาย
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-right font-medium">
          ฿12,500.00
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Badges

```html
<!-- Success Badge -->
<span class="
  inline-flex items-center px-3 py-1
  rounded-full text-xs font-medium
  bg-success-light text-green-800
">
  ตรวจสอบแล้ว
</span>

<!-- Warning Badge -->
<span class="
  inline-flex items-center px-3 py-1
  rounded-full text-xs font-medium
  bg-warning-light text-amber-800
">
  รอตรวจสอบ
</span>

<!-- Error Badge -->
<span class="
  inline-flex items-center px-3 py-1
  rounded-full text-xs font-medium
  bg-error-light text-red-800
">
  ผิดปกติ
</span>

<!-- Info Badge -->
<span class="
  inline-flex items-center px-3 py-1
  rounded-full text-xs font-medium
  bg-info-light text-blue-800
">
  ฉบับร่าง
</span>
```

### Alerts

```html
<!-- Success Alert -->
<div class="bg-success-light border border-green-200 rounded-lg p-4">
  <div class="flex items-start">
    <svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
      <!-- Check Icon -->
    </svg>
    <div class="ml-3">
      <h3 class="text-sm font-medium text-green-800">บันทึกสำเร็จ</h3>
      <p class="text-sm text-green-700 mt-1">ข้อมูลถูกบันทึกเรียบร้อยแล้ว</p>
    </div>
  </div>
</div>

<!-- Error Alert -->
<div class="bg-error-light border border-red-200 rounded-lg p-4">
  <div class="flex items-start">
    <svg class="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
      <!-- X Icon -->
    </svg>
    <div class="ml-3">
      <h3 class="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</h3>
      <p class="text-sm text-red-700 mt-1">กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง</p>
    </div>
  </div>
</div>
```

### Modal

```html
<!-- Modal Overlay -->
<div class="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
  <!-- Modal Content -->
  <div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200">
      <h3 class="text-lg font-semibold text-gray-800">
        หัวข้อ Modal
      </h3>
    </div>
    
    <!-- Body -->
    <div class="px-6 py-4">
      <p class="text-gray-600">
        เนื้อหาภายใน Modal
      </p>
    </div>
    
    <!-- Footer -->
    <div class="px-6 py-4 bg-gray-50 flex justify-end gap-3">
      <button class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
        ยกเลิก
      </button>
      <button class="px-4 py-2 bg-primary text-white hover:bg-primary-dark rounded-lg">
        ยืนยัน
      </button>
    </div>
  </div>
</div>
```

---

## 📱 Responsive Design

### Breakpoints (Tailwind CSS)

```
sm:  640px   (Tablet Portrait)
md:  768px   (Tablet Landscape)
lg:  1024px  (Desktop)
xl:  1280px  (Large Desktop)
2xl: 1536px  (Extra Large Desktop)
```

### Mobile-First Approach

```html
<!-- Stack on Mobile, Side-by-side on Desktop -->
<div class="flex flex-col md:flex-row gap-4">
  <div class="w-full md:w-1/2">Left</div>
  <div class="w-full md:w-1/2">Right</div>
</div>

<!-- Hide on Mobile, Show on Desktop -->
<div class="hidden md:block">
  Desktop Only
</div>

<!-- Show on Mobile, Hide on Desktop -->
<div class="block md:hidden">
  Mobile Only
</div>
```

---

## 🎯 Page Layouts

### 1. Dashboard Layout

```
┌─────────────────────────────────────────────────────┐
│ Header (Logo + User Menu)                           │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ Sidebar  │         Main Content                     │
│ (Menu)   │                                          │
│          │  ┌─────────────────────────────┐        │
│          │  │  Summary Cards              │        │
│          │  └─────────────────────────────┘        │
│          │                                          │
│          │  ┌─────────────────────────────┐        │
│          │  │  Charts / Graphs            │        │
│          │  └─────────────────────────────┘        │
│          │                                          │
│          │  ┌─────────────────────────────┐        │
│          │  │  Recent Transactions        │        │
│          │  └─────────────────────────────┘        │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

### 2. Form Layout (ปิดกะขาย)

```
┌─────────────────────────────────────────────────────┐
│ Header                                               │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  Form Header (Title + Date)                │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  Section 1: ข้อมูลพนักงาน                  │    │
│  │  - ชื่อ                                     │    │
│  │  - POS Number                               │    │
│  │  - กะ                                       │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  Section 2: ยอดขาย POSPOS                  │    │
│  │  - ยอดขายรวม                                │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  Section 3: เงินสด                          │    │
│  │  - จำนวนเงิน                                │    │
│  │  (รายละเอียดธนบัตร/เหรียญ - optional)       │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  Section 4: เงินโอน                         │    │
│  │  - QR Code                                  │    │
│  │  - บัญชีธนาคาร                              │    │
│  │  - โครงการรัฐ                               │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  Summary (ยอดรวม)                           │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  [บันทึก]  [ยกเลิก]                                │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 3. List/Table Layout (รายการรอบันทึก)

```
┌─────────────────────────────────────────────────────┐
│ Header                                               │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  Filters & Search                           │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  Table                                      │    │
│  │  ┌──────┬────────┬─────────┬─────────┐    │    │
│  │  │ วันที่│ พนักงาน│  ยอดเงิน │ สถานะ   │    │    │
│  │  ├──────┼────────┼─────────┼─────────┤    │    │
│  │  │      │        │         │         │    │    │
│  │  └──────┴────────┴─────────┴─────────┘    │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  [Pagination]                                       │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## ✨ Interactions & Animations

### Transitions

```css
/* Default Transition */
.transition-default {
  transition: all 0.2s ease-in-out;
}

/* Hover Effects */
.hover-lift {
  transition: transform 0.2s ease-in-out;
}
.hover-lift:hover {
  transform: translateY(-2px);
}

/* Focus States */
.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2;
}
```

### Loading States

```html
<!-- Skeleton Loader -->
<div class="animate-pulse">
  <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div class="h-4 bg-gray-200 rounded w-1/2"></div>
</div>

<!-- Spinner -->
<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
```

---

## ♿ Accessibility (a11y)

### Best Practices

1. ✅ **Semantic HTML** - ใช้ Tags ที่เหมาะสม
2. ✅ **Alt Text** - ใส่ alt attribute สำหรับรูปภาพ
3. ✅ **Focus States** - แสดง Focus ชัดเจน
4. ✅ **ARIA Labels** - ใส่ Label สำหรับ Screen Readers
5. ✅ **Keyboard Navigation** - ใช้งานได้ด้วย Keyboard
6. ✅ **Color Contrast** - WCAG AA (4.5:1)

```html
<!-- Example: Accessible Button -->
<button
  aria-label="ปิดหน้าต่าง"
  class="focus:ring-2 focus:ring-primary"
>
  <svg aria-hidden="true">...</svg>
</button>

<!-- Example: Accessible Form -->
<form>
  <label for="email" class="sr-only">อีเมล</label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid="false"
  />
</form>
```

---

## 📋 Design Checklist

### Before Development

- [ ] ได้ Approval จากเจ้าของร้าน
- [ ] มี Wireframes สำหรับทุกหน้า
- [ ] กำหนด User Flow ชัดเจน
- [ ] เตรียม Assets (โลโก้, ไอคอน, ภาพ)

### During Development

- [ ] ใช้ Tailwind CSS Utility Classes
- [ ] Follow Naming Convention
- [ ] Component Reusability
- [ ] Responsive ทุกหน้า
- [ ] Test บน Chrome, Safari, Firefox

### Before Launch

- [ ] Cross-browser Testing
- [ ] Mobile/Tablet Testing
- [ ] Accessibility Testing
- [ ] Performance Testing (Lighthouse)
- [ ] User Acceptance Testing (UAT)

---

**Last Updated**: 2026-01-07  
**Version**: 1.0  
**Status**: 📝 Documentation Phase
