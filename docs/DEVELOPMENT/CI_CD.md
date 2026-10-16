# CI/CD Pipeline

**See also**: [DEPLOYMENT.md](./DEPLOYMENT.md) · [FIREBASE.md](../TECHNICAL/FIREBASE.md) · [FIREBASE_COMMANDS.md](../REFERENCE/FIREBASE_COMMANDS.md)

## Overview

The project uses GitHub Actions. All workflows run on `ubuntu-latest` with Node 20 and install with
`npm install --legacy-peer-deps`.

| Workflow | File | Trigger | Steps |
|----------|------|---------|-------|
| PR Check | `.github/workflows/pr-check.yml` | Pull request → `develop` / `main` | `npm run lint` → `npm run type-check` → `npm run build` |
| Deploy Staging | `.github/workflows/deploy-staging.yml` | Push → `develop` | `npm run build` → Firebase Hosting channel `staging` (expires 7d) |
| Deploy Production | `.github/workflows/deploy-production.yml` | Push → `main` | `npm run type-check` → `npm run build` → Firebase Hosting `live` |

Deploys use `FirebaseExtended/action-hosting-deploy@v0`.

## Required GitHub Secrets

| Secret | Used by |
|--------|---------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Deploy Staging, Deploy Production |
| `FIREBASE_PROJECT_ID` | Deploy Staging, Deploy Production |
| `GITHUB_TOKEN` | Provided automatically |

## Notes

- Unit/integration tests (`npm test`) are **not** run in CI yet — run them locally before opening a PR.
- `npm run lint` is `nuxt typecheck` (no ESLint configured).

## Checking runs

```bash
gh run list --limit 10
gh run view <run-id> --log-failed
```

---

**Last Updated**: Oct 16, 2026
