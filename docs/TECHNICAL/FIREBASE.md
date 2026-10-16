# Firebase Setup & Hosting

> Single source of truth for Firebase configuration and deployment.
> Merged from: FIREBASE_SETUP.md, FIREBASE_HOSTING_SETUP.md

**Last Updated**: Oct 16, 2026

---

## Project Details

| Property | Value |
|----------|-------|
| Project ID | `bigt-minimart` |
| Auth Domain | `bigt-minimart.firebaseapp.com` |
| Region | `asia-southeast1` (Bangkok) |
| Plan | Spark (Free) |

---

## Services

| Service | Status | Notes |
|---------|--------|-------|
| Authentication | Enabled | Email/Password — used by the app |
| Firestore | Enabled | asia-southeast1 — **not used yet**; app data is JSON in `public/data/` |
| Storage | Enabled | Unused in Phase 1 |
| Hosting | Enabled | CI/CD integrated |
| Cloud Functions | Configured | `nuxtServer` (Nitro server, Node 20) |

### Auth Config
- Token Expiry: 1 hour
- Refresh Token: 30 days
- Auto Logout: 30 minutes inactivity

---

## Environment Variables

### .env (copy from `.env.example`)

Read in `nuxt.config.ts` → `runtimeConfig.public.*`:

```
FIREBASE_API_KEY=<api-key>
FIREBASE_AUTH_DOMAIN=bigt-minimart.firebaseapp.com
FIREBASE_PROJECT_ID=bigt-minimart
FIREBASE_STORAGE_BUCKET=<bucket>
FIREBASE_MESSAGING_SENDER_ID=<sender-id>
FIREBASE_APP_ID=<app-id>
```

### Server-side (Firebase Admin SDK)

`server/utils/firebase-admin.ts` loads credentials from **`firebase-service-account.json`** at the
project root (git-ignored). `nuxt.config.ts` also exposes `FIREBASE_SERVICE_ACCOUNT` as
`runtimeConfig.firebaseServiceAccount`.

If no service account is available, `server/utils/serverAuth.ts` logs a warning and
**server-side token verification is disabled** (dev mode only — never deploy like this).

---

## Hosting Configuration

### .firebaserc

```json
{
  "projects": {
    "default": "bigt-minimart"
  }
}
```

### firebase.json

Summary (see the file for cache headers):

```json
{
  "hosting": {
    "public": ".output/public",
    "rewrites": [{ "source": "**", "function": "nuxtServer" }],
    "cleanUrls": true,
    "trailingSlashBehavior": "REMOVE"
  },
  "firestore": { "rules": "firestore.rules" },
  "functions": { "source": ".output/server", "runtime": "nodejs20" }
}
```

---

## Deployment

### Architecture

```
Develop branch push → GitHub Actions → Build → Deploy to Staging (7-day preview)
Main branch push    → GitHub Actions → Build → Deploy to Production (live)
```

Details: [DEPLOYMENT.md](../DEVELOPMENT/DEPLOYMENT.md) · [CI_CD.md](../DEVELOPMENT/CI_CD.md)

### GitHub Secrets Required

| Secret | Value |
|--------|-------|
| `FIREBASE_PROJECT_ID` | Firebase Project ID |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Service account JSON (full contents) |

### Commands

```bash
# Local test of production build
npm run build && npm run preview    # http://localhost:3000

# Manual deploy
firebase deploy --only functions,hosting
```

### Rollback

Firebase Console → Hosting → Release history → select previous release → Rollback

```bash
firebase hosting:channel:list
firebase hosting:clone <source> <target>
```

---

## Firestore Security Rules

Current `firestore.rules` (deployed with `firebase deploy --only firestore:rules`):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId && request.auth.uid != null;
    }
    match /roles/{document=**} {
      allow read: if request.auth.uid != null;
      allow write: if false;
    }
    match /{document=**} {
      allow read, write: if request.auth.uid != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

> Role-based rules (owner / manager / auditor per collection) must be written before migrating
> Money Transfer / Bill Payment data to Firestore.

---

## Quotas & Cost

### Free Tier Limits
- Reads: 50,000/day
- Writes: 50,000/day
- Deletes: 20,000/day
- Storage: 1 GB

### Current Usage (Phase 1)
- Estimated daily writes: 20-30
- Estimated daily reads: 100-200
- Storage: <10 MB
- **Status**: Well within free tier

### Scaling
- Upgrade to Blaze (pay-as-you-go) if >50K daily ops
- Estimated cost at 1M ops/month: ~$5-10
