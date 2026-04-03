# Skills Playbook — bigt-minimart

คู่มือการใช้งาน AI Skills สำหรับโปรเจกต์ Nuxt 4 + Vue 3 + Pinia + Firebase

---

## สารบัญ

- [Skills Reference](#skills-reference) — คู่มือแต่ละ skill แบบ quick-reference
- [Workflow Scenarios](#workflow-scenarios) — การใช้หลาย skills ร่วมกันตาม scenario จริง

---

## Skills Reference

### 1. `unit-test-vue-pinia`

**ใช้เมื่อ:** เขียนหรือ review unit tests สำหรับ Vue 3 component, composable, หรือ Pinia store

**Trigger phrases:**
- "write unit tests for this component"
- "add tests for the useMoneyTransfer composable"
- "review the tests in this file"

**ตัวอย่าง — ทดสอบ Pinia store:**
```
Write unit tests for the money-transfer Pinia store.
Focus on: state transitions when submitting a transfer,
and error handling when the Firebase call fails.
```

**ตัวอย่าง — ทดสอบ Vue component:**
```
Write unit tests for the TransactionForm component.
The form should: validate required fields, emit 'submit' with form data,
and show an error banner when the store returns an error.
```

**ตัวอย่าง — ทดสอบ composable:**
```
Write unit tests for useCommission composable.
Test: correct rate calculation for each channel type,
edge case when amount is 0, and when no channel is selected.
```

---

### 2. `conventional-commit`

**ใช้เมื่อ:** ต้องการสร้าง commit message ตาม Conventional Commits specification

**Trigger phrases:**
- "generate a commit message"
- "/commit"
- "create a conventional commit for these changes"

**ตัวอย่าง:**
```
Generate a conventional commit message for the changes I just made
to the money-transfer store and the TransactionForm component.
```

**Output format ที่ได้:**
```xml
<commit-message>
  <type>feat</type>
  <scope>money-transfer</scope>
  <description>add transfer submission with Firebase validation</description>
  <body>
    - Adds submitTransfer action to money-transfer store
    - TransactionForm now validates channel, amount, and recipient
    - Error state surfaced via store.error reactive ref
  </body>
</commit-message>
```

---

### 3. `git-commit`

**ใช้เมื่อ:** ต้องการให้ AI วิเคราะห์ diff แล้ว stage + commit อัตโนมัติ

**Trigger phrases:**
- "commit my changes"
- "/commit"
- "stage and commit these files"

**ตัวอย่าง:**
```
Commit the changes. Stage only files related to the auth fix,
not the WIP money-transfer changes.
```

```
Commit everything with an appropriate conventional commit message.
```

> **ความต่างกับ `conventional-commit`:** `git-commit` รัน `git diff` วิเคราะห์ และ execute `git commit` ได้เลย ส่วน `conventional-commit` สร้าง message format แบบ interactive ให้ copy ไปใช้

---

### 4. `refactor`

**ใช้เมื่อ:** ปรับปรุงโค้ดโดยไม่เปลี่ยน behavior — จัดการ code smells, long methods, magic numbers

**Trigger phrases:**
- "refactor this code"
- "clean up this function"
- "this function is too long, break it down"

**ตัวอย่าง — extract method:**
```
Refactor the calculateCommission function in useCommission.ts.
It's doing too many things: fetching rate, applying tiers, handling edge cases.
Extract each responsibility into its own function.
```

**ตัวอย่าง — magic numbers:**
```
Refactor the money-transfer store to replace all magic numbers
(timeout values, retry counts, fee percentages) with named constants.
```

**ตัวอย่าง — nested conditionals:**
```
Refactor the permission check logic in usePermissions.ts.
Replace the deeply nested if/else with guard clauses.
```

---

### 5. `review-and-refactor`

**ใช้เมื่อ:** ต้องการ code review ครบวงจรตาม coding standards ของโปรเจกต์ใน `.github/instructions/`

**Trigger phrases:**
- "review and refactor this file"
- "do a code review on the sidebar store"
- "check if this component follows our standards"

**ตัวอย่าง:**
```
Review and refactor the money-transfer store.
Check against our coding guidelines and clean up anything that doesn't conform.
```

```
Review the DailySalesModal component.
Ensure it follows our component quality checklist in docs/DEVELOPMENT/.
```

---

### 6. `security-review`

**ใช้เมื่อ:** ต้องการสแกนช่องโหว่ความปลอดภัย — XSS, exposed keys, missing auth, IDOR

**Trigger phrases:**
- "security review"
- "scan this file for vulnerabilities"
- "is this code secure?"
- "/security-review"

**ตัวอย่าง — scan ทั้ง project:**
```
/security-review
```

**ตัวอย่าง — scan เฉพาะ directory:**
```
/security-review server/api/
```

**ตัวอย่าง — เน้น auth:**
```
Security review the middleware/auth.ts and server/api/ endpoints.
Focus on: missing authentication checks, privilege escalation paths,
and whether Firestore rules align with server-side guards.
```

**Output ที่ได้:** ตาราง findings จัด severity (🔴 CRITICAL / 🟠 HIGH / 🟡 MEDIUM / 🔵 LOW) พร้อม code patches

---

### 7. `quality-playbook`

**ใช้เมื่อ:** ต้องการสร้างระบบ quality ครบวงจร — functional tests, review protocol, spec audit

**Trigger phrases:**
- "generate a quality playbook for this project"
- "set up quality playbook"
- "create a quality system"

**ตัวอย่าง:**
```
Generate a quality playbook for this project.
```

**Output ไฟล์ที่ได้:**
| ไฟล์ | หน้าที่ |
|------|---------|
| `quality/QUALITY.md` | Quality constitution — coverage targets, failure scenarios |
| `quality/functional.test.ts` | Automated tests จาก specs |
| `quality/RUN_CODE_REVIEW.md` | Code review protocol |
| `quality/RUN_INTEGRATION_TESTS.md` | Integration test protocol |
| `quality/RUN_SPEC_AUDIT.md` | Council of Three multi-model audit |
| `AGENTS.md` | AI session bootstrap file |

---

### 8. `create-implementation-plan`

**ใช้เมื่อ:** วางแผน implementation ของ feature ใหม่แบบ structured สำหรับ AI agents ทำได้เลย

**Trigger phrases:**
- "create an implementation plan for..."
- "plan the implementation of..."

**ตัวอย่าง:**
```
Create an implementation plan for adding an export-to-PDF feature
for daily sales reports. The feature should allow managers to
download a formatted PDF of any day's sales summary.
```

**Output:** ไฟล์ `plan/feature-daily-sales-pdf-export-1.md` มี phases, tasks, dependencies, risks

---

### 9. `breakdown-feature-implementation`

**ใช้เมื่อ:** มี Feature PRD แล้ว ต้องการแตกเป็น implementation plan พร้อม architecture diagrams

**Trigger phrases:**
- "break down this feature into an implementation plan"
- "create implementation plan from this PRD"

**ตัวอย่าง:**
```
Break down the following feature into an implementation plan:

Feature: Money Transfer Channel Management
- Admins can enable/disable transfer channels (PromptPay, Bank Transfer)
- Each channel has configurable fee structure
- Changes take effect immediately for new transactions
- Audit log for all channel config changes

Follow our Nuxt 4 + Firebase + Pinia architecture.
```

---

### 10. `create-architectural-decision-record`

**ใช้เมื่อ:** บันทึก architectural decisions สำคัญ — เลือก Firebase vs อื่น, เลือก pattern ต่างๆ

**Trigger phrases:**
- "create an ADR for..."
- "document this architectural decision"

**ตัวอย่าง:**
```
Create an ADR for our decision to use Firestore real-time listeners
instead of polling for the daily sales dashboard.

Context: We evaluated polling (every 30s), WebSocket (custom server), and Firestore onSnapshot.
Decision: Firestore onSnapshot for real-time updates.
Alternatives: polling was simpler but laggy; custom WebSocket was overkill.
Stakeholders: Dev team, ops team.
```

**Output:** `docs/adr/adr-0001-firestore-realtime-listeners.md`

---

### 11. `webapp-testing`

**ใช้เมื่อ:** ทดสอบ UI ด้วย Playwright ใน browser จริง — form flows, navigation, visual regression

**Trigger phrases:**
- "test the login flow in the browser"
- "verify the money transfer form works end-to-end"
- "take a screenshot of this page"

**ตัวอย่าง:**
```
Test the complete money transfer flow:
1. Login as a cashier
2. Navigate to Finance > Money Transfer
3. Select PromptPay channel
4. Enter amount 1000 THB
5. Verify the commission breakdown is displayed correctly
6. Submit and verify success state
```

**ตัวอย่าง — screenshot debug:**
```
Navigate to http://localhost:3000/finance/money-transfer
and take a screenshot. Also capture any console errors.
```

---

### 12. `doublecheck`

**ใช้เมื่อ:** ต้องการ verify ความถูกต้องของ AI output — ก่อน apply security patches, architecture decisions

**Trigger phrases:**
- "doublecheck this"
- "verify that response"
- "turn on doublecheck"
- "full report"

**ตัวอย่าง — เปิดใช้งาน persistent mode:**
```
Turn on doublecheck. I'm about to make some security fixes
based on AI recommendations and I want each one verified.
```

**ตัวอย่าง — verify specific output:**
```
Doublecheck the security findings from the previous review.
I want to know if the claimed XSS vulnerability in the template
is a real risk given Vue 3's built-in escaping.
```

---

## Workflow Scenarios

### Scenario A — พัฒนา Feature ใหม่ตั้งแต่ต้น

**เมื่อ:** ได้รับ feature requirement ใหม่ เช่น "เพิ่มระบบ commission แบบ tiered"

```
ขั้นตอน:
1. breakdown-feature-implementation  ← แตก PRD เป็น plan
2. create-implementation-plan        ← สร้างไฟล์ plan อย่างเป็นทางการ  
3. [เขียนโค้ด]
4. unit-test-vue-pinia               ← เขียน tests ควบคู่
5. webapp-testing                    ← ทดสอบ E2E ใน browser
6. review-and-refactor               ← code review รอบสุดท้าย
7. git-commit                        ← commit พร้อม conventional message
```

**ตัวอย่าง prompts ต่อเนื่อง:**

```
[Step 1] Break down this feature into an implementation plan:
"Cashiers can see real-time commission preview as they type the transfer amount.
Preview shows: base amount, channel fee, net to recipient, cashier commission."
Follow our Nuxt 4 + Pinia architecture.
```

```
[Step 2] Create an implementation plan for the commission preview feature
based on the breakdown above. Save to plan/.
```

```
[Step 4] Write unit tests for the useMoneyTransferHelpers composable,
specifically the new calculateCommissionPreview function.
Test: different channels, zero amounts, amounts above tier thresholds.
```

```
[Step 5] Test the commission preview feature end-to-end:
Navigate to /finance/money-transfer, enter various amounts,
verify the preview updates in real-time and shows correct values.
```

```
[Step 6] Review and refactor the new commission preview code.
Check against our component quality checklist.
```

```
[Step 7] Commit all the commission preview changes with an appropriate message.
Stage only the commission-related files.
```

---

### Scenario B — Security Audit ก่อน Production Deploy

**เมื่อ:** ต้องการตรวจสอบความปลอดภัยก่อน push to production

```
ขั้นตอน:
1. security-review                   ← สแกนทั้ง codebase
2. doublecheck                       ← verify findings ที่น่าสงสัย
3. refactor                          ← fix vulnerable code
4. create-architectural-decision-record ← บันทึก security decisions สำคัญ
5. git-commit                        ← commit fixes แยกต่างหาก
```

**ตัวอย่าง prompts:**

```
[Step 1] /security-review
Focus on: server/api/, middleware/, firestore.rules, and any places
where user-supplied data flows into Firestore queries.
```

```
[Step 2] Turn on doublecheck. 
The security review flagged a potential IDOR in the /api/users endpoint.
Verify whether this is actually exploitable given our middleware/auth.ts setup.
```

```
[Step 3] Refactor the auth middleware to add the missing user ownership check.
The fix should validate that req.user.uid matches the requested resource owner.
Preserve existing behavior for admin roles.
```

```
[Step 4] Create an ADR documenting our decision to implement row-level security
in Firestore rules rather than exclusively in the API middleware.
Context: Today's security review revealed gaps when API is bypassed.
```

```
[Step 5] Commit the security fixes. Use a fix(security) conventional commit type.
Keep the security-related changes in a single focused commit.
```

---

### Scenario C — Code Quality Sprint

**เมื่อ:** มี technical debt สะสม ต้องการ clean up codebase อย่างเป็นระบบ

```
ขั้นตอน:
1. quality-playbook                  ← สร้าง quality system ก่อน
2. review-and-refactor               ← review ทีละ module
3. refactor                          ← fix code smells จาก review
4. unit-test-vue-pinia               ← เพิ่ม tests ที่ยังขาดอยู่
5. conventional-commit               ← commit แยกตาม scope
```

**ตัวอย่าง prompts:**

```
[Step 1] Generate a quality playbook for this project.
Focus on: the money-transfer module (most complex), 
the auth/permission system (most critical),
and the daily-sales module (most frequently changing).
```

```
[Step 2] Review and refactor the money-transfer store (stores/money-transfer.ts).
Use our coding guidelines. Identify: long functions, missing error handling,
and any state mutations that bypass Pinia actions.
```

```
[Step 3] Refactor the fetchTransactionHistory function in the money-transfer store.
It's over 120 lines. Extract: query building, pagination logic, and error handling
into separate functions.
```

```
[Step 4] The quality playbook identified missing tests for the
WorkflowProgressBar component. Write unit tests covering:
all 4 workflow states, disabled state behavior, and step transition events.
```

```
[Step 5] Generate a conventional commit message for the money-transfer
store refactoring. Scope: money-transfer. Include a summary of what changed.
```

---

### Scenario D — Bug Investigation & Fix

**เมื่อ:** มี bug ที่ไม่แน่ใจว่าเป็น logic error หรือ security issue

```
ขั้นตอน:
1. doublecheck (เปิดไว้ตลอด session)
2. security-review [specific file]   ← ตรวจว่าเป็น security bug ไหม
3. unit-test-vue-pinia               ← เขียน failing test ก่อน (TDD)
4. refactor                          ← fix the bug
5. webapp-testing                    ← verify fix ใน browser
6. git-commit                        ← commit fix
```

**ตัวอย่าง prompts:**

```
[Step 1] Turn on doublecheck. I'm debugging a reported issue where
cashiers can see each other's pending transfers. I want all findings verified.
```

```
[Step 2] /security-review stores/money-transfer.ts composables/useMoneyTransferHelpers.ts
Focus specifically on: data filtering by user, whether queries are scoped
to the current user's UID, and any missing ownership checks.
```

```
[Step 3] Write a failing unit test that reproduces the bug:
User A's transfers should NOT appear when User B queries transaction history.
The test should fail with the current code and pass after the fix.
```

```
[Step 4] Fix the bug in the money-transfer store.
The Firestore query for transaction history is missing a .where('createdBy', '==', uid) clause.
```

```
[Step 5] Test the fix end-to-end: login as cashier A, create a transfer,
login as cashier B, verify the transfer does not appear in B's history.
```

```
[Step 6] Commit the security fix.
Type: fix, scope: money-transfer, reference: the bug report.
```

---

### Scenario E — Architecture Decision พร้อม Research

**เมื่อ:** ต้องตัดสินใจ technical ที่ส่งผลระยะยาว และต้องการ verify ข้อมูลก่อน document

```
ขั้นตอน:
1. doublecheck                       ← เปิดไว้ตลอดขณะ research
2. [ถาม AI + verify ข้อมูล]
3. create-architectural-decision-record ← document decision
4. create-implementation-plan        ← วางแผน implement decision
```

**ตัวอย่าง prompts:**

```
[Step 1] Turn on doublecheck mode. 
I need to decide whether to move from client-side Firebase SDK
to server-side Firebase Admin for all data operations.
Verify any technical claims I make or you make during this discussion.
```

```
[Step 2-research] What are the security and performance trade-offs between:
Option A: Nuxt API routes with Firebase Admin SDK (server-side only)
Option B: Direct Firebase SDK from Vue (client-side) with strict Firestore rules

For this app: POS system, ~50 concurrent users, financial data, Thai regulations.
```

```
[Step 3] Create an ADR for our decision to migrate API calls to server-side
Firebase Admin SDK for all write operations, while keeping reads client-side.
Context: Today's security review showed client-side rules are insufficient for PCI.
Decision: Hybrid — server-side writes, client-side reads.
Alternatives: Full server-side (too slow for real-time), Full client-side (security risk).
Stakeholders: Dev team, compliance team.
```

```
[Step 4] Create an implementation plan for migrating the money-transfer
write operations from client-side SDK to server/api/ endpoints using Firebase Admin.
This is a phased migration — start with money-transfer, then daily-sales.
```

---

### Scenario F — Onboarding ระบบ Quality ให้ทีม

**เมื่อ:** ต้องการ setup quality infrastructure ทั้งหมดให้ทีมใหม่หรือโปรเจกต์เริ่มต้น

```
ขั้นตอน:
1. quality-playbook                  ← สร้าง QUALITY.md + tests + protocols
2. security-review                   ← initial security baseline
3. create-architectural-decision-record ← บันทึก key decisions ที่มีอยู่แล้ว
4. webapp-testing                    ← ตรวจสอบ critical user flows ทำงานได้
```

**ตัวอย่าง prompts:**

```
[Step 1] Generate a quality playbook for this project.
Key concerns for this POS system:
- Financial calculations must be accurate (commission, fees, totals)
- Auth and permissions must be correct (cashier vs manager vs admin)
- Daily sales records must be immutable once closed
- Money transfer workflow must handle failures gracefully
```

```
[Step 2] /security-review
This is the initial security baseline for the project.
Generate a full report with all findings and proposed patches.
```

```
[Step 3] Create an ADR documenting why we chose Nuxt 4 server API routes
+ Firebase Firestore over alternatives like Supabase or a custom Express backend.
```

```
[Step 4] Test these critical user flows and report pass/fail:
1. Login with valid credentials → dashboard
2. Cashier creates a money transfer → success state
3. Manager views daily sales → correct data displayed
4. Admin accesses user management → role-based UI shown correctly
5. Unauthorized user tries to access /admin → redirected to login
```

---

## Tips การใช้งาน

### เลือก skill ให้ถูกต้อง

| ต้องการทำอะไร | ใช้ skill นี้ |
|---------------|--------------|
| เขียน test ใหม่ หรือ review test ที่มีอยู่ | `unit-test-vue-pinia` |
| Commit changes | `git-commit` (auto) หรือ `conventional-commit` (manual format) |
| ทำ code cleaner ไม่เปลี่ยน behavior | `refactor` |
| Review + fix ตาม project standards | `review-and-refactor` |
| ตรวจหา security bugs | `security-review` |
| วางแผน feature ใหม่ | `breakdown-feature-implementation` → `create-implementation-plan` |
| บันทึก decision สำคัญ | `create-architectural-decision-record` |
| ทดสอบ UI ใน browser | `webapp-testing` |
| Verify AI output ก่อน apply | `doublecheck` |
| Setup quality system ครั้งเดียว | `quality-playbook` |

### ลำดับการใช้ที่แนะนำ

```
Plan → Code → Test → Review → Secure → Commit
  ↓       ↓      ↓       ↓        ↓        ↓
breakdown  -  unit-test  review  security  git-commit
  + plan       vue-pinia  +      -review
               webapp    refactor
               testing
```

### เมื่อ AI ตอบสิ่งที่ไม่แน่ใจ

ใช้ `doublecheck` ก่อนเสมอเมื่อ:
- AI แนะนำ security fix — verify ก่อน apply
- AI อ้าง API behavior / Firebase rules — verify กับ docs
- AI บอกว่า code เป็น vulnerable — verify ว่า exploitable จริงไหม
- ตัดสินใจ architecture สำคัญ — verify trade-offs

```
Turn on doublecheck before we start this security review session.
```
