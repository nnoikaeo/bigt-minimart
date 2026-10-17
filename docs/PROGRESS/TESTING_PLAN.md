# แผนการทดสอบ Service Harmonization (Phase 1-6)

> **วันที่จัดทำ:** 14 เมษายน 2569  
> **อ้างอิง:** `docs/ARCHIVE/PROGRESS/SERVICE_HARMONIZATION_PLAN.md` (archived — implementation complete)  
> **อัปเดตล่าสุด:** 16 ต.ค. 2569  
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

**Step 6: ทดสอบคิว Draft (รอดำเนินการ)**
> ⚠️ เปลี่ยนเป็น **คิว draft** แล้ว (PR คิว draft, ต.ค. 2569 — สเปก `docs/REQUIREMENTS/DRAFT_QUEUE_AND_CASH_LOAN.md`):
> รายการโอน/ถอนใหม่เข้าคิว "รอดำเนินการ" เสมอ (ไม่ต้องเลือก "สำเร็จ/ไม่สำเร็จ" แล้ว) — ฝากเงินบันทึกเป็นสำเร็จทันที
> (ผลทดสอบแบบเดิม 15-27 เม.ย. 2569 ผ่าน แต่พฤติกรรมเปลี่ยนแล้ว → ทดสอบใหม่ตามรายการด้านล่าง)
> ผลรอบ 1 (17 ต.ค. 2569): ฟอร์ม + บันทึกเข้าคิวผ่าน — กด "ดำเนินการ" ตอนยอดไม่พอแล้วไม่เห็นข้อความแจ้ง (BUG-007) + modal รายละเอียดมีปุ่มมากเกิน (BUG-008) → แก้แล้ว; รอบ 2: dialog "ดำเนินการไม่ได้" ✅, คลิกแถวไม่เปิด modal (BUG-009) → แก้แล้ว; รอบ 3: ฝาก 10,000 → ดำเนินการ 5,000/300/200 (รายการโปรด), ยกเลิก 500 — ยอดถูกต้องทุกขั้น (บัญชี 8,250 / เงินสด 6,750), checklist Step 1 ครบ ✅; รอบ 4: แก้ไข draft 100 → 150 ยังอยู่ในคิว ✅, modal แบบใหม่ ✅ → **Step 6 ผ่านครบ 14/14**
- [x] ฟอร์มรายการใหม่ (โอน/ถอน) ไม่มีตัวเลือก "สำเร็จ / ไม่สำเร็จ" — มีข้อความว่าจะเข้าคิว + ปุ่ม "บันทึกเข้าคิว"
- [x] แถบยอดเงินในฟอร์มเป็นข้อมูล (ยอดปัจจุบัน → หลังดำเนินการ) — ยอดไม่พอแสดงสีเหลือง แต่ยังบันทึกได้
- [x] บันทึกโอนเงิน (ยอดพอ) → เข้าคิว "รอดำเนินการ" (ยอดใน Balance Cards ยังไม่เปลี่ยน)
- [x] บันทึกหลายรายการติดกัน → คิวแสดงครบทุกรายการ (ไม่บล็อกการบันทึก)
- [x] รายการโปรด → "บันทึกเข้าคิว" → เข้าคิวเหมือนฟอร์มปกติ (ยอดพอหรือไม่พอก็ตาม)
- [x] ฝากเงิน → บันทึกเป็น "สำเร็จ" ทันที (ไม่เข้าคิว) และยอดในบัญชีเพิ่ม
- [x] กด "ดำเนินการ" โอนเงินที่ยอดพอ → สำเร็จ + ยอดอัปเดต
- [x] กด "ดำเนินการ" โอนเงินที่ยอดในบัญชีไม่พอ → dialog "ดำเนินการไม่ได้": "ยอดในบัญชีไม่พอ (ขาด X)" — รายการยังอยู่ในคิว (ทั้งจากการ์ดคิวและจาก modal รายละเอียด)
- [x] ฝากเงินเข้า → กด "ดำเนินการ" รายการเดิมอีกครั้ง → สำเร็จ
- [x] กด "ดำเนินการ" ถอนเงินที่เงินสดไม่พอ → dialog "เงินสดไม่พอ (ขาด X)" (เช็คเงินสด ไม่ใช่ยอดในบัญชี — BUG-004)
- [x] กด "ยกเลิก" ที่รายการในคิว → ยืนยัน → สถานะ "ยกเลิก" ไม่กระทบยอด (เห็นใน tab "ทั้งหมด")
- [x] แก้ไขรายการในคิว (ปุ่มดินสอ) → บันทึกแล้วยังอยู่ในคิว (ไม่ auto-complete)
- [x] กดปุ่มลบ (ถังขยะ) ที่รายการในคิว → ลบออก
- [x] คลิกที่แถวรายการ (ตรงไหนก็ได้ รวมชื่อบัญชี/สถานะ) → เปิด Detail modal (BUG-009)
- [x] Detail modal ของรายการในคิว: มีแค่ปุ่ม ยกเลิก / ดำเนินการ (แก้ไข/ลบ อยู่ที่แถวในตาราง) + ปิดด้วย ✕ มุมขวาบน

**Step 7: ทดสอบ Status Change**
> ⚠️ หมายเหตุ: ปุ่ม ⋮ (Status Change Modal แยก) ถูกลบออกแล้ว (PR #149)
> การเปลี่ยนสถานะทำผ่านปุ่ม 🔄 (ArrowPath) ที่แถวรายการ completed/on_hold → modal "แก้ไขรายการและเปลี่ยนสถานะ" (ปุ่มดินสอแสดงเฉพาะ draft)
> ทางเปลี่ยนสถานะ: completed → on_hold → completed / cancelled (ยกเลิกได้จาก on_hold เท่านั้น)
> ช่อง "เหตุผล" **required** เมื่อเปลี่ยนสถานะ (ไม่ required เมื่อเลือก "แก้ไขรายการ") — แก้ไขข้อความ 16 ต.ค. 2569 ให้ตรงกับหน้าจอจริง
- [x] ที่แถว transaction → กดปุ่มดินสอ (แก้ไข) → เปลี่ยนสถานะในฟอร์ม
- [x] เปลี่ยน completed → on_hold → บันทึกสำเร็จ (ช่องเหตุผลแสดง แต่ไม่ required)
- [x] เปลี่ยน on_hold → completed → บันทึกสำเร็จ
- [x] เปลี่ยน → cancelled → บันทึกสำเร็จ (ช่องเหตุผลแสดง แต่ไม่ required)

**Step 8: ทดสอบ Filter Tabs + Pagination**
> Login ด้วย **Manager** (`lek@bigt.co.th`) — ส่วนบันทึกรายการแสดงตาม **primaryRole** เท่านั้น (Owner ที่มี role manager ด้วยจะเห็นแค่ "⏳ Manager กำลังบันทึกรายการ")
> เพิ่ม tab "ยกเลิก" แล้ว (17 ต.ค. 2569, BUG-010) — ผลรวม 4 tab (สำเร็จ + รอดำเนินการ + พักรายการ + ยกเลิก) ต้องเท่ากับ "ทั้งหมด"
- [x] เห็น tabs: ทั้งหมด / สำเร็จ / รอดำเนินการ / พักรายการ (อยู่ใต้หัวข้อ "รายการธุรกรรมวันนี้")
- [ ] เห็น tab "ยกเลิก" ต่อท้าย — badge ทั้ง 4 tab รวมกัน = "ทั้งหมด" และกด tab แล้วเห็นเฉพาะรายการที่ยกเลิก (BUG-010)
- [x] กดแต่ละ tab → filter รายการถูกต้อง (สำเร็จ 2, พักรายการ 1, รอดำเนินการ 0 → empty message "ไม่มีรายการที่มีสถานะ รอดำเนินการ")
- [x] badge count ในแต่ละ tab ตรงกับจำนวนจริง และอัปเดตทันทีเมื่อเปลี่ยนสถานะ (completed → on_hold → cancelled, สร้าง draft ผ่านรายการโปรด)
- [x] ถ้ามี > 10 รายการ → เห็น pagination `‹ 1 / 2 ›` (17 ต.ค. 2569 — 11 รายการ)
- [x] หน้า 2 เลขลำดับต่อเนื่อง (11, 12, …) และปุ่ม ‹ / › disabled ที่หน้าแรก/หน้าสุดท้าย (17 ต.ค. 2569)
- [x] เปลี่ยน tab ขณะอยู่หน้า 2 → กลับไปหน้า 1 (17 ต.ค. 2569)
- [ ] อยู่หน้า 2 แล้วรายการลดเหลือ ≤ 10 (เช่น ลบ draft) → ตารางต้องไม่ว่าง (ยังไม่ทดสอบ — สงสัย BUG-006)

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
  3. ✅/❌ ไม่มีรายการรอดำเนินการค้างอยู่ (คิว draft)
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

**Step 6: ทดสอบคิว Draft (BP)**
> คิว draft แบบเดียวกับ MT-2 Step 6 (สเปก `docs/REQUIREMENTS/DRAFT_QUEUE_AND_CASH_LOAN.md`)
- [ ] ฟอร์มรายการใหม่ไม่มีตัวเลือกสถานะ — รับชำระบิลแสดงข้อความเข้าคิว + ปุ่ม "บันทึกเข้าคิว"
- [ ] บันทึกรับชำระบิล → เข้าคิว "รอดำเนินการ" (ยอดยังไม่เปลี่ยน); รายการโปรดก็เข้าคิวเหมือนกัน
- [ ] ฝากเงิน → "สำเร็จ" ทันที (ไม่เข้าคิว)
- [ ] กด "ดำเนินการ" (ยอดในบัญชีพอ) → สำเร็จ + ยอดอัปเดต
- [ ] กด "ดำเนินการ" (ยอดในบัญชีไม่พอ) → dialog "ดำเนินการไม่ได้": "ยอดในบัญชีไม่พอ (ขาด X)"
- [ ] กด "ยกเลิก" → ยืนยัน → สถานะ "ยกเลิก" ไม่กระทบยอด
- [ ] แก้ไขรายการในคิว → ไม่มีตัวเลือกสถานะ และยังอยู่ในคิวหลังบันทึก
- [ ] ลบรายการในคิวได้

**Step 7: ทดสอบ Status Change (BP)**
> ⚠️ หมายเหตุ: เหมือน MT-2 Step 7 — ปุ่ม ⋮ ถูกลบออกแล้ว (PR #149)
> การเปลี่ยนสถานะทำผ่าน Edit Modal (ปุ่มดินสอ) เท่านั้น
> ตัวเลือกสถานะแสดงเฉพาะตอนแก้ไขรายการที่ออกจากคิวแล้ว: สำเร็จ / พักรายการ / ยกเลิก (ไม่มี "รอดำเนินการ" — คิว draft)
> ช่อง "เหตุผล/หมายเหตุสถานะ" แสดงอัตโนมัติเมื่อเลือก on_hold/cancelled แต่ไม่ใช่ required
- [ ] ที่แถว transaction → กดปุ่มดินสอ (แก้ไข) → เปลี่ยนสถานะในฟอร์ม
- [ ] completed ↔ on_hold → บันทึกสำเร็จ (ช่องเหตุผลแสดง แต่ไม่ required)
- [ ] → cancelled → บันทึกสำเร็จ (ช่องเหตุผลแสดง แต่ไม่ required)
- [ ] ปุ่มแก้ไขแสดงเฉพาะสถานะ `step1_in_progress` / `needs_correction` — สถานะอื่นแก้ไขไม่ได้ (workflow edit gate)

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
ฉันต้องการ setup Playwright สำหรับ E2E testing ในโปรเจค Nuxt 4

โปรเจคนี้:
- ใช้ Nuxt 4 (dev server: http://localhost:3000)
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
- Manager บันทึก transaction → เข้าคิว draft → ดำเนินการ (complete) / ยกเลิก → verify ยอด

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
| 2 | MT-2 | MT Service Manager Flow | คุณ | — | 🔄 Step 1-7 |
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
| MT-2 | 15-27 เม.ย. 2569, 16-17 ต.ค. 2569 | 🔄 Step 1-5, 7 ผ่าน; Step 6 (คิว draft) ผ่านครบ 14/14 (17 ต.ค., 4 รอบ); Step 8 pagination ผ่าน 3/4 (เหลือ BUG-006) + tab "ยกเลิก" ใหม่ (BUG-010) รอทดสอบ | 10 (BUG-001~005, 007~010) + สงสัย 1 (BUG-006) | PR #147, #149; `feat/draft-queue` (คิว draft + BUG-004/007/008/009) — เหลือ Step 8 (2 ข้อ: tab ยกเลิก, BUG-006), 9-11 |
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
| BUG-001 | MT-2 Step 8 | ฟอร์มแก้ไขรายการที่ **completed** แสดงยอดเงินสดก่อน/หลังผิด (ถอน 500: แสดง 750 → 250 ควรเป็น 1,250 → 750) — หักยอดรายการตัวเองซ้ำ; `hasSufficientBalance` ผิดด้วย (`components/money-transfer/TransactionForm.vue` bannerInfo) | Medium | ☐ เปิด |
| BUG-002 | MT-2 Step 8 | ปุ่ม "ยืนยันบันทึกรายการ" ไม่ disabled เมื่อมีรายการพักค้าง (`:disabled` ไม่รวม `hasOnHold`) — กดแล้ว handler บล็อก จึงไม่เสียข้อมูล แต่ขัดกับ Step 10 (`ManagerRecordingSection.vue`) | Low | ☐ เปิด |
| BUG-003 | MT-2 Step 8 | Modal เปลี่ยนสถานะ: ปุ่มปิดฟอร์มชื่อ "ยกเลิก" ซ้ำกับตัวเลือกสถานะ "ยกเลิก" → ผู้ทดสอบกดผิด (ควรเปลี่ยนเป็น "ปิด") | Low (UX) | ☐ เปิด |
| BUG-004 | MT-2 Step 8 (อ่านโค้ด) | กด "ดำเนินการ" draft เช็คยอดในบัญชี (`bankAccount`) เสมอ — draft ถอนเงินควรเช็คเงินสด (`transferCash`) (`server/api/money-transfer/transactions/[id]/complete.post.ts`) | Medium | ✅ แก้แล้ว + ทดสอบผ่าน 17 ต.ค. 2569 (ถอน 2,000 เงินสด 1,250 → "เงินสดไม่พอ (ขาด 750)") |
| BUG-005 | MT-2 Step 6/8 | ฟอร์มปกติไม่ auto-draft (ยอดติดลบได้) แต่รายการโปรด auto-draft — กติกาไม่สอดคล้องกัน | Design | 🔧 PR 1 คิว draft implement แล้ว (`feat/draft-queue`) — รอทดสอบ MT-2 Step 6 / BP-2 Step 6; PR 2 (ยืม/คืนเงินขาย) ยังไม่ทำ |
| BUG-007 | MT-2 Step 6 | กด "ดำเนินการ" draft ที่ยอดไม่พอ (การ์ดคิว + modal รายละเอียด) แล้วไม่เห็นอะไรเลย — ข้อความ error อยู่บนสุดของ section (เลื่อนพ้นจอ/ถูก modal บัง) | Medium | ✅ แก้แล้ว + ทดสอบผ่าน 17 ต.ค. 2569 (MT) — dialog "ดำเนินการไม่ได้" |
| BUG-008 | MT-2 Step 6 | UX: modal รายละเอียด draft มี 5 ปุ่มเต็มแถว; ข้อความ "โทรหา Owner ให้ฝากเงินเข้า" ไม่ควรแสดงในแอป (เป็นวิธีปฏิบัติในร้าน) | Low (UX) | ✅ แก้แล้ว + ทดสอบผ่าน 17 ต.ค. 2569 (MT): modal เหลือ ยกเลิก/ดำเนินการ + ✕, ตัดข้อความ Owner (MT + BP) |
| BUG-009 | MT-2 Step 6 | คลิกแถวในตารางแล้ว Detail modal ไม่เปิด ถ้าคลิกโดนคอลัมน์ที่ใช้ slot (ชื่อบัญชี/ค่าบริการ/สถานะ) — `TransactionTable.vue` ตัด click ของ slot cell (มีตั้งแต่ #120, กระทบทุกตารางที่ใช้ component นี้) | Medium | ✅ แก้แล้ว + ทดสอบผ่าน 17 ต.ค. 2569 (MT Manager) |
| BUG-010 | MT-2 Step 8 | ผลรวม badge ของ tab (สำเร็จ 7 + รอดำเนินการ 2 + พักรายการ 0 = 9) ไม่เท่ากับ "ทั้งหมด" 11 — รายการยกเลิกไม่มี tab (สำคัญขึ้นเพราะคิว draft ทำให้ยกเลิกบ่อย) | Low | 🔧 แก้แล้ว (`feat/draft-queue`): เพิ่ม tab "ยกเลิก" (MT + BP) — รอทดสอบ |
| BUG-006 | MT-2 Step 8 (อ่านโค้ด) | สงสัย: อยู่หน้า 2 แล้วจำนวนรายการลดจนเหลือ 1 หน้า → `currentPage` ไม่ถูก clamp → ตารางว่าง + pagination หาย | Medium | ☐ รอยืนยันจาก Step 8 pagination |

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

> อัปเดตจาก `public/data/*-summaries.json` เมื่อ 16 ต.ค. 2569 — สถานะจะเปลี่ยนตามการทดสอบ

| Date | Status | Transactions | ใช้ทดสอบ |
|------|--------|--------------|---------|
| 2026-03-11 | `step1_in_progress` | 4 (2 completed, 1 cancelled, 1 draft) — อัปเดต 16 ต.ค. 2569 | MT-2 Step 8-10 (Manager flow) — ต้องเพิ่มอีก ≥ 7 รายการเพื่อทดสอบ pagination |
| 2026-03-10 | `step2_completed` | 10 (9 completed, 1 cancelled) | MT-3 (Auditor flow) — 10 รายการพอดี (pagination ต้องมี > 10) |
| 2026-03-09 | `step2_completed` | 5 | MT-3 (Auditor flow) |
| 2026-03-08 | `step1_completed` | 5 | MT-2 Step 11 (Cash Verification) |
| 2026-03-04 | `approved` | 2 | MT-4 (Owner view approved) |
| 2026-02-27 | `approved` | 6 | MT-4 (Owner view approved) |
| — | `audited` | ไม่มีข้อมูล | MT-4 — ต้องสร้างจาก MT-3 ก่อน |
| (วันใหม่) | ไม่มีข้อมูล | — | MT-2 (สร้างใหม่ full flow) |

### Bill Payment Test Dates

| Date | Status | Transactions | ใช้ทดสอบ |
|------|--------|--------------|---------|
| 2026-04-01 | `step1_in_progress` | 1 (cancelled) | BP-2 (Manager flow) |
| 2026-01-30 | `step2_completed` | 1 | BP-3 (Auditor flow) |
| 2026-01-31 | `approved` | 4 (3 completed, 1 cancelled) | BP-4 (Owner view approved) |
| 2026-01-29 | `approved` | 4 (3 completed, 1 cancelled) | BP-4 (Owner view approved) |
| — | `step1_completed` / `audited` | ไม่มีข้อมูล | ต้องสร้างจาก flow ก่อนหน้า |
| (วันใหม่) | ไม่มีข้อมูล | — | BP-2 (สร้างใหม่ full flow) |

### Test Accounts

> รหัสผ่านเก็บใน Firebase Auth เท่านั้น — **ห้ามใส่รหัสผ่านในไฟล์นี้** (ลืม → reset ใน Firebase Console → Authentication)
> หน้า service แสดงส่วนของ role ตาม **primaryRole** (`public/data/users.json`) — ทดสอบแต่ละ role ต้อง login ด้วยบัญชีที่ primaryRole ตรงกัน

| Role | Email | หมายเหตุ |
|------|-------|---------|
| Manager | `lek@bigt.co.th` | primaryRole: manager |
| Auditor | `tip@bigt.co.th` | primaryRole: auditor |
| Owner | `nop@bigt.co.th` | primaryRole: owner (มีทุก role แต่เห็นเฉพาะมุมมอง Owner) |
