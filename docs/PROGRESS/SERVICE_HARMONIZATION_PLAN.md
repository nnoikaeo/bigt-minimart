# แผนปรับปรุงบริการโอนเงินและบริการรับชำระบิลให้สอดคล้องกัน

> **วันที่จัดทำ:** 9 เมษายน 2569  
> **แนวทาง:** ปรับทั้งสองฝั่งให้มาเจอกันตรงกลาง — เลือกข้อดีจากแต่ละฝั่ง  
> **เอกสารอ้างอิง:** `docs/PROGRESS/SERVICE_COMPARISON_ANALYSIS.md`

---

## 1. ภาพรวมโครงสร้างหน้า (Page Architecture)

### สถานะปัจจุบัน

| | Money Transfer (MT) | Bill Payment (BP) |
|---|---|---|
| **จำนวนหน้า** | 2 หน้า (History + Single Page) | 4 หน้า (History + Service + Auditor + Owner) |
| **ขนาดไฟล์ Service** | ~2,100 บรรทัด | ~650 บรรทัด (service) + ~380 (auditor) + ~430 (owner) = ~1,460 บรรทัด |

### วิเคราะห์ข้อดี/ข้อเสีย

#### Single Page (MT) — ทุก Role ทำงานในหน้าเดียว

| ข้อดี | ข้อเสีย |
|---|---|
| ✅ ข้อมูลทุก Step อยู่ในหน้าเดียว — ดูภาพรวมได้ทันที | ❌ ไฟล์ใหญ่มาก (~2,100 บรรทัด) — ดูแลยาก |
| ✅ ไม่ต้อง navigate ไปหน้าอื่น — ลดการ load ข้อมูลซ้ำ | ❌ Logic ซับซ้อน — v-if conditions กระจายทั่วไฟล์ |
| ✅ Owner/Auditor เห็น context ครบจบ | ❌ State refs 30+ ตัว — ยากต่อการ debug |
| ✅ Shared computed data — ไม่ต้อง fetch ซ้ำ | ❌ ทดสอบแต่ละ workflow แยกกันยาก |

#### Multi Page (BP) — แยกหน้าตาม Role

| ข้อดี | ข้อเสีย |
|---|---|
| ✅ Separation of concerns — แต่ละไฟล์เล็กและชัดเจน | ❌ ต้อง navigate ข้ามหน้า — UX ไม่ต่อเนื่อง |
| ✅ ดูแลง่าย — แก้เฉพาะ role ไม่กระทบ role อื่น | ❌ อาจ fetch ข้อมูลซ้ำเมื่อเปลี่ยนหน้า |
| ✅ ทดสอบแต่ละ workflow แยกได้สะดวก | ❌ Owner ต้องกดกลับไปดูหน้าอื่นถ้าอยากเห็นรายละเอียด |
| ✅ เพิ่ม feature เฉพาะ role ได้โดยไม่ bloat | ❌ อาจเกิดความไม่ consistent ระหว่างหน้า |

### ✅ คำแนะนำ: Single Page + Component Extraction (Hybrid)

**เลือกแนวทาง Single Page ของ MT เป็นหลัก** เพราะ UX ดีกว่า (ผู้ใช้เห็นภาพรวมทั้งหมดในหน้าเดียว) แต่แก้ข้อเสียเรื่องไฟล์ใหญ่โดย **แยก logic ออกเป็น components และ composables**:

```
แนวทาง Hybrid:
├── pages/finance/{service}-service/index.vue    ← Single Page (orchestrator เบาๆ ~300-400 บรรทัด)
│   ├── <ManagerRecordingSection />              ← component แยก
│   ├── <CashVerificationSection />              ← component แยก
│   ├── <AuditorReviewSection />                 ← component แยก
│   └── <OwnerApprovalSection />                 ← component แยก
└── pages/finance/{service}-history.vue          ← History Page
```

**การเปลี่ยนแปลงที่ต้องทำ:**

| ฝั่ง | การเปลี่ยนแปลง | ผลกระทบ |
|---|---|---|
| **MT** | Refactor `index.vue` (2,100→~300 บรรทัด) โดยแยก section ออกเป็น sub-components | ลดความซับซ้อนของไฟล์หลัก ดูแลง่ายขึ้น |
| **BP** | รวม 3 หน้า (service + auditor-review + owner-approval) เข้าเป็นหน้าเดียว โดยใช้ sub-components | UX สอดคล้องกับ MT, ผู้ใช้เห็นภาพรวมครบ |

**BP ต้อง:**
- ลบ `auditor-review.vue` และ `owner-approval.vue` (ย้าย logic ไปเป็น component)
- สร้าง `components/bill-payment/AuditorReviewSection.vue`
- สร้าง `components/bill-payment/OwnerApprovalSection.vue`
- ปรับ `bill-payment-history.vue` ให้ทุก role navigate ไป URL เดียว
- ปรับ `useBillPaymentHelpers.ts` > `getSmartActionButton()` ให้ไป URL เดียว

**MT ต้อง:**
- แยก sections ออกจาก `index.vue` เป็น sub-components:
  - `components/money-transfer/ManagerRecordingSection.vue`
  - `components/money-transfer/CashVerificationSection.vue`
  - `components/money-transfer/AuditorReviewSection.vue`
  - `components/money-transfer/OwnerApprovalSection.vue`
- `index.vue` เหลือแค่ orchestrator: fetch data, detect role, แสดง component ที่เหมาะสม

---

## 2. หน้า History (รายการประวัติ)

### สถานะปัจจุบัน

ทั้งสองหน้าโครงสร้างคล้ายกันอยู่แล้ว (Pending Inbox + Table + Add Modal) ต่างกันที่:
- ปุ่ม Action: MT ทุก role ไป URL เดียว, BP แยก URL
- Status variants: BP มี sub-status มากกว่า

### ✅ คำแนะนำ

| หัวข้อ | แนวทาง | เปลี่ยนฝั่ง |
|---|---|---|
| **ปุ่ม Action** | ทุก Role ไป URL เดียว (ตามแนวทาง single page ข้อ 1) | BP ปรับ |
| **Pending Inbox** | ใช้รูปแบบเดียวกัน — 3 cards ตาม role (Manager/Auditor/Owner) | ปรับทั้งสองให้ consistent |
| **คอลัมน์ตาราง** | เหมือนกันอยู่แล้ว — ไม่ต้องเปลี่ยน | — |
| **Backdated Warning** | BP มี warning เตือนบันทึกย้อนหลังใน Add Modal — **เพิ่มให้ MT ด้วย** | MT เพิ่ม |
| **Status Badge Colors** | สร้าง shared utility สำหรับ workflow status → badge color mapping | ทั้งสอง |

---

## 3. หน้ารายละเอียดหลัก (Service Page) — มุมมองของ Manager

### 3.1 Opening Balance

| | MT (ปัจจุบัน) | BP (ปัจจุบัน) | เป้าหมาย |
|---|---|---|---|
| **มี/ไม่มี** | ✅ มี — บังคับก่อนบันทึก | ❌ ไม่มี UI | ✅ **ทั้งสองต้องมี** |
| **แหล่งที่มา** | Carryover จากวันก่อน / Manual | — | Carryover / Manual (เหมือน MT) |

**การเปลี่ยนแปลง:**
- **BP เพิ่ม:** Opening Balance modal/section แบบเดียวกับ MT (Carryover/Manual)
- **BP เพิ่ม:** ต้องตั้ง Opening Balance ก่อนจึงบันทึก transaction ได้
- **MT:** ไม่ต้องเปลี่ยน

### 3.2 Balance Cards

| | MT (ปัจจุบัน) | BP (ปัจจุบัน) | เป้าหมาย |
|---|---|---|---|
| **จำนวน** | 8 cards (2 แถว) | 3 cards (1 แถว) | ปรับตามข้อมูลจริงของแต่ละบริการ |
| **Layout** | Full 8 cards (Manager step1) / Compact 4+4 (อื่นๆ) | Static 3 cards | Compact expandable (เหมือน MT) |

**การเปลี่ยนแปลง:**
- **สร้าง shared component:** `CompactBalanceSummary` → refactor เป็น generic (ไม่ผูกกับ MT)
- **BP เพิ่ม:** ใช้ Compact Balance Summary — แสดง cards หลักที่จำเป็น + expandable รายละเอียด
- **BP cards หลัก (แถวบน):** เงินเริ่มต้น, รวมรับชำระ, เงินในบัญชีคงเหลือ, เงินสดคงเหลือ
- **BP cards รอง (expandable):** รวมฝากเงิน, ค่าธรรมเนียม
- **MT:** Refactor `CompactBalanceSummary` ให้เป็น generic แล้ว reuse

### 3.3 Workflow Progress Bar

| | MT | BP | เป้าหมาย |
|---|---|---|---|
| **มี/ไม่มี** | ✅ มี | ❌ ไม่มี | ✅ **ทั้งสองต้องมี** |

**การเปลี่ยนแปลง:**
- **Refactor** `WorkflowProgressBar.vue` ให้เป็น generic — รับ steps config เป็น props
- **BP เพิ่ม:** ใช้ `WorkflowProgressBar` เดียวกัน (steps: บันทึก→ตรวจนับ→Auditor→Owner)
- **MT:** Refactor component ให้รับ props แทน hardcode

### 3.4 Quick Glance Summary

| | MT | BP | เป้าหมาย |
|---|---|---|---|
| **มี/ไม่มี** | ✅ มี | ❌ ไม่มี | ✅ **ทั้งสองต้องมี** |

**การเปลี่ยนแปลง:**
- **Refactor** `QuickGlanceSummary.vue` ให้เป็น generic
- **BP เพิ่ม:** ใช้ Quick Glance Summary แสดง: วันที่, จำนวนรายการ, สำเร็จ, ค่าธรรมเนียม, สถานะ
- **แสดงเมื่อ:** role ไม่ใช่ Manager ใน step1_in_progress (เหมือน MT)

### 3.5 Draft Transactions

| | MT | BP | เป้าหมาย |
|---|---|---|---|
| **มี/ไม่มี** | ✅ มี (insufficient balance → draft) | ❌ ไม่มี | ✅ **ทั้งสองต้องมี** |

**การเปลี่ยนแปลง:**
- **BP เพิ่ม:** ระบบ Draft — เมื่อบันทึก transaction ที่ยอดไม่พอ ให้เป็น draft
- **BP เพิ่ม:** Draft alert section พร้อมปุ่ม "ดำเนินการ" / "ลบ"
- **BP ปรับ type:** เพิ่ม `draft` status ใน `BillPaymentTransaction`
- **BP ปรับ store:** เพิ่ม `completeDraftTransaction()` action
- **MT:** ไม่ต้องเปลี่ยน

### 3.6 Favorites

| | MT | BP | เป้าหมาย |
|---|---|---|---|
| **มี/ไม่มี** | ✅ มี (5 tab, 10 per tab) | ❌ ไม่มี | ✅ **ทั้งสองต้องมี** |

**เหตุผล:**
- **MT:** Favorites มีประโยชน์เพราะ transaction ซ้ำบ่อย (โอนบัญชีเดิม)
- **BP:** Bill payment มักมีลูกค้าซ้ำเช่นกัน — ลูกค้าที่มาชำระบิลประจำสามารถบันทึกเป็น Favorite ได้

**การเปลี่ยนแปลง:**
- **BP เพิ่ม:** Favorite system (ลูกค้า + ประเภทบิล + จำนวนเงินเริ่มต้น)
- **สร้าง shared Favorites component** ที่ทั้งสอง service ใช้ร่วมกัน

### 3.7 Commission Input

| | MT | BP | เป้าหมาย |
|---|---|---|---|
| **วิธีคำนวณ** | Auto-calculate + manual override | ใส่เองเท่านั้น | **Auto-calculate + manual override ทั้งสอง** |
| **Commission Type** | cash / transfer | ไม่มี (เงินสดเสมอ) | ตามธรรมชาติของบริการ |

**การเปลี่ยนแปลง:**
- **BP เพิ่ม:** ใช้ `useCommission` composable สำหรับ auto-calculate
- **BP เพิ่ม:** ปุ่ม toggle Auto/Manual ใน form
- **BP ปรับ:** fee tiers setting สำหรับ bill payment (อาจแยก tier จาก money transfer)
- **Commission Type:** BP คงเป็นเงินสดเท่านั้น (ไม่ต้องเพิ่ม type) เพราะธรรมชาติของบริการรับชำระบิลเป็นเงินสด
- **MT:** ไม่ต้องเปลี่ยน

### 3.8 Transaction Status

| | MT | BP | เป้าหมาย |
|---|---|---|---|
| **สถานะ** | completed, draft, on_hold, cancelled | success, failed | **completed, draft, on_hold, cancelled ทั้งสอง** |

**การเปลี่ยนแปลง:**
- **BP ปรับ:** เปลี่ยน `success` → `completed`, เพิ่ม `draft`, `on_hold`, `cancelled`
- **BP ปรับ:** `failed` → `cancelled` (หรือคง `failed` เป็น label ของ cancelled ในบริบท BP)
- **BP ปรับ type:** `BillPaymentTransaction.status` → `'completed' | 'draft' | 'on_hold' | 'cancelled'`
- **BP ปรับ store/API:** migration ข้อมูลเดิม (`success` → `completed`, `failed` → `cancelled`)
- **MT:** ไม่ต้องเปลี่ยน

> ⚠️ **หมายเหตุ:** ต้อง migrate ข้อมูลเดิมใน Firestore ด้วย

### 3.9 Status Change

| | MT | BP | เป้าหมาย |
|---|---|---|---|
| **มี/ไม่มี** | ✅ มี (completed↔on_hold, →cancelled) | ❌ ไม่มี | ✅ **ทั้งสองต้องมี** |

**การเปลี่ยนแปลง:**
- **BP เพิ่ม:** Status change functionality ใน transaction row
- **BP เพิ่ม:** Status change modal พร้อม reason textarea
- **BP ปรับ store:** เพิ่ม `changeTransactionStatus()` action
- **MT:** ไม่ต้องเปลี่ยน

### 3.10 Filter Tabs + Pagination

| | MT | BP | เป้าหมาย |
|---|---|---|---|
| **Filter Tabs** | ✅ 4 tabs | ❌ ไม่มี | ✅ **ทั้งสองต้องมี** |
| **Pagination** | ✅ 10/page | ❌ ไม่มี | ✅ **ทั้งสองต้องมี** |

**การเปลี่ยนแปลง:**
- **BP เพิ่ม:** Filter tabs (ทั้งหมด / สำเร็จ / รอดำเนินการ / พักรายการ)
- **BP เพิ่ม:** Pagination (10 items per page)
- **MT:** ไม่ต้องเปลี่ยน

### 3.11 Step 1 Completion

| | MT | BP | เป้าหมาย |
|---|---|---|---|
| **เงื่อนไข** | Checklist 4 ข้อ | เงื่อนไข 1 ข้อ | **Checklist 4 ข้อ ทั้งสอง** |

**Checklist เป้าหมาย (ทั้งสอง service):**
1. ✅/❌ ตั้ง Opening Balance แล้ว
2. ✅/❌ มีรายการอย่างน้อย 1 รายการ
3. ✅/❌ ไม่มีรายการ Draft ค้าง (แสดงจำนวนที่เหลือ)
4. ✅/❌ ไม่มีรายการ On Hold ค้าง

**การเปลี่ยนแปลง:**
- **BP เพิ่ม:** Checklist component แบบเดียวกับ MT
- **BP เปลี่ยน:** ปุ่มจาก "ไปขั้นตอนที่ 2 →" → "ยืนยันบันทึกรายการ → ตรวจนับเงินสด" (ข้อความสอดคล้องกัน)
- **MT:** ไม่ต้องเปลี่ยน

---

## 4. การตรวจนับเงินสด (Cash Verification — Step 2) — Manager

### สถานะปัจจุบัน

| | MT | BP |
|---|---|---|
| **UI** | Table-based component | Inline card/form |
| **Diff** | Column ใน table | Inline ข้าง input |
| **Notes** | แสดงเมื่อมี discrepancy | แสดงเสมอ |

### ✅ คำแนะนำ: ใช้ Table-based + Notes เสมอ

**เหตุผล:**
- Table layout อ่านง่ายกว่า เทียบตัวเลขได้ชัดเจน (Expected / นับจริง / ส่วนต่าง)
- Notes แสดงเสมอ → ผู้ใช้ไม่ถูก surprise เมื่อมี discrepancy

**การเปลี่ยนแปลง:**

| ฝั่ง | การเปลี่ยนแปลง |
|---|---|
| **ทั้งสอง** | สร้าง **shared component** `CashVerificationTable.vue` (generic) |
| **BP ปรับ** | เปลี่ยนจาก inline form → ใช้ `CashVerificationTable` |
| **MT ปรับ** | Refactor `MoneyTransferCashVerificationTable` → ใช้ generic `CashVerificationTable` |

**CashVerificationTable Props:**
```typescript
interface CashVerificationRow {
  label: string           // "A. เงินสดโอน/ถอน" หรือ "A. เงินสดรับชำระบิล"
  expected: number
  actual: number | null   // null = input mode, number = read-only
  readOnly?: boolean      // true สำหรับแถว info-only (เช่น ค่าบริการโอน)
}
```

**Notes Textarea:**
- แสดงเสมอทั้งสอง service
- `required` เฉพาะเมื่อมี discrepancy
- Placeholder: "ระบุสาเหตุของส่วนต่าง เช่น เงินสดขาด X บาท เนื่องจาก..."

---

## 5. การตรวจสอบ Auditor (Audit Review)

### 5.1 หน้าที่ใช้

| เป้าหมาย | รายละเอียด |
|---|---|
| **Single Page** | ตามแนวทางข้อ 1 — Auditor ทำงานในหน้าเดียวกับ Service (section แสดงตาม role) |

**BP ปรับ:** ย้าย logic จาก `auditor-review.vue` → `AuditorReviewSection` component ใน single page

### 5.2 Balance Snapshot

| | MT | BP | เป้าหมาย |
|---|---|---|---|
| **มี/ไม่มี** | ✅ 3 cards (Opening→Net Change→Closing) | ❌ ไม่มี | ✅ **ทั้งสองต้องมี** |

**การเปลี่ยนแปลง:**
- **Refactor** `MoneyTransferBalanceSnapshot` → generic `BalanceSnapshot.vue`
- **BP เพิ่ม:** ใช้ `BalanceSnapshot` แสดง Opening → Net Change → Expected Closing
- **BP:** Net Change = +รับชำระ (completed) - ค่าธรรมเนียม (ถ้ามีไหลออก) ตามธรรมชาติของบริการ

### 5.3 Bank Statement

| เป้าหมาย | รายละเอียด |
|---|---|
| **ทั้งสอง** | ใส่ยอด Bank Statement + เปรียบเทียบกับ **Expected Closing Balance** (ยอดปิดบัญชีที่คาดหวัง) |

**BP ปรับ:** เปลี่ยนจากเทียบกับ actual cash → เทียบกับ expected closing balance (สอดคล้องกับ MT)

### 5.4 การตรวจ Transaction

| | MT | BP | เป้าหมาย |
|---|---|---|---|
| **วิธีตรวจ** | Toggle "มีปัญหา" + Eye icon | Checkbox per row | **Toggle "มีปัญหา" + Eye icon (ทั้งสอง)** |

**เหตุผล:** Toggle "มีปัญหา" ชัดเจนกว่า checkbox — ตั้งต้นว่า "ปกติ" แล้วกดเมื่อพบปัญหา (positive default)

**การเปลี่ยนแปลง:**
- **BP ปรับ:** เปลี่ยนจาก checkbox → toggle "มีปัญหา" per row + eye icon view details
- **สร้าง shared pattern:** Transaction row ที่มี toggle + eye icon

### 5.5 Cash Verification (Auditor)

| | MT | BP | เป้าหมาย |
|---|---|---|---|
| **Auditor นับเงินเอง** | ✅ ใช่ (5-col table) | ❌ ดูอย่างเดียว | ✅ **ทั้งสองต้องให้ Auditor นับเอง** |

**เหตุผล:** Auditor นับเงินสดเองเป็น **double verification** ที่สำคัญ — ไม่ควรแค่ดูผลของ Manager

**การเปลี่ยนแปลง:**
- **BP เพิ่ม:** Auditor Cash Count inputs ใน cash verification section
- **BP ปรับ type:** เพิ่ม `auditorActualBillPaymentCash`, `auditorActualServiceFeeCash` ใน `BillPaymentDailySummary`
- **BP ปรับ store:** `submitAudit()` ส่ง auditor cash counts ด้วย
- **ทั้งสอง:** ใช้ `CashVerificationTable` แบบ 5 คอลัมน์ (คาดหวัง / Manager นับ / Auditor นับ / ส่วนต่าง / แสดงผล)

### 5.6 ปุ่ม Action + Outcome States

| | MT (ปัจจุบัน) | BP (ปัจจุบัน) | เป้าหมาย |
|---|---|---|---|
| **ปุ่ม** | 2 (ผ่าน / ส่งคืน) | 3 (ผ่าน / ผ่าน+หมายเหตุ / ส่งคืน) | **3 ปุ่ม (ทั้งสอง)** |
| **Outcomes** | `audited`, `needs_correction` | `audited`, `audited_with_issues`, `needs_correction` | **3 outcomes (ทั้งสอง)** |

**เหตุผล:** 3 outcomes ของ BP ละเอียดกว่า — Owner ควรรู้ว่า Auditor พบปัญหาหรือไม่

**การเปลี่ยนแปลง:**
- **MT เพิ่ม:** ปุ่ม "ยืนยันพร้อมหมายเหตุ" (ระหว่าง ส่งคืน กับ ยืนยัน)
- **MT เพิ่ม:** Workflow status `audited_with_issues`
- **MT ปรับ type:** เพิ่ม `audited_with_issues` ใน WorkflowStatus
- **MT ปรับ store:** `submitAudit()` รองรับ 3 outcomes

---

## 6. การอนุมัติ Owner (Owner Approval)

### 6.1 หน้าที่ใช้

ตามแนวทางข้อ 1 — **Single Page** ทั้งสอง (Owner approval เป็น section ใน index.vue)

**BP ปรับ:** ย้าย logic จาก `owner-approval.vue` → `OwnerApprovalSection` component

### 6.2 การแสดง Step Summary

| | MT | BP | เป้าหมาย |
|---|---|---|---|
| **Layout** | Collapsed read-only | 3 Expandable cards + stats | **Expandable cards + stats (ของ BP)** |

**เหตุผล:** BP ทำได้ดีกว่า MT ตรงนี้ — Expandable cards พร้อม summary stats ให้ Owner เห็นภาพรวมก่อนเปิดดูรายละเอียด

**การเปลี่ยนแปลง:**
- **MT ปรับ:** เปลี่ยนจาก collapsed → Expandable cards พร้อม summary stats
  - **Step 1 Card:** จำนวนรายการ, ยอดรวม, ค่าบริการ + expandable transaction table
  - **Step 2 Card:** ผลตรวจนับ + badge (ตรงกัน/มีส่วนต่าง) + expandable details
  - **Audit Card:** ผลตรวจสอบ + badge + expandable findings
- **BP:** ใช้เป็น reference pattern ที่ดีอยู่แล้ว
- **สร้าง shared component:** `WorkflowStepSummaryCard.vue` (expandable card with header badge + summary stats)

### 6.3 Decision Options + "ขอให้แก้ไข" Condition

| | MT | BP | เป้าหมาย |
|---|---|---|---|
| **ตัวเลือก** | 3 (เหมือนกัน) | 3 (เหมือนกัน) | **3 ตัวเลือก (ทั้งสอง) — เหมือนเดิม** |
| **"ขอแก้ไข"** | ใช้ได้เสมอ | เฉพาะ `audited_with_issues` | **ใช้ได้เสมอ (ทั้งสอง)** |

**เหตุผล:** Owner ควรมีอำนาจส่งกลับแก้ไขได้ตลอด ไม่ว่า Auditor จะพบปัญหาหรือไม่ — Owner อาจพบปัญหาเองที่ Auditor ไม่เห็น

**การเปลี่ยนแปลง:**
- **BP ปรับ:** ลบเงื่อนไข disabled ออกจากปุ่ม "ขอให้แก้ไข"

### 6.4 UI Layout

| | MT | BP | เป้าหมาย |
|---|---|---|---|
| **Design** | Form-based inline | 3-column radio card | **3-column radio card (ของ BP)** |

**เหตุผล:** Radio card ของ BP สวยงามและชัดเจนกว่า — visual distinct ระหว่าง 3 ตัวเลือก

**การเปลี่ยนแปลง:**
- **MT ปรับ:** เปลี่ยนจาก form-based → 3-column radio card selection (green/blue/red borders)
- **สร้าง shared component:** `OwnerDecisionCard.vue` (3-column radio card + notes textarea + submit button)

---

## 7. Workflow Status

### เป้าหมาย: Unified Workflow Status (ทั้งสอง service)

```
step1_in_progress      ← Manager กำลังบันทึก
step1_completed        ← Manager บันทึกเสร็จ (รอตรวจนับ)
step2_completed        ← Manager ตรวจนับเสร็จ (ไม่มี discrepancy)
step2_completed_with_notes  ← Manager ตรวจนับเสร็จ (มี discrepancy + notes)
audited                ← Auditor ตรวจผ่าน
audited_with_issues    ← Auditor ตรวจผ่าน (มีหมายเหตุ/ปัญหา)
approved               ← Owner อนุมัติ
approved_with_notes    ← Owner อนุมัติ (มีหมายเหตุ)
needs_correction       ← ส่งกลับแก้ไข
```

**การเปลี่ยนแปลง:**

| Status | MT (ปัจจุบัน) | MT (เป้าหมาย) | BP (ปัจจุบัน) | BP (เป้าหมาย) |
|---|---|---|---|---|
| `step1_in_progress` | ✅ มี | ✅ คงเดิม | ✅ มี | ✅ คงเดิม |
| `step1_completed` | ✅ มี | ✅ คงเดิม | ❌ ไม่มี | ✅ **เพิ่ม** |
| `step2_completed` | ✅ มี | ✅ คงเดิม | ✅ มี | ✅ คงเดิม |
| `step2_completed_with_notes` | ❌ ไม่มี | ✅ **เพิ่ม** | ✅ มี | ✅ คงเดิม |
| `audited` | ✅ มี | ✅ คงเดิม | ✅ มี | ✅ คงเดิม |
| `audited_with_issues` | ❌ ไม่มี | ✅ **เพิ่ม** | ✅ มี | ✅ คงเดิม |
| `approved` | ✅ มี | ✅ คงเดิม | ✅ มี | ✅ คงเดิม |
| `approved_with_notes` | ❌ ไม่มี | ✅ **เพิ่ม** | ✅ มี | ✅ คงเดิม |
| `needs_correction` | ✅ มี | ✅ คงเดิม | ✅ มี | ✅ คงเดิม |

**สร้าง shared type:**
```typescript
// types/shared-workflow.ts
type UnifiedWorkflowStatus =
  | 'step1_in_progress'
  | 'step1_completed'
  | 'step2_completed'
  | 'step2_completed_with_notes'
  | 'audited'
  | 'audited_with_issues'
  | 'approved'
  | 'approved_with_notes'
  | 'needs_correction'
```

**MT เพิ่ม:** 3 status ใหม่ (`step2_completed_with_notes`, `audited_with_issues`, `approved_with_notes`)
**BP เพิ่ม:** 1 status ใหม่ (`step1_completed`)

---

## 8. Components — แผนสร้าง Shared Components

### Shared Components ใหม่ที่ต้องสร้าง

| Component | ใช้ใน | Refactor จาก |
|---|---|---|
| `components/shared/WorkflowProgressBar.vue` | MT + BP | MT `WorkflowProgressBar.vue` |
| `components/shared/QuickGlanceSummary.vue` | MT + BP | MT `QuickGlanceSummary.vue` |
| `components/shared/CompactBalanceSummary.vue` | MT + BP | MT `CompactBalanceSummary.vue` |
| `components/shared/BalanceSnapshot.vue` | MT + BP | MT `MoneyTransferBalanceSnapshot.vue` |
| `components/shared/CashVerificationTable.vue` | MT + BP | MT `MoneyTransferCashVerificationTable.vue` |
| `components/shared/TransactionTable.vue` | MT + BP | MT `MoneyTransferTransactionTable.vue` |
| `components/shared/OwnerDecisionCard.vue` | MT + BP | BP `owner-approval.vue` (inline) |
| `components/shared/WorkflowStepSummaryCard.vue` | MT + BP | BP `owner-approval.vue` (inline) |

### BP Dedicated Components ใหม่ที่ต้องสร้าง

| Component | หน้าที่ |
|---|---|
| `components/bill-payment/TransactionForm.vue` | Modal form (แยกจาก page inline) |
| `components/bill-payment/ManagerRecordingSection.vue` | Step 1 recording section |
| `components/bill-payment/CashVerificationSection.vue` | Step 2 cash count section |
| `components/bill-payment/AuditorReviewSection.vue` | Auditor review section |
| `components/bill-payment/OwnerApprovalSection.vue` | Owner approval section |

### MT Components ที่ต้อง Refactor

| Component ปัจจุบัน | การเปลี่ยนแปลง |
|---|---|
| `WorkflowProgressBar.vue` | → ย้ายไป shared + ทำเป็น generic |
| `QuickGlanceSummary.vue` | → ย้ายไป shared + ทำเป็น generic |
| `CompactBalanceSummary.vue` | → ย้ายไป shared + ทำเป็น generic |
| `MoneyTransferBalanceSnapshot.vue` | → ย้ายไป shared (rename) |
| `MoneyTransferCashVerificationTable.vue` | → ย้ายไป shared (rename + generic) |
| `MoneyTransferTransactionTable.vue` | → ย้ายไป shared (rename + generic) |
| `TransactionForm.vue` | คงอยู่ใน `money-transfer/` (เฉพาะ MT) |
| `ChannelSelector.vue` | คงอยู่ใน `money-transfer/` (เฉพาะ MT) |
| `BankAccountFields.vue` | คงอยู่ใน `money-transfer/` (เฉพาะ MT) |
| `PromptPayFields.vue` | คงอยู่ใน `money-transfer/` (เฉพาะ MT) |
| `TransactionTypeSelector.vue` | คงอยู่ using service-specific options |
| `BalanceDisplay.vue` | ประเมินว่ายังจำเป็นหรือไม่หลัง refactor |

---

## 9. Data Model — การปรับ Types

### 9.1 Shared Types ใหม่

```typescript
// types/shared-workflow.ts (ใหม่)

// Unified workflow status
type UnifiedWorkflowStatus = 
  | 'step1_in_progress' | 'step1_completed'
  | 'step2_completed' | 'step2_completed_with_notes'
  | 'audited' | 'audited_with_issues'
  | 'approved' | 'approved_with_notes'
  | 'needs_correction'

// Unified transaction status
type UnifiedTransactionStatus = 'completed' | 'draft' | 'on_hold' | 'cancelled'
```

### 9.2 Bill Payment Type Changes

| Type | Field | เปลี่ยนอะไร |
|---|---|---|
| `BillPaymentTransaction` | `status` | `'success' \| 'failed'` → `'completed' \| 'draft' \| 'on_hold' \| 'cancelled'` |
| `BillPaymentTransaction` | เพิ่ม `draftReason?` | สำหรับระบบ Draft |
| `BillPaymentTransaction` | เพิ่ม `statusNote?` | สำหรับ status change reason |
| `BillPaymentTransaction` | เพิ่ม `balanceImpact?` | สำหรับ balance tracking |
| `BillPaymentWorkflowStatus` | เพิ่ม `step1_completed` | workflow status ใหม่ |
| `BillPaymentDailySummary` | เพิ่ม `auditorActualBillPaymentCash?` | Auditor นับเงินเอง |
| `BillPaymentDailySummary` | เพิ่ม `auditorActualServiceFeeCash?` | Auditor นับเงินเอง |
| `BillPaymentBalance` | ไม่เปลี่ยนโครงสร้าง | คงเดิม (3 balances เหมาะกับบริการ) |

### 9.3 Money Transfer Type Changes

| Type | Field | เปลี่ยนอะไร |
|---|---|---|
| `MoneyTransferWorkflowStatus` | เพิ่ม `step2_completed_with_notes` | workflow status ใหม่ |
| `MoneyTransferWorkflowStatus` | เพิ่ม `audited_with_issues` | workflow status ใหม่ |
| `MoneyTransferWorkflowStatus` | เพิ่ม `approved_with_notes` | workflow status ใหม่ |
| `MoneyTransferDailySummary` | เพิ่ม fields สำหรับ correction tracking | `correctionNotes`, `correctionRequestedAt`, `correctionRequestedBy` |

### 9.4 สิ่งที่ไม่ต้องเปลี่ยน (เฉพาะแต่ละ service)

| MT เฉพาะ (คงเดิม) | BP เฉพาะ (คงเดิม) |
|---|---|
| `channel` (bank/promptpay/other) | `billType` (utility/telecom/insurance/other) |
| Channel sub-fields | `customerName` |
| `commissionType` (cash/transfer) | Commission เป็นเงินสดเท่านั้น |
| `TransactionType` (transfer/withdrawal/deposit) | `TransactionType` (bill_payment/deposit) |
| 4 balance fields | 3 balance fields |

---

## 10. ความแตกต่างตาม Role — เป้าหมายให้สอดคล้อง

### Manager/AM — Unified Experience

| Feature | MT (เป้าหมาย) | BP (เป้าหมาย) | Notes |
|---|---|---|---|
| Opening Balance | ✅ มี | ✅ **เพิ่ม** | |
| Balance Cards | Compact expandable | Compact expandable (**ปรับ**) | Shared component |
| Progress Bar | ✅ มี | ✅ **เพิ่ม** | Shared component |
| Quick Glance | ✅ มี | ✅ **เพิ่ม** | Shared component |
| Quick Actions | ✅ มี | ✅ **เพิ่ม** | ปุ่มลัดตามประเภท transaction |
| Favorites | ✅ มี | ✅ **เพิ่ม** | |
| Draft System | ✅ มี | ✅ **เพิ่ม** | |
| Status Change | ✅ มี | ✅ **เพิ่ม** | |
| Filter/Pagination | ✅ มี | ✅ **เพิ่ม** | |
| Checklist 4 ข้อ | ✅ มี | ✅ **เพิ่ม** | |
| Cash Verification | Table-based | Table-based (**ปรับ**) | Shared component |
| Auto Commission | ✅ มี | ✅ **เพิ่ม** | useCommission composable |

### Auditor — Unified Experience

| Feature | MT (เป้าหมาย) | BP (เป้าหมาย) | Notes |
|---|---|---|---|
| Same Page | ✅ คงเดิม | ✅ **ปรับ** (ย้ายมา single page) | |
| Balance Snapshot | ✅ มี | ✅ **เพิ่ม** | Shared component |
| Bank Statement | เทียบ closing balance | เทียบ closing balance (**ปรับ**) | สอดคล้องกัน |
| Txn Toggle | "มีปัญหา" toggle | "มีปัญหา" toggle (**ปรับ**) | |
| Cash Count | Auditor นับเอง | Auditor นับเอง (**เพิ่ม**) | |
| 3 Outcomes | ✅ **เพิ่ม** | ✅ คงเดิม | audited/audited_with_issues/needs_correction |
| 3 Action Buttons | ✅ **เพิ่ม** | ✅ คงเดิม | |

### Owner — Unified Experience

| Feature | MT (เป้าหมาย) | BP (เป้าหมาย) | Notes |
|---|---|---|---|
| Same Page | ✅ คงเดิม | ✅ **ปรับ** (ย้ายมา single page) | |
| Expandable Cards | ✅ **ปรับ** (จาก collapsed) | ✅ คงเดิม | Shared component |
| Radio Card Decision | ✅ **ปรับ** (จาก form) | ✅ คงเดิม | Shared component |
| "ขอแก้ไข" | ✅ ใช้ได้เสมอ | ✅ **ปรับ** (ลบเงื่อนไข) | |

---

## 11. สรุปการเปลี่ยนแปลงทั้งหมด

### สรุปจำนวนการเปลี่ยนแปลงแต่ละฝั่ง

| หมวด | MT ต้องเปลี่ยน | BP ต้องเปลี่ยน |
|---|---|---|
| **Page Architecture** | Refactor index.vue → sub-components | รวม 3 หน้าเป็น 1 + sub-components |
| **History** | เพิ่ม backdated warning | ปรับ navigation ไป URL เดียว |
| **Manager Features** | — | เพิ่ม Opening Balance, Draft, Favorites, Status Change, Filters, Pagination, Checklist, Quick Actions, Progress Bar, Quick Glance |
| **Cash Verification** | Refactor → shared component | เปลี่ยน UI → shared component + เพิ่ม notes เสมอ |
| **Auditor** | เพิ่ม "ยืนยันพร้อมหมายเหตุ" + audited_with_issues | เพิ่ม Balance Snapshot, Auditor cash count, Toggle txn |
| **Owner** | ปรับ collapsed→expandable cards, ปรับ form→radio card | ลบเงื่อนไข "ขอแก้ไข" |
| **Workflow Status** | เพิ่ม 3 status ใหม่ | เพิ่ม 1 status ใหม่ (step1_completed) |
| **Components** | Refactor 6 components → shared | สร้าง 5 dedicated + ใช้ 8 shared |
| **Types** | เพิ่ม 3 workflow status + correction fields | เปลี่ยน transaction status + เพิ่ม draft/on_hold fields + auditor cash fields |

### Impact Assessment

| ฝั่ง | ขนาดการเปลี่ยนแปลง | ความเสี่ยง |
|---|---|---|
| **MT** | ปานกลาง — ส่วนใหญ่เป็น refactor + เพิ่ม feature เล็กน้อย | ต่ำ-ปานกลาง (refactor อาจ introduce regression) |
| **BP** | ใหญ่ — เปลี่ยนโครงสร้าง + เพิ่ม feature จำนวนมาก | ปานกลาง-สูง (architecture change + data migration) |
| **Shared** | ใหญ่ — สร้าง 8 shared components ใหม่ | ต่ำ (components ใหม่ ไม่กระทบของเดิม) |

### Data Migration Required

- **BP:** `success` → `completed`, `failed` → `cancelled` ใน Firestore
- **MT:** ไม่ต้อง migrate ข้อมูลเดิม (เพิ่ม status ใหม่ backward compatible)

---

## 12. ลำดับการดำเนินงาน — Task Prompts

> **กฎ:** 1 Task = 1 Chat Session (Context Window เพียงพอ)  
> **แต่ละ Task มี Prompt สำเร็จรูป** พร้อม context ที่ต้องการสำหรับการ implement

---

### Phase 1: Foundation — Shared Types + Shared Components

---

#### Task 1.1: สร้าง Shared Workflow Types

**Skill:** `create-implementation-plan`

```
ฉันต้องการให้สร้าง shared type file สำหรับ Unified Workflow System ที่ใช้ร่วมกันระหว่าง Money Transfer และ Bill Payment

อ่านไฟล์ต่อไปนี้เพื่อเข้าใจ types ปัจจุบัน:
- types/bill-payment.ts (ดู BillPaymentWorkflowStatus, BillPaymentTransaction status)
- types/repositories.ts (ดู MoneyTransfer workflow types, transaction status)

สร้างไฟล์ใหม่: types/shared-workflow.ts

เนื้อหาที่ต้องสร้าง:

1. UnifiedWorkflowStatus type:
   'step1_in_progress' | 'step1_completed' | 'step2_completed' | 'step2_completed_with_notes' | 'audited' | 'audited_with_issues' | 'approved' | 'approved_with_notes' | 'needs_correction'

2. UnifiedTransactionStatus type:
   'completed' | 'draft' | 'on_hold' | 'cancelled'

3. WorkflowStatusConfig interface:
   - label: string (Thai)
   - colorClass: string (Tailwind)
   - badgeVariant: 'success' | 'warning' | 'error' | 'info' | 'default'

4. WORKFLOW_STATUS_MAP: Record<UnifiedWorkflowStatus, WorkflowStatusConfig>
   - step1_in_progress: "กำลังบันทึก", yellow
   - step1_completed: "รอตรวจนับ", blue
   - step2_completed: "รอตรวจสอบ", blue
   - step2_completed_with_notes: "รอตรวจสอบ (มีหมายเหตุ)", blue
   - audited: "ตรวจสอบแล้ว", indigo
   - audited_with_issues: "ตรวจสอบแล้ว (มีปัญหา)", orange
   - approved: "อนุมัติแล้ว", green
   - approved_with_notes: "อนุมัติแล้ว (มีหมายเหตุ)", green
   - needs_correction: "ส่งกลับแก้ไข", red

5. TRANSACTION_STATUS_MAP: Record<UnifiedTransactionStatus, { label: string, badgeVariant: string }>

6. Helper functions:
   - getWorkflowStatusConfig(status): WorkflowStatusConfig
   - getTransactionStatusConfig(status): TransactionStatusConfig
   - formatDiff(diff: number | null): string (shared between both services)

จากนั้นปรับ types/bill-payment.ts ให้ import และใช้ UnifiedWorkflowStatus (เพิ่ม step1_completed)
และปรับ types/repositories.ts ให้ import และใช้ UnifiedWorkflowStatus (เพิ่ม step2_completed_with_notes, audited_with_issues, approved_with_notes)

หลังสร้างเสร็จ ให้ตรวจสอบว่าไม่มี TypeScript errors

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 7, 9)
```

---

#### Task 1.2: สร้าง Shared WorkflowProgressBar Component

**Skill:** `refactor`

```
ฉันต้องการ refactor component WorkflowProgressBar จาก Money Transfer ให้เป็น generic shared component

อ่านไฟล์ปัจจุบัน:
- components/money-transfer/WorkflowProgressBar.vue

สิ่งที่ต้องทำ:
1. สร้าง components/shared/WorkflowProgressBar.vue (generic version)
   - Props:
     - steps: Array<{ label: string, key: string }> (รับ config เป็น prop แทน hardcode)
     - currentStatus: UnifiedWorkflowStatus
     - statusToStepMap: Record<UnifiedWorkflowStatus, number> (mapping status → active step index)
   - ตัว component แสดง visual step indicator เหมือนเดิม
   - Color logic: Completed (green) | Active (amber pulsing) | Pending (gray) | Error (red)

2. ปรับ money-transfer-service/index.vue ให้ import จาก shared แทน
   - ส่ง steps config: [{label:'บันทึก', key:'record'}, {label:'ตรวจนับ', key:'verify'}, {label:'Auditor', key:'audit'}, {label:'Owner', key:'approve'}]

3. ตรวจสอบว่า Money Transfer ทำงานได้เหมือนเดิม (behavior preserved)

หลัง refactor เสร็จ ลบ components/money-transfer/WorkflowProgressBar.vue ตัวเดิมออก (ถ้าไม่มีที่อื่นใช้)

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 3.3, 8)
```

---

#### Task 1.3: สร้าง Shared QuickGlanceSummary Component

**Skill:** `refactor`

```
ฉันต้องการ refactor component QuickGlanceSummary จาก Money Transfer ให้เป็น generic shared component

อ่านไฟล์ปัจจุบัน:
- components/money-transfer/QuickGlanceSummary.vue
- types/shared-workflow.ts (สร้างจาก Task 1.1)

สิ่งที่ต้องทำ:
1. สร้าง components/shared/QuickGlanceSummary.vue (generic version)
   - Props:
     - date: string
     - totalTransactions: number
     - successCount: number
     - totalCommission: number
     - workflowStatus: UnifiedWorkflowStatus
     - customLabel?: string (optional, สำหรับ label custom เช่น "ค่าธรรมเนียม" แทน "ค่าบริการ")
   - ใช้ WORKFLOW_STATUS_MAP จาก shared-workflow.ts สำหรับ status badge
   - แสดง: 📅 [Date] · [totalTransactions] รายการ · สำเร็จ [successCount] · [customLabel] [formatCurrency(totalCommission)]

2. ปรับ money-transfer-service/index.vue ให้ import จาก shared แทน

3. ตรวจสอบว่า Money Transfer ทำงานได้เหมือนเดิม

หลัง refactor เสร็จ ลบ components/money-transfer/QuickGlanceSummary.vue ตัวเดิม

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 3.4, 8)
```

---

#### Task 1.4: สร้าง Shared CompactBalanceSummary Component

**Skill:** `refactor`

```
ฉันต้องการ refactor component CompactBalanceSummary จาก Money Transfer ให้เป็น generic shared component

อ่านไฟล์ปัจจุบัน:
- components/money-transfer/CompactBalanceSummary.vue

สิ่งที่ต้องทำ:
1. สร้าง components/shared/CompactBalanceSummary.vue (generic version)
   - Props:
     - primaryCards: Array<{ label: string, value: number, icon?: string, colorClass?: string, subtitle?: string }>
     - secondaryCards?: Array<{ label: string, value: number, icon?: string, colorClass?: string }> (expandable)
     - collapsible: boolean (default true)
     - defaultExpanded: boolean (default false)
   - Layout: แถวบน (primary) แสดงเสมอ + แถวล่าง (secondary) ซ่อน/แสดงได้
   - ปุ่ม "▲ ย่อ" / "▼ ขยาย" toggle

2. ปรับ money-transfer-service/index.vue ให้ import จาก shared แทน
   - ส่ง primaryCards: [เงินเริ่มต้น, รวมเงินโอน, เงินบัญชีคงเหลือ, เงินสดคงเหลือ]
   - ส่ง secondaryCards: [รวมเงินฝาก, รวมเงินถอน, ค่าบริการ(สด), ค่าบริการ(โอน)]

3. ตรวจสอบว่า Money Transfer ทำงานได้เหมือนเดิม

หลัง refactor เสร็จ ลบ components/money-transfer/CompactBalanceSummary.vue ตัวเดิม

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 3.2, 8)
```

---

#### Task 1.5: สร้าง Shared BalanceSnapshot Component

**Skill:** `refactor`

```
ฉันต้องการ refactor component MoneyTransferBalanceSnapshot จาก Money Transfer ให้เป็น generic shared component

อ่านไฟล์ปัจจุบัน:
- components/money-transfer/MoneyTransferBalanceSnapshot.vue

สิ่งที่ต้องทำ:
1. สร้าง components/shared/BalanceSnapshot.vue (generic version)
   - Props:
     - openingBalance: number
     - closingBalance: number
     - netChangeLabel?: string (default "สุทธิระหว่างวัน")
   - Computed: netChange = closingBalance - openingBalance
   - Layout: 3 cards (Opening → Net Change → Closing)
   - Color: Opening (blue), Net Change (green if +, red if -), Closing (gray)
   - Slot: default slot ด้านล่าง (สำหรับ bank statement input)

2. ปรับ money-transfer-service/index.vue ให้ import จาก shared แทน

3. ตรวจสอบว่า Money Transfer ทำงานได้เหมือนเดิม

หลัง refactor เสร็จ ลบ components/money-transfer/MoneyTransferBalanceSnapshot.vue ตัวเดิม

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 5.2, 8)
```

---

#### Task 1.6: สร้าง Shared CashVerificationTable Component

**Skill:** `refactor`

```
ฉันต้องการ refactor component MoneyTransferCashVerificationTable จาก Money Transfer ให้เป็น generic shared component

อ่านไฟล์ปัจจุบัน:
- components/money-transfer/MoneyTransferCashVerificationTable.vue

สิ่งที่ต้องทำ:
1. สร้าง components/shared/CashVerificationTable.vue (generic version)
   - Props:
     - rows: Array<CashVerificationRow>
       interface CashVerificationRow {
         label: string           // "A. เงินสดโอน/ถอน"
         expected: number
         managerActual: number | null   // null = ยังไม่กรอก
         auditorActual?: number | null  // optional, สำหรับ auditor view
         readOnly?: boolean             // true = แถว info-only (ไม่มี input)
       }
     - mode: 'manager-input' | 'manager-readonly' | 'auditor-input' | 'auditor-readonly' | 'full-readonly'
     - showTotal: boolean (default true)
   - Modes:
     - manager-input: 3 columns (คาดหวัง | Manager นับ [input] | ส่วนต่าง)
     - manager-readonly: 3 columns (คาดหวัง | Manager นับ | ส่วนต่าง)
     - auditor-input: 5 columns (คาดหวัง | Manager นับ | Auditor นับ [input] | ส่วนต่าง | แสดงผล)
     - auditor-readonly / full-readonly: 5 columns read-only
   - Emits: update:managerActual(rowIndex, value), update:auditorActual(rowIndex, value)
   - Total row: แสดง sum ของแต่ละ column + badge "✅ ตรงกัน" หรือ "⚠️ มีส่วนต่าง"

2. ปรับ money-transfer-service/index.vue ให้ import จาก shared แทน (ทั้ง Manager Step 2 และ Auditor section)

3. ตรวจสอบว่า Money Transfer ทำงานได้เหมือนเดิมทั้ง Manager view และ Auditor view

หลัง refactor เสร็จ ลบ components/money-transfer/MoneyTransferCashVerificationTable.vue ตัวเดิม

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 4, 5.5, 8)
```

---

#### Task 1.7: สร้าง Shared TransactionTable Component

**Skill:** `refactor`

```
ฉันต้องการ refactor component MoneyTransferTransactionTable จาก Money Transfer ให้เป็น generic shared component

อ่านไฟล์ปัจจุบัน:
- components/money-transfer/MoneyTransferTransactionTable.vue

สิ่งที่ต้องทำ:
1. สร้าง components/shared/TransactionTable.vue (generic version)
   - Props:
     - transactions: Array<any> (generic transaction array)
     - columns: Array<TableColumn>
       interface TableColumn {
         key: string
         label: string
         align?: 'left' | 'center' | 'right'
         formatter?: (value: any, row: any) => string
         component?: string  // slot name for custom rendering
       }
     - issuedIds?: Set<string> (optional, สำหรับ auditor toggle "มีปัญหา")
     - emptyMessage?: string
     - indexOffset?: number (default 0)
     - showPagination?: boolean (default false)
     - pageSize?: number (default 10)
     - showFilterTabs?: boolean (default false)
     - filterTabs?: Array<{ key: string, label: string, count?: number }> (สำหรับ filter tabs)
   - Emits: row-click, toggle-issue(id), page-change(page)
   - Slots: action-header, actions (per-row), empty
   - Features:
     - Pagination (showPagination=true)
     - Filter tabs (showFilterTabs=true)
     - Issue toggle per row (issuedIds provided)

2. ปรับ money-transfer-service/index.vue ให้ import จาก shared แทน

3. ตรวจสอบว่า Money Transfer ทำงานได้เหมือนเดิมทุก view

หลัง refactor เสร็จ ลบ components/money-transfer/MoneyTransferTransactionTable.vue ตัวเดิม

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 8)
```

---

#### Task 1.8: สร้าง Shared OwnerDecisionCard + WorkflowStepSummaryCard

**Skill:** `refactor`

```
ฉันต้องการสร้าง 2 shared components ใหม่ โดยอ้างอิงจาก Bill Payment owner-approval.vue

อ่านไฟล์ปัจจุบัน:
- pages/finance/bill-payment-service/owner-approval.vue (ดู decision radio cards + expandable step summaries)
- pages/finance/money-transfer-service/index.vue (ดู Owner approval section)

สิ่งที่ต้องทำ:

### Component 1: components/shared/OwnerDecisionCard.vue
   - Props:
     - modelValue: 'approved' | 'approved_with_notes' | 'needs_correction' | null
     - disableCorrection?: boolean (default false)
     - isSubmitting?: boolean (default false)
   - Emits: update:modelValue, submit(decision, notes)
   - Layout:
     - 3-column radio card selection:
       1. "อนุมัติ ✅" (green border) — value: 'approved'
       2. "อนุมัติพร้อมหมายเหตุ" (blue border) — value: 'approved_with_notes'
       3. "ขอให้แก้ไข" (red border) — value: 'needs_correction'
     - Conditional notes textarea (เมื่อเลือก approved_with_notes หรือ needs_correction)
     - Submit button (label/variant เปลี่ยนตาม decision)
   - UI อ้างอิงจาก BP owner-approval.vue

### Component 2: components/shared/WorkflowStepSummaryCard.vue
   - Props:
     - stepNumber: number
     - title: string
     - badge?: { label: string, variant: 'success' | 'warning' | 'error' | 'info' }
     - summaryItems?: Array<{ label: string, value: string | number, colorClass?: string }>
     - defaultExpanded?: boolean (default false)
   - Slots: default (expandable content), header-right (ช่องว่างขวาของ header)
   - Layout:
     - Card header: "[stepNumber] [title]" + badge (right) + chevron toggle
     - Summary items แสดงเป็น inline cards (ถ้ามี)
     - Expandable area: slot content

หลังสร้างเสร็จ ตรวจสอบว่า TypeScript compile ผ่าน

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 6.2, 6.4, 8)
```

---

#### Task 1.9: Unit Tests สำหรับ Shared Components

**Skill:** `unit-test-vue-pinia`

```
ฉันต้องการเขียน unit tests สำหรับ shared components ที่สร้างใน Phase 1

Component ที่ต้องเขียน test:
1. components/shared/WorkflowProgressBar.vue
2. components/shared/QuickGlanceSummary.vue
3. components/shared/CompactBalanceSummary.vue
4. components/shared/BalanceSnapshot.vue
5. components/shared/CashVerificationTable.vue
6. components/shared/TransactionTable.vue
7. components/shared/OwnerDecisionCard.vue
8. components/shared/WorkflowStepSummaryCard.vue

อ่านไฟล์ types/shared-workflow.ts เพื่อเข้าใจ types ที่ใช้

สำหรับแต่ละ component ให้เขียน tests ครอบคลุม:
- Render correctly with minimal props
- Render correctly with all props
- Props variations (เช่น different status, different modes)
- User interactions (click, toggle, expand/collapse)
- Emits events correctly
- Slots render correctly (ถ้ามี)

สร้างไฟล์ test ที่: tests/unit/components/shared/[ComponentName].spec.ts

ใช้ vitest + @vue/test-utils + createTestingPinia
อ่าน vitest.config.ts เพื่อดู test config ปัจจุบัน
อ่าน tests/ directory เพื่อดู pattern ที่ใช้ในโปรเจค

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 8)
```

---

### Phase 2: Money Transfer Improvements

---

#### Task 2.1: MT — Refactor index.vue เป็น Sub-Components

**Skill:** `refactor`

```
ฉันต้องการ refactor pages/finance/money-transfer-service/index.vue (~2,100 บรรทัด) ให้เป็น orchestrator เบาๆ (~300-400 บรรทัด) โดยแยก sections ออกเป็น sub-components

อ่านไฟล์ปัจจุบัน:
- pages/finance/money-transfer-service/index.vue (ทั้งไฟล์)
- stores/money-transfer.ts (ดู state structure)
- composables/useMoneyTransferHelpers.ts

แยกเป็น 4 sub-components:

### 1. components/money-transfer/ManagerRecordingSection.vue
ย้ายส่วน Manager recording ทั้งหมด:
- Opening Balance setup
- Balance Cards (full 8-card view)
- Quick Actions (โปรด, โอน, ถอน, ฝาก)
- Draft Transactions alert
- Transaction Table (with add/edit/delete)
- Step 1 Completion Checklist
- Transaction Form Modal
- Opening Balance Modal
- Favorite Transfer Modal
Props ที่ต้องรับ: date, transactions, balance, summary, permissions
Emits: transaction-created, transaction-updated, transaction-deleted, step1-completed, opening-balance-set

### 2. components/money-transfer/CashVerificationSection.vue
ย้ายส่วน Step 2 Cash Verification:
- Editable form (Manager input)
- Read-only view (หลัง submit)
- Notes textarea
- Submit button
Props: date, summary, balance, expectedAmounts, isEditable
Emits: step2-completed(step2Data)

### 3. components/money-transfer/AuditorReviewSection.vue
ย้ายส่วน Auditor:
- Correction reason banner
- Balance Snapshot + Bank Statement input
- Transaction list with toggle "มีปัญหา"
- Cash Verification Table (5 columns)
- Issue details textarea
- Action buttons (ส่งคืน / ยืนยัน)
Props: date, summary, transactions, balance, isEditable
Emits: audit-submitted(auditData)

### 4. components/money-transfer/OwnerApprovalSection.vue
ย้ายส่วน Owner:
- Step summary cards (ใช้ shared WorkflowStepSummaryCard)
- Decision card (ใช้ shared OwnerDecisionCard)
- Already approved banner
Props: date, summary, transactions, auditResult
Emits: approval-submitted(approvalData)

index.vue เหลือแค่:
- Data fetching (onMounted)
- Role detection (computed)
- Date navigation
- Status banner
- Render sub-components ตาม role + workflow status

⚠️ Golden Rule: Behavior must be preserved — ทุก feature ต้องทำงานเหมือนเดิม 100%
ทดสอบด้วยการรัน dev server และตรวจสอบทุก role

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 1)
```

---

#### Task 2.2: MT — เพิ่ม 3 Workflow Status ใหม่ + Auditor 3rd Outcome

**Skill:** `create-implementation-plan`

```
ฉันต้องการเพิ่ม 3 workflow status ใหม่ให้ Money Transfer และเพิ่ม Auditor outcome ที่ 3

อ่านไฟล์:
- types/shared-workflow.ts
- types/repositories.ts (MoneyTransfer types)
- stores/money-transfer.ts
- server/api/ (ดู money-transfer related API endpoints)
- pages/finance/money-transfer-service/index.vue (หรือ sub-components จาก Task 2.1)
- composables/useMoneyTransferHelpers.ts

สิ่งที่ต้องทำ:

### 1. Types
- ปรับ MoneyTransferWorkflowStatus ให้ใช้ UnifiedWorkflowStatus (เพิ่ม step2_completed_with_notes, audited_with_issues, approved_with_notes)
- เพิ่ม correction tracking fields ใน MoneyTransferDailySummary: correctionNotes?, correctionRequestedAt?, correctionRequestedBy?

### 2. Store (stores/money-transfer.ts)
- ปรับ completeStep2(): ถ้ามี discrepancy → status = 'step2_completed_with_notes' (แทน 'step2_completed')
- ปรับ submitAudit(): รองรับ 3 outcomes:
  - 'audited' (ผ่าน)
  - 'audited_with_issues' (ผ่าน + หมายเหตุ) ← ใหม่
  - 'needs_correction' (ส่งคืน)
- ปรับ submitOwnerApproval(): ถ้า decision = 'approved_with_notes' → status = 'approved_with_notes'

### 3. API (server/api/)
- ปรับ endpoint ที่เกี่ยวข้องให้รองรับ status ใหม่
- ปรับ audit endpoint ให้รับ outcome: 'audited' | 'audited_with_issues' | 'needs_correction'

### 4. UI (AuditorReviewSection.vue)
- เพิ่มปุ่มที่ 3: "⚠️ ยืนยันพร้อมหมายเหตุ" (amber border) ระหว่างปุ่ม "ส่งคืนแก้ไข" กับ "ยืนยันการตรวจสอบ"
- ปุ่มนี้ต้อง: require auditFindings ไม่ว่างเปล่า

### 5. Helpers (useMoneyTransferHelpers.ts)
- ปรับ status mapping functions ให้รองรับ status ใหม่ทั้ง 3

### 6. History Page (money-transfer-history.vue)
- ปรับ Pending Inbox counts: Auditor inbox นับ step2_completed + step2_completed_with_notes + needs_correction
- ปรับ Owner inbox นับ audited + audited_with_issues
- ปรับ status badge colors สำหรับ status ใหม่

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 5.6, 7)
```

---

#### Task 2.3: MT — ปรับ Owner UI (Expandable Cards + Radio Card Decision)

**Skill:** `refactor`

```
ฉันต้องการปรับ Owner Approval section ของ Money Transfer ให้ใช้ UI ใหม่

อ่านไฟล์:
- components/money-transfer/OwnerApprovalSection.vue (จาก Task 2.1)
- components/shared/OwnerDecisionCard.vue (จาก Task 1.8)
- components/shared/WorkflowStepSummaryCard.vue (จาก Task 1.8)
- pages/finance/bill-payment-service/owner-approval.vue (reference UI pattern)

สิ่งที่ต้องทำ:

### 1. ปรับ OwnerApprovalSection.vue
เปลี่ยนจาก collapsed read-only sections → Expandable Summary Cards:

- Step 1 Summary Card (WorkflowStepSummaryCard):
  - stepNumber: 1, title: "Manager บันทึกรายการ"
  - badge: จำนวนรายการ + สำเร็จ
  - summaryItems: [ยอดรวม, ค่าบริการ, รายการ draft/cancelled]
  - expandable: รายการ transaction table

- Step 2 Summary Card (WorkflowStepSummaryCard):
  - stepNumber: 2, title: "Manager ตรวจนับเงิน"
  - badge: "ตรงกัน ✅" หรือ "มีส่วนต่าง ⚠️"
  - summaryItems: [คาดหวัง, นับจริง, ส่วนต่าง]
  - expandable: Cash verification details + notes

- Audit Summary Card (WorkflowStepSummaryCard):
  - stepNumber: 3, title: "ผลการตรวจสอบ Auditor"
  - badge: "ผ่าน ✅" หรือ "มีปัญหา ⚠️"
  - summaryItems: [Auditor name, Bank Statement, transactions verified, issues found]
  - expandable: audit findings + correction notes

### 2. ปรับ Decision UI
เปลี่ยนจาก form-based inline → ใช้ shared OwnerDecisionCard component:
- 3-column radio card (green/blue/red borders)
- notes textarea (conditional)
- submit button

### 3. ลบปุ่ม "ขอให้แก้ไข" condition (ใช้ได้เสมอ ไม่มีเงื่อนไข)

ทดสอบว่า Owner approval flow ทำงานได้เหมือนเดิมทุกกรณี

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 6)
```

---

#### Task 2.4: MT — เพิ่ม Backdated Warning + History Page Polish

**Skill:** `create-implementation-plan`

```
ฉันต้องการเพิ่ม backdated warning ใน Money Transfer History page

อ่านไฟล์:
- pages/finance/money-transfer-history.vue
- pages/finance/bill-payment-history.vue (reference — ดู backdated warning implementation)

สิ่งที่ต้องทำ:

### 1. Backdated Warning ใน Add Modal
- เมื่อผู้ใช้เลือกวันที่ที่ไม่ใช่วันนี้ แสดง alert warning:
  "⚠️ คุณกำลังบันทึกรายการย้อนหลัง กรุณาตรวจสอบวันที่ให้ถูกต้อง"
- ใช้ component BaseAlert variant="warning"

### 2. ปรับ Status Badge
- ปรับให้ใช้ WORKFLOW_STATUS_MAP จาก shared-workflow.ts
- รองรับ status ใหม่ 3 ตัว (step2_completed_with_notes, audited_with_issues, approved_with_notes)

### 3. ปรับ Pending Inbox Counts
- Manager: step1_in_progress + needs_correction
- Auditor: step2_completed + step2_completed_with_notes + needs_correction
- Owner: audited + audited_with_issues

ทดสอบว่า history page แสดงผลถูกต้องทุก status

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 2)
```

---

### Phase 3: Bill Payment Architecture Change

---

#### Task 3.1: BP — สร้าง Sub-Components (แยกจากหน้าเดิม) ✅

**Branch:** `feature/bp-sub-components` | **Status:** Done (14 Apr 2026)  
**Skill:** `refactor`

```
ฉันต้องการแยก logic จาก Bill Payment pages เป็น sub-components เตรียมรวมเข้าหน้าเดียว

อ่านไฟล์ปัจจุบัน:
- pages/finance/bill-payment-service/index.vue (~650 บรรทัด)
- pages/finance/bill-payment-service/auditor-review.vue (~380 บรรทัด)
- pages/finance/bill-payment-service/owner-approval.vue (~430 บรรทัด)
- stores/bill-payment.ts
- composables/useBillPaymentHelpers.ts
- types/bill-payment.ts

สร้าง 5 sub-components:

### 1. components/bill-payment/TransactionForm.vue
ย้าย transaction form modal จาก index.vue:
- ประเภทรายการ (radio: bill_payment | owner_deposit)
- ประเภทบิล (dropdown, เฉพาะ bill_payment)
- จำนวนเงิน, ค่าธรรมเนียม, ชื่อลูกค้า, สถานะ, หมายเหตุ
- Validation logic
Props: editingData?, presetType?
Emits: submit(formData), cancel

### 2. components/bill-payment/ManagerRecordingSection.vue
ย้ายจาก index.vue — ส่วน Step 1 Active:
- Balance cards
- Transaction table + add button
- Transaction management (edit/delete)
- Step 1 completion button
Props: date, transactions, balance, summary, isActive
Emits: step1-completed

### 3. components/bill-payment/CashVerificationSection.vue
ย้ายจาก index.vue — ส่วน Step 2:
- Cash verification inputs (editable/read-only)
- Notes textarea
- Submit button
Props: date, summary, balance, isEditable
Emits: step2-completed(step2Data)

### 4. components/bill-payment/AuditorReviewSection.vue
ย้ายจาก auditor-review.vue:
- Step 1 + Step 2 read-only views
- Transaction checklist
- Bank statement input
- Audit findings textarea
- Action buttons (3 outcomes)
Props: date, summary, transactions, balance, isEditable
Emits: audit-submitted(auditData)

### 5. components/bill-payment/OwnerApprovalSection.vue
ย้ายจาก owner-approval.vue:
- Step 1/2/Audit expandable summary cards (ใช้ shared WorkflowStepSummaryCard)
- Decision card (ใช้ shared OwnerDecisionCard)
Props: date, summary, transactions
Emits: approval-submitted(approvalData)

⚠️ ในขั้นตอนนี้ยังไม่ลบหน้าเดิม — แค่สร้าง components ใหม่
⚠️ ยังไม่เปลี่ยน feature — แค่ extract code เท่านั้น

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 1, 8)
```

---

#### Task 3.2: BP — รวม 3 หน้าเป็น Single Page

**Skill:** `create-implementation-plan`

```
ฉันต้องการรวม 3 หน้า Bill Payment เป็น Single Page (เหมือนแนวทาง Money Transfer)

อ่านไฟล์:
- pages/finance/bill-payment-service/index.vue (ปัจจุบัน)
- pages/finance/money-transfer-service/index.vue (reference pattern — orchestrator)
- components/bill-payment/ (sub-components จาก Task 3.1)
- stores/bill-payment.ts
- composables/useBillPaymentHelpers.ts
- composables/usePermissions.ts
- composables/useRolePermissions.ts

สิ่งที่ต้องทำ:

### 1. ปรับ index.vue เป็น orchestrator (~300-400 บรรทัด)
- Data fetching: fetchTransactionsByDate, fetchDailySummary, fetchBalanceByDate
- Role detection: isManagerOrAsst, isAuditor, isOwner (ใช้ useRolePermissions)
- Workflow status detection: isStep1InProgress, isStep1Complete, isStep2Complete, isAudited, isApproved, isNeedsCorrection
- Date navigation (date picker + query param)
- Status banner (แสดงสถานะรอ role อื่น)
- Render sub-components ตาม role + status:
  - Manager: ManagerRecordingSection (step1) + CashVerificationSection (step2)
  - Auditor: AuditorReviewSection
  - Owner: OwnerApprovalSection
  - ทุก role: เห็นขั้นตอนก่อนหน้าแบบ read-only

### 2. ปรับ bill-payment-history.vue
- ทุก Role ไป URL เดียว: /finance/bill-payment-service?date=X
- ลบ role-specific URL routing
- ปรับ getSmartActionButton() ใน useBillPaymentHelpers.ts ให้ทุก role ไป URL เดียว

### 3. ลบหน้าเดิม
- ลบ pages/finance/bill-payment-service/auditor-review.vue
- ลบ pages/finance/bill-payment-service/owner-approval.vue

### 4. ทดสอบทุก Role Flow
- Manager: บันทึกรายการ → ตรวจนับ → submit
- Auditor: ดูรายการ → ตรวจสอบ → submit
- Owner: ดูสรุป → อนุมัติ/ส่งกลับ
- Needs Correction: Manager กลับมาแก้ → Auditor ตรวจใหม่

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 1)
```

---

### Phase 4: Bill Payment Feature Additions

---

#### Task 4.1: BP — เพิ่ม Opening Balance System ✅

**Skill:** `create-implementation-plan`

```
ฉันต้องการเพิ่มระบบ Opening Balance ให้ Bill Payment (เหมือน Money Transfer)

อ่านไฟล์:
- pages/finance/money-transfer-service/index.vue (reference — ดู opening balance logic)
- components/bill-payment/ManagerRecordingSection.vue
- stores/bill-payment.ts
- stores/money-transfer.ts (reference — ดู setOpeningBalance, fetchPreviousDayBalance)
- server/api/ (ดู money-transfer balance endpoints เป็น reference)
- types/bill-payment.ts (ดู BillPaymentBalance — มี openingBalance field อยู่แล้ว)

สิ่งที่ต้องทำ:

### 1. Store (stores/bill-payment.ts)
- เพิ่ม state: previousDayBalance
- เพิ่ม action: fetchPreviousDayBalance(date) — GET balance ของวันก่อนหน้า
- ปรับ setOpeningBalance() ให้รับ source: 'manual' | 'carryover'

### 2. API (server/api/bill-payment/)
- เพิ่ม/ปรับ endpoint: GET /api/bill-payment/balances/previous?date=X
- ปรับ POST /api/bill-payment/balances/opening ให้รับ source parameter

### 3. UI (ManagerRecordingSection.vue)
- เพิ่ม Opening Balance section ที่ด้านบนสุด (ก่อน balance cards)
- แสดง alert: "⚠️ กำหนดยอดเงินในบัญชีเริ่มต้น" (ถ้ายังไม่ตั้ง)
- แสดง modal:
  - ตัวเลือก 1: "ยกยอดจากวันก่อน" (auto-fill จาก previousDayBalance)
  - ตัวเลือก 2: "กำหนดเอง" (manual input)
  - ปุ่ม submit
- บล็อคการบันทึก transaction จนกว่าจะตั้ง Opening Balance

### 4. ปรับ Checklist
- เพิ่มเงื่อนไข "ตั้ง Opening Balance แล้ว" เป็นข้อแรกใน Step 1 Completion Checklist

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 3.1)
```

---

#### Task 4.2: BP — เปลี่ยน Transaction Status Model + Data Migration

**Skill:** `create-implementation-plan`

```
ฉันต้องการเปลี่ยน transaction status model ของ Bill Payment ให้สอดคล้องกับ Money Transfer

อ่านไฟล์:
- types/bill-payment.ts (ดู BillPaymentTransaction.status)
- types/shared-workflow.ts (ดู UnifiedTransactionStatus)
- stores/bill-payment.ts
- server/api/bill-payment/ (ทุก endpoint ที่เกี่ยวกับ transaction)
- server/repositories/ (ดู bill-payment repository)
- composables/useBillPaymentHelpers.ts
- components/bill-payment/ManagerRecordingSection.vue
- components/bill-payment/TransactionForm.vue

สิ่งที่ต้องทำ:

### 1. Types (types/bill-payment.ts)
- เปลี่ยน BillPaymentTransaction.status: 'success' | 'failed' → 'completed' | 'draft' | 'on_hold' | 'cancelled'
- เพิ่ม fields: draftReason?, statusNote?, balanceImpact?

### 2. Store (stores/bill-payment.ts)
- เพิ่ม getters: getDraftTransactions, getOnHoldTransactions, getCompletedTransactions
- เพิ่ม actions: completeDraftTransaction(id), changeTransactionStatus(id, status, note)
- ปรับ createTransaction(): ถ้ายอดไม่พอ → สร้างเป็น draft (status: 'draft', draftReason: 'insufficient_balance')

### 3. Helpers (useBillPaymentHelpers.ts)
- ปรับ status label mapping: completed→"สำเร็จ", draft→"รอดำเนินการ", on_hold→"พักรายการ", cancelled→"ยกเลิก"
- ปรับ status badge variant mapping

### 4. API (server/api/bill-payment/)
- ปรับ transaction CRUD endpoints ให้รองรับ status ใหม่
- เพิ่ม endpoint: POST /api/bill-payment/transactions/:id/complete (complete draft)
- เพิ่ม endpoint: PUT /api/bill-payment/transactions/:id/status (change status)

### 5. Data Migration Script
- สร้าง server/api/bill-payment/migrate-status.post.ts (one-time migration)
- Logic: success → completed, failed → cancelled
- ⚠️ ต้องรันก่อน deploy UI changes

### 6. UI (TransactionForm.vue)
- ปรับ status radio: สถานะเริ่มต้นเป็น 'completed'
- ลบ 'success'/'failed' options
- เพิ่ม draft indicator ใน form (ถ้าสร้างเป็น draft)

### 7. UI (ManagerRecordingSection.vue)
- เพิ่ม Draft alert section (เหมือน MT): แสดง draft transactions พร้อมปุ่ม "ดำเนินการ" / "ลบ"
- เพิ่ม Status Change: per-row action ที่ให้เปลี่ยน completed↔on_hold, →cancelled พร้อม reason

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 3.5, 3.8, 3.9)
```

---

#### Task 4.3: BP — เพิ่ม Workflow Progress Bar + Quick Glance + Balance Cards

**Skill:** `create-implementation-plan`

```
ฉันต้องการเพิ่ม visual components ให้ Bill Payment service page

อ่านไฟล์:
- pages/finance/bill-payment-service/index.vue (orchestrator)
- components/bill-payment/ManagerRecordingSection.vue
- components/shared/WorkflowProgressBar.vue
- components/shared/QuickGlanceSummary.vue
- components/shared/CompactBalanceSummary.vue
- stores/bill-payment.ts
- types/bill-payment.ts

สิ่งที่ต้องทำ:

### 1. Workflow Progress Bar (index.vue)
- เพิ่ม WorkflowProgressBar component ใต้ header (เหนือ content)
- steps: [{label:'บันทึก', key:'record'}, {label:'ตรวจนับ', key:'verify'}, {label:'Auditor', key:'audit'}, {label:'Owner', key:'approve'}]
- แสดงเมื่อ: status ≠ step1_in_progress AND status ≠ approved

### 2. Quick Glance Summary (index.vue)
- เพิ่ม QuickGlanceSummary component ใต้ progress bar
- แสดง: วันที่, จำนวนรายการ, สำเร็จ, ค่าธรรมเนียม, สถานะ
- แสดงเมื่อ: role ≠ Manager ใน step1_in_progress
- customLabel: "ค่าธรรมเนียม"

### 3. Balance Cards (ManagerRecordingSection.vue)
- เปลี่ยนจาก 3 static cards → CompactBalanceSummary
- primaryCards: [เงินเริ่มต้น, รวมรับชำระ, เงินในบัญชีคงเหลือ, เงินสดคงเหลือ]
- secondaryCards: [รวมฝากเงิน, ค่าธรรมเนียม]
- เมื่อ Manager อยู่ step1_in_progress → defaultExpanded: true
- เมื่ออื่นๆ → collapsible: true, defaultExpanded: false

### 4. ปรับ store (stores/bill-payment.ts)
- เพิ่ม computed/getter สำหรับ data ที่ QuickGlanceSummary ต้องการ: totalTransactions, successCount, totalCommission

ทดสอบ visual ผ่าน dev server

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 3.2, 3.3, 3.4)
```

---

#### Task 4.4: BP — เพิ่ม Filter Tabs + Pagination + Step 1 Checklist

**Skill:** `create-implementation-plan`

```
ฉันต้องการเพิ่ม Filter Tabs, Pagination, และ Step 1 Checklist ให้ Bill Payment

อ่านไฟล์:
- components/bill-payment/ManagerRecordingSection.vue
- components/shared/TransactionTable.vue
- pages/finance/money-transfer-service/index.vue (reference — ดู filter tabs + pagination + checklist)

สิ่งที่ต้องทำ:

### 1. Filter Tabs (ManagerRecordingSection.vue)
- เพิ่ม filter tabs เหนือ transaction table:
  - "ทั้งหมด" (default) — แสดงทุก transaction
  - "สำเร็จ" — status: completed
  - "รอดำเนินการ" — status: draft
  - "พักรายการ" — status: on_hold
- แสดง count badge ในแต่ละ tab
- ใช้ shared TransactionTable props: showFilterTabs=true, filterTabs=[...]

### 2. Pagination
- เพิ่ม pagination ใต้ transaction table
- 10 items per page
- ใช้ shared TransactionTable props: showPagination=true, pageSize=10

### 3. Step 1 Completion Checklist
- เปลี่ยนจากปุ่ม "ไปขั้นตอนที่ 2 →" เป็น Checklist 4 ข้อ:
  1. ✅/❌ ตั้ง Opening Balance แล้ว
  2. ✅/❌ มีรายการอย่างน้อย 1 รายการ
  3. ✅/❌ ไม่มีรายการ Draft ค้าง (แสดง "เหลือ X รายการ" ถ้ามี)
  4. ✅/❌ ไม่มีรายการ On Hold ค้าง
- ปุ่ม: "ยืนยันบันทึกรายการ → ตรวจนับเงินสด" (disabled จนกว่า checklist ครบ)
- ปุ่มใช้สีเขียว เมื่อ checklist ครบ

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 3.10, 3.11)
```

---

#### Task 4.5: BP — เพิ่ม Auto Commission (useCommission)

**Skill:** `create-implementation-plan`

```
ฉันต้องการเพิ่มระบบ Auto Commission ให้ Bill Payment

อ่านไฟล์:
- composables/useCommission.ts (ดู implementation ปัจจุบันสำหรับ MT)
- stores/daily-record-settings.ts (ดู fee tiers + calculateFee)
- components/bill-payment/TransactionForm.vue
- components/money-transfer/TransactionForm.vue (reference — ดูวิธีใช้ useCommission)

สิ่งที่ต้องทำ:

### 1. Fee Tiers Setting
- ตรวจสอบว่า daily-record-settings.ts รองรับ fee tiers แยกต่างหากสำหรับ bill payment หรือไม่
- ถ้าไม่ → เพิ่ม billPaymentFeeTiers ใน settings (แยกจาก money transfer tiers)
- ถ้า fee structure ต่างกัน → สร้าง calculateBillPaymentFee() แยก

### 2. ปรับ useCommission.ts (ถ้าจำเป็น)
- ให้ composable รองรับ parameter: serviceType: 'money-transfer' | 'bill-payment'
- ใช้ fee tiers ที่ต่างกันตาม serviceType

### 3. ปรับ TransactionForm.vue (Bill Payment)
- เพิ่ม useCommission composable
- เมื่อ transactionType === 'bill_payment':
  - Auto-calculate commission จาก amount
  - แสดงปุ่ม toggle: "อัตโนมัติ ✅" / "กำหนดเอง ✏️"
  - ถ้า auto → commission field disabled, แสดงค่าที่คำนวณได้
  - ถ้า manual → commission field editable
- เมื่อ transactionType === 'owner_deposit':
  - ไม่มี commission (เหมือนเดิม)

### 4. Settings Page (ถ้ามี)
- ตรวจสอบว่ามีหน้า settings สำหรับกำหนด fee tiers แล้วหรือไม่
- ถ้ามี → เพิ่ม tab/section สำหรับ Bill Payment fee tiers
- ถ้าไม่มี → สร้าง banner "ใช้อัตราค่าธรรมเนียมเริ่มต้น" พร้อม link ไปหน้า settings

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 3.7)
```

---

#### Task 4.6: BP — เพิ่ม Quick Actions + Favorites

**Skill:** `create-implementation-plan`

```
ฉันต้องการเพิ่มระบบ Quick Actions และ Favorites ให้ Bill Payment

อ่านไฟล์:
- components/bill-payment/ManagerRecordingSection.vue
- pages/finance/money-transfer-service/index.vue (reference — ดู quick actions + favorites implementation)
- stores/money-transfer.ts (reference — ดู favorites state/actions)
- stores/bill-payment.ts

สิ่งที่ต้องทำ:

### 1. Quick Actions (ManagerRecordingSection.vue)
- เพิ่ม Quick Actions grid (3 ปุ่ม) ใต้ balance cards:
  - ⭐ "รายการโปรด" (Favorites)
  - 📄 "รับชำระบิล" (Bill Payment)
  - 💰 "ฝากเงิน" (Owner Deposit)
- Disabled เมื่อ: Opening Balance ยังไม่ตั้ง หรือ Step 1 เสร็จแล้ว

### 2. Favorites System

Store เพิ่ม (stores/bill-payment.ts):
- state: favorites: BillPaymentFavorite[]
- actions: loadFavorites(), addFavorite(data), updateFavorite(id, data), deleteFavorite(id)

Type เพิ่ม (types/bill-payment.ts):
- BillPaymentFavorite: { id, label, customerName, billType, defaultAmount?, defaultCommission?, tab: number }

API เพิ่ม (server/api/bill-payment/):
- GET    /api/bill-payment/favorites
- POST   /api/bill-payment/favorites
- PUT    /api/bill-payment/favorites/:id
- DELETE /api/bill-payment/favorites/:id

UI:
- Favorite Modal (multi-step เหมือน MT):
  - Step 1: เลือก favorite จาก tabs (5 tabs, max 10 per tab)
  - Step 2: ยืนยัน/ปรับจำนวนเงิน
  - จัดการ: View / Edit / Delete / Add new
- กดเลือก Favorite → auto-fill TransactionForm พร้อม customerName, billType, amount, commission

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 3.6)
```

---

### Phase 5: Bill Payment Auditor + Owner Enhancements

---

#### Task 5.1: BP — เพิ่ม Balance Snapshot + Auditor Cash Count + Bank Statement ✅

**Branch:** `feature/bp-auditor-enhancements`  
**Status:** Completed (14 เม.ย. 2569)

**สิ่งที่ทำเสร็จแล้ว:**
- ✅ `types/bill-payment.ts` — เพิ่ม `auditorActualBillPaymentCash`, `auditorActualServiceFeeCash`, `auditExpectedClosingBalance`, `auditBankStatementVsClosingDiff`, `auditBankStatementVsClosingMatches`, `auditTxnIssueStatus`
- ✅ `components/bill-payment/AuditorReviewSection.vue` — เพิ่ม BalanceSnapshot + Bank Statement vs Closing Balance, CashVerificationTable (auditor-input mode), Transaction toggle (มีปัญหา per row), Transaction Detail Modal
- ✅ `server/api/bill-payment/summaries/[date]/audit.post.ts` — เพิ่ม Zod schema สำหรับ fields ใหม่
- ✅ `server/repositories/bill-payment-json.repository.ts` — persist auditor cash fields + clear on needs_correction
- ✅ Step 2 read-only summary เปลี่ยนใช้ `<CashVerificationTable mode="manager-readonly">`

**Skill:** `create-implementation-plan`

```
ฉันต้องการปรับปรุง Auditor section ของ Bill Payment ให้สอดคล้องกับ Money Transfer

อ่านไฟล์:
- components/bill-payment/AuditorReviewSection.vue
- components/shared/BalanceSnapshot.vue
- components/shared/CashVerificationTable.vue
- components/money-transfer/AuditorReviewSection.vue (reference)
- stores/bill-payment.ts
- types/bill-payment.ts

สิ่งที่ต้องทำ:

### 1. Balance Snapshot
- เพิ่ม BalanceSnapshot component ด้านบนของ Auditor section
- Opening Balance → Net Change (สุทธิระหว่างวัน) → Expected Closing
- Net Change = +รับชำระ(completed) - ฝากเงิน adjustments (ตามธรรมชาติของ BP)

### 2. Bank Statement
- เปลี่ยนจาก "เทียบกับ actual cash" → "เทียบกับ Expected Closing Balance"
- ใส่ยอด Bank Statement → แสดง diff กับ expected closing
- ใช้ slot ของ BalanceSnapshot สำหรับ bank statement input

### 3. Auditor Cash Count
- เพิ่ม Auditor count inputs ใน CashVerificationTable (mode: 'auditor-input')
- rows:
  - A. เงินสดรับชำระบิล — Expected | Manager นับ | Auditor นับ [input] | ส่วนต่าง
  - B. ค่าธรรมเนียม — Expected | Manager นับ | Auditor นับ [input] | ส่วนต่าง
  - Total row
- ปรับ type: เพิ่ม auditorActualBillPaymentCash?, auditorActualServiceFeeCash? ใน BillPaymentDailySummary
- ปรับ store: submitAudit() ส่ง auditor cash counts

### 4. Transaction Toggle
- เปลี่ยนจาก checkbox → toggle "มีปัญหา" per row + eye icon ดูรายละเอียด
- Default: ปกติ (ไม่มีปัญหา) → กดเมื่อพบปัญหา
- ใช้ shared TransactionTable กับ issuedIds prop

### 5. ปรับ Store + API
- ปรับ submitAudit() ให้ส่ง: auditorCash data + bank statement vs closing balance comparison

ทดสอบ Auditor flow ครบถ้วน

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 5)
```

---

#### Task 5.2: BP — ปรับ Owner + เพิ่ม step1_completed + ลบเงื่อนไข ✅ DONE (PR #135, #137)

**Branch:** `feature/bp-owner-step1completed`, `feature/bp-owner-workflow-step-summary-cards`  
**Status:** Completed (14 เม.ย. 2569)

**สิ่งที่ทำเสร็จแล้ว:**
- ✅ `types/bill-payment.ts` — เพิ่ม `step1_completed` ใน `BillPaymentWorkflowStatus`
- ✅ `stores/bill-payment.ts` — `completeStep1()` set status → `step1_completed`, `completeStep2()` transition ถูกต้อง
- ✅ `server/api/bill-payment/` — endpoint `complete-step1` ส่ง `step1_completed` status
- ✅ `components/bill-payment/OwnerApprovalSection.vue` — refactor 3 sections ใช้ `WorkflowStepSummaryCard` (Step 1/2/Audit) + `OwnerDecisionCard` (PR #137)
- ✅ `components/shared/OwnerDecisionCard.vue` — `disableCorrection = false` เสมอ (Owner สั่ง needs_correction ได้ทุกกรณี)
- ✅ `composables/useBillPaymentHelpers.ts` — เพิ่ม `step1_completed` ใน `formatWorkflowStatus()` + `getSmartActionButton()`
- ✅ History Page — Pending Inbox รับรู้ `step1_completed`, Status Badge = "รอตรวจนับ" (blue)

---

#### Task 5.3: BP — Cash Verification ปรับ UI + Notes ✅ DONE (PR #136)

**Skill:** `refactor`

```
ฉันต้องการปรับ Cash Verification section ของ Bill Payment ให้ใช้ shared CashVerificationTable

อ่านไฟล์:
- components/bill-payment/CashVerificationSection.vue
- components/shared/CashVerificationTable.vue
- stores/bill-payment.ts

สิ่งที่ต้องทำ:

### 1. ปรับ CashVerificationSection.vue
- เปลี่ยนจาก inline card/form → ใช้ shared CashVerificationTable
- Mode: 'manager-input' (editable) หรือ 'manager-readonly' (after submit)
- Rows:
  - { label: "A. เงินสดรับชำระบิล", expected: step2ExpectedBillPaymentCash, managerActual: ... }
  - { label: "B. ค่าธรรมเนียมสะสม", expected: step2ExpectedServiceFeeCash, managerActual: ... }

### 2. Notes Textarea
- แสดงเสมอ (ไม่ซ่อนเมื่อไม่มี discrepancy)
- required เฉพาะเมื่อมี discrepancy
- Placeholder: "ระบุสาเหตุของส่วนต่าง เช่น เงินสดขาด X บาท เนื่องจาก..."

### 3. Diff Display
- ใช้ formatDiff() จาก shared-workflow.ts
- แสดงใน table column "ส่วนต่าง" (เหมือน MT)

ทดสอบ Manager cash verification flow

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 4)
```

---

### Phase 6: Testing + Polish

---

#### Task 6.1: Unit Tests — Bill Payment Sub-Components ✅ DONE (PR #138)

**Skill:** `unit-test-vue-pinia`

```
ฉันต้องการเขียน unit tests สำหรับ Bill Payment sub-components ที่สร้างใหม่

Component ที่ต้องเขียน test:
1. components/bill-payment/TransactionForm.vue
2. components/bill-payment/ManagerRecordingSection.vue
3. components/bill-payment/CashVerificationSection.vue
4. components/bill-payment/AuditorReviewSection.vue
5. components/bill-payment/OwnerApprovalSection.vue

อ่านไฟล์:
- types/bill-payment.ts (ดู type definitions)
- types/shared-workflow.ts
- stores/bill-payment.ts (ดู store structure)
- tests/ (ดู existing test patterns)

สำหรับแต่ละ component ให้เขียน tests ครอบคลุม:

### TransactionForm.vue
- Render form correctly (bill_payment mode + owner_deposit mode)
- Show/hide billType dropdown based on transactionType
- Show/hide commission field based on transactionType
- Auto commission toggle works
- Validation errors display
- Submit emits correct data
- Edit mode auto-fills data

### ManagerRecordingSection.vue
- Opening Balance alert shows when not set
- Balance cards render correctly
- Quick actions disabled when appropriate
- Draft transactions alert shows with actions
- Transaction table pagination works
- Filter tabs filter correctly
- Checklist shows correct status
- Step 1 completion button enabled/disabled correctly

### CashVerificationSection.vue
- Renders CashVerificationTable correctly
- Input mode vs read-only mode
- Diff calculation correct
- Notes required when discrepancy
- Submit button disabled logic

### AuditorReviewSection.vue
- Balance Snapshot renders
- Bank statement input + diff
- Toggle "มีปัญหา" per transaction
- Auditor cash count inputs
- 3 action buttons work correctly

### OwnerApprovalSection.vue
- Expandable summary cards render
- Decision card 3 options
- "ขอแก้ไข" always enabled
- Notes required for approved_with_notes / needs_correction
- Submit emits correct data

สร้างไฟล์ test ที่: tests/unit/components/bill-payment/[ComponentName].spec.ts

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 8)
```

---

#### Task 6.2: Integration Testing — ทั้งสอง Service ✅ Done (PR #139)

**Skill:** `unit-test-vue-pinia`

```
ฉันต้องการเขียน integration tests สำหรับ workflow ของทั้งสอง service

อ่านไฟล์:
- stores/money-transfer.ts
- stores/bill-payment.ts
- types/shared-workflow.ts
- tests/integration/ (ดู existing patterns)

สิ่งที่ต้องทดสอบ:

### Money Transfer Workflow
1. Full happy path: step1_in_progress → step1_completed → step2_completed → audited → approved
2. With notes path: → step2_completed_with_notes → audited_with_issues → approved_with_notes
3. Correction path: audited → needs_correction → step1_in_progress → ... → approved
4. Draft transaction flow: create draft → complete draft → verify
5. Status change: completed → on_hold → completed / cancelled

### Bill Payment Workflow
1. Full happy path: step1_in_progress → step1_completed → step2_completed → audited → approved
2. With notes path: → step2_completed_with_notes → audited_with_issues → approved_with_notes
3. Correction path: audited → needs_correction → step1_in_progress → ... → approved
4. Draft transaction flow: create draft → complete draft → verify
5. Opening balance: carryover + manual
6. Auto commission calculation

### Cross-Service Consistency
1. Workflow status transitions ใช้ UnifiedWorkflowStatus เหมือนกัน
2. Transaction status ใช้ UnifiedTransactionStatus เหมือนกัน
3. Store API patterns สอดคล้อง (action names, return types)

สร้างไฟล์ test ที่: tests/integration/workflow/

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 11)
```

---

#### Task 6.3: Data Migration Script + Final Review

**Skill:** `review-and-refactor`

```
ฉันต้องการ review code ทั้งหมดหลังจากการปรับปรุง และสร้าง data migration script

อ่านไฟล์ทั้งหมดที่เปลี่ยนแปลง:
- types/shared-workflow.ts
- types/bill-payment.ts, types/repositories.ts
- stores/money-transfer.ts, stores/bill-payment.ts
- components/shared/
- components/bill-payment/
- components/money-transfer/
- pages/finance/
- composables/useBillPaymentHelpers.ts, useMoneyTransferHelpers.ts
- server/api/bill-payment/, server/api/money-transfer/

สิ่งที่ต้องทำ:

### 1. Data Migration Script
สร้าง server/api/admin/migrate-bill-payment-status.post.ts:
- วัตถุประสงค์: migrate ข้อมูลเดิมใน Firestore
- Logic:
  - BillPaymentTransaction: success → completed, failed → cancelled
  - BillPaymentDailySummary: เพิ่ม default values สำหรับ fields ใหม่
- ต้องมี: authentication check (admin only), dry-run mode, rollback plan
- ⚠️ Script นี้ต้องรันก่อนที่ UI ใหม่จะ live

### 2. Review Code Quality
- ตรวจสอบ TypeScript errors ทั้ง project
- ตรวจสอบ import paths ถูกต้อง (shared components, old components ถูกลบ)
- ตรวจสอบ naming conventions สอดคล้อง
- ตรวจสอบ accessibility (a11y)
- ตรวจสอบ mobile responsiveness

### 3. UX Consistency Check
- เปรียบเทียบ Money Transfer vs Bill Payment:
  - ✅ เดียวกัน: Page architecture (single page + sub-components)
  - ✅ เดียวกัน: Progress bar steps
  - ✅ เดียวกัน: Balance cards layout
  - ✅ เดียวกัน: Cash verification table format
  - ✅ เดียวกัน: Auditor review pattern (balance snapshot + bank statement + toggle + cash count)
  - ✅ เดียวกัน: Owner approval pattern (expandable cards + radio card decision)
  - ✅ เดียวกัน: Workflow status labels/colors
  - ✅ เดียวกัน: Transaction status model
  - ✅ เดียวกัน: Filter tabs + pagination

เอกสารอ้างอิง: docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md (หัวข้อ 11)
```

---

## 13. สรุป Task ทั้งหมด

| Phase | Task | ชื่อ Task | Skill | ฝั่งที่เปลี่ยน |
|---|---|---|---|---|
| **1** | 1.1 | Shared Workflow Types | `create-implementation-plan` | Shared + MT + BP |
| **1** | 1.2 | Shared WorkflowProgressBar | `refactor` | MT → Shared |
| **1** | 1.3 | Shared QuickGlanceSummary | `refactor` | MT → Shared |
| **1** | 1.4 | Shared CompactBalanceSummary | `refactor` | MT → Shared |
| **1** | 1.5 | Shared BalanceSnapshot | `refactor` | MT → Shared |
| **1** | 1.6 | Shared CashVerificationTable | `refactor` | MT → Shared |
| **1** | 1.7 | Shared TransactionTable | `refactor` | MT → Shared |
| **1** | 1.8 | Shared OwnerDecisionCard + StepSummaryCard | `refactor` | BP → Shared |
| **1** | 1.9 | Unit Tests — Shared Components | `unit-test-vue-pinia` | Tests |
| **2** | 2.1 | MT — Refactor index.vue → Sub-Components | `refactor` | MT |
| **2** | 2.2 | MT — 3 Workflow Status + Auditor 3rd Outcome | `create-implementation-plan` | MT |
| **2** | 2.3 | MT — Owner UI (Expandable + Radio Card) | `refactor` | MT |
| **2** | 2.4 | MT — Backdated Warning + History Polish | `create-implementation-plan` | MT |
| **3** | 3.1 | BP — สร้าง Sub-Components | `refactor` | BP |
| **3** | 3.2 | BP — รวม 3 หน้าเป็น Single Page | `create-implementation-plan` | BP |
| **4** | 4.1 | BP — Opening Balance System | `create-implementation-plan` | BP |
| **4** | 4.2 | BP — Transaction Status Model + Migration | `create-implementation-plan` | BP |
| **4** | 4.3 | BP — Progress Bar + Quick Glance + Balance Cards | `create-implementation-plan` | BP |
| **4** | 4.4 | BP — Filter Tabs + Pagination + Checklist | `create-implementation-plan` | BP |
| **4** | 4.5 | BP — Auto Commission | `create-implementation-plan` | BP |
| **4** | 4.6 | BP — Quick Actions + Favorites | `create-implementation-plan` | BP |
| **5** | 5.1 | BP — Balance Snapshot + Auditor Cash Count | `create-implementation-plan` | BP |
| **5** | 5.2 | BP — Owner + step1_completed + ลบเงื่อนไข | `create-implementation-plan` | BP |
| **5** | 5.3 | BP — Cash Verification UI + Notes | `refactor` | BP |
| **6** | 6.1 ✅ | Unit Tests — BP Sub-Components | `unit-test-vue-pinia` | Tests |
| **6** | 6.2 ✅ | Integration Tests — ทั้งสอง Service | `unit-test-vue-pinia` | Tests |
| **6** | 6.3 | Data Migration + Final Review | `review-and-refactor` | All |

**รวม: 27 Tasks ใน 6 Phases**
