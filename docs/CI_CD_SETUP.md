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
4. **Build** - `npm run build`
5. **Deploy to Staging** - Using Vercel/Netlify or custom server
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
- GitHub Release creation (manual)

**Steps**:
1. **Checkout Code**
2. **Setup Node.js 18**
3. **Install Dependencies**
4. **Build** - `npm run build`
5. **Deploy to Production** - Live environment
6. **Health Check** - Verify deployment
7. **Create Release Notes** - Document changes

**Status**: ⚠️ **Manual Approval Recommended** - Prevents accidental deployments

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
- **Release Tag**: Create GitHub release for version tracking

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
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID

VERCEL_TOKEN (if using Vercel)
NETLIFY_AUTH_TOKEN (if using Netlify)
SLACK_WEBHOOK (for notifications)
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

### Vercel (Recommended)

1. Connect repository in [Vercel Dashboard](https://vercel.com)
2. Set Environment Variables for both staging and production
3. Configure Preview Deployments for PRs and develop branch

### Netlify

1. Connect repository in [Netlify Dashboard](https://app.netlify.com)
2. Set build command: `npm run build`
3. Set publish directory: `.output/public`
4. Configure branch deployments

### Custom Server

Update the deployment step in the workflows with your deployment script.

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
- Check [`tsconfig.json`](../../tsconfig.json )
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
4. **Test locally**: `npm run build && npm run preview`

---

## Success Indicators

- ✅ All PR checks pass before merging
- ✅ Staging deploys automatically on develop push
- ✅ Production deploys after main merge approval
- ✅ No manual deployments needed (except approvals)
- ✅ Team gets notifications of deployments
- ✅ Quick feedback on code quality

---

## Next Steps

1. Connect repository to deployment platform (Vercel/Netlify)
2. Set up GitHub Secrets
3. Create a test PR to verify workflows
4. Document deployment procedures for your team
5. Set up monitoring and error tracking

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Nuxt Deployment Guide](https://nuxt.com/docs/getting-started/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)

