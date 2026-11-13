import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users } from '../db/schema/users.js'
import { refreshSessions } from '../db/schema/refresh-sessions.js'

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

  return { data, pagination: { page, limit } }
}

export const updateUserStatus = async (
  userId: string,
  status: 'active' | 'suspended' | 'deleted'
) => {
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
