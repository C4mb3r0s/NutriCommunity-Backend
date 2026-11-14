import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users } from '../db/schema/users.js'
import { refreshSessions } from '../db/schema/refresh-sessions.js'
import { roles } from '../db/schema/roles.js'
import { userRoles } from '../db/schema/user-roles.js'

export const listUsers = async (page: number, limit: number) => {
  const data = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      secondName: users.secondName,
      lastName: users.lastName,
      secondLastName: users.secondLastName,
      email: users.email,
      status: users.status,
      createdAt: users.createdAt
    })
    .from(users)
    .limit(limit)
    .offset((page - 1) * limit)

  const roleRows = data.length > 0
    ? await db
      .select({ userId: userRoles.userId, code: roles.code })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(inArray(userRoles.userId, data.map((user) => user.id)))
    : []

  const dataWithRoles = data.map((user) => ({
    ...user,
    roles: roleRows
      .filter((role) => role.userId === user.id)
      .map((role) => role.code)
  }))

  return { data: dataWithRoles, pagination: { page, limit } }
}

export const updateUserStatus = async (
  userId: string,
  status: 'active' | 'suspended' | 'deleted'
) => {
  const [adminRole] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.code, 'admin'))
    .limit(1)

  if (adminRole) {
    const [targetAdmin] = await db
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.roleId, adminRole.id)
        )
      )
      .limit(1)

    if (targetAdmin) {
      throw new Error('ADMIN_USER_PROTECTED')
    }
  }

  const [user] = await db
    .update(users)
    .set({ status, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      status: users.status
    })

  if (status !== 'active') {
    await db
      .update(refreshSessions)
      .set({ revokedAt: new Date() })
      .where(eq(refreshSessions.userId, userId))
  }

  return user
}
