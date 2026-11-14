import { jest } from '@jest/globals'

const select = jest.fn()
const update = jest.fn()

jest.unstable_mockModule('../../../src/db/index.js', () => ({
  db: { select, update }
}))
jest.unstable_mockModule('../../../src/db/schema/users.js', () => ({
  users: {
    id: 'users.id',
    firstName: 'users.firstName',
    secondName: 'users.secondName',
    lastName: 'users.lastName',
    secondLastName: 'users.secondLastName',
    email: 'users.email',
    status: 'users.status',
    createdAt: 'users.createdAt',
    updatedAt: 'users.updatedAt'
  }
}))
jest.unstable_mockModule('../../../src/db/schema/refresh-sessions.js', () => ({
  refreshSessions: { userId: 'refreshSessions.userId' }
}))
jest.unstable_mockModule('../../../src/db/schema/roles.js', () => ({
  roles: { id: 'roles.id', code: 'roles.code' }
}))
jest.unstable_mockModule('../../../src/db/schema/user-roles.js', () => ({
  userRoles: { userId: 'userRoles.userId', roleId: 'userRoles.roleId' }
}))
jest.unstable_mockModule('drizzle-orm', () => ({
  and: jest.fn(),
  eq: jest.fn(),
  inArray: jest.fn()
}))

const adminService = await import('../../../src/services/admin.service.js')

describe('admin service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('lists users with pagination', async () => {
    const rows = [{ id: 'user-id', email: 'user@example.com' }]
    const usersChain = {
      from: jest.fn(),
      limit: jest.fn(),
      offset: jest.fn().mockResolvedValue(rows)
    }
    usersChain.from.mockReturnValue(usersChain)
    usersChain.limit.mockReturnValue(usersChain)

    const rolesChain = {
      from: jest.fn(),
      innerJoin: jest.fn(),
      where: jest.fn().mockResolvedValue([
        { userId: 'user-id', code: 'participant' }
      ])
    }
    rolesChain.from.mockReturnValue(rolesChain)
    rolesChain.innerJoin.mockReturnValue(rolesChain)
    select
      .mockReturnValueOnce(usersChain)
      .mockReturnValueOnce(rolesChain)

    await expect(adminService.listUsers(2, 10)).resolves.toEqual({
      data: [{ ...rows[0], roles: ['participant'] }],
      pagination: { page: 2, limit: 10 }
    })
  })

  it('updates an active user without revoking sessions', async () => {
    const user = { id: 'user-id', status: 'active' }
    const rolesChain = {
      from: jest.fn(),
      where: jest.fn(),
      limit: jest.fn().mockResolvedValue([])
    }
    rolesChain.from.mockReturnValue(rolesChain)
    rolesChain.where.mockReturnValue(rolesChain)
    select.mockReturnValueOnce(rolesChain)

    const chain = {
      set: jest.fn(),
      where: jest.fn(),
      returning: jest.fn().mockResolvedValue([user])
    }
    chain.set.mockReturnValue(chain)
    chain.where.mockReturnValue(chain)
    update.mockReturnValueOnce(chain)

    await expect(adminService.updateUserStatus('user-id', 'active'))
      .resolves.toEqual(user)
    expect(update).toHaveBeenCalledTimes(1)
  })

  it('revokes sessions when a user is suspended', async () => {
    const user = { id: 'user-id', status: 'suspended' }
    const rolesChain = {
      from: jest.fn(),
      where: jest.fn(),
      limit: jest.fn().mockResolvedValue([])
    }
    rolesChain.from.mockReturnValue(rolesChain)
    rolesChain.where.mockReturnValue(rolesChain)
    select.mockReturnValueOnce(rolesChain)

    const userUpdate = {
      set: jest.fn(),
      where: jest.fn(),
      returning: jest.fn().mockResolvedValue([user])
    }
    const sessionUpdate = {
      set: jest.fn(),
      where: jest.fn().mockResolvedValue(undefined)
    }
    userUpdate.set.mockReturnValue(userUpdate)
    userUpdate.where.mockReturnValue(userUpdate)
    sessionUpdate.set.mockReturnValue(sessionUpdate)
    update
      .mockReturnValueOnce(userUpdate)
      .mockReturnValueOnce(sessionUpdate)

    await expect(adminService.updateUserStatus('user-id', 'suspended'))
      .resolves.toEqual(user)
    expect(update).toHaveBeenCalledTimes(2)
  })

  it('returns undefined for an unknown user', async () => {
    const rolesChain = {
      from: jest.fn(),
      where: jest.fn(),
      limit: jest.fn().mockResolvedValue([])
    }
    rolesChain.from.mockReturnValue(rolesChain)
    rolesChain.where.mockReturnValue(rolesChain)
    select.mockReturnValueOnce(rolesChain)

    const chain = {
      set: jest.fn(),
      where: jest.fn(),
      returning: jest.fn().mockResolvedValue([])
    }
    chain.set.mockReturnValue(chain)
    chain.where.mockReturnValue(chain)
    const sessionUpdate = {
      set: jest.fn(),
      where: jest.fn().mockResolvedValue(undefined)
    }
    sessionUpdate.set.mockReturnValue(sessionUpdate)
    update
      .mockReturnValueOnce(chain)
      .mockReturnValueOnce(sessionUpdate)

    await expect(adminService.updateUserStatus('missing', 'deleted'))
      .resolves.toBeUndefined()
  })

  it('protects administrator users from status changes', async () => {
    const rolesChain = {
      from: jest.fn(),
      where: jest.fn(),
      limit: jest.fn().mockResolvedValue([{ id: 'admin-role-id' }])
    }
    rolesChain.from.mockReturnValue(rolesChain)
    rolesChain.where.mockReturnValue(rolesChain)
    select
      .mockReturnValueOnce(rolesChain)
      .mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ userId: 'admin-id' }])
      })

    await expect(adminService.updateUserStatus('admin-id', 'deleted'))
      .rejects.toThrow('ADMIN_USER_PROTECTED')
    expect(update).not.toHaveBeenCalled()
  })
})
