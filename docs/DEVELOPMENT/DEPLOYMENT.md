# Deployment & CI/CD Guide

## Overview

This document covers deployment processes and CI/CD pipeline configuration for bigt-minimart.

## Table of Contents

1. [Firebase Hosting Setup](#firebase-hosting-setup)
2. [CI/CD Pipeline Architecture](#cicd-pipeline-architecture)
3. [Deployment Processes](#deployment-processes)
4. [Troubleshooting](#troubleshooting)

---

## Firebase Hosting Setup

Firebase Hosting is configured for automatic deployments from GitHub Actions.

### Prerequisites

- Firebase project already created
- Firebase CLI installed locally
- GitHub Secrets configured:
  - `FIREBASE_PROJECT_ID` - Your Firebase Project ID
  - `FIREBASE_SERVICE_ACCOUNT_JSON` - Service account JSON file

### Local Setup

```bash
npm install -g firebase-tools
firebase login
firebase serve  # Test locally
```

### Staging Deployment

- **Trigger**: Push to `develop` branch
- **URL**: Preview channel (7-day retention)
- **Purpose**: Internal testing and QA

### Production Deployment

- **Trigger**: Push to `main` branch
- **URL**: Live Firebase Hosting site
- **Purpose**: Public-facing application

---

## CI/CD Pipeline Architecture

### Workflows

1. **PR Validation** (pr-check.yml)
   - Runs on: Pull requests to develop/main
   - Checks: lint, type-check, build
   - Status: Required to merge

2. **Staging Deploy** (deploy-staging.yml)
   - Runs on: Push to develop
   - Action: Build + deploy to staging
   - Status: Automatic

3. **Production Deploy** (deploy-production.yml)
   - Runs on: Push to main
   - Action: Build + deploy to production
   - Status: Automatic

### Build Configuration

- **Preset**: Static generation (Nitro)
- **Output**: `.output/public` directory
- **Prerendered Pages**: `/login`, `/setup`
- **Framework**: Nuxt 4 with Vue 3

---

## Deployment Processes

### Step-by-Step Deployment

1. **Develop Branch** → Staging
   ```
   Feature Branch → PR to develop → Checks pass → Merge → Auto-deploy to staging
   ```

2. **Main Branch** → Production
   ```
   Develop → PR to main → Review → Merge → Auto-deploy to production
   ```

### Local Testing Before Deploy

```bash
# Build static site
npm run generate

# Test locally
firebase serve

# Visit http://localhost:5000
```

### Manual Deployment (if needed)

```bash
npm run generate
firebase deploy --only hosting
```

---

## Troubleshooting

### Build Fails

```bash
npm run build
npm run type-check
npm run lint
```

### Deployment Not Triggering

- Check GitHub Actions logs
- Verify secrets are set correctly
- Ensure branch names match exactly

### Preview URL Issues

- Clear browser cache
- Check Firebase Console for deployment status
- Verify `.output/public` directory exists

---

## Additional Resources

- [Firebase Hosting Setup Guide](./FIREBASE_HOSTING_SETUP.md)
- [Firebase Commands Reference](./FIREBASE_COMMANDS.md)
- [Deployment Checklist](./FIREBASE_DEPLOYMENT_CHECKLIST.md)
- [CI/CD Pipeline Documentation](./CI_CD_SETUP.md)

