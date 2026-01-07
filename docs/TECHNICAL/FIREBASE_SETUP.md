# 🔥 Firebase Setup & Configuration

## Project Details
- **Project ID**: bigt-minimart
- **Auth Domain**: bigt-minimart.firebaseapp.com
- **Database Location**: asia-southeast1 (Bangkok)
- **Region**: Southeast Asia
- **Language**: Thai (primary)

---

## Firebase Services Status

### 1. Firebase Authentication ✅ Enabled
- [x] Email/Password authentication
- [ ] Google Sign-In (future)
- [ ] Phone Number (future)
- [ ] Social login (future)

**Configuration**:
- Token Expiry: 1 hour
- Refresh Token: 30 days
- Auto Logout: 30 minutes of inactivity

### 2. Firestore Database ✅ Enabled
- [x] Firestore created (Default location)
- [x] Collections created
- [ ] Advanced indexes (created per queries)

**Data Region**: asia-southeast1

### 3. Firebase Storage ✅ Ready
- [x] Storage enabled
- [ ] Currently unused (Phase 1-2)
- [ ] Ready for receipts/documents (Phase 3+)

### 4. Firebase Hosting ✅ Ready
- [x] Hosting enabled
- [ ] Custom domain (to be set up)
- [ ] SSL/TLS enabled

---

## Environment Configuration

### .env.local Template
```
# Firebase Configuration
NUXT_PUBLIC_FIREBASE_API_KEY=<api-key>
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bigt-minimart.firebaseapp.com
NUXT_PUBLIC_FIREBASE_PROJECT_ID=bigt-minimart
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=bigt-minimart.appspot.com
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
NUXT_PUBLIC_FIREBASE_APP_ID=<app-id>
NUXT_PUBLIC_FIREBASE_DATABASE_URL=https://bigt-minimart.firebaseio.com

# Firebase Admin (Server-side)
FIREBASE_ADMIN_SDK_KEY=<admin-sdk-json>
```

---

## Firestore Security Rules

### Access Control
- **Owner**: Full read/write access to all collections
- **Manager**: Read/write daily operations, read reports
- **Assistant Manager**: Same as Manager
- **Cashier**: Read/write own records only
- **Auditor**: Read all, write audit logs

### Rule Implementation
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
    
    match /monthly_expenses/{doc} {
      allow read, write: if isOwner();
    }
    
    match /yearly_expenses/{doc} {
      allow read, write: if isOwner();
    }
    
    match /audit_logs/{doc} {
      allow read: if isAuditor();
      allow write: if isAuditor();
    }
  }
}
```

---

## Backup & Recovery

### Automatic Backup
- **Enabled**: Yes
- **Frequency**: Daily
- **Retention**: 30 days
- **Location**: Google Cloud Storage

### Recovery Process
1. Contact Firebase support
2. Request point-in-time recovery
3. Specify recovery date/time
4. Database restored to specified state

---

## Quotas & Limits

### Firestore (Free Tier)
- **Read/Write**: 50,000 per day (free)
- **Delete**: 20,000 per day (free)
- **Storage**: 1 GB (free)

### Current Usage (Phase 1)
- **Estimated Daily Writes**: 20-30
- **Estimated Daily Reads**: 100-200
- **Estimated Storage**: <10 MB

**Status**: Well within free tier limits

---

## Monitoring & Performance

### Metrics to Monitor
- Database read/write operations
- Authentication failures
- API error rates
- Page load times
- Network latency

### Firebase Console
- Real-time activity monitoring
- Error rate tracking
- Performance insights
- Usage analytics

---

## Cost Considerations

### Current Plan
- **Tier**: Spark (Free)
- **Estimated Monthly Cost**: $0 (within free limits)
- **Scaling**: Automatic

### Future Scaling
- **When to upgrade**: If exceeds 50K daily operations
- **Recommended plan**: Blaze (pay-as-you-go)
- **Estimated cost at 1M operations/month**: ~$5-10

---

**Source**: Newly created Firebase setup documentation  
**Last Updated**: Jan 7, 2026  
**Version**: 1.0  
