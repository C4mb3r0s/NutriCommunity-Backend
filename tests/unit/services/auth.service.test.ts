import { jest } from '@jest/globals'

const select = jest.fn()
const insert = jest.fn()
const update = jest.fn()
const transaction = jest.fn()
const hash = jest.fn()
const compare = jest.fn()

const createAccessToken = jest.fn()
const createCsrfToken = jest.fn()
const createRefreshToken = jest.fn()
const createSessionId = jest.fn()
const getTokenExpiration = jest.fn()
const hashToken = jest.fn()
const verifyRefreshToken = jest.fn()

jest.unstable_mockModule('../../../src/db/index.js', () => ({
  db: { select, insert, update, transaction }
}))
jest.unstable_mockModule('../../../src/db/schema/index.js', () => ({
  refreshSessions: {
    id: 'refreshSessions.id',
    userId: 'refreshSessions.userId',
    tokenJti: 'refreshSessions.tokenJti',
    tokenHash: 'refreshSessions.tokenHash',
    expiresAt: 'refreshSessions.expiresAt',
    revokedAt: 'refreshSessions.revokedAt',
    replacedBy: 'refreshSessions.replacedBy',
    lastUsedAt: 'refreshSessions.lastUsedAt'
  },
  roles: { id: 'roles.id', code: 'roles.code' },
  userRoles: { userId: 'userRoles.userId', roleId: 'userRoles.roleId' },
  users: {
    id: 'users.id',
    firstName: 'users.firstName',
    secondName: 'users.secondName',
    lastName: 'users.lastName',
    secondLastName: 'users.secondLastName',
    email: 'users.email',
    passwordHash: 'users.passwordHash',
    status: 'users.status'
  }
}))
jest.unstable_mockModule('drizzle-orm', () => ({
  and: jest.fn(),
  eq: jest.fn(),
  isNull: jest.fn()
}))
jest.unstable_mockModule('bcrypt', () => ({
  default: { hash, compare }
}))
jest.unstable_mockModule('../../../src/services/token.service.js', () => ({
  createAccessToken,
  createCsrfToken,
  createRefreshToken,
  createSessionId,
  getTokenExpiration,
  hashToken,
  verifyRefreshToken
}))

const authService = await import('../../../src/services/auth.service.js')

const selectChain = (result: unknown[]) => {
  const chain = {
    from: jest.fn(),
    innerJoin: jest.fn(),
    where: jest.fn(),
    limit: jest.fn()
  }
  chain.from.mockReturnValue(chain)
  chain.innerJoin.mockReturnValue(chain)
  chain.where.mockReturnValue(chain)
  chain.limit.mockResolvedValue(result)
  return chain
}

const rolesChain = (result: unknown[]) => {
  const chain = selectChain(result)
  chain.where.mockResolvedValue(result)
  return chain
}

const insertChain = (result: unknown[] = []) => {
  const chain = {
    values: jest.fn(),
    returning: jest.fn().mockResolvedValue(result)
  }
  chain.values.mockReturnValue(chain)
  return chain
}

const updateChain = () => {
  const chain = {
    set: jest.fn(),
    where: jest.fn().mockResolvedValue(undefined)
  }
  chain.set.mockReturnValue(chain)
  return chain
}

const activeUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  firstName: 'Eduardo',
  secondName: null,
  lastName: 'Camberos',
  secondLastName: null,
  email: 'eduardo@example.com',
  passwordHash: 'hashed-password',
  status: 'active'
}

describe('auth service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    hash.mockResolvedValue('hashed-password')
    compare.mockResolvedValue(true)
    createSessionId.mockReturnValue('6ba7b810-9dad-41d1-80b4-00c04fd430c8')
    createRefreshToken.mockReturnValue('refresh-token')
    createCsrfToken.mockReturnValue('csrf-token')
    createAccessToken.mockReturnValue('access-token')
    getTokenExpiration.mockReturnValue(new Date(Date.now() + 60_000))
    hashToken.mockReturnValue('token-hash')
    verifyRefreshToken.mockReturnValue({
      sub: activeUser.id,
      jti: '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
      type: 'refresh'
    })
  })

  it('registers a participant and hashes the password', async () => {
    select.mockReturnValueOnce(selectChain([]))
    const transactionDb = {
      select: jest.fn()
        .mockReturnValueOnce(selectChain([{ id: 'role-id' }])),
      insert: jest.fn()
        .mockReturnValueOnce(insertChain([activeUser]))
        .mockReturnValueOnce(insertChain())
    }
    transaction.mockImplementation(async (callback) => callback(transactionDb))

    await expect(authService.register({
      firstName: 'Eduardo',
      lastName: 'Camberos',
      email: 'Eduardo@Example.com',
      password: 'NutriPass1!'
    })).resolves.toMatchObject({
      email: activeUser.email,
      roles: ['participant']
    })

    expect(hash).toHaveBeenCalledWith('NutriPass1!', 14)
    expect(transactionDb.insert).toHaveBeenCalledTimes(2)
  })

  it('rejects duplicate registration emails', async () => {
    select.mockReturnValueOnce(selectChain([{ id: 'existing-id' }]))

    await expect(authService.register({
      firstName: 'Eduardo',
      lastName: 'Camberos',
      email: 'existing@example.com',
      password: 'NutriPass1!'
    })).rejects.toThrow('EMAIL_ALREADY_EXISTS')
    expect(transaction).not.toHaveBeenCalled()
  })

  it('rejects a failed user creation', async () => {
    select.mockReturnValueOnce(selectChain([]))
    const transactionDb = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValueOnce(insertChain([]))
    }
    transaction.mockImplementation(async (callback) => callback(transactionDb))

    await expect(authService.register({
      firstName: 'Eduardo',
      lastName: 'Camberos',
      email: 'eduardo@example.com',
      password: 'NutriPass1!'
    })).rejects.toThrow('USER_CREATION_FAILED')
  })

  it('rejects registration when the participant role is missing', async () => {
    select.mockReturnValueOnce(selectChain([]))
    const transactionDb = {
      select: jest.fn().mockReturnValueOnce(selectChain([])),
      insert: jest.fn().mockReturnValueOnce(insertChain([activeUser]))
    }
    transaction.mockImplementation(async (callback) => callback(transactionDb))

    await expect(authService.register({
      firstName: 'Eduardo',
      lastName: 'Camberos',
      email: 'eduardo@example.com',
      password: 'NutriPass1!'
    })).rejects.toThrow('PARTICIPANT_ROLE_NOT_FOUND')
  })

  it('logs in active users and creates a session', async () => {
    select
      .mockReturnValueOnce(selectChain([activeUser]))
      .mockReturnValueOnce(rolesChain([{ code: 'participant' }]))
    insert.mockReturnValueOnce(insertChain())

    await expect(authService.login({
      email: 'Eduardo@Example.com',
      password: 'OldPass1'
    }, '127.0.0.1')).resolves.toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      csrfToken: 'csrf-token',
      user: { roles: ['participant'] }
    })

    expect(compare).toHaveBeenCalledWith('OldPass1', 'hashed-password')
  })

  it('rejects inactive users and incorrect passwords', async () => {
    select.mockReturnValueOnce(selectChain([{ ...activeUser, status: 'suspended' }]))
    await expect(authService.login({
      email: activeUser.email,
      password: 'OldPass1'
    }, undefined)).rejects.toThrow('INVALID_CREDENTIALS')

    select.mockReturnValueOnce(selectChain([activeUser]))
    compare.mockResolvedValueOnce(false)
    await expect(authService.login({
      email: activeUser.email,
      password: 'wrong'
    }, undefined)).rejects.toThrow('INVALID_CREDENTIALS')
  })

  it('returns the authenticated active user with roles', async () => {
    select
      .mockReturnValueOnce(selectChain([activeUser]))
      .mockReturnValueOnce(rolesChain([{ code: 'admin' }]))

    await expect(authService.getAuthenticatedUser(activeUser.id))
      .resolves.toMatchObject({
        id: activeUser.id,
        roles: ['admin']
      })
  })

  it('rejects an inactive authenticated user', async () => {
    select.mockReturnValueOnce(selectChain([]))

    await expect(authService.getAuthenticatedUser(activeUser.id))
      .rejects.toThrow('USER_NOT_FOUND')
  })

  it('rotates a valid refresh session', async () => {
    const session = {
      id: 'session-row-id',
      userId: activeUser.id,
      tokenHash: 'token-hash',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null
    }
    select
      .mockReturnValueOnce(selectChain([session]))
      .mockReturnValueOnce(rolesChain([{ code: 'participant' }]))
    insert.mockReturnValueOnce(insertChain())
    update.mockReturnValueOnce(updateChain())

    await expect(authService.refresh('refresh-token', '127.0.0.1'))
      .resolves.toMatchObject({ accessToken: 'access-token' })
    expect(update).toHaveBeenCalledTimes(1)
  })

  it('rejects an invalid refresh session', async () => {
    select.mockReturnValueOnce(selectChain([]))

    await expect(authService.refresh('refresh-token', undefined))
      .rejects.toThrow('REFRESH_TOKEN_INVALID')
  })

  it('rejects an expired refresh session', async () => {
    const expiredSession = {
      id: 'session-row-id',
      userId: activeUser.id,
      tokenHash: 'token-hash',
      expiresAt: new Date(Date.now() - 60_000),
      revokedAt: null
    }
    select.mockReturnValueOnce(selectChain([expiredSession]))

    await expect(authService.refresh('refresh-token', undefined))
      .rejects.toThrow('REFRESH_TOKEN_EXPIRED')
  })

  it('revokes a refresh token during logout', async () => {
    update.mockReturnValueOnce(updateChain())

    await expect(authService.logout('refresh-token')).resolves.toBeUndefined()
    expect(update).toHaveBeenCalledTimes(1)
  })
})
