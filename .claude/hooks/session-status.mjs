// SessionStart hook: prints a short project status summary into Claude's context.
// Source of truth is docs/PROGRESS/STATUS.md — this script only extracts from it.
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join } from 'node:path'

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd()
const out = ['## Project status (auto-loaded from docs/PROGRESS/STATUS.md)']

try {
  const status = readFileSync(join(root, 'docs/PROGRESS/STATUS.md'), 'utf8').replace(/^﻿/, '')
  const lines = status.split(/\r?\n/)

  // Header fields: **Last Updated**, **Current Branch**, **Current Phase**, **Next Up**
  for (const line of lines.slice(0, 15)) {
    if (/^\*\*(Last Updated|Current Branch|Current Phase|Next Up)\*\*/.test(line)) out.push(line)
  }

  // Manual-test progress block under "Remaining / Not Started"
  const start = lines.findIndex(l => l.includes('Service Harmonization Testing (17 Tasks)'))
  if (start !== -1) {
    out.push('', 'Testing progress:')
    for (const line of lines.slice(start + 1)) {
      if (!line.trim() || line.startsWith('```')) break
      out.push(line)
    }
  }
} catch (err) {
  out.push(`(could not read STATUS.md: ${err.message})`)
}

try {
  const git = cmd => execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  const branch = git('git branch --show-current')
  const dirty = git('git status --porcelain').split('\n').filter(Boolean).length
  out.push('', `Git: branch \`${branch}\`, ${dirty} uncommitted file(s)`)
} catch {
  // not a git checkout — skip
}

out.push('', 'Reminder: follow "Keeping docs in sync" in CLAUDE.md.')
console.log(out.join('\n'))
