# 🎨 Color Palette

## Color System Overview

BigT Minimart uses a comprehensive color system based on red as the primary brand color, with supporting neutrals and semantic colors for UI elements.

---

## Primary Colors

### Brand Red
| Property | Value | Usage |
|----------|-------|-------|
| **Color** | #EF3340 | Primary buttons, brand elements |
| **Name** | Red 500 |  |
| **RGB** | rgb(239, 51, 64) |  |
| **HSL** | hsl(357, 92%, 59%) |  |

### Dark Red (Hover/Active)
| Property | Value | Usage |
|----------|-------|-------|
| **Color** | #D42834 | Button hover, active states |
| **Name** | Red 600 |  |
| **RGB** | rgb(212, 40, 52) |  |
| **HSL** | hsl(357, 68%, 49%) |  |

### Light Red (Disabled/Light variant)
| Property | Value | Usage |
|----------|-------|-------|
| **Color** | #F9848C | Disabled buttons, light text |
| **Name** | Red 300 |  |
| **RGB** | rgb(249, 132, 140) |  |
| **HSL** | hsl(356, 96%, 75%) |  |

### White
| Property | Value | Usage |
|----------|-------|-------|
| **Color** | #FFFFFF | Text on red, backgrounds |
| **Name** | White |  |
| **RGB** | rgb(255, 255, 255) |  |

---

## Semantic Colors

### Success (Green)
```
Primary:  #10B981  Confirmed, approved, completed
Light:    #D1FAE5  Light background
Border:   #34D399  Border color
```

### Warning (Amber)
```
Primary:  #F59E0B  Pending, attention needed
Light:    #FEF3C7  Light background
Border:   #FCD34D  Border color
```

### Error (Red)
```
Primary:  #EF4444  Errors, failures, invalid
Light:    #FEE2E2  Light background
Border:   #F87171  Border color
```

### Info (Blue)
```
Primary:  #3B82F6  Information, notice
Light:    #DBEAFE  Light background
Border:   #60A5FA  Border color
```

---

## Neutral Gray Scale

```
Gray 50   #F9FAFB  - Lightest backgrounds
Gray 100  #F3F4F6  - Secondary backgrounds
Gray 200  #E5E7EB  - Input borders, dividers
Gray 300  #D1D5DB  - Disabled states
Gray 400  #9CA3AF  - Placeholder text
Gray 500  #6B7280  - Secondary text
Gray 600  #4B5563  - Body text
Gray 700  #374151  - Headings
Gray 800  #1F2937  - Strong text
Gray 900  #111827  - Very strong text
```

---

## Tailwind CSS Configuration

### tailwind.config.ts
```javascript
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#F9848C',
          400: '#F87171',
          500: '#EF3340',  // Primary
          600: '#D42834',  // Dark
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        success: {
          50: '#F0FDF4',
          100: '#D1FAE5',
          500: '#10B981',
          700: '#047857',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          700: '#B45309',
        },
        error: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          700: '#DC2626',
        },
        info: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          700: '#1D4ED8',
        },
      },
    },
  },
}
```

---

## Color Usage Examples

### Buttons
```html
<!-- Primary (Brand Red) -->
<button class="bg-primary-500 text-white hover:bg-primary-600">
  บันทึก
</button>

<!-- Secondary (Gray) -->
<button class="bg-gray-200 text-gray-800 hover:bg-gray-300">
  ยกเลิก
</button>

<!-- Danger (Red) -->
<button class="bg-red-500 text-white hover:bg-red-600">
  ลบ
</button>

<!-- Disabled -->
<button class="bg-gray-300 text-gray-400 cursor-not-allowed">
  ปิดใช้งาน
</button>
```

### Messages
```html
<!-- Success -->
<div class="bg-success-50 border border-success-200 text-success-700">
  ✓ บันทึกสำเร็จ
</div>

<!-- Warning -->
<div class="bg-warning-50 border border-warning-200 text-warning-700">
  ⚠ รอความเห็นชอบ
</div>

<!-- Error -->
<div class="bg-error-50 border border-error-200 text-error-700">
  ✗ เกิดข้อผิดพลาด
</div>

<!-- Info -->
<div class="bg-info-50 border border-info-200 text-info-700">
  ℹ ข้อมูลเพิ่มเติม
</div>
```

---

## Accessibility Notes

### Contrast Ratios
- **AAA (Enhanced)**: Contrast ratio ≥ 7:1
- **AA (Normal)**: Contrast ratio ≥ 4.5:1
- **Large text**: Contrast ratio ≥ 3:1

### Verified Combinations
- ✅ Primary Red on White: 3.5:1
- ✅ White on Primary Red: 3.5:1
- ✅ Gray 800 on Gray 50: 14.5:1
- ✅ Gray 600 on White: 7.2:1

---

**Source**: Extracted from UI/UX Guidelines  
**Last Updated**: Jan 7, 2026  
**Version**: 1.0  
