# แผนการทดสอบ Service Harmonization (Phase 1-6)

> **วันที่จัดทำ:** 14 เมษายน 2569  
> **อ้างอิง:** `docs/PROGRESS/SERVICE_HARMONIZATION_PLAN.md`  
> **สถานะ implement:** Phase 1-6 เสร็จสมบูรณ์ (27 Tasks, PRs #127-#140)  
> **เป้าหมาย:** ทดสอบทุก feature ที่ implement เพื่อยืนยันว่าทำงานถูกต้องก่อน deploy

---

## สารบัญ

1. [ภาพรวมแผนการทดสอบ](#1-ภาพรวมแผนการทดสอบ)
2. [ขั้นตอนที่ 1: Manual Test (คนทดสอบ)](#2-ขั้นตอนที่-1-manual-test)
3. [ขั้นตอนที่ 2: Bug Fix (AI แก้ไข)](#3-ขั้นตอนที่-2-bug-fix)
4. [ขั้นตอนที่ 3: E2E Playwright (AI เขียน + รัน)](#4-ขั้นตอนที่-3-e2e-playwright)
5. [Task Breakdown](#5-task-breakdown)
6. [บันทึกผลการทดสอบ](#6-บันทึกผลการทดสอบ)

---

## 1. ภาพรวมแผนการทดสอบ

### ลำดับการทดสอบ (3 ขั้นตอน)

```
ขั้นตอน 1: Manual Test (คนทดสอบ)          ← คุณทดสอบเอง ตาม checklist
    │   ใช้ Skill: ไม่ใช้ (AI สร้าง checklist ให้)
    │   1 Task = 1 Chat
    ▼
ขั้นตอน 2: Bug Fix (AI แก้ไข)              ← AI แก้ bug ที่พบจาก Manual Test
    │   ใช้ Skill: refactor / review-and-refactor
    │   1 Task = 1 Chat
    ▼
ขั้นตอน 3: E2E Playwright (AI เขียน + รัน) ← AI เขียน E2E tests ป้องกัน regression
        ใช้ Skill: webapp-testing
        1 Task = 1 Chat
```

### Skill ที่ใช้ในแต่ละขั้นตอน

| ขั้นตอน | Skill | เหตุผล |
|---|---|---|
| **Manual Test** | ไม่ใช้ skill | คนทดสอบผ่าน browser ตรวจ UI/UX/data ด้วยตา |
| **Bug Fix** | `refactor` | แก้ไข code structure โดยไม่เปลี่ยน behavior |
| **Bug Fix** | `review-and-refactor` | review + แก้ตาม coding guidelines |
| **Bug Fix** | `unit-test-vue-pinia` | เขียน unit test ป้องกัน regression (ถ้าจำเป็น) |
| **E2E Playwright** | `webapp-testing` | เขียน Playwright automation tests |

### สิ่งที่ต้องเตรียมก่อนเริ่ม

1. **เปิด dev server:** `npm run dev` (http://localhost:3000)
2. **มี account 3 roles:** Manager, Auditor, Owner
3. **มี test data:** ดูตาราง "Test Data Reference" ท้ายเอกสาร
4. **เปิด browser:** Chrome หรือ Edge (DevTools F12 ไว้ดู console errors)

---

## 2. ขั้นตอนที่ 1: Manual Test

> **ทดสอบโดย:** คุณ (เจ้าของโปรเจค)  
> **วิธี:** เปิด browser → login → ทำตาม checklist ทีละข้อ  
> **บันทึกผล:** ✅ ผ่าน / ❌ ไม่ผ่าน (อธิบายปัญหา) / ⚠️ มีปัญหาเล็กน้อย

### กฎการทดสอบ

- ทดสอบทีละ Task (1 Task = 1 หัวข้อ)
- ถ้าพบ bug ให้ **จดไว้ก่อน** แล้วทดสอบต่อ (ไม่ต้องหยุด)
- หลังทดสอบครบ → รวบรวม bug list → ส่งให้ AI แก้ (ขั้นตอน 2)
- ทดสอบทั้ง **Money Transfer (MT)** และ **Bill Payment (BP)** เปรียบเทียบกัน

---

### MT-1: Manual Test — Money Transfer History Page

> **หน้าที่ทดสอบ:** `/finance/money-transfer-history`  
> **Login ด้วย:** ทดสอบ 3 role (Manager → Auditor → Owner)

#### ขั้นตอนการทดสอบ

**Step 1: เปิดหน้า History (login เป็น Manager)**
1. เปิด browser → ไปที่ http://localhost:3000/login
2. Login ด้วย account Manager
3. ไปที่เมนู "บริการโอนเงิน" ในแถบด้านข้าง
4. ตรวจสอบว่าเห็นหน้า History (รายการประวัติ)

**Step 2: ตรวจสอบ Pending Inbox**
- [x] เห็น Pending Inbox cards (Manager / Auditor / Owner)
- [x] ตัวเลข count ในแต่ละ card ถูกต้อง
- [x] กดที่ card → filter รายการตาม role

**Step 3: ตรวจสอบตารางรายการ**
- [x] ตาราง แสดง columns: วันที่, สถานะ, จำนวนรายการ, ยอดรวม, ปุ่ม Action
- [x] Status Badge แสดงสีถูกต้อง (เขียว=approved, เหลือง=in_progress, แดง=needs_correction)
- [x] Status ใหม่แสดงถูกต้อง: `step2_completed_with_notes`, `audited_with_issues`, `approved_with_notes`

**Step 4: ทดสอบเพิ่มรายการใหม่**
- [x] กดปุ่ม "+ บันทึกรายการใหม่"
- [x] เลือกวันที่ → กด Submit
- [x] ⚠️ **Backdated Warning:** เลือกวันที่ที่ไม่ใช่วันนี้ → ต้องเห็น alert สีเหลือง "คุณกำลังบันทึกรายการย้อนหลัง"
- [x] หลัง submit → navigate ไปหน้า Service

**Step 5: ตรวจสอบปุ่ม Action**
- [x] กดปุ่ม Action ในแต่ละแถว → navigate ไปหน้า Service พร้อม date ถูกต้อง

**Step 6: ทดสอบด้วย Auditor (logout → login Auditor)**
- [x] เห็น Pending Inbox → Auditor card แสดง count ถูกต้อง
- [x] Inbox count นับ: step2_completed + step2_completed_with_notes + needs_correction
- [x] กด Action → ไปหน้า Service ในมุมมอง Auditor

**Step 7: ทดสอบด้วย Owner (logout → login Owner)**
- [x] เห็น Pending Inbox → Owner card แสดง count ถูกต้อง
- [x] Inbox count นับ: audited + audited_with_issues
- [x] กด Action → ไปหน้า Service ในมุมมอง Owner

---

### MT-2: Manual Test — Money Transfer Service Page (Manager Flow)

> **หน้าที่ทดสอบ:** `/finance/money-transfer-service?date=YYYY-MM-DD`  
> **Login ด้วย:** Manager  
> **เป้าหมาย:** ทดสอบ Step 1 (บันทึกรายการ) + Step 2 (ตรวจนับเงิน)

#### ขั้นตอนการทดสอบ

**Step 1: เปิดหน้า Service วันใหม่ (ยังไม่มีข้อมูล)**
1. ไปที่ History → เพิ่มรายการวันใหม่ (หรือเลือกวันที่ status = `step1_in_progress`)
2. ตรวจสอบหน้า Service ที่เปิดขึ้น

- [x] **Workflow Progress Bar:** เห็น 4 ขั้นตอน (บันทึก → ตรวจนับ → Auditor → Owner)
- [x] ขั้นตอน "บันทึก" highlight สี amber (กำลังทำ)
- [x] **Opening Balance Alert:** เห็นข้อความเตือน "ต้องตั้งยอดเริ่มต้นก่อน"

**Step 2: ตั้ง Opening Balance**
- [x] กดปุ่ม "ตั้งยอดเริ่มต้น" → เปิด modal
- [x] เห็นตัวเลือก "ยกยอดจากวันก่อน" / "กำหนดเอง"
- [x] เลือก "กำหนดเอง" → ใส่ตัวเลข → กด Submit
- [x] หลัง submit → Opening Balance alert หายไป
- [x] **Balance Cards** แสดงยอดเริ่มต้นถูกต้อง

**Step 3: ตรวจสอบ Balance Cards**
- [x] **CompactBalanceSummary:** เห็น cards แถวบน (4 cards)
- [x] กดปุ่ม "▼ ขยาย" → เห็น cards แถวล่าง (4 cards เพิ่มเติม)
- [x] กดปุ่ม "▲ ย่อ" → cards แถวล่างหายไป
- [x] ตัวเลขเริ่มต้นถูกต้อง (เงินเริ่มต้น = Opening Balance ที่ตั้งไว้)

**Step 4: ตรวจสอบ Quick Actions**
- [x] เห็นปุ่ม Quick Actions (โปรด / โอน / ถอน / ฝาก)
- [x] กดปุ่ม "โอน" → เปิด Transaction Form → type = transfer
- [x] กดปุ่ม "ถอน" → เปิด Transaction Form → type = withdrawal
- [x] กดปุ่ม "ฝาก" → เปิด Transaction Form → type = owner_deposit

**Step 5: บันทึก Transaction**
- [x] กรอกข้อมูลใน Transaction Form → กด Submit
- [x] ตารางรายการ เพิ่มแถวใหม่
- [x] **Commission Auto-calculate:** เปลี่ยนจำนวนเงิน → ค่าบริการคำนวณอัตโนมัติ
- [x] กดปุ่ม Manual → สามารถแก้ค่าบริการเองได้
- [x] Balance Cards อัปเดตตัวเลข

**Step 6: ทดสอบ Draft Transaction**
- [x] บันทึก transaction ที่ยอดเงินไม่พอ → ต้องถูกบันทึกเป็น Draft
- [x] เห็น Draft Alert section (สีเหลือง) พร้อมจำนวน draft
- [x] กดปุ่ม "ดำเนินการ" ที่ draft → complete draft
- [x] กดปุ่ม "ลบ" ที่ draft → delete draft

**Step 7: ทดสอบ Status Change**
> ⚠️ หมายเหตุ: ปุ่ม ⋮ (Status Change Modal แยก) ถูกลบออกแล้ว (PR ล่าสุด)
> การเปลี่ยนสถานะทำผ่าน Edit Modal (ปุ่มดินสอ) เท่านั้น
> ช่อง "เหตุผล/หมายเหตุสถานะ" แสดงอัตโนมัติเมื่อเลือก draft/on_hold/cancelled แต่ไม่ใช่ required
- [x] ที่แถว transaction → กดปุ่มดินสอ (แก้ไข) → เปลี่ยนสถานะในฟอร์ม
- [x] เปลี่ยน completed → on_hold → บันทึกสำเร็จ (ช่องเหตุผลแสดง แต่ไม่ required)
- [x] เปลี่ยน on_hold → completed → บันทึกสำเร็จ
- [x] เปลี่ยน → cancelled → บันทึกสำเร็จ (ช่องเหตุผลแสดง แต่ไม่ required)

**Step 8: ทดสอบ Filter Tabs + Pagination**
- [ ] เห็น tabs: ทั้งหมด / สำเร็จ / รอดำเนินการ / พักรายการ
- [ ] กดแต่ละ tab → filter รายการถูกต้อง
- [ ] badge count ในแต่ละ tab ตรงกับจำนวนจริง
- [ ] ถ้ามี > 10 รายการ → เห็น pagination

**Step 9: ทดสอบ Favorites**
- [ ] กดปุ่ม "โปรด" (Quick Actions) → เปิด Favorite Modal
- [ ] เห็น 5 tabs (หมวด 1-5)
- [ ] เพิ่ม Favorite ใหม่ → กรอกข้อมูล → บันทึก
- [ ] เลือก Favorite → auto-fill Transaction Form
- [ ] แก้ไข/ลบ Favorite ได้

**Step 10: ทดสอบ Step 1 Completion Checklist**
- [ ] เห็น Checklist 4 ข้อ ด้านล่าง:
  1. ✅ ตั้ง Opening Balance แล้ว
  2. ✅/❌ มีรายการอย่างน้อย 1 รายการ
  3. ✅/❌ ไม่มีรายการ Draft ค้าง
  4. ✅/❌ ไม่มีรายการ On Hold ค้าง
- [ ] ปุ่ม "ยืนยันบันทึกรายการ" disabled เมื่อ checklist ไม่ครบ
- [ ] ปุ่ม enabled (สีเขียว) เมื่อ checklist ครบ
- [ ] กดปุ่ม → สถานะเปลี่ยนเป็น step1_completed

**Step 11: ทดสอบ Cash Verification (Step 2)**
- [ ] เห็น **CashVerificationTable** (3 คอลัมน์: คาดหวัง / นับจริง / ส่วนต่าง)
- [ ] กรอกตัวเลขนับจริง → ส่วนต่างคำนวณอัตโนมัติ
- [ ] **Notes:** textarea แสดงเสมอ
- [ ] ถ้ามีส่วนต่าง → Notes required (ต้องกรอก)
- [ ] กด Submit → สถานะเปลี่ยนเป็น step2_completed (หรือ step2_completed_with_notes ถ้ามี discrepancy)

---

### MT-3: Manual Test — Money Transfer Auditor Flow

> **Login ด้วย:** Auditor  
> **เลือกวันที่:** status = step2_completed หรือ step2_completed_with_notes

#### ขั้นตอนการทดสอบ

**Step 1: เปิดหน้า Service (Auditor view)**
- [ ] **QuickGlanceSummary** แสดง: วันที่, จำนวนรายการ, สำเร็จ, ค่าบริการ
- [ ] **Workflow Progress Bar** ขั้นตอน "Auditor" highlight
- [ ] Step 1 + Step 2 แสดงเป็น read-only (ดูได้อย่างเดียว)

**Step 2: ตรวจสอบ Balance Snapshot**
- [ ] เห็น 3 cards: Opening Balance → Net Change → Expected Closing
- [ ] ตัวเลข Net Change = Closing - Opening (ถูกต้อง)
- [ ] สีถูกต้อง: + เขียว, - แดง

**Step 3: ตรวจสอบ Bank Statement Input**
- [ ] เห็นช่องกรอก "ยอด Bank Statement"
- [ ] กรอกตัวเลข → แสดง diff กับ Expected Closing Balance
- [ ] ถ้าตรง → badge "✅ ตรงกัน"
- [ ] ถ้าไม่ตรง → badge "⚠️ มีส่วนต่าง X บาท"

**Step 4: ตรวจสอบ Transactions**
- [ ] เห็นรายการ transaction ทั้งหมด
- [ ] แต่ละแถวมี toggle "มีปัญหา" (default = ปกติ)
- [ ] กด toggle → เปลี่ยนเป็น "มีปัญหา" (สีแดง)
- [ ] กด eye icon → ดูรายละเอียด transaction

**Step 5: Auditor Cash Verification**
- [ ] เห็น **CashVerificationTable** แบบ 5 คอลัมน์
  - คาดหวัง / Manager นับ / Auditor นับ [input] / ส่วนต่าง
- [ ] กรอก Auditor นับจริง → ส่วนต่างคำนวณอัตโนมัติ

**Step 6: ทดสอบ 3 ปุ่ม Action**
- [ ] เห็น 3 ปุ่ม:
  1. 🔴 "ส่งคืนแก้ไข" → needs_correction
  2. 🟡 "ยืนยันพร้อมหมายเหตุ" → audited_with_issues
  3. 🟢 "ยืนยันการตรวจสอบ" → audited
- [ ] กด "ส่งคืนแก้ไข" → ต้องกรอก findings → สถานะ = needs_correction
- [ ] กด "ยืนยันพร้อมหมายเหตุ" → ต้องกรอก findings → สถานะ = audited_with_issues
- [ ] กด "ยืนยันการตรวจสอบ" → สถานะ = audited

---

### MT-4: Manual Test — Money Transfer Owner Flow

> **Login ด้วย:** Owner  
> **เลือกวันที่:** status = audited หรือ audited_with_issues

#### ขั้นตอนการทดสอบ

**Step 1: เปิดหน้า Service (Owner view)**
- [ ] **QuickGlanceSummary** แสดงข้อมูลครบ
- [ ] **Workflow Progress Bar** ขั้นตอน "Owner" highlight

**Step 2: ตรวจสอบ Expandable Summary Cards**
- [ ] เห็น 3 cards:
  1. **Step 1 Card** ("Manager บันทึกรายการ") — มี badge แสดงจำนวนรายการ
  2. **Step 2 Card** ("Manager ตรวจนับเงิน") — มี badge "ตรงกัน ✅" หรือ "มีส่วนต่าง ⚠️"
  3. **Audit Card** ("ผลการตรวจสอบ Auditor") — มี badge "ผ่าน ✅" หรือ "มีปัญหา ⚠️"
- [ ] กด card → expand → เห็นรายละเอียดใน card
- [ ] กดอีกครั้ง → collapse

**Step 3: ตรวจสอบ Decision Card (Radio Card)**
- [ ] เห็น 3-column radio card:
  1. 🟢 "อนุมัติ" (green border)
  2. 🔵 "อนุมัติพร้อมหมายเหตุ" (blue border)
  3. 🔴 "ขอให้แก้ไข" (red border)
- [ ] **"ขอให้แก้ไข" ใช้ได้เสมอ** (ไม่มีเงื่อนไข disabled)
- [ ] เลือก "อนุมัติพร้อมหมายเหตุ" → ต้องกรอก notes
- [ ] เลือก "ขอให้แก้ไข" → ต้องกรอก notes
- [ ] กด Submit → สถานะเปลี่ยนตาม decision

**Step 4: ทดสอบ Needs Correction Flow**
- [ ] เลือก "ขอให้แก้ไข" → กรอก notes → Submit
- [ ] สถานะ = needs_correction
- [ ] Login เป็น Manager → เห็น banner "ส่งกลับแก้ไข" + เหตุผล
- [ ] Manager แก้ไข → ส่ง → Auditor ตรวจใหม่ → Owner อนุมัติ

---

### BP-1: Manual Test — Bill Payment History Page

> **หน้าที่ทดสอบ:** `/finance/bill-payment-history`  
> **ทดสอบ 3 role เหมือน MT-1**

#### ขั้นตอนการทดสอบ

**Step 1-5: เหมือน MT-1 แต่สำหรับ Bill Payment**

- [ ] เปิดหน้า Bill Payment History
- [ ] เห็น Pending Inbox cards 3 role
- [ ] ตาราง มี columns เหมือน MT
- [ ] Status Badge สีถูกต้อง
- [ ] ปุ่ม Action → **navigate ไป URL เดียว** `/finance/bill-payment-service?date=X` (ทุก role ไป URL เดียวกัน)

**Step 6: เปรียบเทียบกับ MT**
- [ ] Layout, สี, spacing เหมือน MT History Page
- [ ] Pending Inbox cards format เดียวกัน
- [ ] Status badge ใช้สีเดียวกันสำหรับ status เดียวกัน

---

### BP-2: Manual Test — Bill Payment Service Page (Manager Flow)

> **หน้าที่ทดสอบ:** `/finance/bill-payment-service?date=YYYY-MM-DD`  
> **Login ด้วย:** Manager  
> **เปรียบเทียบกับ:** MT-2

#### ขั้นตอนการทดสอบ

**Step 1: เปิดหน้า Service วันใหม่**
- [ ] **Workflow Progress Bar:** เห็น 4 ขั้นตอน เหมือน MT
- [ ] **Opening Balance Alert:** เห็นข้อความเตือน

**Step 2: ตั้ง Opening Balance**
- [ ] กดปุ่ม → modal → "ยกยอดจากวันก่อน" / "กำหนดเอง"
- [ ] Submit → Alert หายไป → Balance Cards อัปเดต

**Step 3: ตรวจสอบ Balance Cards (BP)**
- [ ] **CompactBalanceSummary:** แถวบน 4 cards (เงินเริ่มต้น, รวมรับชำระ, เงินในบัญชีคงเหลือ, เงินสดคงเหลือ)
- [ ] แถวล่าง (expandable): รวมฝากเงิน, ค่าธรรมเนียม
- [ ] ปุ่ม expand/collapse ทำงาน

**Step 4: ตรวจสอบ Quick Actions (BP)**
- [ ] เห็น 3 ปุ่ม: ⭐ รายการโปรด / 📄 รับชำระบิล / 💰 ฝากเงิน
- [ ] กด "รับชำระบิล" → Transaction Form → type = bill_payment
- [ ] กด "ฝากเงิน" → Transaction Form → type = owner_deposit
- [ ] Disabled เมื่อยังไม่ตั้ง Opening Balance

**Step 5: บันทึก Bill Payment Transaction**
- [ ] เลือก type = "รับชำระบิล"
- [ ] เลือกประเภทบิล (ค่าน้ำ/ค่าไฟ/โทรศัพท์/ประกัน/อื่นๆ)
- [ ] กรอก จำนวนเงิน → **Auto Commission** คำนวณอัตโนมัติ
- [ ] กดปุ่ม toggle "อัตโนมัติ/กำหนดเอง" → เปลี่ยนโหมด commission
- [ ] กรอกชื่อลูกค้า
- [ ] กด Submit → เพิ่มในตาราง

**Step 6: ทดสอบ Draft (BP)**
- [ ] บันทึก transaction ที่ยอดไม่พอ → เป็น draft
- [ ] เห็น Draft Alert → ดำเนินการ / ลบ

**Step 7: ทดสอบ Status Change (BP)**
- [ ] completed ↔ on_hold → ต้องใส่เหตุผล
- [ ] → cancelled → ต้องใส่เหตุผล

**Step 8: Filter Tabs + Pagination (BP)**
- [ ] เหมือน MT: 4 tabs + pagination 10/page

**Step 9: Favorites (BP)**
- [ ] กดปุ่ม "รายการโปรด" → Favorite Modal
- [ ] 5 tabs, max 10 per tab
- [ ] เพิ่ม/แก้ไข/ลบ Favorite
- [ ] เลือก → auto-fill (customerName, billType, amount, commission)

**Step 10: Step 1 Checklist (BP)**
- [ ] Checklist 4 ข้อ เหมือน MT
- [ ] กด "ยืนยันบันทึกรายการ" → status = step1_completed

**Step 11: Cash Verification Step 2 (BP)**
- [ ] **CashVerificationTable** — rows:
  - A. เงินสดรับชำระบิล
  - B. ค่าธรรมเนียมสะสม
- [ ] Notes textarea แสดงเสมอ
- [ ] กด Submit → status = step2_completed (หรือ step2_completed_with_notes)

---

### BP-3: Manual Test — Bill Payment Auditor Flow

> **Login ด้วย:** Auditor  
> **เปรียบเทียบกับ:** MT-3

#### ขั้นตอนการทดสอบ

**Step 1: เปิดหน้า Service (Auditor view)**
- [ ] **อยู่ URL เดียวกับ Manager** `/finance/bill-payment-service?date=X` (ไม่ใช่หน้าแยก)
- [ ] QuickGlanceSummary + Progress Bar (Auditor highlight)
- [ ] Step 1 + Step 2 read-only

**Step 2: Balance Snapshot (BP)**
- [ ] 3 cards: Opening → Net Change → Expected Closing
- [ ] Net Change คำนวณถูกต้องตามธรรมชาติ BP (+รับชำระ)

**Step 3: Bank Statement (BP)**
- [ ] เทียบกับ Expected Closing Balance (ไม่ใช่ actual cash)
- [ ] แสดง diff + badge

**Step 4: Transaction Toggle (BP)**
- [ ] Toggle "มีปัญหา" per row (ไม่ใช่ checkbox)
- [ ] Eye icon ดูรายละเอียด

**Step 5: Auditor Cash Count (BP)**
- [ ] CashVerificationTable 5 คอลัมน์ (คาดหวัง / Manager นับ / Auditor นับ [input] / ส่วนต่าง)
- [ ] กรอก Auditor counts

**Step 6: 3 ปุ่ม Action (BP)**
- [ ] เหมือน MT: ส่งคืน / ยืนยันพร้อมหมายเหตุ / ยืนยัน
- [ ] ทดสอบแต่ละปุ่ม → สถานะเปลี่ยนถูกต้อง

---

### BP-4: Manual Test — Bill Payment Owner Flow

> **Login ด้วย:** Owner  
> **เปรียบเทียบกับ:** MT-4

#### ขั้นตอนการทดสอบ

**Step 1: เปิดหน้า Service (Owner view)**
- [ ] **อยู่ URL เดียวกับ Manager/Auditor** (single page)
- [ ] QuickGlanceSummary + Progress Bar (Owner highlight)

**Step 2: Expandable Summary Cards (BP)**
- [ ] 3 cards เหมือน MT (Step 1 / Step 2 / Audit)
- [ ] ใช้ **WorkflowStepSummaryCard** (shared component เดียวกัน)
- [ ] Expand/collapse ทำงาน

**Step 3: Decision Card (BP)**
- [ ] **OwnerDecisionCard** 3-column radio card เหมือน MT
- [ ] "ขอให้แก้ไข" ใช้ได้เสมอ (ไม่มี disabled condition)
- [ ] Notes required ตามเงื่อนไข
- [ ] Submit → สถานะเปลี่ยนถูกต้อง

**Step 4: Needs Correction Flow (BP)**
- [ ] Owner ส่งกลับ → Manager แก้ → Auditor ตรวจ → Owner อนุมัติ (full loop)

---

### SHARED-1: Manual Test — Shared Components Consistency

> **เป้าหมาย:** ตรวจว่า MT และ BP ใช้ shared components เดียวกัน ดู/ทำงานเหมือนกัน

#### ขั้นตอนการทดสอบ

**เปิด 2 tabs:** MT Service + BP Service (วันเดียวกัน, login เป็น Manager)

- [ ] **WorkflowProgressBar:** สี, animation, text เหมือนกัน
- [ ] **CompactBalanceSummary:** layout, expand/collapse เหมือนกัน (cards ต่างกันตามข้อมูล)
- [ ] **CashVerificationTable:** format ตาราง, สีส่วนต่าง เหมือนกัน
- [ ] **QuickGlanceSummary:** format เหมือนกัน (label อาจต่างเช่น "ค่าบริการ" vs "ค่าธรรมเนียม")

**เปิด 2 tabs:** MT Service + BP Service (login เป็น Auditor)

- [ ] **BalanceSnapshot:** 3 cards format เหมือนกัน
- [ ] **CashVerificationTable (5 col):** format auditor view เหมือนกัน
- [ ] **Transaction toggle "มีปัญหา":** UI เหมือนกัน

**เปิด 2 tabs:** MT Service + BP Service (login เป็น Owner)

- [ ] **WorkflowStepSummaryCard:** 3 cards format เหมือนกัน
- [ ] **OwnerDecisionCard:** 3-column radio card เหมือนกัน
- [ ] **"ขอให้แก้ไข"** ใช้ได้เสมอในทั้งสอง service

---

### SHARED-2: Manual Test — Workflow Status Consistency

> **เป้าหมาย:** ตรวจว่า status labels/colors/transitions ตรงกัน

| Status | Label (ไทย) | Badge สี | MT | BP |
|---|---|---|---|---|
| `step1_in_progress` | กำลังบันทึก | เหลือง | ☐ ตรง | ☐ ตรง |
| `step1_completed` | รอตรวจนับ | น้ำเงิน | ☐ ตรง | ☐ ตรง |
| `step2_completed` | รอตรวจสอบ | น้ำเงิน | ☐ ตรง | ☐ ตรง |
| `step2_completed_with_notes` | รอตรวจสอบ (มีหมายเหตุ) | น้ำเงิน | ☐ ตรง | ☐ ตรง |
| `audited` | ตรวจสอบแล้ว | ม่วง/indigo | ☐ ตรง | ☐ ตรง |
| `audited_with_issues` | ตรวจสอบแล้ว (มีปัญหา) | ส้ม | ☐ ตรง | ☐ ตรง |
| `approved` | อนุมัติแล้ว | เขียว | ☐ ตรง | ☐ ตรง |
| `approved_with_notes` | อนุมัติแล้ว (มีหมายเหตุ) | เขียว | ☐ ตรง | ☐ ตรง |
| `needs_correction` | ส่งกลับแก้ไข | แดง | ☐ ตรง | ☐ ตรง |

---

## 3. ขั้นตอนที่ 2: Bug Fix

> **ทำโดย:** AI  
> **เมื่อไหร่:** หลังจาก Manual Test เสร็จ → รวบรวม bug list  
> **1 Task = 1 Chat session**

### วิธีรายงาน Bug

เมื่อพบ bug ในขั้นตอนที่ 1 ให้จดตามรูปแบบนี้:

```
BUG-001: [Task ที่พบ] — [อธิบายปัญหาสั้นๆ]
- หน้า: /finance/xxx
- Role: Manager/Auditor/Owner
- ขั้นตอน: Step X → ทำอะไร → คาดหวังอะไร → ได้ผลอะไร
- Screenshot: (ถ้ามี)
- Console Error: (ถ้ามี)
```

### Task Prompts สำหรับ Bug Fix

#### BugFix-1: แก้ Bug รอบแรก

**Skill:** `refactor` + `review-and-refactor`

```
ฉันทดสอบ Manual Test ตามแผน TESTING_PLAN.md เสร็จแล้ว พบ bug ดังนี้:

[วาง bug list ที่จด]

กรุณา:
1. อ่าน bug list ทั้งหมด
2. วิเคราะห์สาเหตุของแต่ละ bug
3. แก้ไข bug ทั้งหมด
4. รัน vitest run เพื่อตรวจว่า test เดิมยังผ่าน
5. ถ้า bug เกี่ยวข้องกับ logic สำคัญ ให้เขียน unit test เพิ่ม

อ้างอิง: docs/PROGRESS/TESTING_PLAN.md
```

#### BugFix-2: แก้ Bug รอบสอง (ถ้ามี)

ทดสอบ Manual Test อีกรอบ → ถ้ายังมี bug → ทำซ้ำจน clear

---

## 4. ขั้นตอนที่ 3: E2E Playwright

> **ทำโดย:** AI  
> **เมื่อไหร่:** หลัง Bug Fix เสร็จ + Manual Test ผ่านทั้งหมด  
> **Skill:** `webapp-testing`  
> **1 Task = 1 Chat session**

### สิ่งที่ต้องเตรียมก่อน E2E

1. **ติดตั้ง Playwright** (ยังไม่มีในโปรเจค)
2. **สร้าง test data fixtures** (seed data สำหรับ E2E)
3. **สร้าง auth helpers** (login function per role)

### Task Prompts สำหรับ E2E

#### E2E-1: Setup Playwright + Auth Helpers

**Skill:** `webapp-testing`

```
ฉันต้องการ setup Playwright สำหรับ E2E testing ในโปรเจค Nuxt 3

โปรเจคนี้:
- ใช้ Nuxt 3 (dev server: http://localhost:3000)
- Auth: Firebase Auth (email/password)
- 3 Roles: Manager, Auditor, Owner
- Data: JSON files (public/data/) — dev mode
- ยังไม่มี Playwright ในโปรเจค

สิ่งที่ต้องทำ:
1. ติดตั้ง @playwright/test
2. สร้าง playwright.config.ts
3. สร้าง tests/e2e/ directory structure
4. สร้าง tests/e2e/helpers/auth.ts — login helper per role
5. สร้าง tests/e2e/helpers/navigation.ts — common navigation helpers
6. สร้าง tests/e2e/fixtures/ — test data setup/teardown
7. เขียน smoke test: login → navigate to home → verify

ทดสอบว่า Playwright สามารถ:
- เปิด browser → ไป localhost:3000
- Login สำเร็จ
- Navigate ไปหน้าต่างๆ ได้

อ้างอิง: docs/PROGRESS/TESTING_PLAN.md (ขั้นตอน 3: E2E)
```

#### E2E-2: Money Transfer Happy Path

**Skill:** `webapp-testing`

```
ฉันต้องการเขียน E2E test สำหรับ Money Transfer full happy path

อ่าน:
- tests/e2e/helpers/ (auth + navigation helpers จาก E2E-1)
- docs/PROGRESS/TESTING_PLAN.md (ดู MT-2, MT-3, MT-4)

เขียน test ที่ tests/e2e/money-transfer/happy-path.spec.ts:

Test Flow:
1. Login เป็น Manager
2. ไป History → เพิ่มรายการวันใหม่
3. ตั้ง Opening Balance (manual)
4. บันทึก transaction 2-3 รายการ
5. ตรวจ balance cards อัปเดต
6. ทำ Step 1 Completion (checklist ครบ → กดยืนยัน)
7. ทำ Cash Verification (กรอกตัวเลข → submit)
8. Logout → Login เป็น Auditor
9. เปิดวันเดียวกัน → ตรวจ Balance Snapshot
10. กรอก Bank Statement + Auditor Cash Count
11. กด "ยืนยันการตรวจสอบ"
12. Logout → Login เป็น Owner
13. เปิดวันเดียวกัน → ตรวจ Summary Cards
14. เลือก "อนุมัติ" → Submit
15. Verify status = approved

ใช้ data-testid selectors เมื่อเป็นไปได้
Capture screenshot ทุก step สำคัญ

อ้างอิง: docs/PROGRESS/TESTING_PLAN.md
```

#### E2E-3: Bill Payment Happy Path

**Skill:** `webapp-testing`

```
ฉันต้องการเขียน E2E test สำหรับ Bill Payment full happy path

(เหมือน E2E-2 แต่สำหรับ Bill Payment)

Test Flow:
1. Login เป็น Manager
2. ไป BP History → เพิ่มรายการวันใหม่
3. ตั้ง Opening Balance
4. บันทึก bill payment transaction 2-3 รายการ (ตรวจ auto commission)
5. ทดสอบ Favorites (เพิ่ม + ใช้งาน)
6. Step 1 Checklist → ยืนยัน
7. Cash Verification → submit
8. Auditor flow (login → review → ยืนยัน)
9. Owner flow (login → approve)
10. Verify status = approved

สร้างที่: tests/e2e/bill-payment/happy-path.spec.ts

อ้างอิง: docs/PROGRESS/TESTING_PLAN.md
```

#### E2E-4: Needs Correction + Edge Cases

**Skill:** `webapp-testing`

```
ฉันต้องการเขียน E2E tests สำหรับ needs_correction flow และ edge cases

Test 1: MT Needs Correction
- Manager → Auditor → Owner "ขอแก้ไข" → Manager แก้ → Auditor ตรวจใหม่ → Owner อนุมัติ

Test 2: BP Needs Correction
- เหมือน Test 1 แต่สำหรับ Bill Payment

Test 3: Auditor with Issues
- Auditor กด "ยืนยันพร้อมหมายเหตุ" → Owner เห็น badge "มีปัญหา" → อนุมัติพร้อมหมายเหตุ

Test 4: Draft Transaction Flow
- Manager บันทึก transaction ยอดไม่พอ → draft → complete draft → verify

สร้างที่: tests/e2e/workflows/correction-flow.spec.ts

อ้างอิง: docs/PROGRESS/TESTING_PLAN.md
```

#### E2E-5: Shared Components Visual Consistency

**Skill:** `webapp-testing`

```
ฉันต้องการเขียน E2E tests สำหรับตรวจ visual consistency ระหว่าง MT และ BP

Test Flow:
1. Login → ไป MT Service → screenshot ทุก section
2. ไป BP Service (วันเดียวกัน) → screenshot ทุก section
3. เปรียบเทียบ screenshots (manual review)

Sections ที่ต้อง capture:
- Progress Bar
- Balance Summary Cards
- Cash Verification Table
- Auditor view
- Owner view (Summary Cards + Decision Card)

สร้างที่: tests/e2e/visual/consistency.spec.ts
Screenshots บันทึกที่: tests/e2e/screenshots/

อ้างอิง: docs/PROGRESS/TESTING_PLAN.md
```

---

## 5. Task Breakdown — สรุปทั้งหมด

| # | Task ID | ชื่อ Task | ทำโดย | Skill | สถานะ |
|---|---|---|---|---|---|
| 1 | MT-1 | MT History Page Manual Test | คุณ | — | ✅ |
| 2 | MT-2 | MT Service Manager Flow | คุณ | — | ☐ |
| 3 | MT-3 | MT Auditor Flow | คุณ | — | ☐ |
| 4 | MT-4 | MT Owner Flow | คุณ | — | ☐ |
| 5 | BP-1 | BP History Page Manual Test | คุณ | — | ☐ |
| 6 | BP-2 | BP Service Manager Flow | คุณ | — | ☐ |
| 7 | BP-3 | BP Auditor Flow | คุณ | — | ☐ |
| 8 | BP-4 | BP Owner Flow | คุณ | — | ☐ |
| 9 | SHARED-1 | Shared Components Consistency | คุณ | — | ☐ |
| 10 | SHARED-2 | Workflow Status Consistency | คุณ | — | ☐ |
| 11 | BugFix-1 | Bug Fix รอบ 1 | AI | `refactor` / `review-and-refactor` | ☐ |
| 12 | BugFix-2 | Bug Fix รอบ 2 (ถ้ามี) | AI | `refactor` / `unit-test-vue-pinia` | ☐ |
| 13 | E2E-1 | Setup Playwright + Auth | AI | `webapp-testing` | ☐ |
| 14 | E2E-2 | MT Happy Path E2E | AI | `webapp-testing` | ☐ |
| 15 | E2E-3 | BP Happy Path E2E | AI | `webapp-testing` | ☐ |
| 16 | E2E-4 | Correction + Edge Cases E2E | AI | `webapp-testing` | ☐ |
| 17 | E2E-5 | Visual Consistency E2E | AI | `webapp-testing` | ☐ |

**รวม 17 Tasks** (10 Manual + 2 Bug Fix + 5 E2E)

---

## 6. บันทึกผลการทดสอบ

### Manual Test Results

| Task | วันที่ทดสอบ | ผลลัพธ์ | จำนวน Bug | หมายเหตุ |
|---|---|---|---|---|
| MT-1 | 15 เม.ย. 2569 | ✅ ผ่าน | 3 (แก้แล้ว) | PR #143, #144 — แก้ status labels/colors, เพิ่ม card filtering, แก้ column header |
| MT-2 | | ☐ ผ่าน / ☐ ไม่ผ่าน | | |
| MT-3 | | ☐ ผ่าน / ☐ ไม่ผ่าน | | |
| MT-4 | | ☐ ผ่าน / ☐ ไม่ผ่าน | | |
| BP-1 | | ☐ ผ่าน / ☐ ไม่ผ่าน | | |
| BP-2 | | ☐ ผ่าน / ☐ ไม่ผ่าน | | |
| BP-3 | | ☐ ผ่าน / ☐ ไม่ผ่าน | | |
| BP-4 | | ☐ ผ่าน / ☐ ไม่ผ่าน | | |
| SHARED-1 | | ☐ ผ่าน / ☐ ไม่ผ่าน | | |
| SHARED-2 | | ☐ ผ่าน / ☐ ไม่ผ่าน | | |

### Bug List

| Bug ID | Task | อธิบาย | Severity | สถานะ |
|---|---|---|---|---|
| | | | | |

### E2E Test Results

| Task | วันที่ | Pass | Fail | Screenshots |
|---|---|---|---|---|
| E2E-1 | | | | |
| E2E-2 | | | | |
| E2E-3 | | | | |
| E2E-4 | | | | |
| E2E-5 | | | | |

---

## Test Data Reference

### Money Transfer Test Dates

| Date | Status | ใช้ทดสอบ |
|------|--------|---------|
| 2026-03-09 | `step1_in_progress` | MT-2 (Manager flow) |
| 2026-03-08 | `step1_completed` | MT-2 (Step 2) |
| 2026-03-04 | `step2_completed` | MT-3 (Auditor flow) |
| 2026-02-27 | `approved` | MT-4 (Owner view approved) |
| (วันใหม่) | ไม่มีข้อมูล | MT-2 (สร้างใหม่ full flow) |

### Bill Payment Test Dates

> ตรวจสอบ seed data ใน `public/data/bill-payment-*.json`

### Test Accounts

| Role | Email | Password | หมายเหตุ |
|------|-------|----------|---------|
| Manager | (ใส่เอง) | (ใส่เอง) | ROLES.MANAGER |
| Auditor | (ใส่เอง) | (ใส่เอง) | ROLES.AUDITOR |
| Owner | (ใส่เอง) | (ใส่เอง) | ROLES.OWNER |
