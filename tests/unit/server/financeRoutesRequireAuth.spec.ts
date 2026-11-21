/**
 * Guard: every write route (POST / PUT / DELETE / PATCH) of the finance services
 * must call requireServerAuth(event) (BUG-037 / BUG-052).
 * GET routes are intentionally not checked — reads do not require login yet.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, it, expect } from 'vitest'

const ROOT = join(__dirname, '../../../server/api')
const SERVICES = ['money-transfer', 'bill-payment']
const WRITE_ROUTE = /\.(post|put|delete|patch)\.ts$/

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? listFiles(full) : [full]
  })
}

describe('finance write routes require server auth', () => {
  for (const service of SERVICES) {
    const routes = listFiles(join(ROOT, service)).filter(f => WRITE_ROUTE.test(f))

    it(`${service} has write routes to check`, () => {
      expect(routes.length).toBeGreaterThan(0)
    })

    for (const file of routes) {
      const name = relative(ROOT, file).replace(/\\/g, '/')
      it(`${name} calls requireServerAuth(event)`, () => {
        expect(readFileSync(file, 'utf-8')).toMatch(/await requireServerAuth\(event\)/)
      })
    }
  }
})
