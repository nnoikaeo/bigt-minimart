# Contributing to bigt-minimart

Thank you for interest in contributing to **bigt-minimart**! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js 18+
- npm 8+
- Git
- GitHub account

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/nnoikaeo/bigt-minimart.git
cd bigt-minimart

# Install dependencies
npm install

# Create a feature branch
git checkout -b feature/your-feature-name
```

## Development Workflow

### 1. Create a Feature Branch

Use the naming convention: `feature/feature-name`

```bash
git checkout develop
git pull origin develop
git checkout -b feature/user-authentication
```

### 2. Make Your Changes

```bash
# Start development server
npm run dev

# Edit files, test locally
```

### 3. Run Code Quality Checks Locally

Before committing, run these checks:

```bash
# Lint and fix code style
npm run lint

# Type check TypeScript
npm run type-check

# Build to verify no errors
npm run build
```

✅ **All checks must pass before submitting PR**

### 4. Commit Your Changes

Follow conventional commit format:

```bash
git add .
git commit -m "feat: add user authentication flow"
```

**Commit Types**:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style (formatting, missing semicolons)
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Build, dependencies, etc.

### 5. Push and Create Pull Request

```bash
git push origin feature/user-authentication
```

Then create a PR on GitHub:
- **Base branch**: `develop`
- **Compare branch**: `feature/your-feature-name`
- **Title**: Clear, descriptive title
- **Description**: Explain what you did and why

### 6. Address PR Review Comments

- Make requested changes
- Push new commits to the same branch
- Request re-review when ready

### 7. Merge and Deploy

Once approved:
- Click "Merge pull request" on GitHub
- Verify staging deployment succeeds
- Monitor for issues

## CI/CD Pipeline

All pull requests automatically run **PR Validation Checks**:

### What Gets Checked

| Check | Command | Purpose |
|-------|---------|---------|
| **Lint** | `npm run lint` | Code style and quality (ESLint, Prettier) |
| **Type Check** | `npm run type-check` | TypeScript type safety |
| **Build Test** | `npm run build` | Verify code builds without errors |

### Status Badges

You'll see these checks in your PR:

```
✅ pr-check (All checks passed)
❌ pr-check (Some checks failed - see details)
```

Click **Details** to see what failed.

### Common Issues & Fixes

#### Lint Errors

```bash
# Auto-fix most lint issues
npm run lint

# If still failing, manually fix files shown in error
```

#### Type Errors

```bash
# Check TypeScript errors
npm run type-check

# Review errors and fix them in your editor
# VS Code shows errors automatically (red squiggles)
```

#### Build Failures

```bash
# Test build locally
npm run build

# Check the error messages
# Common issues: missing imports, syntax errors, etc.
```

## Code Standards

### TypeScript

- Use `const` for variables that don't reassign
- Type imports explicitly: `import type { User } from '@/types'`
- Avoid `any` type - use proper typing

### Vue Components

- Use `<script setup>` syntax
- Prefix component files with uppercase: `UserCard.vue`
- Add proper TypeScript types to props and emits

```vue
<script setup lang="ts">
interface Props {
  userId: string
  onDelete?: (id: string) => void
}

withDefaults(defineProps<Props>(), {})
const emit = defineEmits<{
  deleted: [id: string]
}>()
</script>
```

### CSS

- Use Tailwind CSS utilities (no global CSS except in `assets/css/main.css`)
- Follow Tailwind's class ordering
- Use CSS custom properties for theme colors

### Naming Conventions

- **Files**: kebab-case for components and utilities (`user-card.vue`, `format-date.ts`)
- **Classes**: PascalCase (`UserCard`, `AuthService`)
- **Functions**: camelCase (`formatDate`, `getUserById`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETRIES`, `DEFAULT_TIMEOUT`)

## Testing

If tests exist, run before submitting:

```bash
npm run test
```

Write tests for:
- New features
- Bug fixes
- Complex logic

## Documentation

Update documentation when:
- Adding new features
- Changing API routes
- Modifying configuration
- Adding environment variables

Update relevant files:
- Code comments (JSDoc style)
- [`docs/`](docs) directory
- [`README.md`](../../README.md)

## Deployment Process

```
Feature Branch → PR to develop → Checks Pass → Merge → Auto-Deploy to Staging
                                                        ↓
                                               Code Review in Staging
                                                        ↓
                                              PR to main (Release) → Auto-Deploy to Production
```

### Staging Environment

- Auto-deploys on develop push
- Full testing environment
- URL: Check deployment logs in GitHub Actions

### Production Environment

- Manual approval required
- Only from main branch
- Merged releases/hotfixes

## Code Review Checklist

When reviewing PRs, check:

- ✅ Code follows style guidelines
- ✅ All checks pass
- ✅ TypeScript types are correct
- ✅ No console.log or debug code
- ✅ Changes are documented
- ✅ Tests included (if applicable)
- ✅ No security issues
- ✅ Performance impact considered

## Reporting Issues

Found a bug? Create an issue:

1. **Title**: Clear, concise description
2. **Environment**: Node version, browser, OS
3. **Steps to Reproduce**: Exact steps to see the issue
4. **Expected**: What should happen
5. **Actual**: What actually happens
6. **Screenshots**: If UI-related

## Project Structure

```
bigt-minimart/
├── pages/              # Route pages (Nuxt)
├── components/         # Vue components
├── composables/        # Composable functions
├── stores/            # Pinia state management
├── server/            # Backend API routes
│   ├── api/          # API endpoints
│   └── utils/        # Server utilities
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── assets/           # Static assets
├── docs/             # Documentation
└── public/           # Public files
```

## Git Workflow Tips

### Sync with develop before creating PR

```bash
git fetch origin
git rebase origin/develop
```

### Update branch with latest develop

```bash
git fetch origin
git rebase origin/develop
git push origin feature/your-feature -f
```

### View changes before commit

```bash
git diff              # Unstaged changes
git diff --staged     # Staged changes
```

## Questions or Need Help?

- 📖 Check documentation in [`docs/`](docs)
- 💬 Open an issue for questions
- 🐛 Report bugs with detailed info
- 📧 Reach out to the team

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing! We appreciate your help in making bigt-minimart better.** 🚀
