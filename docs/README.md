# BigT Minimart — Documentation Index

> Master index for all project documentation. Each folder has one purpose.

**Last Updated**: Oct 16, 2026

---

## Folder Structure

```
docs/
├── PROJECT/          — What the project is
├── REQUIREMENTS/     — What we need to build
├── DESIGN/           — How it looks
├── TECHNICAL/        — How it works
├── DEVELOPMENT/      — How we work
├── PROGRESS/         — Where we are
├── REFERENCE/        — Quick lookups
└── ARCHIVE/          — Old/completed docs
```

---

## PROJECT/ — Project Context

| File | Description |
|------|-------------|
| [PROJECT_OVERVIEW.md](PROJECT/PROJECT_OVERVIEW.md) | Store info, objectives, scope, stakeholders, timeline |

---

## REQUIREMENTS/ — Business & Functional Specs

| File | Description |
|------|-------------|
| [BUSINESS_REQUIREMENTS.md](REQUIREMENTS/BUSINESS_REQUIREMENTS.md) | Functional/non-functional requirements, KPIs |
| [USER_ROLES.md](REQUIREMENTS/USER_ROLES.md) | 5 roles, permission matrix, page access |
| [USE_CASES.md](REQUIREMENTS/USE_CASES.md) | 8 use cases with flows and success criteria |
| [WORKFLOWS.md](REQUIREMENTS/WORKFLOWS.md) | Flow 1-4: Cash, Money Transfer, Bill Payment, Income/Expense (+ unified status mapping) |
| [DEVELOPMENT_ROADMAP.md](REQUIREMENTS/DEVELOPMENT_ROADMAP.md) | Original Phase 1-4 roadmap (Jan 2026) + actual-progress banner |
| [DRAFT_QUEUE_AND_CASH_LOAN.md](REQUIREMENTS/DRAFT_QUEUE_AND_CASH_LOAN.md) | Approved spec: draft queue for MT/BP (PR 1 ✅ done, PR #153) + borrow/repay sales cash (PR 2, not yet implemented) |

---

## DESIGN/ — Visual & UI

| File | Description |
|------|-------------|
| [DESIGN_SYSTEM.md](DESIGN/DESIGN_SYSTEM.md) | Brand, colors, typography, spacing, UI patterns, sidebar |

---

## TECHNICAL/ — Architecture & Implementation

| File | Description |
|------|-------------|
| [TECHNOLOGY_STACK.md](TECHNICAL/TECHNOLOGY_STACK.md) | Nuxt 4, Vue 3, TypeScript, Tailwind, Pinia 3, Firebase, Vitest |
| [COMPONENT_SYSTEM_ARCHITECTURE.md](TECHNICAL/COMPONENT_SYSTEM_ARCHITECTURE.md) | Design system, shared workflow components, RBAC, auto-import |
| [STATE_MANAGEMENT_ARCHITECTURE.md](TECHNICAL/STATE_MANAGEMENT_ARCHITECTURE.md) | Pinia stores (8 current), patterns |
| [DATABASE_SCHEMA.md](TECHNICAL/DATABASE_SCHEMA.md) | Target Firestore schema (not in use yet) + pointers to current types/JSON |
| [API_ENDPOINTS.md](TECHNICAL/API_ENDPOINTS.md) | All 72 Nitro API routes (MT, BP, sales, access control, settings) |
| [AUTH_STORE_USAGE.md](TECHNICAL/AUTH_STORE_USAGE.md) | Auth store guide (Thai), reading user data |
| [ROLE_BASED_ACCESS_CONTROL.md](TECHNICAL/ROLE_BASED_ACCESS_CONTROL.md) | RBAC design + actual implementation mapping |
| [FIREBASE.md](TECHNICAL/FIREBASE.md) | Firebase project, env vars, hosting/functions, security rules |
| [server/repositories/README.md](../server/repositories/README.md) | Repository pattern — JSON (active) / Firestore (prepared) |

---

## DEVELOPMENT/ — Processes & Standards

| File | Description |
|------|-------------|
| [README.md](DEVELOPMENT/README.md) | Development quick start |
| [GIT_WORKFLOW.md](DEVELOPMENT/GIT_WORKFLOW.md) | Branch strategy, commit conventions, release PRs |
| [COMPONENT_QUALITY_CHECKLIST.md](DEVELOPMENT/COMPONENT_QUALITY_CHECKLIST.md) | Checklist for new components (TS, RBAC, styling, a11y) |
| [DEPLOYMENT.md](DEVELOPMENT/DEPLOYMENT.md) | Environments, release flow, rollback |
| [CI_CD.md](DEVELOPMENT/CI_CD.md) | GitHub Actions workflows & secrets |
| [../.claude/PLAYBOOK.md](../.claude/PLAYBOOK.md) | AI skills playbook (Thai) |
| [../CLAUDE.md](../CLAUDE.md) | Claude Code project instructions (auto-loaded) — conventions + doc-sync rules |

---

## PROGRESS/ — Status Tracking

| File | Description |
|------|-------------|
| [STATUS.md](PROGRESS/STATUS.md) | Current project status dashboard (Weeks 1-12) |
| [TESTING_PLAN.md](PROGRESS/TESTING_PLAN.md) | Service Harmonization testing plan — 17 tasks (Manual → Bug Fix → E2E) |

---

## REFERENCE/ — Quick Lookups

| File | Description |
|------|-------------|
| [GLOSSARY.md](REFERENCE/GLOSSARY.md) | Thai-English bilingual glossary (48+ terms) |
| [FAQ.md](REFERENCE/FAQ.md) | Frequently asked questions by category |
| [FIREBASE_COMMANDS.md](REFERENCE/FIREBASE_COMMANDS.md) | Firebase CLI command reference |

---

## Quick Start by Role

| Role | Start here |
|------|------------|
| New to project | [PROJECT_OVERVIEW](PROJECT/PROJECT_OVERVIEW.md) → [BUSINESS_REQUIREMENTS](REQUIREMENTS/BUSINESS_REQUIREMENTS.md) |
| Developer | [TECHNOLOGY_STACK](TECHNICAL/TECHNOLOGY_STACK.md) → [GIT_WORKFLOW](DEVELOPMENT/GIT_WORKFLOW.md) → [COMPONENT_QUALITY_CHECKLIST](DEVELOPMENT/COMPONENT_QUALITY_CHECKLIST.md) |
| Designer | [DESIGN_SYSTEM](DESIGN/DESIGN_SYSTEM.md) |
| Product/Manager | [WORKFLOWS](REQUIREMENTS/WORKFLOWS.md) → [STATUS](PROGRESS/STATUS.md) |
| Tester | [TESTING_PLAN](PROGRESS/TESTING_PLAN.md) |

---

## Archive

Old, completed, or superseded docs are preserved in [ARCHIVE/](ARCHIVE/README.md).
