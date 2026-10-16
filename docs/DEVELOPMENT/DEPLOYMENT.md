# Deployment Guide

**See also**: [CI_CD.md](./CI_CD.md) · [FIREBASE.md](../TECHNICAL/FIREBASE.md) · [FIREBASE_COMMANDS.md](../REFERENCE/FIREBASE_COMMANDS.md)

---

## Environments

| Environment | Branch | Target | How |
|-------------|--------|--------|-----|
| Local | any | `http://localhost:3000` | `npm run dev` |
| Staging | `develop` | Firebase Hosting preview channel `staging` (7-day expiry) | Automatic on push |
| Production | `main` | Firebase Hosting `live` | Automatic on push |

## Build Configuration

- **Framework**: Nuxt 4 + Vue 3
- **Nitro preset**: `node-server` (server output in `.output/server`, static assets in `.output/public`)
- **Prerender**: `/` only (`crawlLinks: false`)
- **firebase.json**: Hosting serves `.output/public`; all routes rewrite to Cloud Function `nuxtServer`
  (source `.output/server`, runtime `nodejs20`)

## Release Flow

```
feature/* ──PR──► develop ──(auto)──► Staging
                     │
                     └──PR (release)──► main ──(auto)──► Production
```

1. Feature branch → PR to `develop` → PR Check passes → squash merge
2. Release PR `develop` → `main` (title `release: ...`) → merge
3. Merge `main` back into `develop` if the release created a merge commit

## Pre-deploy Checklist (local)

```bash
npm test             # Vitest unit + integration
npm run lint         # nuxt typecheck
npm run type-check   # vue-tsc --noEmit
npm run build
npm run preview      # smoke-test the production build
```

## Manual Deployment (if needed)

```bash
npm run build
firebase deploy --only hosting            # hosting only
firebase deploy --only functions,hosting  # server + hosting
```

## Rollback

Firebase Console → Hosting → Release history → select previous release → **Rollback**

## Troubleshooting

| Problem | Check |
|---------|-------|
| Build fails in CI | `gh run view <id> --log-failed`, then reproduce with `npm run lint && npm run type-check && npm run build` |
| Deploy not triggering | Branch name (`develop` / `main`), workflow file, GitHub Actions tab |
| Deploy auth error | Secrets `FIREBASE_SERVICE_ACCOUNT_JSON`, `FIREBASE_PROJECT_ID` |
| 401 from API locally | `firebase-service-account.json` present? (see [FIREBASE.md](../TECHNICAL/FIREBASE.md)) |

---

**Last Updated**: Oct 16, 2026
