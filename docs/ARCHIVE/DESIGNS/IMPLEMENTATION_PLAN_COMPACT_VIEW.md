# 📋 Implementation Plan: Compact History Detail View

> แผนงาน implement ตาม Wireframe ใน `WIREFRAMES_COMPACT_HISTORY_DETAIL.md`
> แบ่งเป็น 6 งานย่อย — แต่ละงานทำจบได้ใน 1 Chat Session

---

## สถานะรวม

| # | งาน | สถานะ | Dependencies |
|---|-----|-------|-------------|
| 1 | สร้าง CollapsibleSection + WorkflowProgressBar | ⬜ ยังไม่เริ่ม | — |
| 2 | สร้าง QuickGlanceSummary + CompactBalanceSummary | ⬜ ยังไม่เริ่ม | — |
| 3 | ใส่ Progress Bar + Quick Glance + Compact Balance ลงหน้าหลัก | ⬜ ยังไม่เริ่ม | งาน 1, 2 |
| 4 | ครอบ Transaction + Cash Verification ด้วย CollapsibleSection | ⬜ ยังไม่เริ่ม | งาน 1, 3 |
| 5 | สลับ Owner Approval ขึ้นบน + Status Banner + Expand/Collapse logic | ⬜ ยังไม่เริ่ม | งาน 4 |
| 6 | Mobile Responsive + Polish + ทดสอบ | ⬜ ยังไม่เริ่ม | งาน 5 |

---

## Branch Strategy

```
develop
  └─ feature/compact-view
       ├─ task-1/collapsible-progress-bar     (งาน 1)
       ├─ task-2/summary-balance-components   (งาน 2)
       ├─ task-3/integrate-header-area        (งาน 3)
       ├─ task-4/collapsible-sections         (งาน 4)
       ├─ task-5/reorder-status-banner        (งาน 5)
       └─ task-6/mobile-polish               (งาน 6)
```

เมื่อทำงานย่อยเสร็จ → merge เข้า `feature/compact-view`
เมื่อทุกงานเสร็จ → merge `feature/compact-view` เข้า `develop`

---

# ═══════════════════════════════════════════════════════════════
# งาน 1: สร้าง CollapsibleSection + WorkflowProgressBar
# ═══════════════════════════════════════════════════════════════

## เป้าหมาย
สร้าง 2 components พื้นฐานที่จะใช้ซ้ำทั่วทั้งหน้า Compact View

## ไฟล์ที่สร้าง
1. `components/ui/display/CollapsibleSection.vue`
2. `components/money-transfer/WorkflowProgressBar.vue`

## รายละเอียด

### 1.1 CollapsibleSection.vue

**ที่อยู่:** `components/ui/display/CollapsibleSection.vue`

**Props:**
```ts
interface Props {
  icon?: string              // emoji icon เช่น '📋'
  title: string              // ชื่อ section
  badge?: {                  // status badge (optional)
    label: string
    variant: 'success' | 'warning' | 'error' | 'info'
  } | null
  summary?: string           // 1-line summary แสดงเมื่อ collapsed
  defaultExpanded?: boolean  // default: false
}
```

**Emits:** `update:expanded`

**Behavior:**
- คลิก header → toggle expand/collapse
- Collapsed: แสดง icon + title + badge + summary ใน 1 แถว
- Expanded: แสดง icon + title + badge + slot content
- Transition: slide-down 200ms
- Chevron icon: ▶ (collapsed) / ▼ (expanded)

**Styling:**
- Container: `bg-white border border-gray-200 rounded-xl overflow-hidden`
- Header: `px-4 py-3 cursor-pointer hover:bg-gray-50`
- Body: `border-t border-gray-100`

**ตัวอย่างใช้งาน:**
```vue
<CollapsibleSection
  icon="📋"
  title="ธุรกรรมวันนี้"
  :badge="{ label: '✅ สำเร็จ', variant: 'success' }"
  summary="2 รายการ · สำเร็จ 2 · ค่าบริการ 30 ฿"
>
  <!-- transaction table content -->
</CollapsibleSection>
```

### 1.2 WorkflowProgressBar.vue

**ที่อยู่:** `components/money-transfer/WorkflowProgressBar.vue`

**Props:**
```ts
interface Props {
  status: 'step1_in_progress' | 'step1_completed' | 'step2_completed' 
        | 'audited' | 'approved' | 'needs_correction'
}
```

**4 Steps:**
1. บันทึก (step1)
2. ตรวจนับ (step2)
3. Auditor
4. Owner

**Mapping status → step states:**
```ts
const stepStates = computed(() => {
  const s = props.status
  return {
    step1: s === 'step1_in_progress' ? 'active' 
         : s === 'needs_correction' ? 'error' 
         : 'completed',
    step2: s === 'step1_in_progress' || s === 'needs_correction' ? 'pending'
         : s === 'step1_completed' ? 'active'
         : 'completed',
    auditor: ['step1_in_progress','step1_completed','needs_correction'].includes(s) ? 'pending'
           : s === 'step2_completed' ? 'active' 
           : 'completed',
    owner: s === 'approved' ? 'completed' 
         : s === 'audited' ? 'active' 
         : 'pending',
  }
})
```

**Styling:**
- Container: `flex items-center justify-between px-4 py-2`
- Dot: `w-3 h-3 rounded-full` + สีตาม state
- Line: `flex-1 h-0.5 mx-1` + สีตาม state
- Label: `text-xs text-gray-500 mt-1`
- Active dot: `bg-amber-500 animate-pulse ring-4 ring-amber-100`
- Completed dot: `bg-green-500`
- Pending dot: `bg-gray-300`
- Error dot: `bg-red-500`

## Prompt สำหรับ Chat Session

```
อ่าน docs/DESIGNS/WIREFRAMES_COMPACT_HISTORY_DETAIL.md ส่วน 2.4 (CollapsibleSection) 
และ 2.1 (WorkflowProgressBar)

สร้าง 2 components:
1. components/ui/display/CollapsibleSection.vue — ตาม spec ใน wireframe
2. components/money-transfer/WorkflowProgressBar.vue — ตาม spec ใน wireframe

ดู components ที่มีอยู่แล้วเป็นตัวอย่าง style:
- components/ui/display/BaseBadge.vue
- components/ui/display/BaseCard.vue
- components/CollapsibleGroup.vue (อาจมี pattern คล้ายกัน)

ทดสอบ: ไม่มี TypeScript errors, ใช้ Tailwind classes, 
รองรับ slot content, transition animation
```

## Definition of Done
- [ ] CollapsibleSection.vue สร้างเสร็จ ใช้งานได้
- [ ] WorkflowProgressBar.vue สร้างเสร็จ แสดงผลถูกต้องทุก status
- [ ] ไม่มี TypeScript errors
- [ ] Commit ลง branch `task-1/collapsible-progress-bar`

---

# ═══════════════════════════════════════════════════════════════
# งาน 2: สร้าง QuickGlanceSummary + CompactBalanceSummary
# ═══════════════════════════════════════════════════════════════

## เป้าหมาย
สร้าง 2 components สำหรับ summary area ด้านบนของหน้า

## ไฟล์ที่สร้าง
1. `components/money-transfer/QuickGlanceSummary.vue`
2. `components/money-transfer/CompactBalanceSummary.vue`

## รายละเอียด

### 2.1 QuickGlanceSummary.vue

**Props:**
```ts
interface Props {
  date: string               // '2026-03-04'
  totalTransactions: number  // จำนวนรายการ
  successCount: number       // จำนวนสำเร็จ
  totalCommission: number    // ค่าบริการรวม
  workflowStatus: string     // workflow status
}
```

**แสดงผล:**
- 1 แถว: `📅 04/03/2569 · 2 รายการ · สำเร็จ 2 · ค่าบริการ 30 ฿`
- แถว 2: `สถานะ: [badge]` ใช้สีเดียวกับ `getStatusBadge()` ที่มีอยู่แล้ว

**Styling:**
- Container: `bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4`
- Text: `text-sm text-gray-600`
- Badge: reuse `BaseBadge` component

**Dependencies:**
- ใช้ `useMoneyTransferHelpers` → `formatCurrency`
- ใช้ helper จาก `money-transfer-history.vue` → `getStatusBadge()` — ย้ายเป็น shared function

### 2.2 CompactBalanceSummary.vue

**Props:**
```ts
interface Props {
  openingBalance: number
  totalDeposit: number
  totalTransfer: number
  totalWithdrawal: number
  serviceFeeCash: number
  serviceFeeTransfer: number
  bankAccountBalance: number
  cashBalance: number
  openingSource?: string    // 'จากเมื่อวาน' etc.
}
```

**Behavior:**
- **Collapsed (default):** แสดง 4 cards ใน 1 แถว
  - เริ่มต้น, รวมโอน, บัญชีคงเหลือ, เงินสดคงเหลือ
  - ปุ่ม `[▼ ดูเพิ่ม]` มุมขวาบน
- **Expanded:** แสดง 8 cards ใน 2 แถว (เหมือนเดิมทุกประการ)
  - แถว 1: เริ่มต้น, รวมโอน, บัญชีคงเหลือ, เงินสดคงเหลือ
  - แถว 2: รวมฝาก, รวมถอน, ค่าบริการ(เงินสด), ค่าบริการ(เงินโอน)
  - ปุ่ม `[▲ ย่อ]`

**Styling ต่อ Card:**
- ใช้สีเดียวกับ Balance Cards เดิม (line 948-1020 ของ index.vue)
- Container: `bg-white border border-gray-200 rounded-xl p-4`
- Card: `text-center p-3 rounded-lg` + background สีอ่อน
- ค่า: `text-lg font-bold`
- Label: `text-xs text-gray-500`

**Reference:** ดู template ที่ line 948-1020 ของ `index.vue` สำหรับ styling เดิม

## Prompt สำหรับ Chat Session

```
อ่าน docs/DESIGNS/WIREFRAMES_COMPACT_HISTORY_DETAIL.md ส่วน 2.2 (QuickGlanceSummary) 
และ 2.3 (CompactBalanceSummary)

สร้าง 2 components:
1. components/money-transfer/QuickGlanceSummary.vue
2. components/money-transfer/CompactBalanceSummary.vue

ดูตัวอย่าง style ของ Balance Cards เดิมที่ 
pages/finance/money-transfer-service/index.vue line 948-1020

ใช้ formatCurrency จาก composables/useMoneyTransferHelpers.ts
ใช้ BaseBadge จาก components/ui/display/BaseBadge.vue

ทดสอบ: ไม่มี TypeScript errors, toggle expand/collapse ทำงาน,
แสดงผลถูกต้องทั้ง 4-card และ 8-card mode
```

## Definition of Done
- [ ] QuickGlanceSummary.vue สร้างเสร็จ
- [ ] CompactBalanceSummary.vue สร้างเสร็จ + toggle ทำงาน
- [ ] ไม่มี TypeScript errors
- [ ] Commit ลง branch `task-2/summary-balance-components`

---

# ═══════════════════════════════════════════════════════════════
# งาน 3: ใส่ Progress Bar + Quick Glance + Compact Balance ลงหน้าหลัก
# ═══════════════════════════════════════════════════════════════

## เป้าหมาย
แทนที่ header area ของหน้า money-transfer-service ด้วย compact components ใหม่

## ไฟล์ที่แก้ไข
- `pages/finance/money-transfer-service/index.vue`

## รายละเอียด

### 3.1 เพิ่ม WorkflowProgressBar

**ตำแหน่ง:** หลัง alerts (success/error) ก่อน Opening Balance section
**ประมาณ line:** 933 (ก่อน `<section v-if="isManagerOrAsst && !isOpeningSet">`)

```vue
<!-- Workflow Progress Bar -->
<WorkflowProgressBar :status="workflowStatus" class="mb-4" />
```

**เงื่อนไข:** แสดงเสมอทุก role — ยกเว้นเมื่อ `step1_in_progress` สำหรับ Manager 
(ไม่ต้องแสดง Progress Bar เพราะ layout เดิมเหมาะสม)

```vue
<WorkflowProgressBar 
  v-if="!(isManagerOrAsst && isStep1InProgress)"
  :status="workflowStatus" 
  class="mb-4" 
/>
```

### 3.2 เพิ่ม QuickGlanceSummary

**ตำแหน่ง:** หลัง Progress Bar, ก่อน Balance section

```vue
<QuickGlanceSummary
  v-if="!(isManagerOrAsst && isStep1InProgress)"
  :date="selectedDate"
  :total-transactions="todayStats.total"
  :success-count="todayStats.completed"
  :total-commission="totalCommission"
  :workflow-status="workflowStatus"
/>
```

### 3.3 แทน Balance Cards ด้วย CompactBalanceSummary

**สถานการณ์ที่ต้องจัดการ:**
1. **Manager + step1_in_progress:** แสดง Balance Cards 8 ช่องเดิม (ไม่เปลี่ยน)
2. **ทุกกรณีอื่น:** แสดง CompactBalanceSummary (4 cards + toggle)

**แก้ไข section ที่ line ~948:**

```vue
<!-- Balance Cards — full 8 cards (Manager step1 active) -->
<section v-if="isManagerOrAsst && isStep1InProgress" class="mb-6">
  <!-- ... 8 cards เดิมคงไว้ทั้งหมด ... -->
</section>

<!-- Balance Cards — compact 4 cards + expandable (ทุกกรณีอื่น) -->
<CompactBalanceSummary
  v-else
  :opening-balance="openingBalance"
  :total-deposit="totalDeposit"
  :total-transfer="totalTransferAmount"
  :total-withdrawal="totalWithdrawalAmount"
  :service-fee-cash="totalServiceFeeCash"
  :service-fee-transfer="totalServiceFeeTransfer"
  :bank-account-balance="closingBalance"
  :cash-balance="cashBalance"
  :opening-source="openingSourceLabel"
  class="mb-6"
/>
```

### 3.4 Script changes

**Imports เพิ่ม:**
```ts
import WorkflowProgressBar from '~/components/money-transfer/WorkflowProgressBar.vue'
import QuickGlanceSummary from '~/components/money-transfer/QuickGlanceSummary.vue'
import CompactBalanceSummary from '~/components/money-transfer/CompactBalanceSummary.vue'
```

**Computed เพิ่ม (ถ้ายังไม่มี):**
- ตรวจสอบว่า `totalCommission`, `todayStats`, `openingBalance` etc. มีอยู่แล้วหรือไม่
- ตรวจสอบ computed ที่ Balance Cards เดิมใช้ → ส่งเป็น props ให้ CompactBalanceSummary

## Prompt สำหรับ Chat Session

```
อ่าน docs/DESIGNS/IMPLEMENTATION_PLAN_COMPACT_VIEW.md ส่วน "งาน 3"
อ่าน docs/DESIGNS/WIREFRAMES_COMPACT_HISTORY_DETAIL.md ส่วน 2.1-2.3

แก้ไข pages/finance/money-transfer-service/index.vue:

1. import WorkflowProgressBar, QuickGlanceSummary, CompactBalanceSummary
2. เพิ่ม WorkflowProgressBar หลัง alerts (ก่อน Opening Balance section ~line 933)
   - แสดงเมื่อ: ไม่ใช่ Manager step1_in_progress
3. เพิ่ม QuickGlanceSummary หลัง Progress Bar
   - แสดงเมื่อ: เหมือน Progress Bar
4. แทน Balance Cards section (~line 948-1020):
   - Manager step1_in_progress → คง 8 cards เดิม
   - ทุกกรณีอื่น → ใช้ CompactBalanceSummary
5. ตรวจสอบว่า computed values ที่เป็น props ของ components ใหม่มีครบ

ทดสอบ: ไม่มี TypeScript errors, layout ถูกต้อง,
Manager step1 เห็นเดิม, Manager step2+ เห็น compact
```

## Definition of Done
- [ ] WorkflowProgressBar แสดงถูกที่
- [ ] QuickGlanceSummary แสดงถูกที่
- [ ] CompactBalanceSummary แทน 8-card สำหรับ non-step1
- [ ] Manager step1 ยังแสดง layout เดิม 100%
- [ ] ไม่มี TypeScript errors
- [ ] Commit ลง branch `task-3/integrate-header-area`

---

# ═══════════════════════════════════════════════════════════════
# งาน 4: ครอบ Transaction + Cash Verification + Audit ด้วย CollapsibleSection
# ═══════════════════════════════════════════════════════════════

## เป้าหมาย
ครอบ sections ที่เป็น read-only ด้วย CollapsibleSection + สร้าง summary text

## ไฟล์ที่แก้ไข
- `pages/finance/money-transfer-service/index.vue`

## รายละเอียด

### 4.1 Transaction Table → CollapsibleSection

**เงื่อนไขแสดง:** ใช้เงื่อนไขเดิม
```
v-if="!(isAuditor && store.isStep2Complete) && !(isOwner && store.isAudited)"
```

**Collapsed / Expanded logic:**
- **Manager + step1_in_progress:** ไม่ครอบ CollapsibleSection (แสดงเต็มเหมือนเดิม)
- **Manager + step2+ (read-only):** ครอบ CollapsibleSection, **collapsed by default**
- **Owner:** ใช้ CollapsibleSection เสมอ (collapsed)

**Summary text (เมื่อ collapsed):**
```
"2 รายการ · สำเร็จ 2 · ค่าบริการ 30 ฿"
```

**Badge:**
```ts
{ label: '✅ สำเร็จ', variant: 'success' }  // เมื่อทุก txn สำเร็จ
{ label: '⚠️ มี Draft', variant: 'warning' } // เมื่อมี draft
```

**Implementation:**
```vue
<!-- Manager step1 active → แสดงเดิมไม่ครอบ -->
<section v-if="isManagerOrAsst && isStep1InProgress" class="mb-6">
  <!-- ... transaction table เดิมทั้งหมด ... -->
</section>

<!-- ทุกกรณีอื่น → ครอบ CollapsibleSection -->
<CollapsibleSection
  v-else-if="!(isAuditor && store.isStep2Complete) && !(isOwner && store.isAudited)"
  icon="📋"
  title="ธุรกรรมวันนี้"
  :badge="txnSectionBadge"
  :summary="txnSectionSummary"
  :default-expanded="false"
  class="mb-4"
>
  <!-- ... transaction table เดิม ... -->
</CollapsibleSection>
```

### 4.2 Cash Verification (read-only) → CollapsibleSection

**เงื่อนไขเดิม:** `showCashCountSection && !isOwner && !(isAuditor && store.isStep2Complete)`

**Collapsed / Expanded logic:**
- **Manager + canEditCashCount (step2 active):** ไม่ครอบ (แสดง form กรอกเดิม)
- **Manager + step2 done (read-only):** ครอบ CollapsibleSection, **collapsed**

**Summary text:**
```
"คาดไว้ 3,980 ฿ · ตรงกัน" หรือ "คาดไว้ 3,980 ฿ · มีผลต่าง"
```

**Badge:**
```ts
{ label: '✅ เสร็จสมบูรณ์', variant: 'success' }
```

### 4.3 Audit Result (read-only) → CollapsibleSection

**Section ปัจจุบัน:** `v-if="store.isAudited"` (~line 1661+)

**ครอบ:**
```vue
<CollapsibleSection
  v-if="store.isAudited"
  icon="🔍"  
  title="ผลตรวจสอบ Auditor"
  :badge="{ label: '✅ ตรวจสอบแล้ว', variant: 'success' }"
  :summary="auditResultSummary"
  :default-expanded="isAuditor"
  class="mt-4"
>
  <!-- ... audit result content เดิม ... -->
</CollapsibleSection>
```

**Expand by default:**
- Auditor → expanded (ดูผลงานตัวเอง)
- Manager / Owner → collapsed

### 4.4 Computed เพิ่ม

```ts
const txnSectionBadge = computed(() => ({
  label: hasDrafts.value ? '⚠️ มี Draft' : '✅ สำเร็จ',
  variant: hasDrafts.value ? 'warning' : 'success' as const,
}))

const txnSectionSummary = computed(() =>
  `${todayStats.value.total} รายการ · สำเร็จ ${todayStats.value.completed} · ค่าบริการ ${formatCurrency(totalCommission.value)}`
)

const cashVerificationSummary = computed(() => {
  const expected = expectedTotal.value
  const hasDiscrep = store.currentSummary?.step2?.hasDiscrepancies
  return `คาดไว้ ${formatCurrency(expected)} · ${hasDiscrep ? 'มีผลต่าง' : 'ตรงกัน'}`
})

const auditResultSummary = computed(() => {
  const issues = store.currentSummary?.auditorVerification?.transactionsWithIssues ?? 0
  return issues > 0 ? `${issues} รายการมีปัญหา` : 'ไม่พบปัญหา · ยอดตรงกัน'
})
```

## Prompt สำหรับ Chat Session

```
อ่าน docs/DESIGNS/IMPLEMENTATION_PLAN_COMPACT_VIEW.md ส่วน "งาน 4"

แก้ไข pages/finance/money-transfer-service/index.vue:

1. Transaction Table section (~line 1147):
   - Manager step1_in_progress → คง section เดิมไม่เปลี่ยน
   - ทุกกรณีอื่น → ครอบด้วย CollapsibleSection (collapsed by default)

2. Cash Verification section (~line 1338):
   - canEditCashCount (form กรอก) → คง form เดิม
   - read-only mode → ครอบด้วย CollapsibleSection (collapsed)

3. Audit Result section (~line 1661):
   - ครอบด้วย CollapsibleSection
   - Auditor → expanded, Manager/Owner → collapsed

4. เพิ่ม computed: txnSectionBadge, txnSectionSummary, 
   cashVerificationSummary, auditResultSummary

ทดสอบ: ทุก section collapse/expand ถูกต้อง, 
Manager step1 ไม่เปลี่ยน, summary text ถูกต้อง
```

## Definition of Done
- [ ] Transaction Table ครอบ CollapsibleSection (post-step1)
- [ ] Cash Verification ครอบ CollapsibleSection (read-only mode)
- [ ] Audit Result ครอบ CollapsibleSection  
- [ ] Summary text แสดงถูกต้อง
- [ ] Expand/collapse default ถูกต้องตาม role
- [ ] Manager step1 ไม่กระทบ
- [ ] Commit ลง branch `task-4/collapsible-sections`

---

# ═══════════════════════════════════════════════════════════════
# งาน 5: สลับ Owner Approval ขึ้นบน + Status Banner + Expand/Collapse Logic
# ═══════════════════════════════════════════════════════════════

## เป้าหมาย
- Owner Approval section ย้ายขึ้นมาอยู่ทันทีหลัง Balance (ก่อน Audit Result)
- เพิ่ม Status Banner สำหรับ read-only states
- ปรับ default expand/collapse ตาม Role × Status

## ไฟล์ที่แก้ไข
- `pages/finance/money-transfer-service/index.vue`

## รายละเอียด

### 5.1 สลับลำดับ Owner Approval

**ปัจจุบัน (ลำดับ template):**
1. Opening Balance
2. Balance Cards
3. Quick Actions
4. Draft Alert
5. Transaction Table
6. Step 1 Completion
7. Cash Verification
8. **Auditor Form (active)**
9. **Audit Result (read-only)**
10. **Owner Approval** ← อยู่ล่างสุด

**ใหม่ (สำหรับ Owner + audited):**
1. ~~Opening Balance~~ (ไม่แสดง)
2. Compact Balance
3. **Owner Approval** ← ย้ายขึ้นมาอยู่ที่นี่
4. Audit Result (collapsed)
5. Transaction Table (collapsed)
6. Cash Verification (collapsed)

**วิธี implement:**

ย้าย Owner Approval section (ปัจจุบัน ~line 1746) ขึ้นมาอยู่หลัง Balance section
และ v-if เงื่อนไขเดิมยังคงอยู่: `v-if="isOwner && store.isAudited"`

```vue
<!-- Balance Cards / Compact Balance -->

<!-- ★ Owner Approval — ย้ายมาอยู่ตรงนี้ (ก่อน Audit Result) -->
<section v-if="isOwner && store.isAudited" class="mb-4">
  <!-- ... Owner Approval content ทั้งหมด ... -->
</section>

<!-- Auditor Form (active) -->
<!-- Audit Result (read-only, CollapsibleSection) -->
<!-- Transaction Table (CollapsibleSection) -->
<!-- Cash Verification (CollapsibleSection) -->
```

### 5.2 Status Banner

**Component:** สร้าง inline ใน template (ไม่ต้องแยก component)

**แสดงเมื่อ role ไม่มี action:**

```vue
<!-- Status Banner — No Action Available -->
<div 
  v-if="showStatusBanner"
  class="rounded-xl border px-5 py-4 flex items-start gap-3"
  :class="statusBannerClasses"
>
  <component :is="statusBannerIcon" class="w-5 h-5 shrink-0 mt-0.5" />
  <div>
    <p class="font-semibold">{{ statusBannerTitle }}</p>
    <p class="text-sm mt-0.5 opacity-80">{{ statusBannerDescription }}</p>
  </div>
</div>
```

**Logic:**
```ts
const showStatusBanner = computed(() => {
  // Manager: แสดงเมื่อ step2+ (ไม่มี action)
  if (isManagerOrAsst.value && !isStep1InProgress.value && !canEditCashCount.value) return true
  // Auditor: แสดงเมื่อ audited (ไม่มี action)
  if (isAuditor.value && store.isAudited) return true
  // Owner: แสดงเมื่อ step2_completed (ยังไม่ได้ audit)
  if (isOwner.value && !store.isAudited) return true
  return false
})

const statusBannerContent = computed(() => {
  const ws = workflowStatus.value
  if (ws === 'step2_completed') return {
    title: '⏳ รอ Auditor ตรวจสอบ',
    description: 'รายการนี้อยู่ระหว่างรอการตรวจสอบจาก Auditor',
    classes: 'border-orange-200 bg-orange-50 text-orange-800'
  }
  if (ws === 'audited' && !isOwner.value) return {
    title: '⏳ รอ Owner อนุมัติ',
    description: 'รายการนี้ผ่านการตรวจสอบแล้ว อยู่ระหว่างรอ Owner อนุมัติ',
    classes: 'border-yellow-200 bg-yellow-50 text-yellow-800'
  }
  if (ws === 'approved') return {
    title: '✅ อนุมัติแล้ว',
    description: `อนุมัติโดย Owner`,
    classes: 'border-green-200 bg-green-50 text-green-800'
  }
  return null
})
```

**ตำแหน่ง:** ด้านล่างสุดของทุก section (ก่อน Modals)

### 5.3 ปรับ Section Order ตาม Role

**Manager/AM (post-step1):**
```
Progress → Glance → Compact Balance → [Cash Count / CollapsibleSection] 
→ Txn (collapsed) → [Audit Result collapsed] → Status Banner
```

**Auditor (active):**
```
Progress → Glance → Compact Balance → Auditor Form (expanded)
→ Status Banner (เมื่อ audited แล้ว)
```

**Owner (audited):**
```
Progress → Glance → Compact Balance → Owner Approval (expanded)
→ Audit Result (collapsed) → Txn (collapsed) → Cash (collapsed)
```

## Prompt สำหรับ Chat Session

```
อ่าน docs/DESIGNS/IMPLEMENTATION_PLAN_COMPACT_VIEW.md ส่วน "งาน 5"
อ่าน docs/DESIGNS/WIREFRAMES_COMPACT_HISTORY_DETAIL.md ส่วน 5.2 (Owner audited)

แก้ไข pages/finance/money-transfer-service/index.vue:

1. ย้าย Owner Approval section (ปัจจุบัน ~line 1746) ขึ้นมา
   อยู่หลัง Balance section, ก่อน Auditor Form / Audit Result
   (v-if เดิมคงไว้: isOwner && store.isAudited)

2. เพิ่ม Status Banner แสดงเมื่อ role ไม่มี action:
   - Manager step2+: "รอ Auditor ตรวจสอบ"
   - Manager/Auditor audited: "รอ Owner อนุมัติ"  
   - ทุก role approved: "อนุมัติแล้ว"
   ตำแหน่ง: ด้านล่างสุด (ก่อน Modals)

3. ปรับ section order ให้ Owner เห็น Approval → Audit → Txn → Cash
   (ไม่ใช่ Txn → Cash → Audit → Approval เหมือนเดิม)

ทดสอบ: Owner เห็น Approval form ทันที, Status Banner ถูกต้องทุก role
```

## Definition of Done
- [ ] Owner Approval อยู่หลัง Balance (ก่อน Audit Result)
- [ ] Status Banner แสดงถูกต้องตาม role × status
- [ ] Section order ถูกต้องตาม wireframe ทุก role
- [ ] ไม่กระทบ functionality เดิม (ปุ่ม approve/reject ยังทำงาน)
- [ ] Commit ลง branch `task-5/reorder-status-banner`

---

# ═══════════════════════════════════════════════════════════════
# งาน 6: Mobile Responsive + Polish + ทดสอบ
# ═══════════════════════════════════════════════════════════════

## เป้าหมาย
ปรับ responsive layout สำหรับ mobile + ทดสอบ + แก้ bugs

## ไฟล์ที่แก้ไข
- `components/money-transfer/CompactBalanceSummary.vue`
- `components/money-transfer/WorkflowProgressBar.vue`
- `pages/finance/money-transfer-service/index.vue`

## รายละเอียด

### 6.1 Balance Cards — Mobile Layout

```
Desktop (≥ sm):  4 cards ใน 1 แถว (grid-cols-4)
Mobile (< sm):   2 cards ต่อแถว (grid-cols-2)
```

ปรับ CompactBalanceSummary:
```vue
<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
```

### 6.2 Progress Bar — Mobile

```
Desktop: แสดง label เต็ม "บันทึก", "ตรวจนับ", "Auditor", "Owner"
Mobile:  ย่อ label + ลด spacing
```

### 6.3 Sticky Action Buttons — Mobile

เมื่อ primary action buttons อยู่นอกจอ → แสดง sticky bar ด้านล่าง

**ปุ่มที่เกี่ยวข้อง:**
- Auditor: `[ส่งคืนแก้ไข]` / `[ยืนยันการตรวจสอบ]`
- Owner: `[ส่งคืนแก้ไข]` / `[อนุมัติ]`

**Implementation:**
```vue
<!-- Sticky Action Bar (mobile) -->
<Teleport to="body">
  <div 
    v-if="showStickyActions && !isActionButtonVisible"
    class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg px-4 py-3 flex items-center justify-between z-50 sm:hidden"
  >
    <BaseButton variant="danger" size="sm" @click="handleReject">
      ส่งคืนแก้ไข
    </BaseButton>
    <BaseButton variant="success" size="sm" @click="handleApprove">
      {{ primaryActionLabel }}
    </BaseButton>
  </div>
</Teleport>
```

ใช้ `IntersectionObserver` ตรวจ visibility ของปุ่ม action จริง

### 6.4 ทดสอบทุก Role × Status

**Test Matrix:**

| Role | Status | คาดหวัง | ✅ |
|------|--------|---------|---|
| Manager | step1_in_progress | Layout เดิม, ไม่ compact | ⬜ |
| Manager | step1_completed | Compact balance, Cash count expanded | ⬜ |
| Manager | step2_completed | Compact, ทุก section collapsed, banner "รอ" | ⬜ |
| Manager | audited | Compact, Audit collapsed, banner "รอ" | ⬜ |
| Manager | approved | Compact, ทุก collapsed, banner ✅ | ⬜ |
| Manager | needs_correction | เหมือน step1, Progress Bar แดง | ⬜ |
| Auditor | step2_completed | Compact, Auditor form expanded | ⬜ |
| Auditor | audited | Compact, Audit result expanded, banner "รอ" | ⬜ |
| Owner | step2_completed | Compact, ทุก collapsed, banner "รอ" | ⬜ |
| Owner | audited | Compact, Approval expanded, Audit collapsed | ⬜ |
| Owner | approved | Compact, Approved banner, ทุก collapsed | ⬜ |

### 6.5 Polish

- ตรวจสอบ transition animation ราบรื่น
- ตรวจสอบ spacing consistency ระหว่าง sections
- ตรวจสอบ color consistency กับ design system
- ตรวจสอบ accessibility (keyboard nav บน CollapsibleSection)

## Prompt สำหรับ Chat Session

```
อ่าน docs/DESIGNS/IMPLEMENTATION_PLAN_COMPACT_VIEW.md ส่วน "งาน 6"

ปรับ responsive + polish:

1. CompactBalanceSummary.vue: grid-cols-2 sm:grid-cols-4
2. WorkflowProgressBar.vue: ย่อ label บน mobile
3. Sticky action buttons สำหรับ Auditor/Owner บน mobile (sm:hidden)
4. ทดสอบทุก role × status ตาม Test Matrix

แก้ bugs ที่พบ, ตรวจสอบ transitions, spacing, accessibility
```

## Definition of Done
- [ ] Mobile layout ถูกต้อง (Balance 2×2, Progress compact)
- [ ] Sticky action buttons ทำงานบน mobile
- [ ] ผ่าน Test Matrix ทุกช่อง
- [ ] ไม่มี TypeScript errors
- [ ] Transitions ราบรื่น
- [ ] Commit ลง branch `task-6/mobile-polish`
- [ ] Merge ทุก task เข้า `feature/compact-view`

---

# 📁 File Map: สรุปไฟล์ที่เกี่ยวข้อง

## สร้างใหม่
| ไฟล์ | งาน |
|------|-----|
| `components/ui/display/CollapsibleSection.vue` | งาน 1 |
| `components/money-transfer/WorkflowProgressBar.vue` | งาน 1 |
| `components/money-transfer/QuickGlanceSummary.vue` | งาน 2 |
| `components/money-transfer/CompactBalanceSummary.vue` | งาน 2 |

## แก้ไข
| ไฟล์ | งาน | ส่วนที่แก้ |
|------|-----|-----------|
| `pages/finance/money-transfer-service/index.vue` | งาน 3 | เพิ่ม import + Progress + Glance + Compact Balance |
| `pages/finance/money-transfer-service/index.vue` | งาน 4 | ครอบ sections ด้วย CollapsibleSection |
| `pages/finance/money-transfer-service/index.vue` | งาน 5 | ย้าย Owner section + Status Banner |
| `pages/finance/money-transfer-service/index.vue` | งาน 6 | Responsive + sticky buttons |

## ไม่แก้ไข (reference only)
| ไฟล์ | ใช้เป็น |
|------|--------|
| `components/money-transfer/MoneyTransferBalanceSnapshot.vue` | reuse เดิม |
| `components/money-transfer/MoneyTransferCashVerificationTable.vue` | reuse เดิม |
| `components/money-transfer/MoneyTransferTransactionTable.vue` | reuse เดิม |
| `stores/money-transfer.ts` | ใช้ getters เดิม |
| `composables/useMoneyTransferHelpers.ts` | ใช้ formatCurrency เดิม |
