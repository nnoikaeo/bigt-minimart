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
- PR Check does not cover deploys. After merging, check that Deploy Staging passed.
- Deploys run `firebase-tools@latest`, so a new version can need new permissions. The service account in `FIREBASE_SERVICE_ACCOUNT_JSON` (project `bigt-minimart`) needs **Service Usage Consumer**, added on Nov 2, 2026 after deploys failed with a 403 on `serviceusage.services.get`. To fix a similar failure, add the missing role in Google Cloud IAM, then run `gh run rerun <run-id> --failed`.
- GitHub warns that Node 20 in these workflows is deprecated.

## Checking runs

```bash
gh run list --limit 10
gh run view <run-id> --log-failed
```

---

**Last Updated**: Nov 2, 2026
