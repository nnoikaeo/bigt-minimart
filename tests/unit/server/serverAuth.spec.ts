/* eslint-disable */
// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { verifyIdToken, getUserById } = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  getUserById: vi.fn(),
}))

vi.mock('~/server/utils/firebase-admin', () => ({
  adminAuth: { verifyIdToken },
}))
vi.mock('~/server/repositories/access-control-json.repository', () => ({
  AccessControlJsonRepository: class {
    getUserById = getUserById
  },
}))

vi.stubGlobal('getRequestHeader', (event, name) => event.headers[name])
vi.stubGlobal('createError', ({ statusCode, message }) => Object.assign(new Error(message), { statusCode }))

const { requireServerAuth } = await import('~/server/utils/serverAuth')

const authedEvent = () => ({ headers: { authorization: 'Bearer token' }, context: {} })

describe('requireServerAuth display name', () => {
  beforeEach(() => {
    verifyIdToken.mockReset()
    getUserById.mockReset()
    verifyIdToken.mockResolvedValue({ uid: 'u1', email: 'tip@bigt.co.th' })
  })

  it('uses the display name from users.json instead of the email', async () => {
    getUserById.mockResolvedValue({ uid: 'u1', displayName: 'พรทิพย์ เรือนสุข' })
    const user = await requireServerAuth(authedEvent())
    expect(user.name).toBe('พรทิพย์ เรือนสุข')
    expect(getUserById).toHaveBeenCalledWith('u1')
  })

  it('falls back to the email when the user is not in users.json', async () => {
    getUserById.mockResolvedValue(null)
    const user = await requireServerAuth(authedEvent())
    expect(user.name).toBe('tip@bigt.co.th')
  })

  it('still authenticates when users.json cannot be read', async () => {
    getUserById.mockRejectedValue(new Error('read failed'))
    const user = await requireServerAuth(authedEvent())
    expect(user.uid).toBe('u1')
    expect(user.name).toBe('tip@bigt.co.th')
  })

  it('rejects an invalid token with 401', async () => {
    verifyIdToken.mockRejectedValue(new Error('bad token'))
    await expect(requireServerAuth(authedEvent())).rejects.toMatchObject({ statusCode: 401 })
  })
})
