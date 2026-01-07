# 🔄 Git Daily Workflow Guide

**Last Updated**: Jan 7, 2026  
**Version**: 1.0  
**For**: Development team - Daily use  
**Time to Read**: 10 minutes

---

## 📅 Daily Workflow Overview

```
Morning
  ↓
Check latest code (git pull)
  ↓
Create feature branch
  ↓
Development Day
  ↓
Make commits
  ↓
Push to remote
  ↓
Create Pull Request
  ↓
Code Review
  ↓
Merge to develop
  ↓
Deploy / Close branch
```

---

## 🌅 Morning: Start of Day

### Step 1: Update Your Local Repo

```bash
# Make sure you're on develop branch
git checkout develop

# Pull latest changes from team
git pull origin develop
```

**Why?** Get the latest code from your team before starting work.

---

### Step 2: Create Feature Branch

```bash
# Create and switch to new branch
git checkout -b feature/user-login

# Or for bug fixes
git checkout -b bugfix/auth-error

# Or for chores
git checkout -b chore/update-dependencies
```

**Branch Naming Convention:**
- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `chore/description` - Maintenance, refactoring
- `docs/description` - Documentation
- `hotfix/description` - Production fixes (rare)

**Examples:**
```bash
git checkout -b feature/daily-sales-form
git checkout -b bugfix/login-validation
git checkout -b chore/tailwind-upgrade
git checkout -b docs/api-endpoints
```

---

## 💻 During the Day: Development

### Step 3: Make Changes

Edit your files as normal in VS Code:
```
src/
├── components/
│   ├── LoginForm.vue  ← Edit this
│   └── DashBoard.vue
├── pages/
├── server/
└── types/
```

### Step 4: Check Your Changes

Before committing, review what you changed:

```bash
# See status
git status

# Output:
# On branch feature/user-login
# Changes not staged for commit:
#   modified:   src/components/LoginForm.vue
#   modified:   src/types/auth.ts
```

### Step 5: Stage Changes

```bash
# Stage specific file
git add src/components/LoginForm.vue

# Or stage multiple files
git add src/components/LoginForm.vue src/types/auth.ts

# Or stage everything
git add .
```

**Tip:** Stage only related changes together for clean commits.

### Step 6: Make a Commit

```bash
# Commit with message
git commit -m "feat(auth): implement login form validation"

# Or for longer description
git commit -m "feat(auth): implement login form validation" -m "
- Added email validation
- Added password strength checker
- Added error message display
"
```

**Commit Message Format:**
```
type(scope): subject

type can be:
  feat     - new feature
  fix      - bug fix
  docs     - documentation
  style    - code style (prettier, semicolons, etc)
  refactor - code refactoring without feature change
  test     - adding tests
  chore    - maintenance tasks

scope can be:
  auth     - authentication
  sales    - daily sales
  expenses - expense tracking
  etc

subject:
  - Use imperative mood ("add", not "added")
  - Don't capitalize first letter
  - No period at end
  - Max 50 characters
```

**Good Examples:**
```bash
git commit -m "feat(auth): implement login form"
git commit -m "fix(expenses): correct calculation error"
git commit -m "docs(readme): update installation steps"
git commit -m "refactor(dashboard): simplify component"
git commit -m "test(auth): add login validation tests"
```

---

## 📤 Before End of Day: Push & PR

### Step 7: Push Changes to Remote

After several commits, push to GitHub:

```bash
# Push your branch to GitHub
git push origin feature/user-login

# First time pushing new branch, you might see:
# fatal: The current branch has no upstream branch
# Run: git push --set-upstream origin feature/user-login
```

**Good Practice:** Push at least daily so your work is backed up.

---

## 🔀 Create Pull Request (PR)

### Step 8: Create PR on GitHub UI

1. Go to GitHub: https://github.com/your-repo
2. Click "Pull Requests" tab
3. Click "New Pull Request" button
4. Select:
   - Base branch: `develop`
   - Compare branch: `feature/user-login`
5. Click "Create Pull Request"

### Step 9: Fill PR Details

Use the PR template (`.github/pull_request_template.md`):

```markdown
## Description
Implements user login functionality with form validation.

## Type of Change
- [x] ✨ New feature
- [ ] 🐛 Bug fix

## Changes Made
- Added LoginForm.vue component
- Added email validation
- Added password strength checker
- Added error handling

## Related Issue
Closes #42

## Testing Done
- [x] Tested in browser
- [x] Tested on mobile
- [x] All unit tests pass
- [x] No console errors

## Checklist
- [x] Code follows style guide
- [x] Self-reviewed my code
- [x] No console.logs left
- [x] Tests added
```

---

## 👀 Code Review Phase

### Step 10: Address Review Comments

When reviewer asks for changes:

```bash
# Make the requested changes in your editor
# Stage and commit as normal
git add .
git commit -m "fix: address review feedback"

# Push again (same branch)
git push origin feature/user-login
```

**The PR automatically updates with new commits!**

Repeat until reviewer approves ✅

---

## ✅ Merge & Cleanup

### Step 11: Merge PR

Once approved, you have options:

**Option A: Merge on GitHub UI (Recommended)**
1. On GitHub PR page
2. Click "Merge pull request" button
3. Select "Squash and merge" (we use this strategy)
4. Confirm merge

**Why squash & merge?**
- Keeps develop branch clean
- One commit per feature in main history
- Easier to revert if needed

### Step 12: Delete Feature Branch

```bash
# Delete local branch
git branch -d feature/user-login

# Delete remote branch (or GitHub does it for you)
git push origin --delete feature/user-login
```

### Step 13: Return to Main Branch

```bash
# Switch to develop
git checkout develop

# Get the merged code
git pull origin develop
```

**Congratulations! Your feature is now in develop branch! 🎉**

---

## 🔄 Full Day Example

### Morning (9:00 AM)
```bash
git checkout develop
git pull origin develop
git checkout -b feature/daily-sales-form
```

### During Day (Multiple commits)
```bash
# 10:00 AM - First feature section
git add src/components/SalesForm.vue
git commit -m "feat(sales): add sales form component"
git push origin feature/daily-sales-form

# 1:00 PM - Add validation
git add src/utils/validators.ts
git commit -m "feat(sales): add form validation logic"
git push origin feature/daily-sales-form

# 3:00 PM - Fix styling
git add src/components/SalesForm.vue
git commit -m "fix(sales): correct form layout on mobile"
git push origin feature/daily-sales-form
```

### End of Day (5:00 PM)
```bash
# GitHub UI: Create PR
# Wait for review or submit for tomorrow review

# Or if approved:
# GitHub UI: Merge pull request (Squash and merge)

git checkout develop
git pull origin develop
git branch -d feature/daily-sales-form
git push origin --delete feature/daily-sales-form
```

---

## 📅 Weekly Release Process

### Release Day (Every Friday)

```bash
# 1. Make sure develop is clean
git checkout develop
git pull origin develop

# 2. Check latest version tag
git tag -l

# 3. Create release tag
# If last tag was v1.0, next is v1.1
git tag -a v1.1 -m "Week 2 Complete - Daily Sales Form"

# 4. Push tag to GitHub
git push origin v1.1

# 5. GitHub UI: Create Release
#    - Select tag v1.1
#    - Add release notes
#    - Publish release
```

**Release goes to production! 🚀**

---

## 🚨 Common Situations

### Situation 1: Need Latest Code Mid-Feature

```bash
# Current feature branch needs latest develop
git fetch origin

# Rebase on latest develop
git rebase origin/develop

# If conflicts appear:
# 1. Edit conflicted files
# 2. Resolve conflicts
# 3. git add .
# 4. git rebase --continue

# Push with force-with-lease
git push origin feature/name --force-with-lease
```

### Situation 2: Committed to Wrong Branch

```bash
# Undo the commit but keep changes
git reset --soft HEAD~1

# Switch to correct branch
git checkout feature/correct-name

# Commit again
git commit -m "your message"
```

### Situation 3: Need to Review Your Own Changes

```bash
# See what you changed vs develop
git diff origin/develop

# See your commits
git log --oneline origin/develop..

# See specific commit
git show abc1234
```

### Situation 4: Accidental Push?

```bash
# If not merged yet, you can force revert
git revert HEAD

# Push revert
git push origin feature/name
```

---

## ✨ Best Practices

### ✅ Do This
- ✅ Push at least daily
- ✅ Keep commits focused (one feature per commit if possible)
- ✅ Write clear commit messages
- ✅ Pull before starting work
- ✅ Test locally before pushing
- ✅ Create PR promptly for review
- ✅ Respond quickly to review feedback

### ❌ Don't Do This
- ❌ Commit directly to develop
- ❌ Mix multiple features in one commit
- ❌ Vague messages like "fix" or "update"
- ❌ Leave uncommitted changes overnight
- ❌ Push without testing
- ❌ Rewrite history after merging
- ❌ Hold onto feature branches for weeks

---

## 🔗 Related Documentation

- [GIT_WORKFLOW.md](./GIT_WORKFLOW.md) - Overall strategy
- [GIT_COMMANDS.md](./GIT_COMMANDS.md) - All commands reference
- [GIT_CHECKLIST.md](./GIT_CHECKLIST.md) - Checklists for each step
- [.github/pull_request_template.md](../../.github/pull_request_template.md) - PR format

---

## 📞 Need Help?

### Common Commands

```bash
# Check your branch
git branch

# See current status
git status

# View your commits
git log --oneline -5

# See changes since develop
git diff origin/develop

# Undo last commit (not pushed)
git reset --soft HEAD~1
```

### Troubleshooting

See [GIT_COMMANDS.md](./GIT_COMMANDS.md) section: "Troubleshooting Commands"

---

## ✅ Workflow Checklist

- [ ] Pull latest develop
- [ ] Create feature branch
- [ ] Make changes
- [ ] Review with `git status`
- [ ] Stage changes with `git add`
- [ ] Commit with clear message
- [ ] Push to remote
- [ ] Create PR on GitHub
- [ ] Wait for review
- [ ] Address feedback
- [ ] Merge PR
- [ ] Delete feature branch
- [ ] Pull merged code

---

<div align="center">
  <p><strong>You've got this! 🚀</strong></p>
  <p>Follow this workflow daily and your code will stay organized</p>
</div>
