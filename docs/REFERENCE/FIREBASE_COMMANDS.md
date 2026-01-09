# Firebase Hosting Commands Reference

Quick reference for common Firebase Hosting commands.

## Login & Setup

```bash
# Authenticate with Firebase
firebase login

# Logout
firebase logout

# List your Firebase projects
firebase projects:list

# Set default project
firebase use --add
```

## Local Development

```bash
# Start Nuxt dev server
npm run dev

# Build for production
npm run build

# Preview production build locally (uses Firebase Hosting)
firebase serve

# Preview on specific port
firebase serve -p 8080
```

## Deployment

### Deploy Everything

```bash
# Deploy all features (hosting, functions, etc.)
firebase deploy
```

### Deploy Only Hosting

```bash
# Deploy to default project (live/production)
firebase deploy --only hosting

# Deploy with a message
firebase deploy --only hosting -m "Fixed bug #123"
```

### Deploy to Staging Channel

```bash
# Deploy to preview channel (valid for 7 days)
firebase hosting:channel:deploy staging --expires 7d

# Custom expiration time
firebase hosting:channel:deploy staging --expires 30d
```

## Channel Management (Preview URLs)

```bash
# List all channels
firebase hosting:channel:list

# Deploy to specific channel
firebase hosting:channel:deploy my-feature-branch

# Clone deployment from one channel to another
firebase hosting:channel:clone production staging

# Delete a channel
firebase hosting:channel:delete staging
```

## Site Management

```bash
# List all sites in project
firebase hosting:sites

# Clone production to another site
firebase hosting:clone production-site staging-site --yes
```

## Monitoring & Debugging

```bash
# View deployment history
firebase hosting:list

# Get info about a specific release
firebase hosting:releases

# View real-time usage
firebase functions:log

# View hosting request logs
firebase hosting:log
```

## Rollback

```bash
# List releases
firebase hosting:releases

# Rollback to previous release (interactive)
firebase deploy --only hosting --force

# Or from Firebase Console:
# Hosting > Click previous deployment > Restore
```

## Environment & Configuration

```bash
# View current configuration
firebase.json

# Edit configuration
# (Use text editor, no CLI command)

# View current project settings
firebase setup:web

# Initialize Firebase in a new project
firebase init

# Add Firebase to existing project with defaults
firebase init --no-prompt
```

## Testing

```bash
# Run local tests before deploying
npm run lint
npm run type-check
npm run build

# Test with all checks
npm run lint && npm run type-check && npm run build
```

## Useful One-Liners

```bash
# Build and deploy in one command
npm run build && firebase deploy --only hosting

# Build, test, then deploy
npm run build && npm run type-check && firebase deploy --only hosting

# Quick check before push
npm run lint && npm run type-check && npm run build && firebase serve

# Clean and rebuild
rm -rf .output && npm run build && firebase deploy --only hosting
```

## Environment Variables

```bash
# For development (local .env file)
NUXT_PUBLIC_FIREBASE_API_KEY=...
NUXT_PUBLIC_FIREBASE_PROJECT_ID=...

# For CI/CD (GitHub Secrets)
FIREBASE_PROJECT_ID
FIREBASE_SERVICE_ACCOUNT_JSON
```

## Troubleshooting Commands

```bash
# Check Firebase CLI version
firebase --version

# Update Firebase CLI
npm update -g firebase-tools

# Verify authentication
firebase auth:import

# Check project configuration
cat .firebaserc

# View active project
firebase use

# Reinitialize Firebase
rm -rf .firebaserc firebase.json
firebase init
```

## GitHub Actions Integration

These commands are automatically run in CI/CD:

```bash
# In GitHub Actions (not needed locally):
npm install
npm run build
firebase deploy --only hosting --token $FIREBASE_TOKEN
```

The `--token` is provided via `FIREBASE_SERVICE_ACCOUNT_JSON` secret.

## Useful Aliases (Add to .bashrc or .zshrc)

```bash
alias fdeploy="npm run build && firebase deploy --only hosting"
alias fserve="firebase serve"
alias flog="firebase hosting:log"
alias flist="firebase hosting:releases"
```

## Detailed Command Examples

### Deploy with Custom Message

```bash
firebase deploy --only hosting -m "Feature: Add user authentication - Fixes #45"
```

### Preview Before Deploying

```bash
# Build
npm run build

# Test locally
firebase serve

# If satisfied, deploy
firebase deploy --only hosting
```

### Deploy to Staging for QA

```bash
# Build
npm run build

# Deploy to preview channel (valid 30 days)
firebase hosting:channel:deploy qa-preview --expires 30d

# Share the preview URL with QA team
firebase hosting:channel:list
```

### Rollback to Previous Version

```bash
# View recent deployments
firebase hosting:releases

# Find the version you want to restore (e.g., commit SHA)
# Go to Firebase Console > Hosting > Click deployment > Restore

# Or use CLI to clone previous working deployment to live
firebase hosting:channel:clone <previous-channel> live
```

## Performance Optimization

```bash
# Analyze bundle size (after build)
npm run build

# The .output/public directory is what gets deployed
du -sh .output/public
ls -lh .output/public/
```

## More Resources

- `firebase --help` - Show all available commands
- `firebase <command> --help` - Show help for specific command
- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- [Nuxt Deployment Guide](https://nuxt.com/docs/getting-started/deployment)

---

**Pro Tip**: Always test with `firebase serve` before deploying!
