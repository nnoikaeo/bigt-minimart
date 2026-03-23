# Plan: Consistent Layout for Non-Approved Workflow Statuses

> **Created**: 2026-03-23  
> **Status**: Planned  
> **Related**: PR #80 (Approved State Layout — commit ed49905)  
> **File**: `pages/finance/money-transfer-service/index.vue`

---

## Background

PR #80 จัดการ Approved State Layout ให้ทุก role (Manager, Auditor, Owner) เห็น layout สอดคล้องกันเมื่อสถานะเป็น "อนุมัติแล้ว"

**ตอนนี้** ต้องทำให้ 3 สถานะที่ยังไม่ approved มี layout สอดคล้องกันเช่นกัน:
- `step1_in_progress` — Manager กำลังบันทึกรายการ
- `step1_completed` — Manager กำลังตรวจนับเงินสด (Step 2)
- `step2_completed` — Auditor กำลังตรวจสอบ

---

## Current Issues

### Role × Status Visibility Matrix (ก่อนแก้ — ปัญหาอยู่ในตัวหนา)

| Section | step1_in_progress | step1_completed | step2_completed |
|---------|:-:|:-:|:-:|
| WorkflowProgressBar | M:❌ A:✅ O:✅ | All ✅ | All ✅ |
| QuickGlanceSummary | M:❌ A:✅ O:✅ | All ✅ | All ✅ |
| CompactBalance | M:full8 A:✅ O:✅ | All ✅ | All ✅ |
| Txns (collapsed) | M:edit A:✅ O:✅ | All ✅ | M:✅ A:❌(audit form) O:✅ |
| Cash Count readonly | ❌ all | ❌ all | M:✅ A:❌(in audit) **O:❌** |
| **Status Banner** | M:❌ **A:❌ O:null** | M:❌ **A:❌ O:null** | M:✅ A:❌(has form) O:✅ |

> M = Manager/AM, A = Auditor, O = Owner

### Issue #1: No banner for step1_in_progress / step1_completed

`statusBannerContent` (line ~437) returns `null` สำหรับ 2 สถานะนี้

- Owner มี `showStatusBanner=true` แต่ content เป็น null → ไม่ render อะไรเลย
- Auditor ไม่มี banner เลย เพราะ `showStatusBanner` ต้องการ `isAuditor && store.isAudited`

### Issue #2: showStatusBanner ไม่ครอบคลุม Auditor ช่วง step1

`showStatusBanner` computed (line ~429):
```js
if (isAuditor.value && store.isAudited) return true  // ❌ ไม่ true ตอน step1
```
Auditor ไม่เห็น banner ระหว่าง step1_in_progress / step1_completed

### Issue #3: Owner ไม่เห็น Cash Count result ตอน step2_completed

Cash Count readonly (line ~1982):
```html
v-if="showCashCountSection && !canEditCashCount && !isOwner && ..."
```
`!isOwner` hardcoded ทำให้ Owner ไม่เห็นผล step2 จนกว่าจะถึง Owner Approval section (หลัง audit)

---

## Tasks (1 task = 1 chat session)

### Task 1: Add Missing Status Banners for step1 states
> **Scope**: 2 computed changes in `index.vue`  
> **Estimated changes**: ~20 lines

**สิ่งที่ต้องทำ:**

1. **Fix `showStatusBanner`** (line ~429)
   - เปลี่ยน condition Auditor จาก:
     ```js
     if (isAuditor.value && store.isAudited) return true
     ```
   - เป็น:
     ```js
     if (isAuditor.value && (store.isAudited || !store.isStep2Complete)) return true
     ```
   - ผลลัพธ์: Auditor เห็น banner ตอน step1_in_progress, step1_completed (รอ Manager), และหลัง audit (รอ Owner)
   - ไม่แสดงตอน step2_completed เพราะ Auditor มี audit form อยู่แล้ว

2. **Extend `statusBannerContent`** (line ~437) — เพิ่ม 2 case ใหม่:
   ```js
   if (ws === 'step1_in_progress') return {
     title: '⏳ Manager กำลังบันทึกรายการ',
     description: 'Manager/AM กำลังบันทึกรายการโอนเงินประจำวัน',
     classes: 'border-blue-200 bg-blue-50 text-blue-800',
     icon: ClockIcon,
   }
   if (ws === 'step1_completed') return {
     title: '⏳ รอ Manager ตรวจนับเงินสด',
     description: 'Manager/AM กำลังดำเนินการตรวจนับเงินสด (Step 2)',
     classes: 'border-blue-200 bg-blue-50 text-blue-800',
     icon: ClockIcon,
   }
   ```

**การทดสอบ:**
- date=2026-03-09 (step1_in_progress): Login Auditor → blue banner "Manager กำลังบันทึกรายการ". Login Owner → same. Login Manager → no banner.
- date=2026-03-08 (step1_completed): Login Auditor → blue banner "รอ Manager ตรวจนับเงินสด". Login Owner → same. Login Manager → no banner (has cash count form).

---

### Task 2: Make Cash Count Result Visible to Owner in step2_completed
> **Scope**: 1 v-if change in `index.vue`  
> **Estimated changes**: ~1 line

**สิ่งที่ต้องทำ:**

1. **เปลี่ยน Cash Count readonly v-if** (line ~1982)
   - จาก:
     ```html
     v-if="showCashCountSection && !canEditCashCount && !isOwner && !(isAuditor && store.isStep2Complete) && !isApproved"
     ```
   - เป็น:
     ```html
     v-if="showCashCountSection && store.isStep2Complete && !canEditCashCount && !isAuditor && !isApproved"
     ```
   - ลบ `!isOwner` ออก → Owner เห็น Cash Count result
   - เพิ่ม `store.isStep2Complete` → มั่นใจว่ามีข้อมูลก่อน render
   - ยัง exclude Auditor (เห็นใน audit form อยู่แล้ว)

**การทดสอบ:**
- date=2026-03-04 (step2_completed): Login Owner → Cash Count readonly section ปรากฏ (ตารางเปรียบเทียบ). Login Auditor → audit form (ไม่ซ้ำ). Login Manager → readonly + orange banner.
- date=2026-02-27 (approved): ทุก role → approved layout ไม่เปลี่ยน.

---

## Decisions

| Decision | เหตุผล |
|----------|--------|
| สี blue สำหรับ step1 banners | เป็น informational (ยังอยู่ช่วงแรก) ต่างจาก orange ของ step2_completed (urgent กว่า) |
| `needs_correction` out of scope | มี UX considerations แยกต่างหาก ควรเป็น PR แยก |
| Dead code (`v-if="false"` ~200 lines) out of scope | ควร cleanup ใน PR แยก ไม่ผสมกับ layout fix |
| Banner อยู่ตำแหน่งเดิม (ด้านล่าง) | QuickGlanceSummary badge + WorkflowProgressBar ให้ status context ด้านบนแล้ว |

---

## Expected Result After Fix

| Section | step1_in_progress | step1_completed | step2_completed |
|---------|:-:|:-:|:-:|
| WorkflowProgressBar | M:❌ A:✅ O:✅ | All ✅ | All ✅ |
| QuickGlanceSummary | M:❌ A:✅ O:✅ | All ✅ | All ✅ |
| CompactBalance | M:full8 A:✅ O:✅ | All ✅ | All ✅ |
| Txns (collapsed) | M:edit A:✅ O:✅ | All ✅ | M:✅ A:❌(audit form) O:✅ |
| Cash Count readonly | ❌ all | ❌ all | M:✅ A:❌(in audit) **O:✅** ✨ |
| **Status Banner** | M:❌ **A:✅ O:✅** ✨ | M:❌ **A:✅ O:✅** ✨ | M:✅ A:❌(has form) O:✅ |

> ✨ = Fixed in this plan

---

## Test Data Reference

| Date | Status | Transactions |
|------|--------|-------------|
| 2026-03-09 | `step1_in_progress` | 0 txns |
| 2026-03-08 | `step1_completed` | 5 txns |
| 2026-03-04 | `step2_completed` | 2 txns |
| 2026-02-27 | `approved` | 6 txns (full workflow) |
| ❌ missing | `audited` | ไม่มี test data |
| ❌ missing | `needs_correction` | ไม่มี test data |
