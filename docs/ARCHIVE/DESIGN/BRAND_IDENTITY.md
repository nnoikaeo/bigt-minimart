# 🎨 Brand Identity

## Brand Name
**BigT Minimart** (changed from BigThee)

---

## Logo

### Visual Description
- **Design**: Circular logo with white text on red background
- **Text**: "บิ๊กธี" (BigT in Thai)
- **Style**: Modern, clean, easy to read
- **Colors**: White text on primary red (#EF3340)
- **Appearance**: Professional yet approachable

### Usage Guidelines
- **Minimum Size**: 32x32 pixels
- **Clear Space**: Minimum 10px padding around logo
- **Backgrounds**: White, gray (light), or red (primary)
- **Avoid**: Small sizes (<32px), complex backgrounds

---

## Primary Colors

```css
/* Main Brand Red */
--color-primary: #EF3340;       /* Red 500 - Primary brand color */
--color-primary-dark: #D42834;  /* Red 600 - Hover/pressed state */
--color-primary-light: #F9848C; /* Red 300 - Light variant/disabled */

/* Neutral White */
--color-white: #FFFFFF;         /* Pure white */
```

---

## Secondary Colors

```css
/* Semantic Colors */
--color-success: #10B981;       /* Green - Success/approved */
--color-warning: #F59E0B;       /* Amber - Warning/pending */
--color-error: #EF4444;         /* Red - Error/failed */
--color-info: #3B82F6;          /* Blue - Info/notice */
```

---

## Gray Scale

```css
--color-gray-50: #F9FAFB;       /* Lightest - Backgrounds */
--color-gray-100: #F3F4F6;      /* Light - Secondary backgrounds */
--color-gray-200: #E5E7EB;      /* Light border - Input borders */
--color-gray-300: #D1D5DB;      /* Medium - Disabled states */
--color-gray-400: #9CA3AF;      /* Medium - Placeholder text */
--color-gray-500: #6B7280;      /* Medium - Secondary text */
--color-gray-600: #4B5563;      /* Dark - Primary body text */
--color-gray-700: #374151;      /* Dark - Headings */
--color-gray-800: #1F2937;      /* Very dark - Main text */
--color-gray-900: #111827;      /* Darkest - Strong emphasis */
```

---

## Color Applications

### UI Elements

| Element | Color | Usage |
|---------|-------|-------|
| Primary buttons | Primary Red | Main actions, submit |
| Secondary buttons | Gray 200 | Alternative actions |
| Dangerous actions | Error Red | Delete, dangerous |
| Disabled buttons | Gray 300 | Inactive elements |
| Success messages | Success Green | Approved, completed |
| Warning messages | Warning Amber | Pending, attention needed |
| Error messages | Error Red | Failed, invalid |
| Info messages | Info Blue | Information, notice |
| Text primary | Gray 800 | Main body text |
| Text secondary | Gray 600 | Secondary information |
| Text placeholder | Gray 400 | Input placeholders |
| Backgrounds | Gray 50 | Page backgrounds |
| Card backgrounds | White | Card/component backgrounds |
| Borders | Gray 200 | Input borders, dividers |

---

## Typography

### Fonts
- **Primary (English)**: Inter
- **Secondary (Thai)**: Noto Sans Thai
- **Fallback**: sans-serif

### Font Sizes

```
text-xs:   12px / 16px line-height (0.75rem / 1rem)
text-sm:   14px / 20px line-height (0.875rem / 1.25rem)
text-base: 16px / 24px line-height (1rem / 1.5rem)
text-lg:   18px / 28px line-height (1.125rem / 1.75rem)
text-xl:   20px / 28px line-height (1.25rem / 1.75rem)
text-2xl:  24px / 32px line-height (1.5rem / 2rem)
text-3xl:  30px / 36px line-height (1.875rem / 2.25rem)
text-4xl:  36px / 40px line-height (2.25rem / 2.5rem)
```

### Font Weights
- **Normal**: 400 (body text)
- **Medium**: 500 (labels, buttons)
- **Semibold**: 600 (subheadings)
- **Bold**: 700 (headings, emphasis)

---

## Logo Assets

### File Formats Available
- SVG (vector, recommended)
- PNG (raster, transparency)
- JPEG (raster, no transparency)

### Sizing
- **Logo**: 200x200 pixels (minimum)
- **Favicon**: 32x32 pixels
- **App icon**: 192x192 pixels, 512x512 pixels

---

## Color Combinations

### Accessible Combinations
- Red #EF3340 on White: Contrast ratio 3.5:1 (WCAG AA) ✅
- Red #EF3340 on Gray 50: Contrast ratio 3.2:1 ❌ (use caution)
- White on Red #EF3340: Contrast ratio 3.5:1 ✅
- Gray 800 on White: Contrast ratio 14.5:1 ✅✅✅
- Gray 600 on White: Contrast ratio 7.2:1 ✅✅

---

**Source**: Extracted from UI/UX Guidelines  
**Last Updated**: Jan 7, 2026  
**Version**: 1.0  
