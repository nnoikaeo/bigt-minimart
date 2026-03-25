# Firebase Setup & Hosting

> Single source of truth for Firebase configuration and deployment.
> Merged from: FIREBASE_SETUP.md, FIREBASE_HOSTING_SETUP.md

**Last Updated**: Mar 25, 2026

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
| Authentication | Enabled | Email/Password |
| Firestore | Enabled | asia-southeast1 |
| Storage | Enabled | Unused in Phase 1 |
| Hosting | Enabled | CI/CD integrated |

### Auth Config
- Token Expiry: 1 hour
- Refresh Token: 30 days
- Auto Logout: 30 minutes inactivity

---

## Environment Variables

### .env.local

```
NUXT_PUBLIC_FIREBASE_API_KEY=<api-key>
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bigt-minimart.firebaseapp.com
NUXT_PUBLIC_FIREBASE_PROJECT_ID=bigt-minimart
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=bigt-minimart.appspot.com
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
NUXT_PUBLIC_FIREBASE_APP_ID=<app-id>
NUXT_PUBLIC_FIREBASE_DATABASE_URL=https://bigt-minimart.firebaseio.com

# Server-side
FIREBASE_ADMIN_SDK_KEY=<admin-sdk-json>
```

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

```json
{
  "hosting": {
    "public": ".output/public",
    "ignore": ["firebase.json", ".firebaserc", "*.md"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

---

## Deployment

### Architecture

```
Develop branch push → GitHub Actions → Build → Deploy to Staging (7-day preview)
Main branch push    → GitHub Actions → Build → Deploy to Production (live)
```

### GitHub Secrets Required

| Secret | Value |
|--------|-------|
| `FIREBASE_PROJECT_ID` | Firebase Project ID |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Service account JSON (full contents) |

### Commands

```bash
# Local test
npm run build && firebase serve    # http://localhost:5000

# Manual deploy
firebase deploy --only hosting     # Production
```

### Rollback

Firebase Console → Hosting → select previous deployment → Restore

```bash
firebase hosting:channel:list
firebase hosting:clone <source> <target>
```

---

## Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuth() { return request.auth != null; }
    function isOwner() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "owner"; }
    function isManager() { return request.auth.token.role in ["owner", "manager", "assistant_manager"]; }
    function isAuditor() { return request.auth.token.role in ["owner", "auditor"]; }

    match /users/{userId} {
      allow read: if isAuth();
      allow write: if isOwner();
    }
    match /daily_sales/{doc} {
      allow read: if isManager() || isAuditor() || resource.data.userId == request.auth.uid;
      allow write: if isManager() || isAuditor();
    }
    match /monthly_expenses/{doc} { allow read, write: if isOwner(); }
    match /yearly_expenses/{doc} { allow read, write: if isOwner(); }
    match /audit_logs/{doc} { allow read, write: if isAuditor(); }
  }
}
```

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
