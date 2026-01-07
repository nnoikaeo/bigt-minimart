# ✅ Git Operations Checklist

**Last Updated**: Jan 7, 2026  
**Version**: 1.0  
**For**: Quick reference during daily development  
**Print this**: Keep at your desk!

---

## 🚀 Starting a Feature

### Before You Start
- [ ] Checked Slack/GitHub for team updates
- [ ] Pulled latest develop: `git pull origin develop`
- [ ] Checked what features are in progress
- [ ] Task/issue number noted (#42)

### Creating Branch
- [ ] Decided on branch name: `feature/xxx`, `bugfix/xxx`, or `chore/xxx`
- [ ] Created branch: `git checkout -b feature/name`
- [ ] Verified on correct branch: `git branch` (should show *)
- [ ] Ready to start coding

### Done with Setup
```bash
# Checklist marks ✓
git checkout develop
git pull origin develop
git checkout -b feature/my-feature
git status  # Should show branch name
```

---

## 📝 During Development (Daily)

### Before Each Commit
- [ ] Tested changes in browser
- [ ] No `console.log()` left in code
- [ ] No commented-out code
- [ ] Code follows style guide (Prettier formatted)
- [ ] Changes are related (not mixing features)

### Making the Commit
- [ ] Staged changes: `git add .` or `git add filename.vue`
- [ ] Reviewed changes: `git diff --cached`
- [ ] Wrote commit message: `git commit -m "type(scope): message"`
- [ ] Used proper format (feat/fix/docs/etc)
- [ ] Message is clear and concise

### Good Commit Message Examples
- `feat(auth): implement login form validation`
- `fix(expenses): correct calculation for tax`
- `docs(readme): update installation steps`
- `refactor(dashboard): simplify component logic`

### Before End of Day
- [ ] Pushed to remote: `git push origin feature/name`
- [ ] Verified on GitHub (in browser)
- [ ] No uncommitted changes: `git status` shows clean
- [ ] Work is safe on GitHub

---

## 🔀 Creating Pull Request

### Before PR
- [ ] Feature is complete
- [ ] All changes pushed: `git push origin feature/name`
- [ ] Branch appears on GitHub
- [ ] Tested thoroughly locally
- [ ] No console errors or warnings

### Creating PR on GitHub UI
- [ ] Went to: GitHub.com → Pull Requests
- [ ] Clicked: "New Pull Request"
- [ ] Base branch: `develop` ✓
- [ ] Compare branch: `feature/name` ✓
- [ ] Clicked: "Create Pull Request"

### Filling PR Details
- [ ] **Description**: What does this do? (1-2 sentences)
- [ ] **Type**: Checked one: Feature ✓, Fix ☐, Docs ☐, etc
- [ ] **Changes Made**: Listed 3-5 key changes
- [ ] **Related Issue**: Added issue number (if any)
- [ ] **Testing**: Checked what was tested
- [ ] **Checklist**: Verified all items met

### PR Template to Use
```markdown
## Description
Implements X feature that allows Y

## Type of Change
- [x] ✨ New feature

## Changes Made
- Added component X
- Added function Y
- Fixed style Z

## Testing Done
- [x] Tested in browser
- [x] No console errors
- [x] Tests pass

## Checklist
- [x] Code follows style guide
- [x] Self-reviewed
- [x] No debug code
```

### After Creating PR
- [ ] Posted PR link in Slack (if team uses it)
- [ ] Mentioned which person should review
- [ ] Ready for feedback

---

## 👀 During Code Review

### Handling Review Comments
- [ ] Read reviewer's feedback carefully
- [ ] Made the requested changes
- [ ] Tested changes again
- [ ] Staged changes: `git add .`
- [ ] Committed: `git commit -m "fix: address review feedback"`
- [ ] Pushed: `git push origin feature/name`

### PR Automatically Updates
- [ ] New commits visible in PR
- [ ] GitHub shows "Pending review" again
- [ ] Marked ready for re-review (if needed)

### Multiple Review Rounds
- [ ] Can happen 1-3 times (normal)
- [ ] Respond promptly to feedback
- [ ] Test thoroughly before pushing
- [ ] Ask for clarification if unclear

### When Approved ✅
- [ ] PR shows "Approved" badge
- [ ] All checks pass (if applicable)
- [ ] Ready to merge!

---

## ✅ Merging PR

### Before Merge
- [ ] Got approval (green checkmark)
- [ ] All tests pass
- [ ] No merge conflicts
- [ ] Base branch still has latest develop

### Merging on GitHub UI
- [ ] Went to Pull Request page
- [ ] Clicked "Merge pull request"
- [ ] Selected "Squash and merge" (our strategy)
- [ ] Confirmed the merge message (one commit)
- [ ] Clicked "Confirm squash and merge"

### What Happens
- [ ] Your commits become 1 commit in develop
- [ ] PR marked as "Merged"
- [ ] Branch can be deleted (button appears)

---

## 🧹 After Merge

### Delete Feature Branch
- [ ] Clicked "Delete branch" on GitHub (appears after merge)
- OR manually deleted:
  - [ ] Local: `git branch -d feature/name`
  - [ ] Remote: `git push origin --delete feature/name`

### Update Your Local Develop
- [ ] Switched to develop: `git checkout develop`
- [ ] Pulled latest: `git pull origin develop`
- [ ] Verified branch clean: `git status`

### Feature Complete! 🎉
- [ ] Feature is in develop branch
- [ ] Will be released with next version
- [ ] Team can see merged code
- [ ] Ready for next feature

---

## 🔄 Handling Merge Conflicts

### When Conflicts Appear
- [ ] PR shows "Can't merge - conflicts exist"
- [ ] Pulled latest develop locally:
  - `git fetch origin`
  - `git rebase origin/develop`
- [ ] Conflicts marked in files with `<<<`, `===`, `>>>`

### Resolving Conflicts
- [ ] Opened conflicted files
- [ ] Decided which version to keep (yours/theirs/both)
- [ ] Removed conflict markers (`<<<`, `===`, `>>>`)
- [ ] Staged resolved file: `git add filename.vue`
- [ ] Continued rebase: `git rebase --continue`

### After Resolution
- [ ] Pushed with force: `git push origin feature/name --force-with-lease`
- [ ] PR now shows clean to merge
- [ ] Proceeded with merge

---

## 🆘 Mistake Recovery

### Accidentally Committed Wrong Thing
- [ ] Undo commit (keep changes): `git reset --soft HEAD~1`
- [ ] Stage only correct files: `git add correct-file.vue`
- [ ] Commit again: `git commit -m "..."`
- [ ] No one was affected (not pushed)

### Committed to Wrong Branch
- [ ] Saved the commit hash: `git log --oneline` → note hash
- [ ] Switched to correct branch: `git checkout feature/correct`
- [ ] Cherry-picked commit: `git cherry-pick abc1234`
- [ ] Went back to wrong branch: `git checkout feature/wrong`
- [ ] Undid commit: `git reset --hard HEAD~1`

### Pushed Something Wrong
- [ ] PR not yet merged? Revert with new commit:
  - `git revert HEAD`
  - `git push origin feature/name`
- [ ] Already merged? Talk to team about hotfix

---

## 📊 Weekly/Release Checklist

### Before Release (Friday)
- [ ] All PRs merged to develop
- [ ] Develop branch is clean
- [ ] No uncommitted changes
- [ ] Pulled latest: `git pull origin develop`
- [ ] Tests pass locally

### Creating Release Tag
- [ ] Checked latest tag: `git tag -l`
- [ ] Decided new version (v1.1 or v2.0)
- [ ] Created tag: `git tag -a v1.1 -m "Release message"`
- [ ] Pushed tag: `git push origin v1.1`

### GitHub Release (UI)
- [ ] Went to Releases section
- [ ] Created release from tag
- [ ] Added release notes (what changed)
- [ ] Marked as latest release
- [ ] Published release

### Release Complete 🚀
- [ ] Version is tagged
- [ ] Release notes are available
- [ ] Can be deployed to production
- [ ] Team can reference the version

---

## 📋 Self-Review Checklist (Before PR)

### Code Quality
- [ ] Code follows project style guide
- [ ] No duplicate code
- [ ] No commented-out code
- [ ] Variable names are clear
- [ ] Functions are not too long

### Testing
- [ ] Tested happy path
- [ ] Tested error cases
- [ ] No console.log() or debug code
- [ ] Verified on mobile
- [ ] Verified in different browsers (Chrome, Firefox, Safari)

### Git Hygiene
- [ ] Commits are logical and ordered
- [ ] Commit messages are clear
- [ ] No sensitive data in commits
- [ ] Branch is up-to-date with develop
- [ ] No merge conflicts

### Documentation
- [ ] Code has comments where needed
- [ ] Complex logic is explained
- [ ] README updated (if needed)
- [ ] New functions have JSDoc comments

### Performance
- [ ] No unused imports
- [ ] No memory leaks
- [ ] Images are optimized
- [ ] No N+1 queries

---

## 👥 Reviewer Checklist

### Code Review
- [ ] Code is readable and clear
- [ ] Logic is sound
- [ ] No security issues
- [ ] Follows project patterns
- [ ] No performance problems

### Testing
- [ ] Tests exist and pass
- [ ] Tests cover main paths
- [ ] Tests cover error cases
- [ ] Tested by submitter

### Before Approval
- [ ] All my comments addressed
- [ ] Code quality acceptable
- [ ] No breaking changes
- [ ] Approved: ✅ (comment with thumbs up)

---

## 🎯 Daily Standup Checklist

### What to Say
- [ ] **Yesterday**: "I merged feature X and started feature Y"
- [ ] **Today**: "I'm working on implementing feature Y"
- [ ] **Blockers**: "I need clarification on the API structure"
- [ ] **PRs**: "I have 2 PRs waiting for review"

### Sample Statement
```
Yesterday: Completed and merged the daily sales form feature
Today: Starting on expense tracking module
Blockers: None - moving forward
PRs: Have 1 waiting for review (PR #42 - Sales Form)
```

---

## 🏁 End of Week Review

### What to Check
- [ ] All PRs merged from the week
- [ ] No abandoned branches
- [ ] Version tagged correctly
- [ ] Release notes published
- [ ] No blocking issues left

### Cleanup (Friday EOD)
- [ ] All feature branches deleted (except any in progress)
- [ ] Develop branch clean and latest
- [ ] Tag pushed successfully
- [ ] Team notified of new release

---

## 📞 Quick Reference

### Most Common Commands
```bash
# Daily start
git checkout develop && git pull origin develop

# Create feature
git checkout -b feature/name

# Daily commit
git add .
git commit -m "type(scope): message"
git push origin feature/name

# Create PR
# (Use GitHub UI)

# After review, merge on GitHub UI

# Cleanup
git checkout develop
git pull origin develop
git branch -d feature/name
```

---

## 🆘 When Stuck

1. **Check current status**: `git status`
2. **See your changes**: `git diff`
3. **View commit history**: `git log --oneline`
4. **Read**: [GIT_COMMANDS.md](./GIT_COMMANDS.md)
5. **Ask**: Message team in Slack or create issue

---

<div align="center">
  <p><strong>✅ Print this checklist and keep it nearby!</strong></p>
  <p>Reference it during your daily workflow</p>
  <p><em>Following this ensures clean, organized code</em></p>
</div>
