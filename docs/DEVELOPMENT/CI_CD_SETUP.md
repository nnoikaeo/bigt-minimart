# CI/CD Pipeline Setup Documentation

## Overview

This document describes the CI/CD pipeline configured for the **bigt-minimart** project. The pipeline automates testing, building, and deployment processes.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Main Branch (Production)                            │  │
│  │  └─> Deploy to Production (Manual Approval)          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Develop Branch (Integration)                        │  │
│  │  └─> Deploy to Staging (Automatic)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Feature Branches & PRs                              │  │
│  │  └─> Run PR Validation Checks (Required)            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Workflows

### 1. PR Validation Workflow (pr-check.yml)

**Trigger**: Pull requests to `develop` and `main` branches

**Steps**:
1. **Checkout Code** - Fetch the PR code
2. **Setup Node.js** - Install Node.js v18
3. **Install Dependencies** - Run `npm install`
4. **Lint Check** - Run `npm run lint` (ESLint + Prettier)
5. **Type Check** - Run `npm run type-check` (TypeScript)
6. **Build Test** - Run `npm run build` (Verify buildability)

**Status**: ✅ **Required** to merge - Cannot merge if checks fail

**What This Catches**:
- Code style violations
- TypeScript errors
- Build failures
- Dependency issues

---

### 2. Staging Deployment Workflow (deploy-staging.yml)

**Trigger**: Push to `develop` branch

**Steps**:
1. **Checkout Code**
2. **Setup Node.js 18**
3. **Install Dependencies** - `npm install`
4. **Build** - `npm run generate`
5. **Deploy to Staging** - Using Firebase Hosting preview channel
6. **Send Notification** - Team notification (optional)

**Environment**: Staging/Preview URL

**When to Use**:
- Test features before production
- Internal team testing
- Stakeholder reviews

---

### 3. Production Deployment Workflow (deploy-production.yml)

**Trigger**: 
- Push to `main` branch (automatic after PR merge)

**Steps**:
1. **Checkout Code**
2. **Setup Node.js 18**
3. **Install Dependencies**
4. **Build** - `npm run generate`
5. **Deploy to Production** - Firebase Hosting live site
6. **Create Release Notes** - Document changes

**Status**: ✅ **Automatic** - Deploys immediately after merge to main

**When to Use**:
- After all PRs merged to main
- Release day
- Hotfixes

---

## Branch Strategy

### Main Branch
- **Purpose**: Production-ready code
- **Permissions**: Protected, requires PR review
- **CI/CD**: Auto-deploy to production
- **Release Tag**: GitHub releases for version tracking

### Develop Branch
- **Purpose**: Integration and staging
- **Permissions**: Protected, requires PR review
- **CI/CD**: Auto-deploy to staging
- **Testing**: Full QA before promoting to main

### Feature Branches (`feature/*`)
- **Purpose**: Individual feature development
- **Naming**: `feature/user-auth`, `feature/payment-integration`
- **CI/CD**: PR checks required
- **Merge**: Via PR to develop

---

## Running Checks Locally

Before pushing code, developers should run these checks:

```bash
# Install dependencies
npm install

# Lint code (fixes auto-fixable issues)
npm run lint

# Type check
npm run type-check

# Build test
npm run build

# Generate static site
npm run generate

# Run tests (if applicable)
npm run test
```

**Pro Tip**: Set up pre-commit hooks to run these automatically:
```bash
npm install husky lint-staged --save-dev
npx husky install
```

---

## Environment Variables & Secrets

### GitHub Secrets Configuration

Store these in **Settings > Secrets and variables > Actions**:

```
FIREBASE_PROJECT_ID
FIREBASE_SERVICE_ACCOUNT_JSON
```

### .env.example

Always commit a `.env.example` file with placeholder values:

```
NUXT_PUBLIC_FIREBASE_API_KEY=<your-api-key>
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-auth-domain>
NUXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-bucket>
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
NUXT_PUBLIC_FIREBASE_APP_ID=<your-app-id>
```

---

## Deployment Configuration

### Firebase Hosting

- **Platform**: Firebase Hosting
- **Build Command**: `npm run generate`
- **Output Directory**: `.output/public`
- **Staging URL**: Preview channel (7-day retention)
- **Production URL**: Live site

---

## Status Badges

Add to your README.md:

```markdown
![PR Check](https://github.com/nnoikaeo/bigt-minimart/actions/workflows/pr-check.yml/badge.svg)
![Deploy Staging](https://github.com/nnoikaeo/bigt-minimart/actions/workflows/deploy-staging.yml/badge.svg)
![Deploy Production](https://github.com/nnoikaeo/bigt-minimart/actions/workflows/deploy-production.yml/badge.svg)
```

---

## Troubleshooting

### PR Checks Failing

**Lint Errors**:
```bash
npm run lint -- --fix
git add .
git commit -m "fix: lint issues"
git push
```

**Type Errors**:
- Review TypeScript errors in VS Code
- Check `tsconfig.json`
- Run `npm run type-check` locally to verify

**Build Failures**:
```bash
npm run build
# Check the error logs
```

### Deployment Issues

1. **Check workflow logs** in GitHub Actions tab
2. **Verify environment variables** are set correctly
3. **Check build output** (.output directory)
4. **Test locally**: `npm run generate && firebase serve`

---

## Success Indicators

- ✅ All PR checks pass before merging
- ✅ Staging deploys automatically on develop push
- ✅ Production deploys after main merge
- ✅ No manual deployments needed
- ✅ Team gets notifications of deployments
- ✅ Quick feedback on code quality

---

## Next Steps

1. Set up GitHub Secrets (FIREBASE_PROJECT_ID, FIREBASE_SERVICE_ACCOUNT_JSON)
2. Create a test PR to verify workflows
3. Document deployment procedures for your team
4. Set up monitoring and error tracking

---

## Related Documentation

- [Firebase Hosting Setup](../TECHNICAL/FIREBASE_HOSTING_SETUP.md)
- [Deployment & CI/CD Process](./DEPLOYMENT.md)
- [Deployment Checklist](./FIREBASE_DEPLOYMENT_CHECKLIST.md)
- [Firebase Commands Reference](../REFERENCE/FIREBASE_COMMANDS.md)

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Nuxt Deployment Guide](https://nuxt.com/docs/getting-started/deployment)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
