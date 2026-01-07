# 🔄 Git Workflow Guide

**Last Updated**: Jan 7, 2026  
**Version**: 1.0  
**Status**: Active  
**For**: Development team

---

## 📚 Quick Links

Start here based on your needs:

### 🚀 I'm Starting Development
→ Read: [GIT_DAILY_WORKFLOW.md](./GIT_DAILY_WORKFLOW.md) (10 min)

### ✅ I Need a Checklist
→ Use: [GIT_CHECKLIST.md](./GIT_CHECKLIST.md) (print it!)

### 🖥️ I Need a Command
→ Reference: [GIT_COMMANDS.md](./GIT_COMMANDS.md) (bookmark it!)

### 🔀 I'm Creating a PR
→ Use: [.github/pull_request_template.md](../../.github/pull_request_template.md)

---

## 🎯 Our Workflow Strategy

### Branch Strategy: Feature Branches
We use **feature branches for everything**:
- All work happens on feature branches
- `develop` is our main integration branch
- No direct commits to `develop`
- Clean history with meaningful commits

### Merge Strategy: Squash & Merge
We use **squash and merge** for PRs:
- Multiple commits become 1 clean commit
- Keeps main history readable
- Easy to revert if needed
- One commit = one feature

### Release Strategy: Tag Based
We use **git tags** for releases:
- Version tags: `v1.0`, `v1.1`, `v2.0`
- Release notes on GitHub
- One release per week
- Easy to reference specific versions

---

## 🌳 Branch Structure

```
main
  ↑
  └─ (merge releases here)
  
develop ← Main integration branch
  ↑
  ├─ feature/auth-login
  ├─ feature/daily-sales
  ├─ bugfix/validation-error
  ├─ chore/dependencies
  └─ docs/api-endpoints

hotfix ← Emergency fixes only
  ↑
  └─ hotfix/production-bug
```

### Branch Naming Convention

| Type | Format | Example |
|------|--------|---------|
| Feature | `feature/description` | `feature/user-login` |
| Bug Fix | `bugfix/description` | `bugfix/form-validation` |
| Chore | `chore/description` | `chore/update-tailwind` |
| Docs | `docs/description` | `docs/api-endpoints` |
| Hotfix | `hotfix/description` | `hotfix/critical-error` |

---

## 🔄 Standard Workflow

### 1. Start Your Day
```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-feature
```

### 2. During Development
```bash
# Make changes in your editor...

# Commit regularly
git add .
git commit -m "feat(auth): implement login"
git push origin feature/my-feature
```

### 3. Create Pull Request
- Go to GitHub
- Create PR from `feature/my-feature` → `develop`
- Fill in PR template
- Request reviewers

### 4. Code Review
- Address feedback
- Push new commits
- Get approval ✅

### 5. Merge & Deploy
- Merge on GitHub: "Squash and merge"
- Delete branch
- Pull latest develop
- Deploy to staging/production

### 6. Release (Weekly)
```bash
git tag -a v1.1 -m "Week 1 Complete"
git push origin v1.1
# Create release on GitHub
```

---

## 📋 Commit Message Convention

**Format:**
```
type(scope): subject

[optional body]
```

**Type:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style (Prettier, etc)
- `refactor` - Refactoring
- `test` - Tests
- `chore` - Maintenance

**Scope:**
- `auth` - Authentication
- `sales` - Daily sales module
- `expenses` - Expense tracking
- `dashboard` - Dashboard
- `ui` - UI components
- etc.

**Examples:**
```bash
feat(auth): implement login form
fix(expenses): correct tax calculation
docs(readme): update setup instructions
refactor(dashboard): simplify component
test(auth): add login validation tests
```

---

## 🔀 PR Merge Process

### Before Merge
1. ✅ All tests pass
2. ✅ Code reviewed and approved
3. ✅ No merge conflicts
4. ✅ Base branch is up to date

### Merge on GitHub UI
1. Go to Pull Request
2. Click "Merge pull request"
3. Select "Squash and merge"
4. Confirm the merge message
5. Delete branch

### After Merge
```bash
git checkout develop
git pull origin develop
git branch -d feature/name
```

---

## 📦 Release Process

### Weekly Release (Friday)

```bash
# 1. Verify develop is clean
git checkout develop
git pull origin develop
git status  # Should show clean

# 2. Create version tag
git tag -a v1.1 -m "Week 1 Complete - Login Implementation"

# 3. Push tag
git push origin v1.1

# 4. GitHub UI - Create Release
#    - Go to Releases
#    - Select tag v1.1
#    - Add release notes
#    - Publish release
```

### Version Numbering
- `v1.0`, `v1.1`, `v1.2` - Minor releases
- `v2.0`, `v3.0` - Major releases
- Always format: `v[major].[minor]` or `v[major].[minor].[patch]`

---

## 🚨 Handling Issues

### Merge Conflicts

When PR shows "Can't merge":

```bash
# Fetch latest
git fetch origin

# Rebase on develop
git rebase origin/develop

# Resolve conflicts in editor
# Search for: <<<<<<, ======, >>>>>>

# After resolving
git add .
git rebase --continue

# Push with force (safe)
git push origin feature/name --force-with-lease
```

### Reverting a Merge

```bash
# If PR merged but has issues:
git revert -m 1 <merge-commit-hash>

# This creates a revert commit in develop
# Push and deploy
```

### Lost Commits

```bash
# See all commits (including deleted)
git reflog

# Recover deleted commit
git cherry-pick <commit-hash>
```

---

## 🧹 Cleanup

### Delete Old Branches

```bash
# Delete local branch
git branch -d feature/name

# Delete remote branch
git push origin --delete feature/name
```

### Clean Up Merged Branches

```bash
# Fetch latest
git fetch origin

# Delete all merged branches (except main/develop)
git branch --merged | grep -v "main\|develop" | xargs git branch -d
```

---

## 📊 Team Best Practices

### Do This ✅
- ✅ Push at least daily
- ✅ Keep commits focused
- ✅ Write clear commit messages
- ✅ Pull before starting work
- ✅ Test locally before pushing
- ✅ Create PRs promptly
- ✅ Review thoroughly
- ✅ Respond to feedback quickly

### Don't Do This ❌
- ❌ Commit directly to develop
- ❌ Mix multiple features in one commit
- ❌ Vague messages ("fix", "update")
- ❌ Leave uncommitted changes overnight
- ❌ Push without testing
- ❌ Merge without review
- ❌ Rewrite history after merging
- ❌ Keep branches for weeks

---

## 🎯 Common Scenarios

### Scenario 1: Need Latest Code Mid-Feature

```bash
git fetch origin
git rebase origin/develop
# If conflicts, resolve them
git push origin feature/name --force-with-lease
```

### Scenario 2: Committed to Wrong Branch

```bash
git reset --soft HEAD~1       # Undo commit, keep changes
git stash                      # Save changes
git checkout correct-branch    # Switch branch
git stash apply               # Apply changes
git commit -m "..."           # Commit on correct branch
```

### Scenario 3: Need to Update Your PR

```bash
# Just make changes and commit normally
git add .
git commit -m "fix: address review feedback"
git push origin feature/name
# PR automatically updates!
```

### Scenario 4: Want to See What Changed

```bash
# See changes vs develop
git diff origin/develop

# See commits you added
git log --oneline origin/develop..

# See specific commit
git show abc1234
```

---

## 🔗 Documentation Index

### For Daily Work
- [Daily Workflow Guide](./GIT_DAILY_WORKFLOW.md) - Step-by-step process
- [Checklist](./GIT_CHECKLIST.md) - Checklist for each operation

### For Reference
- [Commands Reference](./GIT_COMMANDS.md) - All git commands
- [PR Template](../../.github/pull_request_template.md) - PR format

### For Learning
- [PROJECT_INSTRUCTIONS.md](./PROJECT_INSTRUCTIONS.md) - Project setup
- [CODING_STANDARDS.md](./CODING_STANDARDS.md) - Code guidelines
- [TESTING_GUIDELINES.md](./TESTING_GUIDELINES.md) - Testing approach

---

## 📞 Quick Command Reference

```bash
# Start work
git checkout develop && git pull origin develop
git checkout -b feature/name

# Daily workflow
git add .
git commit -m "type(scope): message"
git push origin feature/name

# Create PR (GitHub UI)

# Review feedback
git commit -m "fix: address feedback"
git push origin feature/name

# Merge (GitHub UI - Squash and merge)

# Cleanup
git checkout develop
git pull origin develop
git branch -d feature/name

# Release
git tag -a v1.1 -m "message"
git push origin v1.1
```

---

## 🆘 Getting Help

### Can't Remember What to Do?
1. Read: [GIT_DAILY_WORKFLOW.md](./GIT_DAILY_WORKFLOW.md)
2. Check: [GIT_CHECKLIST.md](./GIT_CHECKLIST.md)
3. Look up: [GIT_COMMANDS.md](./GIT_COMMANDS.md)

### Need Specific Command?
→ Search: [GIT_COMMANDS.md](./GIT_COMMANDS.md)

### Stuck or Error?
1. Run: `git status`
2. Run: `git log --oneline`
3. Read: [GIT_COMMANDS.md - Troubleshooting](./GIT_COMMANDS.md)
4. Ask: Post in Slack or create issue

---

## 🎓 Training

### For New Team Members
1. Read: This document (all sections)
2. Study: [GIT_DAILY_WORKFLOW.md](./GIT_DAILY_WORKFLOW.md)
3. Print: [GIT_CHECKLIST.md](./GIT_CHECKLIST.md)
4. Bookmark: [GIT_COMMANDS.md](./GIT_COMMANDS.md)
5. Do: Practice by creating first PR

### Pairing/Mentoring
- Pair on first PR creation
- Show branch workflow
- Demonstrate commit message format
- Guide through code review process
- Show merge and cleanup steps

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-07 | Initial workflow guide |
| - | - | - |

---

## 🎉 Next Steps

1. **Read**: [GIT_DAILY_WORKFLOW.md](./GIT_DAILY_WORKFLOW.md) (today)
2. **Print**: [GIT_CHECKLIST.md](./GIT_CHECKLIST.md) (keep at desk)
3. **Bookmark**: [GIT_COMMANDS.md](./GIT_COMMANDS.md) (reference often)
4. **Create PR**: First feature branch (this week)
5. **Join Team**: Start following this workflow (immediately)

---

<div align="center">
  <p><strong>Welcome to our Git Workflow! 🚀</strong></p>
  <p>Clear process → Organized code → Happy team</p>
  <p><em>Let's build something great together</em></p>
</div>
