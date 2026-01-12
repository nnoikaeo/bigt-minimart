# 🚀 Week 2 Task Prompt - Layout & Navigation

**Project**: BigT Minimart Management System  
**Week**: 2 (January 13-17, 2026)  
**Status**: Ready to Start  
**Release Tag**: v1.1 (Week 1 Complete)

---

## ⚡ Quick Start - READ FIRST

Before starting Week 2 tasks, please read these files **in order**:

### 📚 **MUST READ** (Required - 30 minutes)
1. [docs/DEVELOPMENT/README.md](docs/DEVELOPMENT/README.md) - **Navigation guide** (5 min)
   - How to read development docs
   - Git + CI/CD integration
   
2. [docs/DEVELOPMENT/GIT_DAILY_WORKFLOW.md](docs/DEVELOPMENT/GIT_DAILY_WORKFLOW.md) - **Daily workflow** (10 min)
   - How to create features
   - How to commit and push
   - How to create PRs
   
3. [docs/DEVELOPMENT/GIT_CHECKLIST.md](docs/DEVELOPMENT/GIT_CHECKLIST.md) - **Print & keep at desk** (5 min)
   - Checklist to follow while working
   - Quick reference for common tasks
   
4. [docs/PROGRESS/WEEK_SUMMARIES/WEEK_01.md](docs/PROGRESS/WEEK_SUMMARIES/WEEK_01.md) - **Previous week context** (10 min)
   - What was built in Week 1
   - Current architecture
   - What's already working

### 📖 **SHOULD READ** (Reference - 20 minutes)
5. [docs/DEVELOPMENT/CI_CD_SETUP.md](docs/DEVELOPMENT/CI_CD_SETUP.md) - **How CI/CD works** (10 min)
   - Automatic checks on PR
   - Auto-deployment to staging
   - Auto-deployment to production
   
6. [docs/DEVELOPMENT/DEPLOYMENT.md](docs/DEVELOPMENT/DEPLOYMENT.md) - **How to deploy** (10 min)
   - When to deploy to staging
   - When to deploy to production

### 🔖 **BOOKMARK THESE** (Keep handy)
7. [docs/DEVELOPMENT/GIT_COMMANDS.md](docs/DEVELOPMENT/GIT_COMMANDS.md) - **Git commands reference**
   - 100+ commands documented
   - Usage examples
   - Troubleshooting

---

## 🎯 Week 2 Objectives

### **Main Goal**: Create professional layout with navigation system

The app currently has basic pages but **no navigation structure**. Users can't navigate between pages easily.

**Week 2 will add**:
- ✅ Sidebar navigation (always visible on desktop)
- ✅ Mobile menu toggle (hamburger menu on mobile)
- ✅ Role-based menu items (different menus for different users)
- ✅ Breadcrumb navigation (show current location)
- ✅ Icons for menu items (better UX)
- ✅ Responsive design (works on all devices)

---

## 📋 Week 2 Tasks (5 tasks)

### **Task 2.1: Sidebar Navigation Component** 🎨
**Time**: 4-5 hours  
**Difficulty**: Medium

**What to do**:
1. Create `components/Sidebar.vue` component
2. Display navigation links:
   - Dashboard (`/`)
   - User Management (`/admin/users`)
   - Settings (placeholder)
   - Logout button
3. Show current user role in sidebar
4. Style with Tailwind (match brand colors)
5. Test on desktop (visible) and mobile (hidden by default)

**Expected result**:
- Sidebar appears on left side of page
- Contains all navigation links
- Shows current user info
- Looks professional with brand colors

---

### **Task 2.2: Mobile Menu Toggle** 📱
**Time**: 2-3 hours  
**Difficulty**: Easy-Medium

**What to do**:
1. Add hamburger menu button (top-left on mobile)
2. Create toggle state for sidebar visibility
3. Show/hide sidebar on mobile when button clicked
4. Close sidebar when link clicked
5. Use Tailwind responsive classes

**Expected result**:
- Desktop (≥768px): Sidebar always visible
- Mobile (<768px): Hamburger button shows
- Click button → Sidebar slides out
- Click link → Sidebar closes
- Professional hamburger icon

---

### **Task 2.3: Role-Based Menu Items** 👥
**Time**: 3-4 hours  
**Difficulty**: Medium

**What to do**:
1. Check user role from auth store
2. Show different menus for different roles:
   - **Owner**: Dashboard, Users, Settings, Reports
   - **Manager**: Dashboard, Users, Settings
   - **Staff**: Dashboard only
3. Hide menu items user doesn't have access to
4. Add role badge in sidebar
5. Test with all 3 test users

**Expected result**:
- Owner sees all menu items
- Manager sees some items (no Reports)
- Staff sees only Dashboard
- Sidebar updates when user changes

---

### **Task 2.4: Breadcrumb Navigation** 🍞
**Time**: 2-3 hours  
**Difficulty**: Easy-Medium

**What to do**:
1. Create `components/Breadcrumb.vue` component
2. Display current page path as breadcrumbs
3. Example: `Dashboard > User Management > Edit User`
4. Make breadcrumbs clickable (navigate back)
5. Show on every page under header

**Expected result**:
- Shows current location
- Clickable links to parent pages
- Updates when navigating
- Styled nicely with Tailwind

---

### **Task 2.5: Responsive Layout Enhancement** 🎯
**Time**: 3-4 hours  
**Difficulty**: Medium

**What to do**:
1. Update `layouts/default.vue` to use new components
2. Adjust main content area (responsive to sidebar)
3. Update header/footer for new layout
4. Test on different screen sizes:
   - Desktop (1920px)
   - Tablet (768px)
   - Mobile (375px)
5. Ensure no overlapping elements

**Expected result**:
- Professional layout on all devices
- Sidebar + main content properly aligned
- Header/footer properly styled
- No horizontal scroll on mobile
- Content readable on all sizes

---

## 🛠️ Technical Stack (Week 2)

**Same as Week 1, plus:**
- `@heroicons/vue` or similar for menu icons (optional)
- Tailwind CSS responsive utilities (already have)
- Vue composition API (already using)

**Files to modify**:
```
layouts/default.vue          ← Update with new components
components/Sidebar.vue       ← CREATE NEW
components/Breadcrumb.vue    ← CREATE NEW
composables/useUser.ts       ← Already exists, might use
stores/auth.ts               ← Already exists, use for role check
```

---

## 📊 Progress Tracking

### Week 2 Workflow:

```
1️⃣ CREATE FEATURE BRANCH
   $ git checkout -b feature/layout-navigation
   
2️⃣ BUILD COMPONENTS (Tasks 2.1-2.5)
   - Sidebar.vue component
   - Mobile menu toggle
   - Role-based logic
   - Breadcrumb.vue
   - Layout updates

3️⃣ TEST LOCALLY
   $ npm run dev
   - Test on desktop
   - Test on mobile (responsive)
   - Test with all 3 test users
   - Check console for errors

4️⃣ COMMIT & PUSH
   $ git add .
   $ git commit -m "feat: add sidebar navigation with role-based menus"
   $ git push -u origin feature/layout-navigation
   ⚙️ CI/CD RUNS: pr-check.yml (auto)

5️⃣ CREATE PULL REQUEST
   - Target: develop branch
   - Title: "feat: navigation layout and sidebar"
   - Description: list what's done
   - Wait for review

6️⃣ MERGE TO DEVELOP
   ⚙️ CI/CD RUNS: deploy-staging.yml (auto)
   🌐 Test on https://bigt-minimart-staging.web.app

7️⃣ MERGE TO MAIN (when ready)
   ⚙️ CI/CD RUNS: deploy-production.yml (auto)
   🌐 Goes live at https://bigt-minimart.web.app

8️⃣ CREATE RELEASE TAG
   $ git tag -a v1.2 -m "Week 2 Complete - Navigation Layout"
   $ git push origin v1.2
```

---

## 🎓 Step-by-Step: How to Start

### **Step 1: Prepare (5 minutes)**
```bash
# 1. Read all 7 files above (in order listed)
# 2. Make sure you understand Week 1 accomplishments
# 3. Review the 5 Week 2 tasks above
```

### **Step 2: Update Local (5 minutes)**
```bash
# Switch to develop
git checkout develop

# Pull latest from GitHub
git pull origin develop

# Verify you're up to date
git log -1 --oneline
```

### **Step 3: Create Feature Branch (2 minutes)**
```bash
# Create new feature branch
git checkout -b feature/layout-navigation

# Verify branch created
git branch
```

### **Step 4: Start Development**

**Install icon library (optional but recommended)**:
```bash
npm install @heroicons/vue
```

**Create Sidebar.vue**:
- Start with basic component structure
- Add nav links
- Style with Tailwind
- Test in browser

**Then continue with other tasks**...

### **Step 5: Commit & Push**
```bash
# When you finish a task (or multiple tasks)
npm run lint          # Fix style issues
npm run type-check    # Check TypeScript
npm run build         # Verify build

# Then commit
git add .
git commit -m "feat: add sidebar navigation component"
git push -u origin feature/layout-navigation
```

### **Step 6: Create PR on GitHub**
- Go to https://github.com/nnoikaeo/bigt-minimart
- Click "New Pull Request"
- Select: `feature/layout-navigation` → `develop`
- Fill in title and description
- Submit

### **Step 7: Wait for CI/CD**
- GitHub Actions will automatically check your code
- Should see green checkmark if all tests pass
- If red, fix errors and push again

### **Step 8: Merge & Deploy**
- After approval, click "Merge Pull Request"
- CI/CD automatically deploys to staging
- Test on staging URL
- When ready, merge develop → main
- CI/CD automatically deploys to production

---

## ✅ Checklist Before Starting

- [ ] Read all 7 files listed above
- [ ] Understand Week 1 accomplishments
- [ ] Review the 5 Week 2 tasks
- [ ] Have Git commands reference handy
- [ ] Local repo is up to date (`git pull origin develop`)
- [ ] Understand the Git workflow (create branch → commit → push → PR → merge)
- [ ] Know how CI/CD will run automatically
- [ ] Have test user login credentials ready

---

## 📚 Quick Reference

### **Need a Git command?**
→ See [docs/DEVELOPMENT/GIT_COMMANDS.md](docs/DEVELOPMENT/GIT_COMMANDS.md)

### **Need to remember the workflow?**
→ See [docs/DEVELOPMENT/GIT_DAILY_WORKFLOW.md](docs/DEVELOPMENT/GIT_DAILY_WORKFLOW.md)

### **Not sure what to read?**
→ See [docs/DEVELOPMENT/README.md](docs/DEVELOPMENT/README.md)

### **Want to understand CI/CD?**
→ See [docs/DEVELOPMENT/CI_CD_SETUP.md](docs/DEVELOPMENT/CI_CD_SETUP.md)

### **Need deployment help?**
→ See [docs/DEVELOPMENT/DEPLOYMENT.md](docs/DEVELOPMENT/DEPLOYMENT.md)

---

## 🎯 Success Criteria

**Week 2 is successful when:**

- ✅ Sidebar component created and working
- ✅ Mobile menu toggle works
- ✅ Role-based menus working (all 3 roles tested)
- ✅ Breadcrumb navigation working
- ✅ Layout responsive (desktop + mobile)
- ✅ All components styled professionally
- ✅ No console errors
- ✅ PR merged to develop
- ✅ Staging deployment successful
- ✅ PR merged to main
- ✅ Production deployment successful
- ✅ v1.2 release tag created

---

## 💡 Pro Tips

1. **Build incrementally**: Do Task 2.1 completely, then test → commit → push → PR
2. **Test on mobile**: Use browser dev tools to test responsive design
3. **Use all 3 test users**: Test with owner, manager, and staff roles
4. **Read code before writing**: Look at existing components to understand patterns
5. **Commit frequently**: Small commits are easier to review and fix if needed
6. **Ask if stuck**: Refer to docs or ask for help before getting blocked

---

## 📞 When You're Ready

Once you've:
1. ✅ Read all files above
2. ✅ Created feature branch locally
3. ✅ Ready to start coding

**Simply say**: "Ready for Week 2" or describe the first task you want help with!

I'll be here to help you through all 5 tasks, guide you through the Git workflow, and ensure CI/CD runs smoothly.

---

**Good luck with Week 2! 🚀**

Remember: 
- Small steps → big progress
- Test frequently → catch bugs early
- Commit often → clean history
- Ask questions → learn more
- You've got this! 💪

---

**Week 1 Status**: ✅ COMPLETE (v1.1)  
**Week 2 Status**: 🟡 READY TO START  
**Production**: 🟢 LIVE  

**Let's build something great! 🎉**
