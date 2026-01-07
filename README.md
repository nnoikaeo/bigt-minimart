# bigt-minimart

> A modern Nuxt.js 3 + Firebase mini-mart application with comprehensive CI/CD pipeline

[![PR Check](https://github.com/nnoikaeo/bigt-minimart/actions/workflows/pr-check.yml/badge.svg)](https://github.com/nnoikaeo/bigt-minimart/actions/workflows/pr-check.yml)
[![Deploy Staging](https://github.com/nnoikaeo/bigt-minimart/actions/workflows/deploy-staging.yml/badge.svg)](https://github.com/nnoikaeo/bigt-minimart/actions/workflows/deploy-staging.yml)
[![Deploy Production](https://github.com/nnoikaeo/bigt-minimart/actions/workflows/deploy-production.yml/badge.svg)](https://github.com/nnoikaeo/bigt-minimart/actions/workflows/deploy-production.yml)

## Tech Stack

- **Frontend**: [Nuxt 3](https://nuxt.com) + [Vue 3](https://vuejs.org) + [TypeScript](https://www.typescriptlang.org)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Database**: [Firebase](https://firebase.google.com)
- **Package Manager**: npm
- **Node Version**: 18+

## Quick Start

Check the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Contributing

Please read our [Contributing Guide](.github/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Local Development Checklist

Before submitting a pull request, make sure to run:

```bash
# Install dependencies
npm install

# Run code quality checks
npm run lint      # Lint and fix code style
npm run type-check # TypeScript type checking
npm run build     # Test build

# Start dev server for testing
npm run dev
```

All checks must pass before merging. See [CI/CD Pipeline Documentation](docs/CI_CD_SETUP.md) for more details.

## CI/CD Pipeline

This project has automated CI/CD pipeline:

- **PR Validation**: Automatic checks on all pull requests (lint, type-check, build)
- **Staging Deploy**: Automatic deployment to staging on `develop` branch
- **Production Deploy**: Automatic deployment to production on `main` branch

See [CI/CD Setup Documentation](docs/CI_CD_SETUP.md) for complete details on workflows and deployment.

## Project Structure

```
src/
├── pages/           # Route pages
├── components/      # Vue components
├── composables/     # Composable logic
├── stores/          # Pinia stores
├── server/          # Backend API routes
│   ├── api/        # API endpoints
│   └── utils/      # Server utilities
├── types/           # TypeScript definitions
└── utils/           # Utility functions
```

## Documentation

- [CI/CD Setup Guide](docs/CI_CD_SETUP.md) - Pipeline overview and deployment
- [Contributing Guide](.github/CONTRIBUTING.md) - How to contribute
- [Development Workflow](docs/DEVELOPMENT/GIT_WORKFLOW.md) - Git workflow

## License

MIT
