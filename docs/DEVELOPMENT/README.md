# 📚 Development Documentation

**Last Updated**: Oct 16, 2026

How we work on BigT Minimart: git workflow, quality standards, CI/CD and deployment.

---

## 📁 Files

| File | Purpose | When to read |
|------|---------|--------------|
| [GIT_WORKFLOW.md](./GIT_WORKFLOW.md) | Branch strategy, commit conventions, PR & merge process | Daily development |
| [COMPONENT_QUALITY_CHECKLIST.md](./COMPONENT_QUALITY_CHECKLIST.md) | Checklist for new components/pages (TS, RBAC, styling, a11y) | Before opening a PR with UI changes |
| [CI_CD.md](./CI_CD.md) | GitHub Actions workflows & secrets | Investigating a failed check |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Environments, release flow, rollback | Before releasing to `main` |

AI-assisted workflow (skills, prompts): [.claude/PLAYBOOK.md](../../.claude/PLAYBOOK.md)

---

## 🚦 Quick Start

```bash
npm install
cp .env.example .env      # Firebase client config
npm run dev               # http://localhost:3000
npm test                  # Vitest
```

---

## 📋 Workflow at a Glance

```
1. git checkout develop && git pull
2. git checkout -b feature/<scope>-<short-name>
3. Commit with Conventional Commits (feat/fix/docs/refactor/test/chore)
4. npm test && npm run lint && npm run type-check && npm run build
5. Push → PR to develop → PR Check passes → Squash & merge
6. Release: PR develop → main (auto-deploys to production)
```

---

## 🎓 Best Practices

### ✅ Do's
- Keep commits small and focused
- Use Conventional Commits
- Create a feature branch for all work
- Run tests locally (CI does not run `npm test` yet)
- Delete the branch after merge

### ❌ Don'ts
- Don't commit directly to `main`/`develop`
- Don't commit secrets (`.env`, `firebase-service-account.json`)
- Don't force push to shared branches

---

## 🔗 Related Documentation

- [TECHNICAL/](../TECHNICAL/) — Architecture & implementation details
- [PROGRESS/](../PROGRESS/) — Project status & testing plan
- [REQUIREMENTS/](../REQUIREMENTS/) — Business requirements & workflows
