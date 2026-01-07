# 🖥️ Git Commands Reference

**Last Updated**: Jan 7, 2026  
**Version**: 1.0  
**For**: Daily use by development team  
**Tip**: Keep this open in a browser tab!

---

## Basic Commands

### Setup (One-Time)
```bash
# Global config (one-time)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Clone repository
git clone https://github.com/your-repo.git
cd your-repo
```

### Daily Commands
```bash
# Check current branch
git branch

# Check status
git status

# See changes
git diff

# Add changes
git add .
git add filename.js

# Commit
git commit -m "type(scope): message"

# Push
git push origin branch-name

# Pull latest
git pull origin
```

---

## Branch Commands

### Create & Switch
```bash
# Create and switch
git checkout -b feature/name

# Switch existing
git checkout develop

# List branches
git branch        # Local only
git branch -a     # All (local + remote)

# Delete branch
git branch -d feature/name           # Local
git push origin --delete feature/name # Remote
```

### Branch Info
```bash
# See merged branches
git branch --merged

# See unmerged branches
git branch --no-merged

# See branch history
git log --oneline branch-name
```

---

## Commit Commands

### Making Commits
```bash
# Stage all changes
git add .

# Stage specific file
git add src/components/Form.vue

# View staged changes
git diff --cached

# Commit
git commit -m "feat(auth): implement login"

# Commit with description
git commit -m "feat(auth): implement login" -m "Detailed description here"

# Amend last commit (if not pushed)
git commit --amend
```

### Viewing Commits
```bash
# View commits (short)
git log --oneline

# View commits with details
git log

# View specific number
git log --oneline -5

# View graph
git log --oneline --graph --all

# View by author
git log --author="name"

# View specific date
git log --since="2 weeks ago"
```

---

## Push & Pull Commands

### Pushing
```bash
# Push current branch
git push origin feature/name

# Push all branches
git push origin

# Push with force (safe)
git push origin feature/name --force-with-lease

# Push tags
git push origin v1.1
```

### Pulling
```bash
# Pull from develop
git pull origin develop

# Fetch (don't merge)
git fetch origin

# Pull with rebase
git pull origin develop --rebase
```

---

## Merge & Rebase

### Rebase (Before PR)
```bash
# Rebase on develop
git rebase origin/develop

# If conflicts appear
# 1. Edit conflicted files
# 2. git add .
# 3. git rebase --continue

# Abort rebase if needed
git rebase --abort
```

### Merge (GitHub UI preferred)
```bash
# Local merge (not recommended)
git checkout main
git merge feature/name

# Better: Use GitHub UI for PR merge
```

---

## Tagging (Releases)

### Create Tags
```bash
# Lightweight tag
git tag v1.1

# Annotated tag (recommended)
git tag -a v1.1 -m "Week 1 Complete"

# Tag specific commit
git tag -a v1.1 -m "message" commit-hash
```

### Manage Tags
```bash
# List tags
git tag
git tag -l

# Show tag details
git show v1.1

# Delete tag
git tag -d v1.1              # Local
git push origin --delete v1.1 # Remote

# Push tag
git push origin v1.1
git push origin --tags       # All tags
```

---

## Undoing Changes

### Before Commit
```bash
# Unstage file
git reset HEAD src/components/Form.vue

# Discard changes in file
git checkout -- src/components/Form.vue

# Discard all changes
git reset --hard
```

### After Commit (Not Pushed)
```bash
# Undo last commit, keep changes
git reset --soft HEAD~1

# Undo last commit, discard changes
git reset --hard HEAD~1

# Undo multiple commits
git reset --soft HEAD~3
```

### After Push (Create revert commit)
```bash
# Revert last commit
git revert HEAD

# Revert specific commit
git revert abc1234

# Push revert
git push origin develop
```

---

## Cleanup Commands

### Remove Branches
```bash
# Delete local branch
git branch -d feature/name

# Force delete
git branch -D feature/name

# Delete remote branch
git push origin --delete feature/name

# Clean up remote tracking
git remote prune origin
```

### Cleanup Multiple
```bash
# Delete all local branches except main/develop
git branch | grep -v "main\|develop" | xargs git branch -d

# Delete merged branches only
git branch --merged | grep -v "main\|develop" | xargs git branch -d
```

---

## Helpful Aliases

Add to git config:
```bash
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.log1 "log --oneline"
git config --global alias.logs "log --oneline --graph --all"
git config --global alias.unstage "reset HEAD"
```

**Usage:**
```bash
git st          # instead of git status
git co develop  # instead of git checkout develop
git ci -m "msg" # instead of git commit -m "msg"
git logs        # instead of git log --oneline --graph --all
```

---

## Troubleshooting Commands

### Merge Conflicts
```bash
# See conflict status
git status

# See conflicted files
git diff

# After resolving
git add .
git commit -m "Merge resolved"
```

### Rebase Issues
```bash
# Abort rebase
git rebase --abort

# Continue rebase (after fixing conflicts)
git rebase --continue

# Skip commit during rebase
git rebase --skip
```

### Lost Commits
```bash
# See all commits (including deleted)
git reflog

# Recover deleted commit
git checkout abc1234
```

### Check Branch Status
```bash
# Show behind/ahead
git status

# Detailed comparison
git rev-list --count main..feature/name  # Commits ahead
git rev-list --count feature/name..main  # Commits behind
```

---

## Advanced Commands

### Stash (Temporary Save)
```bash
# Save work without committing
git stash

# List saved stashes
git stash list

# Apply latest stash
git stash apply

# Apply specific stash
git stash apply stash@{0}

# Delete stash
git stash drop
```

### Cherry-Pick
```bash
# Apply specific commit to current branch
git cherry-pick abc1234

# If conflicts
git cherry-pick --abort
```

### Interactive Rebase
```bash
# Reorder, squash, or edit commits
git rebase -i HEAD~3  # Last 3 commits

# In editor:
# pick abc1234 commit message
# squash def5678 another commit  
# pick ghi9012 third commit
```

### Searching
```bash
# Find commit by message
git log --grep="login"

# Find commit by content
git log -S "function_name"

# Find who deleted something
git log -p -- src/components/OldComponent.vue
```

---

## Configuration Commands

### View Config
```bash
# See global config
git config --global --list

# See local config
git config --list

# See specific value
git config user.name
```

### Set Config
```bash
# Global (applies to all repos)
git config --global user.email "your@email.com"

# Local (only current repo)
git config user.email "your@email.com"
```

### Useful Configurations
```bash
# Better diffs
git config --global core.pager "less -+F"

# Colors in output
git config --global color.ui true

# Push only current branch
git config --global push.default current

# Merge strategy (squash)
git config --global pull.rebase true
```

---

## Scripting Helpers

### Count Commits
```bash
# Commits since tag
git rev-list --count v1.0..HEAD

# Commits by person
git shortlog -sn

# Commits per file
git log --pretty=format: --name-only | sort | uniq -c | sort -rn
```

### Statistics
```bash
# Lines added/removed by author
git log --author="name" --pretty=tformat: --numstat | awk '{ add+=$1; subs+=$2 } END { printf "added lines: %s, removed lines: %s\n", add, subs }'

# Files changed in commit
git diff-tree --no-commit-id --name-only -r abc1234
```

---

## Git Workflows

### Fork Workflow
```bash
# Fork on GitHub, then clone fork
git clone https://github.com/YOUR-USERNAME/repo.git

# Add original as upstream
git remote add upstream https://github.com/ORIGINAL-OWNER/repo.git

# Keep fork updated
git fetch upstream
git rebase upstream/main
git push origin main
```

### Feature Branch Workflow (We Use This)
```bash
# Create feature branch from develop
git checkout -b feature/name

# Make commits
git commit -m "..."

# Push when ready
git push origin feature/name

# Create PR on GitHub
# After approval and merge...

git checkout develop
git pull origin develop
git branch -d feature/name
```

---

## Performance Tips

### Speed Up Git
```bash
# Enable git compression
git config --global core.compression 9

# Better file system monitor
git config --global core.fsmonitor true

# Faster operations on large repos
git config --global core.checkStat minimal
```

### Optimize Repo
```bash
# Clean up unreferenced objects
git gc

# Repack objects
git repack -d

# Run maintenance
git maintenance run
```

---

## Debugging

### Check History
```bash
# See what happened to branch
git reflog

# See what branch pointers point to
git show-ref

# Debug push/pull
GIT_TRACE=1 git push origin feature/name
```

### Verify Integrity
```bash
# Check repo for corruption
git fsck --full

# Verify all objects
git verify-pack -v .git/objects/pack/*.idx
```

---

## Common Patterns

### Making a Pull Request
```bash
# 1. Create branch
git checkout -b feature/user-auth

# 2. Make changes and commits
git add .
git commit -m "feat(auth): add login form"

# 3. Push to GitHub
git push origin feature/user-auth

# 4. Create PR on GitHub UI
# 5. Wait for review
# 6. Make requested changes (if any)
# 7. Merge on GitHub (Squash and merge)
# 8. Delete branch
git checkout develop
git pull origin develop
git branch -d feature/user-auth
```

### Syncing with Team
```bash
# Get latest changes
git fetch origin

# See what team changed
git log --oneline origin/develop..

# Update your branch
git rebase origin/develop

# Push your changes
git push origin feature/name
```

### Releasing
```bash
# Make sure develop is clean
git checkout develop
git pull origin develop

# Create release tag
git tag -a v1.1 -m "Week 1 Complete"

# Push tag
git push origin v1.1

# Create release on GitHub UI
# (Releases section, create from tag)
```

---

## Quick Cheat Sheet

| Task | Command |
|------|---------|
| Start work | `git checkout -b feature/name` |
| Daily commit | `git add .` → `git commit -m "..."` → `git push origin feature/name` |
| Update from team | `git pull origin develop` |
| Undo changes | `git checkout -- file` |
| Undo commit | `git reset --soft HEAD~1` |
| Merge PR | GitHub UI (Squash and merge) |
| Delete branch | `git branch -d feature/name` |
| Create release | `git tag -a v1.1 -m "..."` → `git push origin v1.1` |

---

## 📞 Command Not Working?

### Check Git Status
```bash
# Current branch
git branch

# Current status
git status

# Remote info
git remote -v
```

### Get Help
```bash
# Help for command
git help commit
git commit --help

# See available commands
git --help

# Our documentation
# Read: GIT_DAILY_WORKFLOW.md
# Read: GIT_CHECKLIST.md
```

---

## 💡 Pro Tips

1. **Commit Often**: Small commits are easier to review and revert
2. **Pull Before Push**: Always get latest before pushing
3. **Write Good Messages**: Future you will thank present you
4. **Use Branches**: Never commit directly to develop/main
5. **Review Your Own Changes**: Catch mistakes before PR
6. **Push Daily**: Ensures backup of your work
7. **Delete Old Branches**: Keeps repo clean
8. **Tag Releases**: Know which version is which

---

<div align="center">
  <p><strong>Bookmark this page! 🔖</strong></p>
  <p>Reference it whenever you need a git command</p>
  <p><em>Save this URL for quick access</em></p>
</div>
