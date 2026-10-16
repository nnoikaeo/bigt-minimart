# bigt-minimart

> ระบบจัดการร้านบิ๊กธี มินิมาร์ท — Nuxt 4 + Vue 3 + Firebase

[![PR Check](https://github.com/nnoikaeo/bigt-minimart/actions/workflows/pr-check.yml/badge.svg)](https://github.com/nnoikaeo/bigt-minimart/actions/workflows/pr-check.yml)
[![Deploy Staging](https://github.com/nnoikaeo/bigt-minimart/actions/workflows/deploy-staging.yml/badge.svg)](https://github.com/nnoikaeo/bigt-minimart/actions/workflows/deploy-staging.yml)
[![Deploy Production](https://github.com/nnoikaeo/bigt-minimart/actions/workflows/deploy-production.yml/badge.svg)](https://github.com/nnoikaeo/bigt-minimart/actions/workflows/deploy-production.yml)

## Tech Stack

- **Frontend**: [Nuxt 4](https://nuxt.com) + [Vue 3](https://vuejs.org) (`<script setup lang="ts">`) + [TypeScript](https://www.typescriptlang.org)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com)
- **State**: [Pinia 3](https://pinia.vuejs.org)
- **Auth**: Firebase Authentication (email/password)
- **Data**: JSON files in `public/data/` via Repository Pattern (Firestore repositories prepared, not yet active)
- **Testing**: Vitest + Vue Test Utils + happy-dom
- **Node**: 20+ (CI uses Node 20)

ดูรายละเอียดทั้งหมดที่ [docs/TECHNICAL/TECHNOLOGY_STACK.md](docs/TECHNICAL/TECHNOLOGY_STACK.md)

## Setup

```bash
npm install
cp .env.example .env    # ใส่ค่า Firebase client config
```

สำหรับ server-side token verification ให้วาง `firebase-service-account.json` ที่ root
(หรือตั้ง `FIREBASE_SERVICE_ACCOUNT`) — ไฟล์นี้อยู่ใน `.gitignore` แล้ว ห้าม commit

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server ที่ `http://localhost:3000` |
| `npm run build` | Production build (`node-server` preset → `.output/`) |
| `npm run preview` | Preview production build |
| `npm run lint` | `nuxt typecheck` |
| `npm run type-check` | `vue-tsc --noEmit` |
| `npm test` | Vitest — unit + integration tests |
| `npm run test:watch` | Vitest watch mode |

## CI/CD

| Workflow | Trigger | Steps |
|----------|---------|-------|
| PR Check | Pull request → `develop` / `main` | lint, type-check, build |
| Deploy Staging | Push → `develop` | build → Firebase Hosting channel `staging` (7 days) |
| Deploy Production | Push → `main` | type-check, build → Firebase Hosting `live` |

ดู [docs/DEVELOPMENT/CI_CD.md](docs/DEVELOPMENT/CI_CD.md) และ [docs/DEVELOPMENT/DEPLOYMENT.md](docs/DEVELOPMENT/DEPLOYMENT.md)

## Project Structure

```
├── pages/            # Route pages (finance/, sales/, admin/, settings/, hr/, user/)
├── components/       # ui/ (design system), layout/, shared/, money-transfer/, bill-payment/
├── composables/      # useLogger, usePermissions, useCommission, ...
├── stores/           # Pinia stores (auth, money-transfer, bill-payment, sales, ...)
├── layouts/          # default, auth
├── middleware/       # Route guards (auth, guest)
├── plugins/          # firebase, apiFetch (injects Firebase ID token), directives (v-can)
├── utils/            # sidebar-menu
├── server/
│   ├── api/          # Nitro API routes
│   ├── repositories/ # JSON / Firestore data access
│   └── utils/        # firebase-admin, serverAuth, user-service
├── types/            # TypeScript definitions
├── public/data/      # JSON data store (dev)
├── tests/            # unit/ + integration/ (Vitest)
└── docs/             # Project documentation
```

## Documentation

- [docs/README.md](docs/README.md) — Documentation index
- [docs/PROGRESS/STATUS.md](docs/PROGRESS/STATUS.md) — Current project status
- [docs/PROGRESS/TESTING_PLAN.md](docs/PROGRESS/TESTING_PLAN.md) — Current testing plan
- [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) — Contributing guide
- [docs/DEVELOPMENT/GIT_WORKFLOW.md](docs/DEVELOPMENT/GIT_WORKFLOW.md) — Git workflow

## License

MIT
