# 🎨 UI/UX Guidelines

**Last Updated**: Jan 15, 2026  
**Version**: 1.0  
**Status**: Design Complete

---

## 🗂️ Sidebar Navigation

### Structure

- **Width**: 256px (Desktop/Tablet), Hidden on Mobile (toggle with ☰)
- **Layout**: Vertical stack of groups + subpages
- **Interaction**: Accordion-style expand/collapse
- **Behavior**: Multiple groups can be open simultaneously
- **Mobile**: Auto-closes after page selection

### Groups

Each group contains:
1. Emoji icon (e.g., 💰, 📈, 👥)
2. Group name (Thai language)
3. Arrow indicator (▼/▶)
4. Sub-pages (optional, expandable)

### Icons by Group

```
📊 = หน้าหลัก (Dashboard/Overview)
💰 = การขาย (Sales)
📈 = บัญชี (Accounting)
📦 = สต๊อกสินค้า (Inventory)
👥 = บุคคล (Human Resources)
⚙️ = ตั้งค่า (Settings)
```

### Color Scheme

**Group Label**:
- Background: `#F5F5F5` (Light gray)
- Text: `#333333` (Dark gray)
- Padding: 12px 16px
- Font: 14px, 600 weight (semibold)
- Hover: `#EEEEEE` (Slightly darker gray)

**Active Page**:
- Background: `#EF3340` (BigT Red)
- Text: `#FFFFFF` (White)
- Padding: 8px 16px 8px 32px (left-indented for hierarchy)
- Font: 14px, 500 weight (medium)
- Border-left: 3px solid `#EF3340` (optional)

**Inactive Page**:
- Background: transparent
- Text: `#666666` (Medium gray)
- Padding: 8px 16px 8px 32px
- Font: 14px, 400 weight (regular)
- Hover: Background `#FFF0F0` (Very light red)

**Arrow Indicator**:
- ▼ = Group expanded (pointing down)
- ▶ = Group collapsed (pointing right)
- Font size: 14px
- Position: Right side of group label
- Color: `#999999` (Medium gray)

### Visual Hierarchy

```
Group Label (14px, 600, gray background)
├─ 🟡 Icon (16px)
├─ 📝 Text (14px)
└─ ▼ Arrow (14px, right-aligned)

  Page Item (14px, 400, indented)
  ├─ Icon (optional)
  ├─ Text (14px)
  └─ Status Indicator (optional)

  Active Page Item (14px, 500, RED bg)
  ├─ Icon (optional)
  ├─ Text (14px, white)
  └─ ✓ Checkmark (optional)
```

### Responsive Behavior

**Desktop (1920px)**:
- Sidebar: Always visible, 256px fixed width
- Layout: Content area adjusts (margin-left: 256px)
- Interaction: Multiple groups expandable
- State: User preference saved to localStorage
- Scroll: Sidebar scrollable if groups exceed viewport height

**Tablet (768px)**:
- Sidebar: Toggleable with hamburger menu (☰)
- Width: 256px (same as desktop)
- Overlay: Optional overlay (dark background behind sidebar)
- Interaction: Same as desktop (multiple groups expandable)
- Auto-close: Optional (on page select)

**Mobile (375px)**:
- Sidebar: Hidden by default
- Toggle: Hamburger menu (☰) in header
- Width: Full width (100%) or slight margin
- Overlay: Dark overlay behind sidebar (semi-transparent)
- Auto-close: **YES** - Closes immediately after page selection
- Z-index: High (z-10+) to appear above content

### Interaction States

**Expand/Collapse Group**:
```
Before: 💰 [การขาย] ▶ (collapsed)
        [No pages visible]

Click: [Group label]
Animation: 200ms ease-in-out

After: 💰 [การขาย] ▼ (expanded)
       -[Daily Sales]
       -[Close Shift]
       -[Sales Report]
```

**Select Page**:
```
Before: [Sales] ▼
        -[Daily Sales] (gray text)
        -[Close Shift] (gray text)

Click: [Daily Sales]
Animation: 150ms ease-out

After: [Sales] ▼
       -[Daily Sales] ✓ (RED BG + white text)
       -[Close Shift] (gray text)
       
Page Route Updates: /auditor/daily-sales
```

**Mobile Page Selection**:
```
Before: ☰ [Sidebar visible, expanded]
        [Content area narrowed/covered]

Click: [Daily Sales]
Animation: 200ms ease-out (sidebar slide out)

After: ☰ [Sidebar closed]
       Content fullscreen visible
       Route: /auditor/daily-sales
```

### Animation (Optional but Recommended)

```css
/* Expand/Collapse Animation */
transition: all 200ms ease-in-out;

/* Page Highlight Animation */
transition: background-color 150ms ease-out, color 150ms ease-out;

/* Hover Effect Animation */
transition: background-color 100ms ease-in;

/* Sidebar Slide Animation (Mobile) */
transition: transform 200ms ease-out;
```

### Accessibility

- ✅ **Keyboard Navigation**: Arrow keys, Enter to expand/select
- ✅ **Focus States**: Visible outline (2px focus ring)
- ✅ **ARIA Labels**: `role="navigation"`, `aria-expanded` for groups
- ✅ **Color Contrast**: All text meets WCAG AA standard
- ✅ **Screen Readers**: Group/page names announced clearly
- ✅ **Active Indicator**: Not just color (#EF3340) but also text/icon

### Typography

| Element | Font Size | Weight | Letter Spacing |
|---------|-----------|--------|-----------------|
| Group Label | 14px | 600 (semibold) | normal |
| Page Item | 14px | 400 (regular) | normal |
| Active Page | 14px | 500 (medium) | normal |
| Arrow/Icon | 14px | - | normal |

### Spacing

| Element | Padding | Margin |
|---------|---------|--------|
| Group Label | 12px 16px | 0 |
| Inactive Page | 8px 16px 8px 32px | 2px 0 |
| Active Page | 8px 16px 8px 32px | 2px 0 |
| Group Section | - | 8px 0 |

---

## 🎯 Task 3.1: Daily Sales Page

### Page Layout

**Header Section**:
- Page title: "บันทึกยอดขายรายวัน"
- Button: "+ บันทึกใหม่" (Create new entry)
- Filter bar (optional): Filter by วันที่, Status, Cashier

**Main Content**:
- Table: Display all Daily Sales records
- Pagination: 10 items per page
- Column headers: วันที่, Cashier, ยอดขาย, ผลต่าง, Status, Actions

**Actions Column**:
- View icon (👁️)
- Edit icon (✏️)
- Delete icon (🗑️)

### Modal Form

**Title**: "บันทึกยอดขายใหม่"

**Input Sections**:
1. Basic Info
   - วันที่ (Date picker, required)
   - Cashier (Select dropdown, required)

2. Sales Data
   - เงินสด (Cash) - input, number, required
   - QR Code - input, number, required
   - ธนาคาร (Bank) - input, number, required
   - โครงการรัฐ (Government) - input, number, required

3. Reconciliation
   - ผลต่างเงินสด (Cash Difference) - auto-calculated, display only
   - หมายเหตุ (Notes) - textarea, optional

4. Summary (Display Only)
   - รวมยอด = Cash + QR + Bank + Government
   - ผลต่าง = Actual - Expected

### Color Scheme (Task 3.1)

- Form Background: White (`#FFFFFF`)
- Input Fields: Light gray border (`#CCCCCC`)
- Active Input: Blue border (`#2563EB`)
- Button (Save): BigT Red (`#EF3340`)
- Button (Cancel): Gray (`#CCCCCC`)
- Error Message: Red (`#DC2626`)
- Success Message: Green (`#10B981`)

---

## 🎨 Overall Design System

### Primary Colors

| Color | Hex | Usage |
|-------|-----|-------|
| BigT Red | `#EF3340` | Active states, Primary buttons, Highlights |
| Light Red | `#FFF0F0` | Hover states (inactive pages) |
| Light Gray | `#F5F5F5` | Group backgrounds |
| Dark Gray | `#333333` | Primary text |
| Medium Gray | `#666666` | Secondary text |

### Typography (Global)

- **Font Family**: System font (Segoe UI, -apple-system, BlinkMacSystemFont)
- **Base Size**: 14px
- **Line Height**: 1.5
- **Primary Weight**: 400 (regular)
- **Accent Weight**: 600 (semibold)

### Spacing Scale (Tailwind)

- 4px = 0.25rem
- 8px = 0.5rem
- 12px = 0.75rem
- 16px = 1rem
- 24px = 1.5rem
- 32px = 2rem

### Border Radius

- Buttons: 6px
- Modals: 8px
- Inputs: 6px
- Cards: 8px

### Shadows

- Subtle: `0 1px 3px rgba(0,0,0,0.1)`
- Medium: `0 4px 6px rgba(0,0,0,0.1)`
- Large: `0 10px 15px rgba(0,0,0,0.1)`

---

**Design Version**: 1.0  
**Last Updated**: Jan 15, 2026  
**Status**: ✅ Complete & Ready for Implementation
