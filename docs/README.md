# BigT Minimart — Documentation Index

> Master index for all project documentation. Each folder has one purpose.

**Last Updated**: Mar 25, 2026

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
| [WORKFLOWS.md](REQUIREMENTS/WORKFLOWS.md) | Flow 1-4: Cash, Money Transfer, Bill Payment, Income/Expense |
| [DEVELOPMENT_ROADMAP.md](REQUIREMENTS/DEVELOPMENT_ROADMAP.md) | Phase 1-4 roadmap, repository pattern strategy |

---

## DESIGN/ — Visual & UI

| File | Description |
|------|-------------|
| [DESIGN_SYSTEM.md](DESIGN/DESIGN_SYSTEM.md) | Brand, colors, typography, spacing, UI patterns, sidebar |

---

## TECHNICAL/ — Architecture & Implementation

| File | Description |
|------|-------------|
| [TECHNOLOGY_STACK.md](TECHNICAL/TECHNOLOGY_STACK.md) | Nuxt 3, Vue 3, TypeScript, Tailwind, Pinia, Firebase |
| [COMPONENT_SYSTEM_ARCHITECTURE.md](TECHNICAL/COMPONENT_SYSTEM_ARCHITECTURE.md) | Design system components, RBAC, composables |
| [STATE_MANAGEMENT_ARCHITECTURE.md](TECHNICAL/STATE_MANAGEMENT_ARCHITECTURE.md) | Pinia stores, repository pattern, caching |
| [DATABASE_SCHEMA.md](TECHNICAL/DATABASE_SCHEMA.md) | Firestore collections, TypeScript interfaces, security rules |
| [API_ENDPOINTS.md](TECHNICAL/API_ENDPOINTS.md) | All REST endpoints with response format |
| [AUTH_STORE_USAGE.md](TECHNICAL/AUTH_STORE_USAGE.md) | Auth store guide (Thai), reading user data |
| [ROLE_BASED_ACCESS_CONTROL.md](TECHNICAL/ROLE_BASED_ACCESS_CONTROL.md) | RBAC design, permission matrix, composable, route guards |
| [FIREBASE.md](TECHNICAL/FIREBASE.md) | Firebase project setup, hosting, deployment, security rules |

---

## DEVELOPMENT/ — Processes & Standards

| File | Description |
|------|-------------|
| [README.md](DEVELOPMENT/README.md) | Development quick start |
| [GIT_WORKFLOW.md](DEVELOPMENT/GIT_WORKFLOW.md) | Branch strategy, commit conventions, merge policy |
| [COMPONENT_QUALITY_CHECKLIST.md](DEVELOPMENT/COMPONENT_QUALITY_CHECKLIST.md) | Checklist for new components (TS, RBAC, styling, a11y) |
| [DEPLOYMENT.md](DEVELOPMENT/DEPLOYMENT.md) | Firebase Hosting deploy guide (staging/production) |
| [CI_CD.md](DEVELOPMENT/CI_CD.md) | GitHub Actions workflows |

---

## PROGRESS/ — Status Tracking

| File | Description |
|------|-------------|
| [STATUS.md](PROGRESS/STATUS.md) | Current project status dashboard (Weeks 1-9) |

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

---

## Archive

Old, completed, or superseded docs are preserved in [ARCHIVE/](ARCHIVE/README.md).
