# 💻 Technology Stack

> Versions are taken from `package.json` (installed versions in parentheses where they differ).

## Frontend
- **Framework**: Nuxt 4 (`nuxt ^4.2.2`) + Vue 3.5
- **Language**: TypeScript 5.9 (`strict: true`)
- **Styling**: Tailwind CSS 3.4 (`@nuxtjs/tailwindcss`, `@tailwindcss/forms`)
- **State Management**: Pinia 3 (`@pinia/nuxt` 0.11) — see [STATE_MANAGEMENT_ARCHITECTURE.md](./STATE_MANAGEMENT_ARCHITECTURE.md)
- **HTTP Client**: `$fetch` / `$apiFetch` plugin (injects Firebase ID token)
- **Validation**: Zod 4 (`useValidatedForm`, access-control API routes)
- **Icons**: Heroicons (`@heroicons/vue/24/outline`)
- **Installed but not used yet**: VeeValidate (`@vee-validate/zod`), Radix Vue, VueUse, Day.js, Sass (`sass-embedded`)

## Backend
- **Runtime**: Nuxt Server (Nitro), preset `node-server`
- **Language**: TypeScript
- **Authentication**: Firebase Authentication (client) + Firebase Admin SDK token verification (`server/utils/serverAuth.ts`)
- **API Style**: RESTful Nitro server routes — see [API_ENDPOINTS.md](./API_ENDPOINTS.md)
- **Data Access**: Repository Pattern — see [server/repositories/README.md](../../server/repositories/README.md)

## Data Storage
- **Current**: JSON files in `public/data/` (all active repositories are JSON)
- **Prepared**: Firestore repositories for sales and money-transfer (not yet wired in)
- **Firebase project**: `bigt-minimart` — see [FIREBASE.md](./FIREBASE.md)

## Hosting & Deployment
- **Hosting**: Firebase Hosting (+ Cloud Functions `nuxtServer` for SSR/API, Node 20)
- **CI/CD**: GitHub Actions — PR Check, Deploy Staging (`develop`), Deploy Production (`main`)
- **Domain**: To be determined

## Development Tools
- **Package Manager**: npm
- **Code Editor**: VS Code
- **Version Control**: Git / GitHub (`gh` CLI)
- **Type Checking**: `nuxt typecheck` (`npm run lint`), `vue-tsc --noEmit` (`npm run type-check`)
- **Testing**: Vitest 4 + Vue Test Utils + `@pinia/testing` + happy-dom (`npm test`)
- **E2E**: Playwright — planned (TESTING_PLAN E2E-1)
- **Linting/Formatting**: no ESLint/Prettier configured (Stylelint config only)

## External Services (Future)
- **Spreadsheets**: Google Sheets API (Phase 2)
- **Analytics**: Looker Studio (Phase 2)

---

**Last Updated**: Oct 16, 2026
**Version**: 2.0
