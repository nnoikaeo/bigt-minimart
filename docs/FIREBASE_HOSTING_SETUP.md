# Firebase Hosting Setup Guide

## Overview

Firebase Hosting is integrated with your CI/CD pipeline for automatic deployments.

## Prerequisites

- Firebase project already created
- Firebase CLI installed locally
- GitHub Secrets configured

## Step 1: Install Firebase CLI Locally

```bash
npm install -g firebase-tools
```

## Step 2: Authenticate Firebase

```bash
firebase login
```

This opens a browser to authenticate with your Google account.

## Step 3: Initialize Firebase in Your Project

Already done! Check `.firebaserc` and `firebase.json`:

**`.firebaserc`** - Project configuration:
```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

**`firebase.json`** - Hosting configuration:
```json
{
  "hosting": {
    "public": ".output/public",
    "ignore": ["firebase.json", ".firebaserc", "*.md"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## Step 4: Get Firebase Service Account

This is required for GitHub Actions to deploy:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Settings** (⚙️) → **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file

## Step 5: Add GitHub Secrets

In your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `FIREBASE_PROJECT_ID` | Your Firebase Project ID |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Paste entire contents of service account JSON file |

**Example of service account JSON:**
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----...",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "..."
}
```

## Step 6: Configure `.firebaserc`

Update `.firebaserc` with your actual Firebase project ID:

```json
{
  "projects": {
    "default": "your-actual-firebase-project-id"
  }
}
```

Replace `your-actual-firebase-project-id` with your project ID from Firebase Console.

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│  Develop Branch Push                    │
│  └─> GitHub Actions (PR Check)          │
│      └─> npm run build                  │
│          └─> Deploy to Staging Channel  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Main Branch Push (Release)             │
│  └─> GitHub Actions (PR Check)          │
│      └─> npm run build                  │
│          └─> Deploy to Live (Production)│
└─────────────────────────────────────────┘
```

## Deployment Environments

### Staging (Preview)
- **Trigger**: Push to `develop` branch
- **URL**: `https://staging-<hash>--<project-id>.web.app`
- **Retention**: 7 days
- **Purpose**: Internal testing, stakeholder review

### Production (Live)
- **Trigger**: Push to `main` branch
- **URL**: `https://<project-id>.web.app` (or custom domain)
- **Retention**: Live
- **Purpose**: Public-facing site

## Test Locally

Before pushing to GitHub:

```bash
# Build the project
npm run build

# Test Firebase Hosting locally
firebase serve

# Visit http://localhost:5000
```

## Deploy Manually (Optional)

```bash
# Deploy to production
firebase deploy --only hosting

# Deploy to specific channel (staging)
firebase deploy --only hosting -m "Staging deployment message"
```

## Troubleshooting

### Build Fails

Check the build output:
```bash
npm run build
# Review error messages
```

### Deployment Fails in GitHub Actions

1. Check workflow logs: **Actions** → **Workflow Run** → Logs
2. Verify GitHub Secrets are set correctly
3. Ensure service account has Firebase Hosting permissions

### Check Deployment Status

```bash
# List all deployments
firebase hosting:channel:list

# View specific deployment
firebase hosting:sites
```

## Configure Custom Domain

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. **Hosting** → **Connect Domain**
4. Follow the domain verification steps
5. Update DNS records as instructed

## View Analytics

In Firebase Console:
- **Hosting** → View traffic and performance metrics
- **Analytics** → Monitor user activity
- **Performance** → Check page load times

## Environment Variables for Build

Create `.env.example`:
```
NUXT_PUBLIC_FIREBASE_API_KEY=...
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NUXT_PUBLIC_FIREBASE_PROJECT_ID=...
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NUXT_PUBLIC_FIREBASE_APP_ID=...
```

Environment variables are automatically available during Nuxt build if prefixed with `NUXT_PUBLIC_`.

## Rollback

If deployment fails:

1. Go to Firebase Console → **Hosting**
2. Click on previous deployment
3. Click **Restore**

Or via CLI:
```bash
firebase hosting:channel:list
firebase hosting:clone <source-channel> <target-channel>
```

## Monitoring

### Real-time Monitoring
- Check deployment status in GitHub Actions tab
- View live traffic in Firebase Console

### Set Up Alerts (Optional)

In Firebase Console:
- **Performance** → **Add alert**
- **Crashes** → **Add alert**
- **Cloud Functions** → **View logs**

## Performance Optimization

The `firebase.json` includes:
- **Cache-Control for static assets**: 1 year (immutable)
- **Cache-Control for index.html**: 0 (always fresh)
- **SPA rewrite**: All routes → index.html

## Resources

- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [Nuxt Deployment Guide](https://nuxt.com/docs/getting-started/deployment)
- [GitHub Actions - Firebase Deploy](https://github.com/FirebaseExtended/action-hosting-deploy)

## Next Steps

1. ✅ Update `.firebaserc` with your project ID
2. ✅ Add GitHub Secrets
3. ✅ Test locally with `firebase serve`
4. ✅ Create a test PR to develop branch
5. ✅ Verify staging deployment succeeds
6. ✅ Merge to main and verify production deployment
