# 🔄 Git Workflow Guide

**Last Updated**: Oct 16, 2026
**Version**: 2.0
**Status**: Active

---

## 🎯 Strategy

| Topic | Rule |
|-------|------|
| Integration branch | `develop` — no direct commits for feature work |
| Production branch | `main` — updated only through release PRs |
| Feature work | Short-lived branches from `develop` |
| Merge | **Squash and merge** (1 PR = 1 commit) |
| Release | PR `develop` → `main` titled `release: ...` (auto-deploys to production) |
| Tags | Optional — last tag `v1.6`; releases are tracked by `release:` PRs |
| Cleanup | Delete the branch (local + remote) after merge |

---

## 🌳 Branch Structure

```
main      ← production (release PRs only)
  ↑
develop   ← integration (auto-deploys to staging)
  ↑
  ├─ feature/<scope>-<name>   e.g. feature/bp-status-ux-and-workflow-gate
  ├─ fix/<name>               e.g. fix/history-page-consistency
  ├─ test/<name>              e.g. test/task-6.2-integration-tests
  ├─ docs/<name>              e.g. docs/update-testing-plan-mt1
  └─ chore/<name>
```

| Type | Format |
|------|--------|
| Feature | `feature/<description>` |
| Bug fix | `fix/<description>` |
| Tests | `test/<description>` |
| Docs | `docs/<description>` |
| Chore | `chore/<description>` |
| Hotfix (from `main`) | `hotfix/<description>` |

---

## 🔄 Standard Workflow

```bash
# 1. Start
git checkout develop && git pull origin develop
git checkout -b feature/<scope>-<name>

# 2. Commit (Conventional Commits)
git add <files>
git commit -m "feat(bill-payment): add favorites modal"

# 3. Verify locally (CI does not run tests yet)
npm test && npm run lint && npm run type-check && npm run build

# 4. Push + PR to develop
git push -u origin feature/<scope>-<name>
gh pr create --base develop --fill

# 5. After PR Check passes → Squash and merge, then clean up
git checkout develop && git pull origin develop
git branch -D feature/<scope>-<name>     # -D needed: squash merge rewrites commits
git push origin --delete feature/<scope>-<name>
```

---

## 📋 Commit Message Convention

```
type(scope): subject

[optional body]
```

**Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`, `release`

**Scopes used in this repo**: `money-transfer` / `mt`, `bill-payment` / `bp`, `finance`, `workflow`,
`ui`, `sales`, `auth`, `testing`, `progress`, `data`

```bash
feat(money-transfer): improve transaction form UX + detail modal reconciliation
fix(bill-payment): resolve 401, remove ⋮ button, enforce workflow edit gate
test(workflow): Task 6.2 — Integration Tests for both Services
docs(testing): update MT-1 status to passed in TESTING_PLAN.md
chore(data): sync money-transfer test data
```

---

## 📦 Release Process

```bash
# 1. Make sure develop is green (PR Check / Deploy Staging)
gh run list --branch develop --limit 3

# 2. Open release PR
gh pr create --base main --head develop --title "release: <summary>"

# 3. Merge → Deploy Production runs automatically

# 4. If main got a merge commit, sync it back
git checkout develop && git pull origin develop
git merge origin/main && git push origin develop
```

---

## 🚨 Handling Issues

### Merge conflicts in `public/data/*.json`
Test data files change during manual testing. Prefer keeping the `develop` version unless the
other side contains intentional seed data, then re-run the app to regenerate summaries.

### Update a feature branch with latest develop
```bash
git fetch origin
git rebase origin/develop
git push --force-with-lease
```

### Revert a squash-merged PR
```bash
git revert <commit-hash>
```

### Lost commits
```bash
git reflog
git cherry-pick <commit-hash>
```

---

## 🔐 Authentication

Git pushes over HTTPS use the GitHub CLI credential helper:

```bash
gh auth status
gh auth setup-git
```

---

## 🔗 Related

- [PR Template](../../.github/pull_request_template.md)
- [CONTRIBUTING.md](../../.github/CONTRIBUTING.md)
- [CI_CD.md](./CI_CD.md) · [DEPLOYMENT.md](./DEPLOYMENT.md)
- [COMPONENT_QUALITY_CHECKLIST.md](./COMPONENT_QUALITY_CHECKLIST.md)

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-07 | Initial workflow guide |
| 2.0 | 2026-10-16 | Match actual practice (release PRs, branch types, gh CLI); remove links to non-existent docs |
