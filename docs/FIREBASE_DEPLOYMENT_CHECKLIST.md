# Firebase Hosting Setup Checklist

Complete this checklist to deploy your Nuxt.js app to Firebase Hosting.

## 1. Local Setup

- [ ] Install Firebase CLI globally: `npm install -g firebase-tools`
- [ ] Login to Firebase: `firebase login`
- [ ] Test build locally: `npm run build`
- [ ] Test Firebase Hosting locally: `firebase serve`
- [ ] Visit `http://localhost:5000` and verify app works

## 2. Firebase Console Configuration

- [ ] Go to [Firebase Console](https://console.firebase.google.com)
- [ ] Select your `bigt-minimart` project
- [ ] Enable Firebase Hosting (if not already enabled)
- [ ] Note your **Project ID**

## 3. Service Account Setup

- [ ] Go to **Settings** (⚙️) → **Service Accounts**
- [ ] Click **Generate New Private Key**
- [ ] Save the JSON file securely
- [ ] Copy the entire JSON contents

## 4. GitHub Secrets Configuration

In your GitHub repository:

- [ ] Go to **Settings** → **Secrets and variables** → **Actions**
- [ ] Click **New repository secret**

Add these secrets:

### Secret 1: FIREBASE_PROJECT_ID
- **Name**: `FIREBASE_PROJECT_ID`
- **Value**: Your Firebase Project ID (from Firebase Console)
- [ ] Created

### Secret 2: FIREBASE_SERVICE_ACCOUNT_JSON
- **Name**: `FIREBASE_SERVICE_ACCOUNT_JSON`
- **Value**: Paste the entire service account JSON file contents
- [ ] Created

Verify both secrets are visible in the Secrets page.

## 5. Update Project Configuration

- [ ] Edit `.firebaserc`
- [ ] Replace `your-firebase-project-id` with your actual Project ID
- [ ] Example:
```json
{
  "projects": {
    "default": "my-project-12345"
  }
}
```

## 6. Test Staging Deployment

- [ ] Create a new feature branch: `git checkout -b feature/test-deployment`
- [ ] Make a small change (e.g., update README)
- [ ] Commit: `git commit -m "test: deployment"`
- [ ] Push: `git push origin feature/test-deployment`
- [ ] Create a Pull Request to `develop` branch
- [ ] Wait for PR checks to pass ✅
- [ ] Go to **Actions** tab → Check **Deploy to Staging** workflow
- [ ] Verify deployment succeeds
- [ ] Check Firebase Console → **Hosting** → **Channels** for staging preview URL
- [ ] Click the preview URL and test the app

## 7. Test Production Deployment

- [ ] Merge the PR to `develop` (if staging test passed)
- [ ] Create another PR from `develop` to `main`
- [ ] Wait for all checks to pass ✅
- [ ] Merge to `main`
- [ ] Go to **Actions** → **Deploy to Production** workflow
- [ ] Verify deployment succeeds ✅
- [ ] Check Firebase Console → **Hosting** for live site
- [ ] Visit your live Firebase Hosting URL: `https://<project-id>.web.app`
- [ ] Verify the app works in production

## 8. Optional: Custom Domain Setup

- [ ] Go to Firebase Console → **Hosting**
- [ ] Click **Connect Domain**
- [ ] Enter your custom domain
- [ ] Follow DNS verification steps
- [ ] Update DNS records as instructed
- [ ] Wait for SSL certificate (may take 24-48 hours)

## 9. Documentation & Communication

- [ ] Update team about deployment URLs
- [ ] Add production URL to project documentation
- [ ] Document any environment-specific setup
- [ ] Share [Firebase Hosting Setup Guide](FIREBASE_HOSTING_SETUP.md) with team

## 10. Monitoring Setup (Optional)

- [ ] Enable Analytics in Firebase Console
- [ ] Set up error reporting
- [ ] Configure performance monitoring
- [ ] Set up alerts for deployment failures

## Troubleshooting

### Build Fails Locally
```bash
npm run build
# Check error messages and fix
```

### Firebase CLI Issues
```bash
firebase login  # Re-authenticate
firebase projects:list  # Verify project access
```

### GitHub Secrets Not Working
- [ ] Verify secret names match exactly: `FIREBASE_PROJECT_ID` and `FIREBASE_SERVICE_ACCOUNT_JSON`
- [ ] Verify service account JSON is complete (no truncation)
- [ ] Check workflow file uses correct secret names: `${{ secrets.FIREBASE_PROJECT_ID }}`

### Deployment Succeeds but Site Won't Load
- [ ] Verify `.output/public` exists after build
- [ ] Check `firebase.json` configuration
- [ ] Ensure SPA rewrite rule is correct
- [ ] Clear browser cache and try again

## After Successful Deployment

- [ ] Update `README.md` with live site URL
- [ ] Add deployment status badges
- [ ] Share live site with stakeholders
- [ ] Monitor logs and performance
- [ ] Document any issues encountered

## Key Resources

- [Firebase Hosting Setup Guide](FIREBASE_HOSTING_SETUP.md)
- [CI/CD Pipeline Documentation](CI_CD_SETUP.md)
- [Firebase Console](https://console.firebase.google.com)
- [GitHub Actions - Firebase Deploy](https://github.com/FirebaseExtended/action-hosting-deploy)

---

**Status**: Ready to deploy? Check all boxes above! ✅

For questions, see the [Firebase Hosting Setup Guide](FIREBASE_HOSTING_SETUP.md) or [CI/CD Documentation](CI_CD_SETUP.md).
