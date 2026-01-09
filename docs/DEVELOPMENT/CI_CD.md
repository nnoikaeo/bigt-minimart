# CI/CD Pipeline Documentation

**See also**: [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment processes

## Quick Links

- **Setup Guide**: [FIREBASE_HOSTING_SETUP.md](../FIREBASE_HOSTING_SETUP.md)
- **Commands Reference**: [FIREBASE_COMMANDS.md](../FIREBASE_COMMANDS.md)
- **Checklist**: [FIREBASE_DEPLOYMENT_CHECKLIST.md](../FIREBASE_DEPLOYMENT_CHECKLIST.md)
- **Main Documentation**: [CI_CD_SETUP.md](../CI_CD_SETUP.md)

## Overview

The project uses GitHub Actions for continuous integration and continuous deployment (CI/CD).

### Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| PR Check | Pull requests | Validate code (lint, type-check, build) |
| Deploy Staging | Push to develop | Deploy to staging environment |
| Deploy Production | Push to main | Deploy to production |

### Configuration Files

- `.github/workflows/pr-check.yml`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-production.yml`

For detailed setup instructions, see [FIREBASE_HOSTING_SETUP.md](../FIREBASE_HOSTING_SETUP.md).

