# Design System

> Single source of truth for brand, colors, typography, and UI patterns.
> Merged from: BRAND_IDENTITY.md, COLOR_PALETTE.md, UI_UX_GUIDELINES.md

**Last Updated**: Mar 25, 2026

---

## Brand Identity

- **Name**: BigT Minimart (changed from BigThee)
- **Logo**: Circular, white Thai text "บิ๊กธี" on red (#EF3340)
- **Minimum size**: 32x32px, clear space 10px
- **Fonts**: Inter (English), Noto Sans Thai (Thai), fallback sans-serif

---

## Color System

### Primary (Brand Red)

| Token | Hex | Usage |
|-------|-----|-------|
| primary-500 | `#EF3340` | Primary buttons, brand elements |
| primary-600 | `#D42834` | Hover/active states |
| primary-300 | `#F9848C` | Disabled/light variant |

### Semantic Colors

| Token | Primary | Light BG | Border |
|-------|---------|----------|--------|
| Success (Green) | `#10B981` | `#D1FAE5` | `#34D399` |
| Warning (Amber) | `#F59E0B` | `#FEF3C7` | `#FCD34D` |
| Error (Red) | `#EF4444` | `#FEE2E2` | `#F87171` |
| Info (Blue) | `#3B82F6` | `#DBEAFE` | `#60A5FA` |

### Gray Scale

```
Gray 50   #F9FAFB  — Page backgrounds
Gray 100  #F3F4F6  — Secondary backgrounds
Gray 200  #E5E7EB  — Input borders, dividers
Gray 300  #D1D5DB  — Disabled states
Gray 400  #9CA3AF  — Placeholder text
Gray 500  #6B7280  — Secondary text
Gray 600  #4B5563  — Body text
Gray 700  #374151  — Headings
Gray 800  #1F2937  — Strong text
Gray 900  #111827  — Very strong text
```

### Tailwind Config

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FEF2F2', 100: '#FEE2E2', 200: '#FECACA',
          300: '#F9848C', 400: '#F87171', 500: '#EF3340',
          600: '#D42834', 700: '#B91C1C', 800: '#991B1B', 900: '#7F1D1D',
        },
        success: { 50: '#F0FDF4', 100: '#D1FAE5', 500: '#10B981', 700: '#047857' },
        warning: { 50: '#FFFBEB', 100: '#FEF3C7', 500: '#F59E0B', 700: '#B45309' },
        error:   { 50: '#FEF2F2', 100: '#FEE2E2', 500: '#EF4444', 700: '#DC2626' },
        info:    { 50: '#EFF6FF', 100: '#DBEAFE', 500: '#3B82F6', 700: '#1D4ED8' },
      },
    },
  },
}
```

### Accessibility (Contrast Ratios)

| Combination | Ratio | WCAG |
|-------------|-------|------|
| Primary Red on White | 3.5:1 | AA Large |
| White on Primary Red | 3.5:1 | AA Large |
| Gray 800 on White | 14.5:1 | AAA |
| Gray 600 on White | 7.2:1 | AA |

---

## Typography

| Property | Value |
|----------|-------|
| Font (EN) | Inter |
| Font (TH) | Noto Sans Thai |
| Base size | 14px (text-sm) |
| Line height | 1.5 |

### Scale

```
text-xs:   12px / 16px
text-sm:   14px / 20px
text-base: 16px / 24px
text-lg:   18px / 28px
text-xl:   20px / 28px
text-2xl:  24px / 32px
text-3xl:  30px / 36px
text-4xl:  36px / 40px
```

### Weights

- 400 Normal — body text
- 500 Medium — labels, buttons
- 600 Semibold — subheadings
- 700 Bold — headings, emphasis

---

## Spacing & Layout

### Spacing Scale (Tailwind)

4px → 8px → 12px → 16px → 24px → 32px

### Border Radius

| Element | Radius |
|---------|--------|
| Buttons, Inputs | 6px (`rounded-md`) |
| Cards, Modals | 8px (`rounded-lg`) |

### Shadows

| Level | Value |
|-------|-------|
| Subtle | `0 1px 3px rgba(0,0,0,0.1)` |
| Medium | `0 4px 6px rgba(0,0,0,0.1)` |
| Large | `0 10px 15px rgba(0,0,0,0.1)` |

---

## UI Element Patterns

### Buttons

```html
<!-- Primary -->
<button class="bg-primary-500 text-white hover:bg-primary-600">บันทึก</button>
<!-- Secondary -->
<button class="bg-gray-200 text-gray-800 hover:bg-gray-300">ยกเลิก</button>
<!-- Danger -->
<button class="bg-red-500 text-white hover:bg-red-600">ลบ</button>
```

### Feedback Messages

```html
<div class="bg-success-50 border border-success-200 text-success-700">บันทึกสำเร็จ</div>
<div class="bg-warning-50 border border-warning-200 text-warning-700">รอความเห็นชอบ</div>
<div class="bg-error-50 border border-error-200 text-error-700">เกิดข้อผิดพลาด</div>
<div class="bg-info-50 border border-info-200 text-info-700">ข้อมูลเพิ่มเติม</div>
```

---

## Sidebar Navigation

- **Width**: 256px desktop, hidden on mobile (toggle ☰)
- **Groups**: Accordion-style, multiple can be open, emoji icons
- **Active page**: Red background (#EF3340) + white text
- **Inactive hover**: Light red (#FFF0F0)
- **Mobile**: Full-width overlay, auto-close on page select
- **Animations**: 200ms ease-in-out (expand), 150ms ease-out (highlight)

### Responsive Breakpoints

| Breakpoint | Sidebar | Behavior |
|------------|---------|----------|
| Desktop (1920px) | Always visible, fixed 256px | Multiple groups expandable |
| Tablet (768px) | Toggleable hamburger | Same interactions |
| Mobile (375px) | Hidden, full-width overlay | Auto-close on select |

---

## Icons

- **Library**: `@heroicons/vue/24/outline`
- **Sidebar groups**: Emoji icons (📊💰📈📦👥⚙️)
- **Action buttons**: Heroicons only (never emoji)
